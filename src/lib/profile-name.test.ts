import { describe, expect, it } from "vitest";
import { profileDisplayName } from "@/lib/profile-name";

describe("profileDisplayName", () => {
  it("prefers full_name, then name", () => {
    expect(profileDisplayName({ full_name: "נועה", name: "Noa" })).toBe("נועה");
    expect(profileDisplayName({ name: "Noa" })).toBe("Noa");
    expect(profileDisplayName({ full_name: "", name: "Noa" })).toBe("");
    expect(profileDisplayName(null)).toBeNull();
    expect(profileDisplayName({ full_name: 1, name: "Noa" })).toBeNull();
    expect(profileDisplayName({})).toBeNull();
  });
});
