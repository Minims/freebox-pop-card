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

function createCard({
  view = "overview",
  clientCount = 0,
  hardReboot = false,
  equipment = false,
} = {}) {
  const callService = vi.fn();
  const callWS = vi.fn(() => Promise.resolve());
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
    "button.freebox_mark_calls_as_read": {
      entity_id: "button.freebox_mark_calls_as_read",
      unique_id: "AA mark_calls_as_read",
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
    "button.freebox_mark_calls_as_read": { state: "unknown", attributes: {} },
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

  for (let index = 1; index <= clientCount; index += 1) {
    const entityId = `device_tracker.client_${index}`;
    entities[entityId] = {
      entity_id: entityId,
      unique_id: `BB:CC:DD:EE:FF:${String(index).padStart(2, "0")}`,
      platform: "freebox",
      config_entry_id: "entry",
    };
    states[entityId] = {
      state: "home",
      attributes: { friendly_name: `Client ${index}` },
    };
  }

  if (equipment) {
    const items = [
      ["player", "Freebox Player POP", "home", "mdi:television-guide"],
      ["repeater", "Repeteur Wifi Freebox", "not_home", "mdi:network"],
    ];
    for (const [id, name, state, icon] of items) {
      const entityId = `device_tracker.${id}`;
      entities[entityId] = {
        entity_id: entityId,
        unique_id: `DD:EE:FF ${id}`,
        platform: "freebox",
        config_entry_id: "entry",
      };
      states[entityId] = { state, attributes: { friendly_name: name, icon } };
    }
  }

  if (hardReboot) {
    states["switch.freebox_power"] = { state: "on", attributes: {} };
  }

  const card = document.createElement("freebox-pop-card-test");
  card.setConfig({
    type: "custom:freebox-pop-card",
    view,
    max_clients: 2,
    hard_reboot_entity: hardReboot ? "switch.freebox_power" : "",
    hard_reboot_delay: 12,
  });
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
    callWS,
    user: { is_admin: true },
  };
  document.body.append(card);
  return { card, callService, callWS };
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
    expect(text).toContain("Marquer les appels comme lus");
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
    const { card } = createCard({ view: "compact" });
    await card.updateComplete;
    expect(card.shadowRoot.querySelector(".stats")).not.toBeNull();
    expect(card.shadowRoot.querySelector(".hero")).toBeNull();
    expect(card.shadowRoot.querySelector(".panel")).toBeNull();
  });

  it("marks calls as read even when the missed-call count is zero", async () => {
    const { card, callService } = createCard();
    await card.updateComplete;

    card.shadowRoot.querySelector(".mark-read-button").click();

    expect(callService).toHaveBeenCalledWith("button", "press", {
      entity_id: "button.freebox_mark_calls_as_read",
    });
  });

  it("expands and collapses supplementary clients", async () => {
    const { card } = createCard({ clientCount: 4 });
    await card.updateComplete;

    expect(card.shadowRoot.querySelectorAll(".client")).toHaveLength(2);
    const more = card.shadowRoot.querySelector(".more-button");
    expect(more.textContent).toContain("+2 clients supplémentaires");
    more.click();
    await card.updateComplete;

    expect(card.shadowRoot.querySelectorAll(".client")).toHaveLength(4);
    expect(card.shadowRoot.querySelector(".more-button").textContent).toContain(
      "Afficher moins de clients",
    );
  });

  it("shows Freebox equipment states and runs the hard reboot from Home Assistant", async () => {
    const confirm = vi.fn(() => true);
    window.confirm = confirm;
    const { card, callWS } = createCard({ hardReboot: true, equipment: true });
    await card.updateComplete;

    const text = card.shadowRoot.textContent.replaceAll(/\s+/g, " ");
    expect(text).toContain("Équipements Freebox");
    const equipmentItems = [...card.shadowRoot.querySelectorAll(".equipment-item")].map(
      (item) => item.textContent.replaceAll(/\s+/g, " "),
    );
    expect(equipmentItems).toContainEqual(
      expect.stringContaining("Freebox Player POP Actif"),
    );
    expect(equipmentItems).toContainEqual(
      expect.stringContaining("Repeteur Wifi Freebox Inactif"),
    );
    expect(text).toContain("Soft reboot");
    expect(text).toContain("Hard reboot");

    card.shadowRoot.querySelector(".hard-reboot-button").click();
    await Promise.resolve();

    expect(confirm).toHaveBeenCalledWith(
      expect.stringContaining("pendant 12 secondes"),
    );
    expect(callWS).toHaveBeenCalledWith({
      type: "execute_script",
      sequence: [
        {
          action: "switch.turn_off",
          target: { entity_id: "switch.freebox_power" },
        },
        { delay: { seconds: 12 } },
        {
          action: "switch.turn_on",
          target: { entity_id: "switch.freebox_power" },
        },
      ],
    });
  });
});
