import { Navbar } from './Navbar';
import { Footer } from './Footer';

export function Layout({ children, withFooter = true }) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      <Navbar />
      <main className="flex-1 pt-16">{children}</main>
      {withFooter && <Footer />}
    </div>
  );
}

export default Layout;
