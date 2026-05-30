"""Exercise the built editor (out/) in a real browser; no hosted services required.

    python tests/browser_checks.py            # run the checks (works offline)
    python tests/browser_checks.py --capture  # also refresh docs/screenshots/ (needs Google Fonts)
"""
import argparse
import functools
import math
import http.server
import re
import struct
import tempfile
import threading
import zlib
from pathlib import Path

from playwright.sync_api import Page, expect, sync_playwright

REPO = Path(__file__).resolve().parents[1]
FIXTURE_SIZE = (1600, 800)
CORNER_PIXEL_JS = """(() => {
  const c = document.querySelector('canvas.lower-canvas');
  return Array.from(c.getContext('2d').getImageData(c.width - 4, c.height - 4, 1, 1).data);
})()"""


def gradient_png(width, height):
    """A pale vertical gradient: every pixel is roughly (236, 224..236, 202)."""
    rows = b''.join(b'\0' + bytes([236, 224 + (y * 12 // height), 202]) * width for y in range(height))
    header = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    def chunk(kind, data):
        return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data) & 0xFFFFFFFF)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', header) + chunk(b'IDAT', zlib.compress(rows)) + chunk(b'IEND', b'')


def poster_png(width, height):
    """A generated dusk scene (sky, sun, two hill lines) for README screenshots."""
    def mix(a, b, t):
        return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))
    sun_x, sun_y, sun_r = 0.7 * width, 0.5 * height, 0.08 * width
    def pixel(x, y):
        far = 0.66 * height + 0.05 * height * math.sin(x / width * 2 * math.pi * 1.3)
        near = 0.8 * height + 0.04 * height * math.sin(x / width * 2 * math.pi * 2.1 + 1)
        if y > near:
            return (52, 38, 48)
        if y > far:
            return (96, 66, 76)
        if (x - sun_x) ** 2 + (y - sun_y) ** 2 < sun_r ** 2:
            return (255, 238, 206)
        return mix((252, 222, 182), (232, 136, 104), y / far)
    rows = b''.join(b'\0' + b''.join(bytes(pixel(x, y)) for x in range(width)) for y in range(height))
    header = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    def chunk(kind, data):
        return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data) & 0xFFFFFFFF)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', header) + chunk(b'IDAT', zlib.compress(rows, 9)) + chunk(b'IEND', b'')


def open_editor(browser, base_url, errors, **context):
    page = browser.new_page(**context)
    page.on('console', lambda msg: errors.append(msg.text) if msg.type == 'error' else None)
    page.on('pageerror', lambda exc: errors.append(str(exc)))
    page.goto(base_url, wait_until='networkidle')
    page.get_by_role('heading', name='Image Text Editor').wait_for()
    return page


def upload(page: Page, image: Path):
    page.locator('#image-upload').set_input_files(image)
    # The 1600x800 fixture gets an 800px-wide preview; the drawing buffer is that times the pixel ratio.
    page.wait_for_function("document.querySelector('canvas.lower-canvas')?.width === 800 * window.devicePixelRatio")
    # Rendering happens on the next animation frame.
    page.wait_for_function(CORNER_PIXEL_JS + '[3] === 255')


def export(page: Page, folder: Path, name: str) -> bytes:
    with page.expect_download() as pending:
        page.get_by_role('button', name='Export', exact=True).click()
    dest = folder / name
    pending.value.save_as(dest)
    data = dest.read_bytes()
    assert struct.unpack('>II', data[16:24]) == FIXTURE_SIZE, 'Export must preserve source dimensions'
    return data


def desktop_checks(browser, base_url, folder: Path, image: Path, errors):
    page = open_editor(browser, base_url, errors, viewport={'width': 1720, 'height': 1100}, device_scale_factor=2)
    upload(page, image)

    corner = page.evaluate(CORNER_PIXEL_JS)
    assert abs(corner[0] - 236) <= 3 and abs(corner[2] - 202) <= 3, f'Bottom-right corner shows {corner}, not the upload'

    add_text = page.get_by_role('button', name='Add Text', exact=True)
    undo = page.get_by_role('button', name='Undo', exact=True)
    redo = page.get_by_role('button', name='Redo', exact=True)

    # Export stays at source resolution on a retina screen; undo/redo restore real pixels.
    baseline = export(page, folder, 'before.png')
    add_text.click()
    page.get_by_text('1 layer', exact=True).wait_for()
    added = export(page, folder, 'added.png')
    assert added != baseline
    undo.click()
    page.get_by_text('No layers yet', exact=True).wait_for()
    assert export(page, folder, 'undo.png') == baseline, 'Undo must restore actual canvas pixels'
    redo.click()
    page.get_by_text('1 layer', exact=True).wait_for()
    assert export(page, folder, 'redo.png') == added, 'Redo must restore actual canvas pixels'

    # A new edit after undo discards the redo branch.
    undo.click()
    page.get_by_text('No layers yet', exact=True).wait_for()
    add_text.click()
    page.get_by_text('1 layer', exact=True).wait_for()
    assert redo.is_disabled()

    # The properties panel follows the selected layer instead of keeping stale values.
    content = page.get_by_label('Content', exact=True)
    layer = lambda text: page.get_by_role('button', name=re.compile('^' + re.escape(text) + r' Layer \d+$'))
    add_text.click()
    page.get_by_text('2 layers', exact=True).wait_for()
    page.wait_for_timeout(300)
    content.fill('Second caption')
    layer('Second caption').wait_for()
    # The panel switches one render after the click, so wait with expect() rather than read once.
    layer('Your Text Here').click()
    expect(content).to_have_value('Your Text Here')
    layer('Second caption').click()
    expect(content).to_have_value('Second caption')

    # A keyboard nudge moves the layer's hit area too, not just its pixels.
    layer('Second caption').click()
    page.get_by_role('heading', name='Image Text Editor').click()
    for _ in range(10):
        page.keyboard.press('Shift+ArrowUp')
    box = page.locator('canvas.upper-canvas').bounding_box()
    page.mouse.click(box['x'] + 4, box['y'] + 4)
    page.get_by_text('No selection', exact=True).wait_for()
    page.mouse.click(box['x'] + box['width'] / 2, box['y'] + box['height'] / 2 - 100)
    expect(content).to_have_value('Second caption')

    # A non-PNG is refused with an inline message rather than a blocking alert.
    text_file = folder / 'notes.txt'
    text_file.write_text('not an image')
    page.locator('#image-upload').set_input_files(text_file)
    page.get_by_role('alert').filter(has_text='notes.txt is not a PNG').wait_for()
    page.close()


