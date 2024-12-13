import { Header } from './_components/layout/Header';
import { Sidebar } from './_components/layout/Sidebar';
import { Footer } from './_components/layout/Footer';
import './globals.css';

export const metadata = {
  title: 'Find Partner',
  description: 'Find your best partner',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <Header />
        <div className="flex min-h-[calc(100vh-64px)] pt-16 pb-16">
          <Sidebar />
          <main className="flex-1 w-full overflow-auto">
            <div className="px-4 py-6 mx-auto max-w-[1600px]">
              {children}
            </div>
          </main>
        </div>
        <Footer />
      </body>
    </html>
  );
}
