import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NotFoundNavigation from '@/components/NotFoundNavigation';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <Header />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-8xl font-bold text-gray-900 mb-4">404</h1>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Page Not Found</h2>
            <p className="text-lg text-gray-600 mb-8">
              Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved, deleted, or doesn&apos;t exist.
            </p>
          </div>

          <NotFoundNavigation />
        </div>
      </div>

      <Footer />
    </div>
  );
}
