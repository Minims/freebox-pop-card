import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildModel,
  compactLabel,
  discoverDevices,
  formatEntityState,
  formatUptime,
  inferEquipmentKind,
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
    "button.reboot_freebox": {
      entity_id: "button.reboot_freebox",
      unique_id: "AA:BB:CC:DD:EE:FF",
      device_class: "restart",
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
          friendly_name: "Freebox Pop CPU temperature",
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
      "button.reboot_freebox": {
        state: "unknown",
        attributes: { device_class: "restart" },
      },
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
          friendly_name: "Disk 0 Media free space",
          unit_of_measurement: "%",
        },
      },
      "binary_sensor.renamed_raid": {
        state: "off",
        attributes: { friendly_name: "RAID array 0 degraded" },
      },
      "device_tracker.phone": {
        state: "home",
        attributes: { friendly_name: "11:22:33:44:55:66 Alex’s phone" },
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
    expect(
      inferFunctionId(
        hass.entities["button.reboot_freebox"],
        hass.states["button.reboot_freebox"],
      ),
    ).toBe("reboot");
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

  it("classifies Freebox equipment from tracker metadata and labels", () => {
    const hass = createHass();
    const tracker = {
      entity_id: "device_tracker.freebox_player_pop",
      platform: "freebox",
      config_entry_id: "entry-1",
    };
    expect(
      inferEquipmentKind(
        tracker,
        {
          state: "home",
          attributes: {
            friendly_name: "Living room box",
            icon: "mdi:television-guide",
          },
        },
        hass,
      ),
    ).toBe("player");
    expect(
      inferEquipmentKind(
        { ...tracker, entity_id: "device_tracker.repeater" },
        {
          state: "not_home",
          attributes: { friendly_name: "Repeteur Wifi Freebox" },
        },
        hass,
      ),
    ).toBe("repeater");
    expect(
      inferEquipmentKind(
        { ...tracker, entity_id: "device_tracker.upstairs_repeater" },
        {
          state: "home",
          attributes: { friendly_name: "Mon Repeteur" },
        },
        hass,
      ),
    ).toBe("repeater");
    expect(
      inferEquipmentKind(
        { ...tracker, entity_id: "device_tracker.phone" },
        {
          state: "home",
          attributes: {
            friendly_name: "Téléphone DECT",
            icon: "mdi:phone-voip",
          },
        },
        hass,
      ),
    ).toBeUndefined();
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
    expect(model.temperatures[0].label).toBe("CPU temperature");
    expect(model.fans).toHaveLength(1);
    expect(model.partitions).toHaveLength(1);
    expect(model.partitions[0].label).toBe("Media free space");
    expect(model.raids).toHaveLength(1);
    expect(model.clients.map((client) => client.label)).toEqual(["Alex’s phone"]);
    expect(model.connectedClients).toBe(1);
    expect(model.systemUptime).toBe("2026-09-01T08:00:00+00:00");
    expect(model.connectionUptime).toBeUndefined();
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

  it("exposes active and inactive Freebox equipment from device trackers", () => {
    const hass = createHass();
    const equipment = [
      ["player", "Freebox Player POP", "home", "mdi:television-guide"],
      ["repeater", "Repeteur Wifi Freebox", "not_home", "mdi:network"],
    ];
    for (const [id, name, state, icon] of equipment) {
      const entityId = `device_tracker.${id}`;
      hass.entities[entityId] = {
        entity_id: entityId,
        unique_id: `AA:BB ${id}`,
        platform: "freebox",
        config_entry_id: "entry-1",
      };
      hass.states[entityId] = {
        state,
        attributes: { friendly_name: name, icon },
      };
    }

    expect(
      buildModel(hass, {}).equipment.map(({ kind, connected }) => ({
        kind,
        connected,
      })),
    ).toEqual([
      { kind: "player", connected: true },
      { kind: "repeater", connected: false },
    ]);
  });
});

describe("display helpers", () => {
  it("normalizes configuration and clamps the client limit", () => {
    expect(
      normalizeConfig({
        view: "invalid",
        max_clients: 99,
        show_system: false,
        hard_reboot_entity: "switch.freebox_power",
        hard_reboot_delay: 1,
      }),
    ).toMatchObject({
      type: "custom:freebox-pop-card",
      view: "overview",
      max_clients: 20,
      show_system: false,
      show_equipment: true,
      show_controls: true,
      confirm_actions: true,
      hard_reboot_entity: "switch.freebox_power",
      hard_reboot_delay: 5,
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
    expect(formatUptime(7_800, (key) => key)).toBe("2 hour 10 minute");
  });

  it("removes device and MAC prefixes without losing meaningful names", () => {
    expect(compactLabel("Freebox v8 (r1) Température CPU", ["Freebox v8 (r1)"])).toBe(
      "Température CPU",
    );
    expect(compactLabel("00:76:B1:05:44:A5 Somfy volet")).toBe("Somfy volet");
    expect(compactLabel("Freebox v8 (r1)", ["Freebox v8 (r1)"])).toBe(
      "Freebox v8 (r1)",
    );
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
