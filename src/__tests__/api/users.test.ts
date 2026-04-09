import { GET } from "@/app/api/users/route";
import { jsonRequest, readJson } from "../helpers/next-request";
import { auth } from "@/lib/auth";

jest.mock("@/lib/mongodb", () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

const mockSort = jest.fn();
const mockFind = jest.fn(() => ({ sort: mockSort }));

jest.mock("@/models/User", () => ({
  __esModule: true,
  default: {
    find: (...args: unknown[]) => mockFind(...args),
  },
}));

describe("GET /api/users", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSort.mockResolvedValue([{ _id: "1", email: "a@b.co", role: "rider" }]);
  });

  it("returns 401 when there is no session", async () => {
    (auth as jest.Mock).mockResolvedValueOnce(null);
    const req = jsonRequest("/api/users");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns 403 when session is not admin", async () => {
    (auth as jest.Mock).mockResolvedValueOnce({
      user: { id: "u1", role: "rider" },
    });
    const req = jsonRequest("/api/users");
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it("returns 400 for invalid role filter", async () => {
    (auth as jest.Mock).mockResolvedValueOnce({
      user: { id: "u1", role: "admin" },
    });
    const req = jsonRequest("/api/users", {
      searchParams: { role: "invalid" },
    });
    const res = await GET(req);
    expect(res.status).toBe(400);
    const data = (await readJson(res)) as { error: string };
    expect(data.error).toBe("Invalid role filter");
  });

  it("returns users for admin without filter", async () => {
    (auth as jest.Mock).mockResolvedValueOnce({
      user: { id: "u1", role: "admin" },
    });
    const req = jsonRequest("/api/users");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = (await readJson(res)) as Array<{ email: string }>;
    expect(Array.isArray(data)).toBe(true);
    expect(data[0].email).toBe("a@b.co");
    expect(mockFind).toHaveBeenCalledWith({}, { password: 0 });
  });

  it("filters by role when query param is valid", async () => {
    (auth as jest.Mock).mockResolvedValueOnce({
      user: { id: "u1", role: "admin" },
    });
    const req = jsonRequest("/api/users", {
      searchParams: { role: "operator" },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(mockFind).toHaveBeenCalledWith({ role: "operator" }, { password: 0 });
  });
});
