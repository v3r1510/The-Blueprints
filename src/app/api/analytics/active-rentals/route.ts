import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Trip from "@/models/Trip";
import { AnalyticsSystem } from "@/lib/observers/AnalyticsObserver";

export async function GET() {
  const session = await auth();

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: admin access only" }, { status: 403 });
  }

  try {
    await connectDB();

    const activeRentalsCount = await Trip.countDocuments({
      status: { $in: ["Reserved", "Active"] },
    });

    const analytics = AnalyticsSystem.getInstance();
    analytics.setActiveRentals(activeRentalsCount);

    return NextResponse.json({ activeRentals: activeRentalsCount });
  } catch (err) {
    console.error("[ANALYTICS ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}