import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildModel,
  discoverDevices,
  formatEntityState,
  formatUptime,
  inferFunctionId,
  isActionAvailable,
  normalizeConfig,
  numericState,
  safeHttpUrl,
} from "../src/model.js";

function createHass() {
  const entities = {
    "sensor.renamed_download": {
      entity_id: "sensor.renamed_download",
      unique_id: "AA:BB:CC:DD:EE:FF rate_down",
      platform: "freebox",
      device_id: "router-1",
      config_entry_id: "entry-1",
    },
    "sensor.renamed_upload": {
      entity_id: "sensor.renamed_upload",
      unique_id: "AA:BB:CC:DD:EE:FF rate_up",
      platform: "freebox",
      device_id: "router-1",
      config_entry_id: "entry-1",
    },
    "sensor.renamed_temperature": {
      entity_id: "sensor.renamed_temperature",
      unique_id: "AA:BB:CC:DD:EE:FF temp_cpu_b",
      original_name: "CPU temperature",
      platform: "freebox",
      device_id: "router-1",
      config_entry_id: "entry-1",
    },
    "sensor.renamed_fan": {
      entity_id: "sensor.renamed_fan",
      unique_id: "AA:BB:CC:DD:EE:FF fan0_speed",
      original_name: "Fan 1",
      platform: "freebox",
      device_id: "router-1",
      config_entry_id: "entry-1",
    },
    "switch.renamed_wifi": {
      entity_id: "switch.renamed_wifi",
      unique_id: "AA:BB:CC:DD:EE:FF wifi",
      platform: "freebox",
      device_id: "router-1",
      config_entry_id: "entry-1",
    },
    "button.renamed_reboot": {
      entity_id: "button.renamed_reboot",
      unique_id: "AA:BB:CC:DD:EE:FF reboot",
      platform: "freebox",
      device_id: "router-1",
      config_entry_id: "entry-1",
    },
    "device_tracker.renamed_router": {
      entity_id: "device_tracker.renamed_router",
      unique_id: "AA:BB:CC:DD:EE:FF",
      platform: "freebox",
      device_id: "router-1",
      config_entry_id: "entry-1",
    },
    "sensor.renamed_partition": {
      entity_id: "sensor.renamed_partition",
      unique_id: "AA:BB partition_free_space 0 1",
      platform: "freebox",
      device_id: "disk-1",
      config_entry_id: "entry-1",
    },
    "binary_sensor.renamed_raid": {
      entity_id: "binary_sensor.renamed_raid",
      unique_id: "AA:BB raid_degraded raid0 0",
      platform: "freebox",
      device_id: "router-1",
      config_entry_id: "entry-1",
    },
    "device_tracker.phone": {
      entity_id: "device_tracker.phone",
      unique_id: "11:22:33:44:55:66",
      platform: "freebox",
      config_entry_id: "entry-1",
    },
    "device_tracker.other_network": {
      entity_id: "device_tracker.other_network",
      unique_id: "77:88:99:AA:BB:CC",
      platform: "freebox",
      device_id: "phone-2",
      config_entry_id: "entry-2",
    },
  };

  return {
    entities,
    devices: {
      "router-1": {
        id: "router-1",
        name: "Freebox Pop",
        model: "Freebox v8 (Pop)",
        hw_version: "fbxgw8-r1",
        sw_version: "4.9.8",
        configuration_url: "https://mafreebox.freebox.fr/",
      },
      "disk-1": {
        id: "disk-1",
        name: "Disk 0",
        model: "USB SSD",
        via_device_id: "router-1",
      },
      "phone-1": { id: "phone-1", name: "Phone" },
      "phone-2": { id: "phone-2", name: "Other phone" },
    },
    states: {
      "sensor.renamed_download": {
        state: "12500",
        attributes: {
          friendly_name: "Freebox Download speed",
          unit_of_measurement: "kB/s",
        },
      },
      "sensor.renamed_upload": {
        state: "650",
        attributes: {
          friendly_name: "Freebox Upload speed",
          unit_of_measurement: "kB/s",
        },
      },
      "sensor.renamed_temperature": {
        state: "52.4",
        attributes: {
          friendly_name: "Freebox CPU temperature",
          device_class: "temperature",
          unit_of_measurement: "°C",
        },
      },
      "sensor.renamed_fan": {
        state: "1490",
        attributes: {
          friendly_name: "Freebox Fan 1",
          unit_of_measurement: "rpm",
        },
      },
      "switch.renamed_wifi": { state: "on", attributes: {} },
      "button.renamed_reboot": { state: "unknown", attributes: {} },
      "device_tracker.renamed_router": {
        state: "home",
        attributes: {
          friendly_name: "Freebox Pop",
          IPv4: "192.0.2.10",
          IPv6: "2001:db8::10",
          connection_type: "ftth",
          uptime: "2026-09-01T08:00:00+00:00",
          serial: "redacted",
        },
      },
      "sensor.renamed_partition": {
        state: "72.5",
        attributes: {
          friendly_name: "Media free space",
          unit_of_measurement: "%",
        },
      },
      "binary_sensor.renamed_raid": {
        state: "off",
        attributes: { friendly_name: "RAID array 0 degraded" },
      },
      "device_tracker.phone": {
        state: "home",
        attributes: { friendly_name: "Alex’s phone" },
      },
      "device_tracker.other_network": {
        state: "home",
        attributes: { friendly_name: "Other network phone" },
      },
    },
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("Freebox entity discovery", () => {
  it("finds router devices but ignores client and disk devices", () => {
    expect(discoverDevices(createHass())).toEqual([
      {
        id: "router-1",
        name: "Freebox Pop",
        model: "Freebox v8 (Pop)",
      },
    ]);
  });

  it("uses stable unique IDs after entity IDs are renamed", () => {
    const hass = createHass();
    expect(
      inferFunctionId(
        hass.entities["sensor.renamed_download"],
        hass.states["sensor.renamed_download"],
      ),
    ).toBe("rate_down");
    expect(
      inferFunctionId(
        hass.entities["switch.renamed_wifi"],
        hass.states["switch.renamed_wifi"],
      ),
    ).toBe("wifi");
  });

  it("classifies variable system sensors from their state metadata", () => {
    const hass = createHass();
    expect(
      inferFunctionId(
        hass.entities["sensor.renamed_temperature"],
        hass.states["sensor.renamed_temperature"],
      ),
    ).toBe("temperature");
    expect(
      inferFunctionId(
        hass.entities["sensor.renamed_fan"],
        hass.states["sensor.renamed_fan"],
      ),
    ).toBe("fan");
  });
});

describe("Freebox model", () => {
  it("aggregates the router, child storage, and clients from one config entry", () => {
    const model = buildModel(createHass(), {});
    expect(model.deviceId).toBe("router-1");
    expect(model.online).toBe(true);
    expect(model.connection).toMatchObject({
      IPv4: "192.0.2.10",
      connection_type: "ftth",
    });
    expect(model.download.state.state).toBe("12500");
    expect(model.wifi.state.state).toBe("on");
    expect(model.temperatures).toHaveLength(1);
    expect(model.fans).toHaveLength(1);
    expect(model.partitions).toHaveLength(1);
    expect(model.raids).toHaveLength(1);
    expect(model.clients.map((client) => client.label)).toEqual(["Alex’s phone"]);
    expect(model.connectedClients).toBe(1);
  });

  it("does not guess a device when several routers exist", () => {
    const hass = createHass();
    hass.entities["sensor.second_download"] = {
      entity_id: "sensor.second_download",
      unique_id: "FF:EE:DD rate_down",
      platform: "freebox",
      device_id: "router-2",
      config_entry_id: "entry-2",
    };
    hass.states["sensor.second_download"] = {
      state: "0",
      attributes: { unit_of_measurement: "kB/s" },
    };
    hass.devices["router-2"] = { id: "router-2", name: "Second Freebox" };
    expect(buildModel(hass, {}).deviceId).toBe("");
  });
});

describe("display helpers", () => {
  it("normalizes configuration and clamps the client limit", () => {
    expect(
      normalizeConfig({ view: "invalid", max_clients: 99, show_system: false }),
    ).toMatchObject({
      type: "custom:freebox-pop-card",
      view: "overview",
      max_clients: 20,
      show_system: false,
      show_controls: true,
      confirm_actions: true,
    });
  });

  it("formats entity states with and without the Home Assistant formatter", () => {
    const state = { state: "12.5", attributes: { unit_of_measurement: "MB/s" } };
    expect(formatEntityState({}, state)).toBe("12.5 MB/s");
    expect(formatEntityState({ formatEntityState: () => "12,5 Mo/s" }, state)).toBe(
      "12,5 Mo/s",
    );
  });

  it("formats the boot timestamp as uptime", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-03T10:35:00Z"));
    expect(formatUptime("2026-09-01T08:00:00Z", (key) => key)).toBe("2 day 2 hour");
    expect(formatUptime("invalid", (key) => key)).toBe("invalid");
  });

  it("handles numeric and button states", () => {
    expect(numericState({ state: "72.5", attributes: {} })).toBe(72.5);
    expect(numericState({ state: "unknown", attributes: {} })).toBeUndefined();
    expect(isActionAvailable({ state: "unknown" })).toBe(true);
    expect(isActionAvailable({ state: "unavailable" })).toBe(false);
  });

  it("only permits HTTP links", () => {
    expect(safeHttpUrl("https://mafreebox.freebox.fr/")).toBe(
      "https://mafreebox.freebox.fr/",
    );
    expect(safeHttpUrl("javascript:alert(1)")).toBe("");
    expect(safeHttpUrl("not a URL")).toBe("");
  });
});
