import { POST } from "@/app/api/register/route";
import { jsonRequest, readJson } from "../helpers/next-request";

jest.mock("@/lib/mongodb", () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("bcryptjs", () => ({
  __esModule: true,
  default: {
    hash: jest.fn().mockResolvedValue("hashed-password"),
  },
}));

const mockFindOne = jest.fn();
const mockCreate = jest.fn();

jest.mock("@/models/User", () => ({
  __esModule: true,
  default: {
    findOne: (...args: unknown[]) => mockFindOne(...args),
    create: (...args: unknown[]) => mockCreate(...args),
  },
}));

describe("POST /api/register", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when fields are missing", async () => {
    const req = jsonRequest("/api/register", {
      method: "POST",
      body: { name: "A", email: "a@b.co" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = (await readJson(res)) as { error: string };
    expect(data.error).toBe("All fields are required");
  });

  it("returns 400 for invalid role", async () => {
    const req = jsonRequest("/api/register", {
      method: "POST",
      body: {
        name: "Test",
        email: "t@example.com",
        password: "secret12",
        role: "guest",
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = (await readJson(res)) as { error: string };
    expect(data.error).toBe("Invalid role");
  });

  it("returns 400 for invalid email", async () => {
    const req = jsonRequest("/api/register", {
      method: "POST",
      body: {
        name: "Test",
        email: "not-an-email",
        password: "secret12",
        role: "rider",
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = (await readJson(res)) as { error: string };
    expect(data.error).toBe("Invalid email address");
  });

  it("returns 400 when password is too short", async () => {
    const req = jsonRequest("/api/register", {
      method: "POST",
      body: {
        name: "Test",
        email: "t@example.com",
        password: "12345",
        role: "rider",
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = (await readJson(res)) as { error: string };
    expect(data.error).toBe("Password must be at least 6 characters");
  });

  it("returns 409 when email is already registered", async () => {
    mockFindOne.mockResolvedValueOnce({ _id: "existing" });
    const req = jsonRequest("/api/register", {
      method: "POST",
      body: {
        name: "Test",
        email: "t@example.com",
        password: "secret12",
        role: "rider",
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(409);
    const data = (await readJson(res)) as { error: string };
    expect(data.error).toBe("Email already registered");
  });

  it("returns 201 and userId on success", async () => {
    mockFindOne.mockResolvedValueOnce(null);
    mockCreate.mockResolvedValueOnce({ _id: { toString: () => "user-id-1" } });
    const req = jsonRequest("/api/register", {
      method: "POST",
      body: {
        name: "Test User",
        email: "new@example.com",
        password: "secret12",
        role: "operator",
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = (await readJson(res)) as { message: string; userId: string };
    expect(data.message).toBe("User registered successfully");
    expect(data.userId).toBe("user-id-1");
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Test User",
        email: "new@example.com",
        password: "hashed-password",
        role: "operator",
      }),
    );
  });
});
