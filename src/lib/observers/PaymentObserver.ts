import { IObserver, VehicleStateChange } from "./ObserverInterfaces";
import { connectDB } from "@/lib/mongodb";
import PaymentEvent from "@/models/PaymentEvent";
export class PaymentObserver implements IObserver {
  private static instance: PaymentObserver;

  private successCount: number = 0;
  private failureCount: number = 0;

  private constructor() {}

  static getInstance(): PaymentObserver {
    if (!PaymentObserver.instance) {
      PaymentObserver.instance = new PaymentObserver();
    }
    return PaymentObserver.instance;
  }

  // IObserver ---------

  update(data: VehicleStateChange): void {
    if (
      (data.previousState === "Reserved" || data.previousState === "Active") &&
      data.newState === "Available"
    ) {
      this.successCount++;
      console.log(
        `[PaymentObserver] Payment success for vehicle ${data.vehicleId} | total successes: ${this.successCount}`,
      );
    }
  }


  async recordFailure(userId?: string): Promise<void> {
    this.failureCount++;
    await connectDB();
    await PaymentEvent.create({ userId: userId ?? "unknown", type: "failure", reason: "insufficient_funds" });
    console.log(`[PaymentObserver] Insufficient funds rejection for user ${userId}`);
  }

  getSuccessCount(): number {
    return this.successCount;
  }

  getFailureCount(): number {
    return this.failureCount;
  }

  getSuccessRate(): number {
    const total = this.successCount + this.failureCount;
    if (total === 0) return 0;
    return Math.round((this.successCount / total) * 100);
  }

  setStats(successCount: number, failureCount: number): void {
    this.successCount = successCount;
    this.failureCount = failureCount;
  }
}