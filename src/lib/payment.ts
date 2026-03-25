type VehicleType = "Car" | "Bike" | "Scooter";
type PricingStrategy = "PerMinute" | "PerHour" | "FlatRate";

interface PricingRate {
  rate: number;
  unit: string;
  strategy: PricingStrategy;
}

const PRICING_RATES: Record<VehicleType, PricingRate> = {
  Scooter: { rate: 0.15, unit: "min", strategy: "PerMinute" },
  Bike: { rate: 3.0, unit: "hour", strategy: "PerHour" },
  Car: { rate: 0.45, unit: "min", strategy: "PerMinute" },
};

class PaymentSystem {
  private static instance: PaymentSystem;
  private mockUserBalance: number = 50.0; //simulated $50 starting balance

  private constructor() {}

  public static getInstance(): PaymentSystem {
    if (!PaymentSystem.instance) {
      PaymentSystem.instance = new PaymentSystem();
    }
    return PaymentSystem.instance;
  }

  public verifyBalance(userId: string): boolean {
    return this.mockUserBalance >= 10.0;
  }

  public getBalance(): number {
    return this.mockUserBalance;
  }

  public getPricingRate(vehicleType: string): PricingRate {
    return PRICING_RATES[vehicleType as VehicleType] ?? { rate: 0, unit: "min", strategy: "FlatRate" };
  }

  public calculateFare(
    vehicleType: string,
    startTime: Date,
    endTime: Date,
  ): { fare: number; durationMinutes: number; rate: number; unit: string } {
    const pricing = this.getPricingRate(vehicleType);
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationMinutes = Math.max(1, Math.ceil(durationMs / 60_000));

    let fare: number;
    switch (pricing.strategy) {
      case "PerMinute":
        fare = durationMinutes * pricing.rate;
        break;
      case "PerHour": {
        const hours = Math.max(1, Math.ceil(durationMinutes / 60));
        fare = hours * pricing.rate;
        break;
      }
      case "FlatRate":
      default:
        fare = 0;
        break;
    }

    fare = Math.round(fare * 100) / 100;

    return { fare, durationMinutes, rate: pricing.rate, unit: pricing.unit };
  }

  public debitAccount(userId: string, amount: number): { success: boolean; remaining: number } {
    if (this.mockUserBalance < amount) {
      console.log(`[PAYMENT] Insufficient balance. Has $${this.mockUserBalance.toFixed(2)}, needs $${amount.toFixed(2)}`);
      return { success: false, remaining: this.mockUserBalance };
    }
    this.mockUserBalance -= amount;
    console.log(
      `[PAYMENT] Debited $${amount.toFixed(2)}. Remaining: $${this.mockUserBalance.toFixed(2)}`,
    );
    return { success: true, remaining: this.mockUserBalance };
  }
}

//single instance
export const paymentSystem = PaymentSystem.getInstance();
