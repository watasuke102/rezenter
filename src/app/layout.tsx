import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rezenter',
  description:
    'PDF and Typst presentation sessions with viewer, presenter, and controller',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='ja'>
      <body>{children}</body>
    </html>
  );
}
