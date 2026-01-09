import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TerzoTimeSheets - Employee Timesheet Management',
  description: 'Manage employee timesheets for cafe-bars',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
