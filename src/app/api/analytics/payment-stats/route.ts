import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Trip from "@/models/Trip";
import { PaymentObserver } from "@/lib/observers/PaymentObserver";
import PaymentEvent from "@/models/PaymentEvent";

export async function GET() {
  const session = await auth();

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: admin access only" }, { status: 403 });
  }

  try {
    await connectDB();

    const observer = PaymentObserver.getInstance();
    const successCount = await Trip.countDocuments({ status: "Completed" });
    const failureCount = await PaymentEvent.countDocuments({ type: "failure" });
    const total = successCount + failureCount;
    const successRate = total === 0 ? 100 : Math.round((successCount / total) * 100);

    // Sync success count into singleton
    observer.setStats(successCount, failureCount);

    return NextResponse.json({ successCount, failureCount, successRate, total });
  } catch (err) {
    console.error("[PAYMENT STATS ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}