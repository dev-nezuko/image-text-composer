import './globals.css';
import type { Metadata } from 'next';



export const metadata: Metadata = {
  title: 'Image text composer',
  description: 'Browser canvas prototype for text overlays, layer styling and PNG export.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
