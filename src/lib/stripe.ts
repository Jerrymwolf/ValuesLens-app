import Stripe from 'stripe';

// Lazy-initialized Stripe instance (avoids build-time initialization errors)
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    });
  }
  return _stripe;
}

// Price ID for the 2026 Values Report ($12)
export const REPORT_PRICE_ID = process.env.STRIPE_REPORT_PRICE_ID;

// Product configuration
export const PRODUCTS = {
  report2026: {
    name: 'Your 2026 Values Report',
    description: 'Beautiful PDF report with all 5 values, decision framework, and printable wallet card',
    price: 1200, // $12.00 in cents
  },
};
