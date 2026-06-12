import './globals.css';

export const metadata = {
  title: 'Anaesthetics Career Dashboard',
  description: 'Cross-device CV + career progression dashboard with Supabase sync.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
