import Header from '../../components/Header';
import ComingFeatures from '../../components/ComingFeatures';
import Footer from '../../components/Footer';
import PricingGrid from '@/components/PricingGrid';
import ContactSalesButton from '@/components/ContactSalesButton';

export default function Pricing() {

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="container mx-auto px-4 py-16">
        {/* Header Section */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
            Choose Your{' '}
            <span className="bg-black text-white px-2 py-1 rounded text-3xl md:text-4xl font-semibold">
              Perfect Plan
            </span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Select the plan that best fits your content creation needs. Upgrade or downgrade anytime.
          </p>
        </div>

        {/* Pricing Cards */}
          <PricingGrid />        {/* FAQ or Additional Info */}
        <div className="mt-16 text-center max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold mb-4">Need help choosing?</h3>
          <p className="text-gray-600 mb-4">
            Not sure which plan is right for you? Start with our free tier and upgrade when you&apos;re ready for more features.
          </p>
          <ContactSalesButton />
        </div>
      </div>

      {/* Coming Features Section */}
      <ComingFeatures />

      {/* Footer */}
      <Footer />
    </div>
  );
}
