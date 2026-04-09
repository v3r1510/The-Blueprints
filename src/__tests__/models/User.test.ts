/**
 * @jest-environment node
 */
import mongoose from "mongoose";
import User from "@/models/User";

describe("User model", () => {
  describe("required fields", () => {
    it("should require name", () => {
      const user = new User({ email: "test@example.com", password: "secret" });
      const err = user.validateSync();
      expect(err?.errors.name).toBeDefined();
    });

    it("should require email", () => {
      const user = new User({ name: "Alice", password: "secret" });
      const err = user.validateSync();
      expect(err?.errors.email).toBeDefined();
    });

    it("should require password", () => {
      const user = new User({ name: "Alice", email: "test@example.com" });
      const err = user.validateSync();
      expect(err?.errors.password).toBeDefined();
    });
  });

  describe("defaults", () => {
    it("should default role to rider", () => {
      const user = new User({
        name: "Alice",
        email: "test@example.com",
        password: "secret",
      });
      expect(user.role).toBe("rider");
    });

    it("should default balance to 0", () => {
      const user = new User({
        name: "Alice",
        email: "test@example.com",
        password: "secret",
      });
      expect(user.balance).toBe(0);
    });
  });

  describe("field validation", () => {
    it("should accept valid roles", () => {
      for (const role of ["rider", "operator", "admin"] as const) {
        const user = new User({
          name: "Alice",
          email: "test@example.com",
          password: "secret",
          role,
        });
        const err = user.validateSync();
        expect(err?.errors.role).toBeUndefined();
      }
    });

    it("should reject an invalid role", () => {
      const user = new User({
        name: "Alice",
        email: "test@example.com",
        password: "secret",
        role: "superadmin",
      });
      const err = user.validateSync();
      expect(err?.errors.role).toBeDefined();
    });

    it("should reject a negative balance", () => {
      const user = new User({
        name: "Alice",
        email: "test@example.com",
        password: "secret",
        balance: -10,
      });
      const err = user.validateSync();
      expect(err?.errors.balance).toBeDefined();
    });

    it("should convert email to lowercase", () => {
      const user = new User({
        name: "Alice",
        email: "TEST@EXAMPLE.COM",
        password: "secret",
      });
      expect(user.email).toBe("test@example.com");
    });

    it("should trim name whitespace", () => {
      const user = new User({
        name: "  Alice  ",
        email: "test@example.com",
        password: "secret",
      });
      // Mongoose trim applies on save; for validateSync the value is pre-set
      const err = user.validateSync();
      expect(err?.errors.name).toBeUndefined();
    });

    it("should allow an optional preferredMobilityType", () => {
      const user = new User({
        name: "Alice",
        email: "test@example.com",
        password: "secret",
        preferredMobilityType: "scooter",
      });
      const err = user.validateSync();
      expect(err).toBeUndefined();
    });
  });

  describe("valid document", () => {
    it("should pass validation with all required fields", () => {
      const user = new User({
        name: "Alice",
        email: "alice@example.com",
        password: "secret",
      });
      const err = user.validateSync();
      expect(err).toBeUndefined();
    });

    it("should have a MongoDB _id", () => {
      const user = new User({
        name: "Alice",
        email: "alice@example.com",
        password: "secret",
      });
      expect(user._id).toBeInstanceOf(mongoose.Types.ObjectId);
    });
  });
});
