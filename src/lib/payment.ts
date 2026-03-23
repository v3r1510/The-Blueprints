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

  //pre-authorization check to ensure user has sufficient balance to reserve a vehicle
  public verifyBalance(userId: string): boolean {
    return this.mockUserBalance >= 10.0; //minimum balance = 10$
  }

  public debitAccount(userId: string, amount: number): void {
    this.mockUserBalance -= amount;
    console.log(
      `[PAYMENT] Debited $${amount.toFixed(2)}. Remaining: $${this.mockUserBalance.toFixed(2)}`,
    );
  }
}

//single instance
export const paymentSystem = PaymentSystem.getInstance();
