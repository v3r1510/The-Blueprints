/**
 * @jest-environment node
 */
import mongoose from "mongoose";
import Trip from "@/models/Trip";

const userId = new mongoose.Types.ObjectId();
const vehicleId = new mongoose.Types.ObjectId();
const parkingSpotId = new mongoose.Types.ObjectId();

describe("Trip model", () => {
  describe("required fields", () => {
    it("should require userId", async () => {
      const trip = new Trip({
        pricingStrategy: "PerMinute",
        vehicleId,
      });
      await expect(trip.validate()).rejects.toThrow();
    });

    it("should require pricingStrategy", async () => {
      const trip = new Trip({ userId, vehicleId });
      await expect(trip.validate()).rejects.toThrow();
    });

    it("should reject an invalid pricingStrategy", () => {
      const trip = new Trip({
        userId,
        vehicleId,
        pricingStrategy: "Weekly",
      });
      const err = trip.validateSync();
      expect(err?.errors.pricingStrategy).toBeDefined();
    });

    it("should reject an invalid status", () => {
      const trip = new Trip({
        userId,
        vehicleId,
        pricingStrategy: "PerMinute",
        status: "Pending",
      });
      const err = trip.validateSync();
      expect(err?.errors.status).toBeDefined();
    });
  });

  describe("defaults", () => {
    it("should default status to Reserved", () => {
      const trip = new Trip({
        userId,
        vehicleId,
        pricingStrategy: "PerHour",
      });
      expect(trip.status).toBe("Reserved");
    });

    it("should default startTime to approximately now", () => {
      const before = Date.now();
      const trip = new Trip({
        userId,
        vehicleId,
        pricingStrategy: "FlatRate",
      });
      const after = Date.now();
      expect(trip.startTime.getTime()).toBeGreaterThanOrEqual(before);
      expect(trip.startTime.getTime()).toBeLessThanOrEqual(after);
    });
  });

  describe("pre-validate hook", () => {
    it("should throw when both vehicleId and parkingSpotId are set", async () => {
      const trip = new Trip({
        userId,
        vehicleId,
        parkingSpotId,
        pricingStrategy: "PerMinute",
      });
      await expect(trip.validate()).rejects.toThrow(
        "Trip cannot reference both vehicle and parking spot",
      );
    });

    it("should throw when neither vehicleId nor parkingSpotId is set", async () => {
      const trip = new Trip({ userId, pricingStrategy: "PerMinute" });
      await expect(trip.validate()).rejects.toThrow(
        "Trip must set vehicleId or parkingSpotId",
      );
    });

    it("should set resourceType to vehicle when vehicleId is provided", async () => {
      const trip = new Trip({
        userId,
        vehicleId,
        pricingStrategy: "PerMinute",
      });
      await trip.validate();
      expect(trip.resourceType).toBe("vehicle");
    });

    it("should set resourceType to parking when parkingSpotId is provided", async () => {
      const trip = new Trip({
        userId,
        parkingSpotId,
        pricingStrategy: "FlatRate",
      });
      await trip.validate();
      expect(trip.resourceType).toBe("parking");
    });
  });

  describe("valid documents", () => {
    it("should pass validation for a vehicle trip", async () => {
      const trip = new Trip({
        userId,
        vehicleId,
        pricingStrategy: "PerMinute",
      });
      await expect(trip.validate()).resolves.toBeUndefined();
    });

    it("should pass validation for a parking trip", async () => {
      const trip = new Trip({
        userId,
        parkingSpotId,
        pricingStrategy: "FlatRate",
      });
      await expect(trip.validate()).resolves.toBeUndefined();
    });

    it("should accept all valid pricingStrategy values", async () => {
      for (const strategy of ["PerMinute", "PerHour", "FlatRate"] as const) {
        const trip = new Trip({ userId, vehicleId, pricingStrategy: strategy });
        await expect(trip.validate()).resolves.toBeUndefined();
      }
    });

    it("should accept all valid status values", async () => {
      for (const status of [
        "Reserved",
        "Active",
        "Completed",
        "Cancelled",
      ] as const) {
        const trip = new Trip({
          userId,
          vehicleId,
          pricingStrategy: "PerHour",
          status,
        });
        await expect(trip.validate()).resolves.toBeUndefined();
      }
    });

    it("should have a MongoDB _id", () => {
      const trip = new Trip({
        userId,
        vehicleId,
        pricingStrategy: "PerMinute",
      });
      expect(trip._id).toBeInstanceOf(mongoose.Types.ObjectId);
    });
  });
});
