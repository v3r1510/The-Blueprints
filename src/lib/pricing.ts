export interface PricingStrategy {
  readonly name: string;
  readonly rate: number;
  readonly unit: string;
  calculateTotal(durationMinutes: number): number;
}

export class PerMinutePricing implements PricingStrategy {
  readonly name = "PerMinute";
  readonly unit = "min";

  constructor(public readonly rate: number) {}

  calculateTotal(durationMinutes: number): number {
    return Math.round(durationMinutes * this.rate * 100) / 100;
  }
}

export class PerHourPricing implements PricingStrategy {
  readonly name = "PerHour";
  readonly unit = "hour";

  constructor(public readonly rate: number) {}

  calculateTotal(durationMinutes: number): number {
    const hours = Math.max(1, Math.ceil(durationMinutes / 60));
    return Math.round(hours * this.rate * 100) / 100;
  }
}

export class FlatRatePricing implements PricingStrategy {
  readonly name = "FlatRate";
  readonly unit = "flat";

  constructor(public readonly rate: number = 0) {}

  calculateTotal(_durationMinutes: number): number {
    return this.rate;
  }
}

type VehicleType = "Car" | "Bike" | "Scooter";
type StrategyName = "PerMinute" | "PerHour" | "FlatRate";

const VEHICLE_STRATEGIES: Record<VehicleType, PricingStrategy> = {
  Scooter: new PerMinutePricing(0.15),
  Car: new PerMinutePricing(0.45),
  Bike: new PerHourPricing(3.0),
};

const STRATEGY_DEFAULTS: Record<StrategyName, PricingStrategy> = {
  PerMinute: new PerMinutePricing(0),
  PerHour: new PerHourPricing(0),
  FlatRate: new FlatRatePricing(0),
};

export function getStrategyForVehicle(vehicleType: string): PricingStrategy {
  return VEHICLE_STRATEGIES[vehicleType as VehicleType] ?? new FlatRatePricing(0);
}

export function getStrategyByName(name: string): PricingStrategy {
  return STRATEGY_DEFAULTS[name as StrategyName] ?? new FlatRatePricing(0);
}

/** Flat-rate parking sessions (rate = total fare when trip ends). */
export function getStrategyForParkingFlat(flatRate: number): PricingStrategy {
  return new FlatRatePricing(flatRate);
}
