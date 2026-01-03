import { NextRequest, NextResponse } from 'next/server';
import { getStripe, PRODUCTS } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, rankedValues, definitions } = body;

    if (!sessionId || !rankedValues || rankedValues.length === 0) {
      return NextResponse.json(
        { error: 'Missing session data' },
        { status: 400 }
      );
    }

    // Get the origin for success/cancel URLs
    const origin = request.headers.get('origin') || 'http://localhost:3000';

    // Create Stripe Checkout session
    const stripe = getStripe();
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: PRODUCTS.report2026.name,
              description: PRODUCTS.report2026.description,
            },
            unit_amount: PRODUCTS.report2026.price,
          },
          quantity: 1,
        },
      ],
      metadata: {
        sessionId,
        rankedValues: JSON.stringify(rankedValues),
        definitions: JSON.stringify(definitions),
      },
      success_url: `${origin}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/assess/review`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
