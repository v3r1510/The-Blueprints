import { IObserver, VehicleStateChange } from "./ObserverInterfaces";

export class AnalyticsSystem implements IObserver {
  private static instance: AnalyticsSystem;
  private activeRentals: number = 0;

  private constructor() { }

  static getInstance(): AnalyticsSystem {
    if (!AnalyticsSystem.instance) {
      AnalyticsSystem.instance = new AnalyticsSystem();
    }
    return AnalyticsSystem.instance;
  }

  update(data: VehicleStateChange): void {
    const wasActive =
      data.previousState === "Reserved" || data.previousState === "InUse";
    const isActive =
      data.newState === "Reserved" || data.newState === "InUse";

    if (!wasActive && isActive) this.activeRentals++;
    if (wasActive && !isActive) this.activeRentals = Math.max(0, this.activeRentals - 1);

    console.log(
      `[AnalyticsSystem] ${data.vehicleId}: ${data.previousState} → ${data.newState} | active rentals: ${this.activeRentals}`,
    );
  }

  getActiveRentals(): number {
    return this.activeRentals;
  }

  setActiveRentals(count: number): void {
    this.activeRentals = count;
  }
}