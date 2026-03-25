import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const ALLOWED_PRICES = new Set([
  process.env.STRIPE_PRICE_10,
  process.env.STRIPE_PRICE_25,
  process.env.STRIPE_PRICE_50,
]);

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { priceId } = body;

    if (!priceId || !ALLOWED_PRICES.has(priceId)) {
      return NextResponse.json(
        { error: "Invalid price selection" },
        { status: 400 },
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId: session.user.id },
      success_url: `${appUrl}/profile?success=true`,
      cancel_url: `${appUrl}/profile?cancelled=true`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("[STRIPE CHECKOUT ERROR]", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
