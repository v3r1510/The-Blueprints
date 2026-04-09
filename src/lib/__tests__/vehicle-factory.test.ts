import { getFactory } from "@/lib/vehicle-factory";

describe("Vehicle Factory Pattern", () => {
  const baseInput = {
    zone: "Downtown",
    coordinates: [-73.5673, 45.5017] as [number, number],
  };

  it("should create a Car with correct base properties and battery (50-100)", () => {
    const factory = getFactory("Car");
    const vehicle = factory.create(baseInput);

    expect(vehicle.type).toBe("Car");
    expect(vehicle.zone).toBe("Downtown");
    expect(vehicle.state).toBe("Available");
    expect(vehicle.batteryLevel).toBeGreaterThanOrEqual(50);
    expect(vehicle.batteryLevel).toBeLessThanOrEqual(100);
    expect(vehicle.location.type).toBe("Point");
  });

  it("should create a Bike with a fixed 100% battery", () => {
    const factory = getFactory("Bike");
    const vehicle = factory.create(baseInput);

    expect(vehicle.type).toBe("Bike");
    expect(vehicle.batteryLevel).toBe(100);
  });

  it("should create a Scooter with battery (25-100)", () => {
    const factory = getFactory("Scooter");
    const vehicle = factory.create(baseInput);

    expect(vehicle.type).toBe("Scooter");
    expect(vehicle.batteryLevel).toBeGreaterThanOrEqual(25);
    expect(vehicle.batteryLevel).toBeLessThanOrEqual(100);
  });
});
