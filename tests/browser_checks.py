"""Exercise the built editor in a real browser; no hosted services required."""
import argparse
import functools
import re
import http.server
from pathlib import Path
import struct
import tempfile
import threading
import zlib
from playwright.sync_api import sync_playwright

def png(width, height):
    def chunk(kind, data):
        return struct.pack('>I',len(data))+kind+data+struct.pack('>I',zlib.crc32(kind+data)&0xffffffff)
    rows=b''.join(b'\0'+bytes([236,224+(y*12//height),202])*width for y in range(height))
    return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',width,height,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(rows))+chunk(b'IEND',b'')

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--capture',action='store_true');args=parser.parse_args()
    repo=Path(__file__).resolve().parents[1]
    server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(repo/'out')))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    try:
      with tempfile.TemporaryDirectory() as folder, sync_playwright() as engine:
        image=Path(folder)/'fixture.png';image.write_bytes(png(1600,800))
        browser=engine.chromium.launch(headless=True)
        page=browser.new_page(viewport={'width':1720,'height':1100},device_scale_factor=2)
        page.goto('http://127.0.0.1:'+str(server.server_port),wait_until='networkidle')
        page.locator('#image-upload').set_input_files(image)
        page.wait_for_function("document.querySelector('canvas.lower-canvas')?.width === 1600")
        # The background must cover the whole canvas, not just one quadrant.
        corner=page.evaluate("(() => { const c = document.querySelector('canvas.lower-canvas'); return Array.from(c.getContext('2d').getImageData(c.width - 4, c.height - 4, 1, 1).data); })()")
        assert abs(corner[0]-236)<=3 and abs(corner[2]-202)<=3,f'Bottom-right corner shows {corner}, not the uploaded image'
        def export(name):
          with page.expect_download() as pending:page.get_by_role('button',name='Export',exact=True).click()
          dest=Path(folder)/name;pending.value.save_as(dest);data=dest.read_bytes()
          assert struct.unpack('>II',data[16:24])==(1600,800),'Export must preserve source dimensions even on retina displays'
          return data
        baseline=export('before.png')
        page.get_by_role('button',name='Add Text',exact=True).click()
        page.get_by_text('1 layer',exact=True).wait_for()
        added=export('added.png');assert added != baseline
        page.get_by_role('button',name='Undo',exact=True).click()
        page.get_by_text('No layers yet',exact=True).wait_for()
        assert export('undo.png')==baseline,'Undo must restore actual canvas pixels'
        page.get_by_role('button',name='Redo',exact=True).click()
        page.get_by_text('1 layer',exact=True).wait_for()
        assert export('redo.png')==added,'Redo must restore actual canvas pixels'
        # A new edit after undo discards the redo branch.
        page.get_by_role('button',name='Undo',exact=True).click();page.get_by_text('No layers yet',exact=True).wait_for()
        page.get_by_role('button',name='Add Text',exact=True).click();page.get_by_text('1 layer',exact=True).wait_for()
        assert page.get_by_role('button',name='Redo',exact=True).is_disabled()
        # The properties panel follows the selected layer instead of keeping stale field values.
        content=page.get_by_label('Content',exact=True)
        page.get_by_role('button',name='Add Text',exact=True).click();page.get_by_text('2 layers',exact=True).wait_for()
        page.wait_for_timeout(300)
        layer=lambda text:page.locator('p',has_text=re.compile('^'+re.escape(text)+'$'))
        content.fill('Second caption');layer('Second caption').wait_for()
        layer('Your Text Here').click()
        assert content.input_value()=='Your Text Here','Content field must show the newly selected layer'
        layer('Second caption').click()
        assert content.input_value()=='Second caption'
        if args.capture:
          page.get_by_label('Content',exact=True).fill('Summer studio')
          page.wait_for_timeout(800)
          dest=repo/'docs/screenshots';dest.mkdir(parents=True,exist_ok=True)
          page.screenshot(path=str(dest/'editor.png'),full_page=True)
        browser.close()
        print('PASS: full-canvas background, original-resolution retina export, pixel-verified undo/redo, redo-branch invalidation, per-layer properties')
    finally:server.shutdown();server.server_close()

if __name__=='__main__':main()
