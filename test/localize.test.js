import { describe, expect, it } from "vitest";

import { localize } from "../src/localize.js";

describe("localization", () => {
  it("selects French from regional locales", () => {
    expect(localize("fr-FR", "download")).toBe("Descendant");
  });

  it("falls back to English and finally the key", () => {
    expect(localize("de-DE", "download")).toBe("Download");
    expect(localize("en", "missing_key")).toBe("missing_key");
  });
});
