import { IObserver, VehicleStateChange } from "./ObserverInterfaces";
import { connectDB } from "@/lib/mongodb";
import GatewayEvent from "@/models/GatewayEvent";

export interface GatewayCallEvent {
  service: string;
  status: "success" | "failure";
  latencyMs: number;
  httpStatus?: number;
  error?: string;
  timestamp: Date;
}

/**
 * GatewayAnalyticsObserver – Singleton observer that tracks external API
 * gateway call health (STM transit feeds).
 *
 * Implements IObserver to participate in the existing observer pattern.
 * Also exposes onGatewayCall() which the transit API route invokes
 * directly — the same way PaymentObserver exposes recordFailure() and
 * RevenueObserver exposes setTodayRevenue().
 */
export class GatewayAnalyticsObserver implements IObserver {
  private static instance: GatewayAnalyticsObserver;

  private totalCalls = 0;
  private successCount = 0;
  private failureCount = 0;
  private totalLatencyMs = 0;

  private constructor() {}

  static getInstance(): GatewayAnalyticsObserver {
    if (!GatewayAnalyticsObserver.instance) {
      GatewayAnalyticsObserver.instance = new GatewayAnalyticsObserver();
    }
    return GatewayAnalyticsObserver.instance;
  }

  // IObserver — vehicle state changes are not relevant to gateway monitoring
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(_: VehicleStateChange): void {}

  // Gateway-specific entry point called by the transit API route
  onGatewayCall(event: GatewayCallEvent): void {
    this.totalCalls++;
    this.totalLatencyMs += event.latencyMs;
    if (event.status === "success") {
      this.successCount++;
    } else {
      this.failureCount++;
    }

    // Persist to DB asynchronously so we never block the API response
    this.persist(event).catch((err) =>
      console.error("[GatewayAnalyticsObserver] DB persist failed:", err),
    );

    console.log(
      `[GatewayAnalyticsObserver] ${event.service} → ${event.status} (${event.latencyMs}ms)`,
    );
  }

  private async persist(event: GatewayCallEvent): Promise<void> {
    await connectDB();
    await GatewayEvent.create({
      service: event.service,
      status: event.status,
      latencyMs: event.latencyMs,
      httpStatus: event.httpStatus,
      error: event.error,
    });
  }

  // Sync in-memory state from DB totals (called by gateway-health endpoint)
  setStats(totalCalls: number, successCount: number, failureCount: number, avgLatencyMs: number): void {
    this.totalCalls = totalCalls;
    this.successCount = successCount;
    this.failureCount = failureCount;
    this.totalLatencyMs = avgLatencyMs * totalCalls;
  }

  getStats() {
    const successRate =
      this.totalCalls === 0
        ? 100
        : Math.round((this.successCount / this.totalCalls) * 100);
    const avgLatencyMs =
      this.totalCalls === 0
        ? 0
        : Math.round(this.totalLatencyMs / this.totalCalls);
    return {
      totalCalls: this.totalCalls,
      successCount: this.successCount,
      failureCount: this.failureCount,
      successRate,
      avgLatencyMs,
    };
  }
}
