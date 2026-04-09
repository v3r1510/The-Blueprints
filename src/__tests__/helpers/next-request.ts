import { NextRequest } from "next/server";

export function jsonRequest(
  pathname: string,
  init: {
    method?: string;
    body?: unknown;
    searchParams?: Record<string, string>;
  } = {},
): NextRequest {
  const url = new URL(pathname, "http://localhost");
  if (init.searchParams) {
    for (const [key, value] of Object.entries(init.searchParams)) {
      url.searchParams.set(key, value);
    }
  }
  const hasBody = init.body !== undefined;
  return new NextRequest(url, {
    method: init.method ?? "GET",
    body: hasBody ? JSON.stringify(init.body) : undefined,
    headers: hasBody ? { "content-type": "application/json" } : undefined,
  });
}

export async function readJson(res: Response): Promise<unknown> {
  return res.json();
}
