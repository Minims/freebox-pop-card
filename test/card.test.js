// @vitest-environment happy-dom

import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { FreeboxPopCard } from "../src/card.js";

beforeAll(() => {
  if (!customElements.get("freebox-pop-card-test")) {
    customElements.define("freebox-pop-card-test", FreeboxPopCard);
  }
});

afterEach(() => {
  document.body.replaceChildren();
  delete window.confirm;
  vi.restoreAllMocks();
});

function createCard(view = "overview") {
  const callService = vi.fn();
  const entities = {
    "sensor.down": {
      entity_id: "sensor.down",
      unique_id: "AA rate_down",
      platform: "freebox",
      device_id: "router",
      config_entry_id: "entry",
    },
    "sensor.up": {
      entity_id: "sensor.up",
      unique_id: "AA rate_up",
      platform: "freebox",
      device_id: "router",
      config_entry_id: "entry",
    },
    "switch.wifi": {
      entity_id: "switch.wifi",
      unique_id: "AA wifi",
      platform: "freebox",
      device_id: "router",
      config_entry_id: "entry",
    },
    "button.freebox_restart": {
      entity_id: "button.freebox_restart",
      unique_id: "AA",
      device_class: "restart",
      platform: "freebox",
      device_id: "router",
      config_entry_id: "entry",
    },
    "device_tracker.router": {
      entity_id: "device_tracker.router",
      unique_id: "AA",
      platform: "freebox",
      device_id: "router",
      config_entry_id: "entry",
    },
  };
  const states = {
    "sensor.down": {
      state: "12.5",
      attributes: { friendly_name: "Download", unit_of_measurement: "MB/s" },
    },
    "sensor.up": {
      state: "2.5",
      attributes: { friendly_name: "Upload", unit_of_measurement: "MB/s" },
    },
    "switch.wifi": { state: "on", attributes: { friendly_name: "Wi-Fi" } },
    "button.freebox_restart": {
      state: "unknown",
      attributes: { device_class: "restart" },
    },
    "device_tracker.router": {
      state: "home",
      attributes: {
        friendly_name: "Freebox Pop",
        connection_type: "FTTH",
        IPv4: "192.0.2.10",
        uptime: "2026-09-03T08:00:00Z",
      },
    },
  };
  const card = document.createElement("freebox-pop-card-test");
  card.setConfig({ type: "custom:freebox-pop-card", view });
  card.hass = {
    language: "fr",
    entities,
    states,
    devices: {
      router: {
        id: "router",
        name: "Freebox Pop",
        model: "Freebox v8 (Pop)",
        configuration_url: "https://mafreebox.freebox.fr/",
      },
    },
    callService,
  };
  document.body.append(card);
  return { card, callService };
}

describe("Freebox Pop card", () => {
  it("renders official Freebox entities and connection metadata", async () => {
    const { card } = createCard();
    await card.updateComplete;
    const text = card.shadowRoot.textContent.replaceAll(/\s+/g, " ");
    expect(text).toContain("Freebox Pop");
    expect(text).toContain("12.5 MB/s");
    expect(text).toContain("FTTH");
    expect(text).toContain("192.0.2.10");
    expect(text).toContain("Uptime système");
    expect(text).toContain("Uptime connexion");
    expect(text).toContain("Non exposé");
  });

  it("confirms Wi-Fi shutdown and Server reboot", async () => {
    const confirm = vi.fn(() => true);
    window.confirm = confirm;
    const { card, callService } = createCard();
    await card.updateComplete;

    card.shadowRoot.querySelector(".control").click();
    card.shadowRoot.querySelector(".action-button.danger").click();

    expect(confirm).toHaveBeenCalledTimes(2);
    expect(callService).toHaveBeenNthCalledWith(1, "switch", "turn_off", {
      entity_id: "switch.wifi",
    });
    expect(callService).toHaveBeenNthCalledWith(2, "button", "press", {
      entity_id: "button.freebox_restart",
    });
  });

  it("keeps the compact layout focused on summary metrics", async () => {
    const { card } = createCard("compact");
    await card.updateComplete;
    expect(card.shadowRoot.querySelector(".stats")).not.toBeNull();
    expect(card.shadowRoot.querySelector(".hero")).toBeNull();
    expect(card.shadowRoot.querySelector(".panel")).toBeNull();
  });
});
