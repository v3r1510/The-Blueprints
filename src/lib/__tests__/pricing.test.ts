import {
  PerMinutePricing,
  PerHourPricing,
  FlatRatePricing,
  getStrategyForVehicle,
} from "@/lib/pricing";

describe("Pricing Strategy Pattern", () => {
  describe("PerMinutePricing", () => {
    it("should calculate fare correctly based on minutes", () => {
      const strategy = new PerMinutePricing(0.15);
      expect(strategy.calculateTotal(10)).toBe(1.5);
    });
  });

  describe("PerHourPricing", () => {
    it("should calculate fare for a fraction of an hour (minimum 1 hour)", () => {
      const strategy = new PerHourPricing(3.0);
      expect(strategy.calculateTotal(30)).toBe(3.0);
    });

    it("should calculate fare rounding up to the next hour", () => {
      const strategy = new PerHourPricing(3.0);
      expect(strategy.calculateTotal(65)).toBe(6.0);
    });
  });

  describe("FlatRatePricing", () => {
    it("should always return the flat rate regardless of duration", () => {
      const strategy = new FlatRatePricing(15.0);
      expect(strategy.calculateTotal(120)).toBe(15.0);
    });
  });

  describe("Vehicle Strategy Factory", () => {
    it("should return the correct strategy for a Scooter", () => {
      const strategy = getStrategyForVehicle("Scooter");
      expect(strategy.name).toBe("PerMinute");
      expect(strategy.rate).toBe(0.15);
    });

    it("should return the correct strategy for a Bike", () => {
      const strategy = getStrategyForVehicle("Bike");
      expect(strategy.name).toBe("PerHour");
    });
  });
});
