import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    p10: process.env.STRIPE_PRICE_10 ?? "",
    p25: process.env.STRIPE_PRICE_25 ?? "",
    p50: process.env.STRIPE_PRICE_50 ?? "",
  });
}
