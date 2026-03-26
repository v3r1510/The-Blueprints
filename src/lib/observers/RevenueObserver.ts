import { IObserver, VehicleStateChange } from "./ObserverInterfaces";

export class RevenueObserver implements IObserver {
  private static instance: RevenueObserver;
  private todayRevenue: number = 0;

  private constructor() {}

  static getInstance(): RevenueObserver {
    if (!RevenueObserver.instance) {
      RevenueObserver.instance = new RevenueObserver();
    }
    return RevenueObserver.instance;
  }

  // IObserver: -----------
  update(data: VehicleStateChange): void {
    if (
      (data.previousState === "Reserved" || data.previousState === "Active") &&
      data.newState === "Available"
    ) {
      console.log(
        `[RevenueObserver] Rental completed for vehicle ${data.vehicleId} — fare recorded separately`,
      );
    }
  }

  // Direct recording (fare is the exact amount debited from the user's account)
  // called immediately after a successful debit:
  recordRevenue(fare: number): void {
    this.todayRevenue = Math.round((this.todayRevenue + fare) * 100) / 100;
    console.log(
      `[RevenueObserver] +$${fare.toFixed(2)} recorded | today's total: $${this.todayRevenue.toFixed(2)}`,
    );
  }

  getTodayRevenue(): number {
    return this.todayRevenue;
  }

  setTodayRevenue(amount: number): void {
    this.todayRevenue = amount;
  }
}