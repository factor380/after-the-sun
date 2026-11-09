import { describe, expect, it } from "vitest";
import { clientAddress } from "@/lib/client-address";

function request(headers: Record<string, string>) {
  return {
    headers: {
      get(name: string) {
        return headers[name.toLowerCase()] ?? null;
      },
    },
  };
}

describe("clientAddress", () => {
  it("uses the first forwarded address", () => {
    expect(
      clientAddress(request({ "x-forwarded-for": "203.0.113.4, 10.0.0.1" })),
    ).toBe("203.0.113.4");
  });

  it("falls back to x-real-ip", () => {
    expect(clientAddress(request({ "x-real-ip": "2001:db8::1" }))).toBe("2001:db8::1");
  });

  it("shares one bucket when the header is missing or not an address", () => {
    expect(clientAddress(request({}))).toBe("unknown");
    expect(clientAddress(request({ "x-forwarded-for": "not an ip" }))).toBe("unknown");
  });
});