/** @type {import('next').NextConfig} */
const nextConfig = {
  // This editor is entirely client-side — the canvas, the fonts and the export
  // all run in the browser — so it builds to a static site with no server.
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
