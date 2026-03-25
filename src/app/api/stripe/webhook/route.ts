import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("[STRIPE WEBHOOK] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const amountCents = session.amount_total;

    if (!userId || !amountCents) {
      console.error("[STRIPE WEBHOOK] Missing userId or amount in session", session.id);
      return NextResponse.json({ error: "Invalid session data" }, { status: 400 });
    }

    const amountDollars = amountCents / 100;

    try {
      await connectDB();
      await User.findByIdAndUpdate(userId, {
        $inc: { balance: amountDollars },
      });
      console.log(`[STRIPE WEBHOOK] Added $${amountDollars.toFixed(2)} to user ${userId}`);
    } catch (dbErr) {
      console.error("[STRIPE WEBHOOK] DB update failed:", dbErr);
      return NextResponse.json({ error: "DB update failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
