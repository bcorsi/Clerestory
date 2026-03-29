import './globals.css';

export const metadata = {
  title: 'Clerestory',
  description: "See the deal before it's a deal.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
