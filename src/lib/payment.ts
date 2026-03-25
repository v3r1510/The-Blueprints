import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

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

  private constructor() {}

  public static getInstance(): PaymentSystem {
    if (!PaymentSystem.instance) {
      PaymentSystem.instance = new PaymentSystem();
    }
    return PaymentSystem.instance;
  }

  public async verifyBalance(userId: string): Promise<boolean> {
    await connectDB();
    const user = await User.findById(userId).select("balance");
    if (!user) return false;
    return user.balance >= 10.0;
  }

  public async getBalance(userId: string): Promise<number> {
    await connectDB();
    const user = await User.findById(userId).select("balance");
    return user?.balance ?? 0;
  }

  public getPricingRate(vehicleType: string): PricingRate {
    return (
      PRICING_RATES[vehicleType as VehicleType] ?? {
        rate: 0,
        unit: "min",
        strategy: "FlatRate",
      }
    );
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

  public async debitAccount(
    userId: string,
    amount: number,
  ): Promise<{ success: boolean; remaining: number }> {
    await connectDB();
    const user = await User.findById(userId).select("balance");
    if (!user || user.balance < amount) {
      console.log(`[PAYMENT] Insufficient balance for user ${userId}`);
      return { success: false, remaining: user?.balance ?? 0 };
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      { $inc: { balance: -amount } },
      { new: true },
    );

    const remaining = updated?.balance ?? 0;
    console.log(
      `[PAYMENT] Debited $${amount.toFixed(2)} from user ${userId}. Remaining: $${remaining.toFixed(2)}`,
    );
    return { success: true, remaining };
  }
}

export const paymentSystem = PaymentSystem.getInstance();