def mobile_checks(browser, base_url, folder: Path, image: Path, errors):
    page = open_editor(browser, base_url, errors, viewport={'width': 390, 'height': 844}, device_scale_factor=3,
                       is_mobile=True, has_touch=True)
    upload(page, image)

    overflow = page.evaluate('document.documentElement.scrollWidth - window.innerWidth')
    assert overflow <= 0, f'Page scrolls sideways by {overflow}px on a phone'
    box = page.locator('canvas.upper-canvas').bounding_box()
    assert box['x'] >= 0 and box['x'] + box['width'] <= 390, f'Canvas spills out of the viewport: {box}'
    assert box['width'] < 800, 'Canvas should be scaled down to fit a phone'

    # Pointer mapping must survive the CSS scale: tapping the text selects it.
    page.get_by_role('button', name='Add Text', exact=True).click()
    page.get_by_text('1 layer', exact=True).wait_for()
    page.mouse.click(box['x'] + 4, box['y'] + 4)
    page.get_by_text('No selection', exact=True).wait_for()
    page.mouse.click(box['x'] + box['width'] / 2, box['y'] + box['height'] / 2)
    page.get_by_label('Content', exact=True).wait_for()

    export(page, folder, 'mobile.png')
    page.close()


def add_caption(page: Page, text: str, font: str, size: int, raise_by: int = 0):
    page.get_by_role('button', name='Add Text', exact=True).click()
    page.wait_for_timeout(300)
    page.get_by_label('Content', exact=True).fill(text)
    page.get_by_label('Font Family', exact=True).click()
    page.get_by_role('option', name=font, exact=True).click()
    page.get_by_label('Font Size', exact=True).fill(str(size))
    page.wait_for_timeout(1200)  # debounced edits plus the Google Fonts stylesheet
    page.get_by_role('heading', name='Image Text Editor').click()  # move focus off the form so arrows nudge
    for _ in range(raise_by // 10):
        page.keyboard.press('Shift+ArrowUp')
    page.wait_for_timeout(400)


def capture(browser, base_url, folder: Path, errors):
    poster = folder / 'poster.png'
    poster.write_bytes(poster_png(1600, 1000))
    dest = REPO / 'docs' / 'screenshots'
    dest.mkdir(parents=True, exist_ok=True)

    page = open_editor(browser, base_url, errors, viewport={'width': 1440, 'height': 900})
    page.locator('#image-upload').set_input_files(poster)
    page.wait_for_timeout(600)
    add_caption(page, 'LATE FERRY', 'Bebas Neue', 120, raise_by=150)
    add_caption(page, 'Saturday, last sailing 21:40', 'Space Mono', 26, raise_by=60)
    page.screenshot(path=str(dest / 'editor-desktop.png'))
    page.close()

    page = open_editor(browser, base_url, errors, viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
    page.locator('#image-upload').set_input_files(poster)
    page.wait_for_timeout(600)
    add_caption(page, 'LATE FERRY', 'Bebas Neue', 120, raise_by=150)
    page.evaluate('window.scrollTo(0, 0)')
    page.screenshot(path=str(dest / 'editor-mobile.png'))
    page.close()
    for shot in ('editor-desktop.png', 'editor-mobile.png'):
        print(f'captured docs/screenshots/{shot}: {(dest / shot).stat().st_size // 1024} KB')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--capture', action='store_true', help='refresh docs/screenshots/')
    args = parser.parse_args()

    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(REPO / 'out'))
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base_url = f'http://127.0.0.1:{server.server_port}'
    errors = []
    try:
        with tempfile.TemporaryDirectory() as tmp, sync_playwright() as engine:
            folder = Path(tmp)
            image = folder / 'fixture.png'
            image.write_bytes(gradient_png(*FIXTURE_SIZE))
            browser = engine.chromium.launch(headless=True)
            desktop_checks(browser, base_url, folder, image, errors)
            mobile_checks(browser, base_url, folder, image, errors)
            if args.capture:
                capture(browser, base_url, folder, errors)
            browser.close()
        assert not errors, f'Console errors: {errors}'
        print('PASS: full-canvas background, source-resolution export, pixel-verified undo/redo, '
              'redo-branch invalidation, per-layer properties, upload errors, phone layout and touch selection, '
              'no console errors')
    finally:
        server.shutdown()
        server.server_close()


if __name__ == '__main__':
    main()
