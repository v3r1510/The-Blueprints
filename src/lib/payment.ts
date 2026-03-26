import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import {
  PricingStrategy,
  getStrategyForVehicle,
  getStrategyByName,
} from "@/lib/pricing";

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

  public resolveStrategy(vehicleType: string): PricingStrategy {
    return getStrategyForVehicle(vehicleType);
  }

  public resolveStrategyByName(name: string): PricingStrategy {
    return getStrategyByName(name);
  }

  public calculateFare(
    strategy: PricingStrategy,
    startTime: Date,
    endTime: Date,
  ): { fare: number; durationMinutes: number; rate: number; unit: string } {
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationMinutes = Math.max(1, Math.ceil(durationMs / 60_000));
    const fare = strategy.calculateTotal(durationMinutes);

    return { fare, durationMinutes, rate: strategy.rate, unit: strategy.unit };
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
