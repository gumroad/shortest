import { checkoutAction } from '@/lib/payments/actions';
import { Check } from 'lucide-react';
import { getStripePrices, getStripeProducts } from '@/lib/payments/stripe';
import { SubmitButton } from './submit-button';
import Link from 'next/link';

// Prices are fresh for one hour max
export const revalidate = 3600;

export default async function PricingPage() {
  const [prices, products] = await Promise.all([
    getStripePrices(),
    getStripeProducts(),
  ]);

  const freePlan = products.find((product) => product.name === 'Free');
  const basePlan = products.find((product) => product.name === 'Base');
  const plusPlan = products.find((product) => product.name === 'Plus');

  const basePrice = prices.find((price) => price.productId === basePlan?.id);
  const plusPrice = prices.find((price) => price.productId === plusPlan?.id);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-center mb-8">Shortest Pricing</h1>
      <p className="text-center mb-12 text-gray-600">Run your CI suite faster and more efficiently with Shortest</p>
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <PricingCard
          name="Free"
          price={0}
          interval="month"
          features={[
            '10 builds per day',
            '1 user',
            'Basic support',
            'Confidence interval testing'
          ]}
        />
        <PricingCard
          name={basePlan?.name || 'Base'}
          price={basePrice?.unitAmount || 2900}
          interval={basePrice?.interval || 'month'}
          trialDays={basePrice?.trialPeriodDays || 14}
          features={[
            'Up to 100 builds per day',
            'Up to 10 users',
            'Email support',
            'Advanced CI optimization',
            'Detailed test analytics'
          ]}
          priceId={basePrice?.id}
        />
        <PricingCard
          name={plusPlan?.name || 'Plus'}
          price={plusPrice?.unitAmount || 9900}
          interval={plusPrice?.interval || 'month'}
          trialDays={plusPrice?.trialPeriodDays || 14}
          features={[
            'Up to 1,000 builds per day',
            'Up to 100 users',
            'Priority support',
            'Custom CI workflows',
            'Advanced reporting and insights'
          ]}
          priceId={plusPrice?.id}
        />
      </div>
      <div className="mt-12 text-center">
        <h2 className="text-2xl font-semibold mb-4">Enterprise</h2>
        <p className="mb-4">Need more? Our enterprise plan offers unlimited builds, users, and custom solutions.</p>
        <Link href="mailto:sales@shortest.com" className="text-orange-500 hover:text-orange-600 font-medium">
          Contact our sales team
        </Link>
      </div>
    </main>
  );
}

function PricingCard({
  name,
  price,
  interval,
  trialDays,
  features,
  priceId,
}: {
  name: string;
  price: number;
  interval: string;
  trialDays?: number;
  features: string[];
  priceId?: string;
}) {
  return (
    <div className="border rounded-lg p-6 shadow-sm">
      <h2 className="text-2xl font-medium text-gray-900 mb-2">{name}</h2>
      {trialDays && (
        <p className="text-sm text-gray-600 mb-4">
          with {trialDays} day free trial
        </p>
      )}
      <p className="text-4xl font-medium text-gray-900 mb-6">
        ${price / 100}{' '}
        <span className="text-xl font-normal text-gray-600">
          /{interval}
        </span>
      </p>
      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="h-5 w-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>
      {priceId ? (
        <form action={checkoutAction}>
          <input type="hidden" name="priceId" value={priceId} />
          <SubmitButton />
        </form>
      ) : (
        <button className="w-full bg-gray-100 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors">
          Current Plan
        </button>
      )}
    </div>
  );
}
