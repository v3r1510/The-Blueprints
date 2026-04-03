import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import GatewayEvent from "@/models/GatewayEvent";
import { GatewayAnalyticsObserver } from "@/lib/observers/GatewayAnalyticsObserver";

export async function GET() {
  const session = await auth();

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: admin access only" }, { status: 403 });
  }

  try {
    await connectDB();

    const [totalCalls, successCount, latencyResult] = await Promise.all([
      GatewayEvent.countDocuments({}),
      GatewayEvent.countDocuments({ status: "success" }),
      GatewayEvent.aggregate([{ $group: { _id: null, avg: { $avg: "$latencyMs" } } }]),
    ]);

    const failureCount = totalCalls - successCount;
    const avgLatencyMs = latencyResult[0] ? Math.round(latencyResult[0].avg) : 0;
    const successRate = totalCalls === 0 ? 100 : Math.round((successCount / totalCalls) * 100);

    // Sync singleton with DB-sourced values
    GatewayAnalyticsObserver.getInstance().setStats(totalCalls, successCount, failureCount, avgLatencyMs);

    return NextResponse.json({ totalCalls, successCount, failureCount, successRate, avgLatencyMs });
  } catch (err) {
    console.error("[GATEWAY HEALTH ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
