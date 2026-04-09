/**
 * @jest-environment node
 */
import mongoose from "mongoose";
import Rating from "@/models/Rating";

const tripId = new mongoose.Types.ObjectId();
const vehicleId = new mongoose.Types.ObjectId();
const userId = new mongoose.Types.ObjectId();

describe("Rating model", () => {
  describe("required fields", () => {
    it("should require tripId", () => {
      const rating = new Rating({ vehicleId, userId, stars: 4 });
      const err = rating.validateSync();
      expect(err?.errors.tripId).toBeDefined();
    });

    it("should require vehicleId", () => {
      const rating = new Rating({ tripId, userId, stars: 4 });
      const err = rating.validateSync();
      expect(err?.errors.vehicleId).toBeDefined();
    });

    it("should require userId", () => {
      const rating = new Rating({ tripId, vehicleId, stars: 4 });
      const err = rating.validateSync();
      expect(err?.errors.userId).toBeDefined();
    });

    it("should require stars", () => {
      const rating = new Rating({ tripId, vehicleId, userId });
      const err = rating.validateSync();
      expect(err?.errors.stars).toBeDefined();
    });
  });

  describe("stars validation", () => {
    it("should reject stars below 1", () => {
      const rating = new Rating({ tripId, vehicleId, userId, stars: 0 });
      const err = rating.validateSync();
      expect(err?.errors.stars).toBeDefined();
    });

    it("should reject stars above 5", () => {
      const rating = new Rating({ tripId, vehicleId, userId, stars: 6 });
      const err = rating.validateSync();
      expect(err?.errors.stars).toBeDefined();
    });

    it("should accept stars from 1 to 5", () => {
      for (const stars of [1, 2, 3, 4, 5]) {
        const rating = new Rating({ tripId, vehicleId, userId, stars });
        const err = rating.validateSync();
        expect(err?.errors.stars).toBeUndefined();
      }
    });
  });

  describe("comment field", () => {
    it("should be optional", () => {
      const rating = new Rating({ tripId, vehicleId, userId, stars: 5 });
      const err = rating.validateSync();
      expect(err).toBeUndefined();
    });

    it("should reject a comment longer than 500 characters", () => {
      const rating = new Rating({
        tripId,
        vehicleId,
        userId,
        stars: 3,
        comment: "a".repeat(501),
      });
      const err = rating.validateSync();
      expect(err?.errors.comment).toBeDefined();
    });

    it("should accept a comment of exactly 500 characters", () => {
      const rating = new Rating({
        tripId,
        vehicleId,
        userId,
        stars: 3,
        comment: "a".repeat(500),
      });
      const err = rating.validateSync();
      expect(err?.errors.comment).toBeUndefined();
    });
  });

  describe("valid document", () => {
    it("should pass validation with all required fields", () => {
      const rating = new Rating({ tripId, vehicleId, userId, stars: 5 });
      const err = rating.validateSync();
      expect(err).toBeUndefined();
    });

    it("should pass validation with an optional comment", () => {
      const rating = new Rating({
        tripId,
        vehicleId,
        userId,
        stars: 4,
        comment: "Great ride!",
      });
      const err = rating.validateSync();
      expect(err).toBeUndefined();
    });

    it("should have a MongoDB _id", () => {
      const rating = new Rating({ tripId, vehicleId, userId, stars: 5 });
      expect(rating._id).toBeInstanceOf(mongoose.Types.ObjectId);
    });
  });
});
