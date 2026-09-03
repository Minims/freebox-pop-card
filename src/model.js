export const INTEGRATION = "freebox";

const UNAVAILABLE_STATES = new Set(["unavailable", "unknown"]);
const KNOWN_FUNCTIONS = [
  "mark_calls_as_read",
  "partition_free_space",
  "raid_degraded",
  "rate_down",
  "rate_up",
  "reboot",
  "missed",
  "wifi",
];
const ROUTER_FUNCTIONS = new Set([
  "router_tracker",
  "rate_down",
  "rate_up",
  "reboot",
  "wifi",
]);

export function normalizeConfig(config = {}) {
  const parsedMaxClients = Number(config.max_clients);
  const maxClients = Number.isFinite(parsedMaxClients)
    ? Math.min(20, Math.max(0, Math.trunc(parsedMaxClients)))
    : 6;

  return {
    type: "custom:freebox-pop-card",
    device_id: config.device_id || "",
    title: config.title || "",
    view: ["compact", "overview", "detailed"].includes(config.view)
      ? config.view
      : "overview",
    show_connection: config.show_connection !== false,
    show_system: config.show_system !== false,
    show_storage: config.show_storage !== false,
    show_clients: config.show_clients !== false,
    show_controls: config.show_controls !== false,
    confirm_actions: config.confirm_actions !== false,
    max_clients: maxClients,
  };
}

function normalizedSource(entry) {
  return [
    entry?.translation_key,
    entry?.unique_id,
    entry?.original_name,
    entry?.entity_id,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replaceAll(" ", "_")
    .replaceAll("-", "_");
}

function containsFunction(source, functionId) {
  const escaped = functionId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|_)${escaped}(?:_|$)`).test(source);
}

export function entityState(hass, entity) {
  return entity ? hass?.states?.[entity.entity_id] : undefined;
}

export function isAvailable(state) {
  return Boolean(state && !UNAVAILABLE_STATES.has(state.state));
}

export function isActionAvailable(state) {
  return Boolean(state && state.state !== "unavailable");
}

export function inferFunctionId(entry, state) {
  const source = normalizedSource(entry);
  const domain = entry?.entity_id?.split(".")[0];
  const attributes = state?.attributes || {};
  const deviceClass = String(
    attributes.device_class || entry?.device_class || "",
  ).toLowerCase();

  if (
    domain === "button" &&
    (deviceClass === "restart" ||
      containsFunction(source, "restart") ||
      containsFunction(source, "redemarrer") ||
      containsFunction(source, "redémarrer"))
  ) {
    return "reboot";
  }

  const known = KNOWN_FUNCTIONS.find((candidate) =>
    containsFunction(source, candidate),
  );
  if (known) return known;

  const unit = String(attributes.unit_of_measurement || "").toLowerCase();

  if (domain === "device_tracker") {
    if (
      attributes.connection_type ||
      attributes.firmware_version ||
      attributes.serial ||
      attributes.IPv4 ||
      attributes.IPv6
    ) {
      return "router_tracker";
    }
    return "client_tracker";
  }
  if (deviceClass === "temperature" || ["°c", "°f"].includes(unit)) {
    return "temperature";
  }
  if (unit === "rpm" || attributes.icon === "mdi:fan") return "fan";
  return undefined;
}

function registryEntries(hass) {
  return Object.values(hass?.entities || {}).filter(
    (entry) => entry.platform === INTEGRATION,
  );
}

export function compactLabel(value, prefixes = []) {
  const original = String(value || "").trim();
  if (!original) return "";
  let result = original.replace(
    /^(?:[0-9a-f]{2}:){5}[0-9a-f]{2}(?:\s+|\s*[-·]\s*)/i,
    "",
  );

  for (const valuePrefix of prefixes) {
    const prefix = String(valuePrefix || "").trim();
    if (!prefix) continue;
    if (result.toLocaleLowerCase().startsWith(prefix.toLocaleLowerCase())) {
      const remainder = result.slice(prefix.length);
      if (/^(?:\s+|\s*[-·:]\s*)/.test(remainder)) {
        result = remainder.replace(/^(?:\s+|\s*[-·:]\s*)/, "").trim();
      }
    }
  }

  return result || original;
}

function entityLabel(entry, state, hass) {
  const label =
    state?.attributes?.friendly_name ||
    entry?.name ||
    entry?.original_name ||
    entry?.entity_id ||
    "";
  const device = hass?.devices?.[entry?.device_id] || {};
  return compactLabel(label, [device.name_by_user, device.name]);
}

function entryConfigIds(entry) {
  return new Set(
    [entry?.config_entry_id, ...(entry?.config_entry_ids || [])].filter(Boolean),
  );
}

function setsOverlap(left, right) {
  return [...left].some((value) => right.has(value));
}

export function discoverDevices(hass) {
  const entries = registryEntries(hass);
  const ids = new Set();

  for (const entry of entries) {
    const role = inferFunctionId(entry, entityState(hass, entry));
    if (entry.device_id && ROUTER_FUNCTIONS.has(role)) ids.add(entry.device_id);
  }

  return [...ids]
    .map((id) => {
      const device = hass?.devices?.[id] || {};
      return {
        id,
        name: device.name_by_user || device.name || id,
        model: device.model || "Freebox Server",
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

function metric(entry, hass) {
  if (!entry) return undefined;
  const state = entityState(hass, entry);
  return {
    entry,
    state,
    available: isAvailable(state),
    label: entityLabel(entry, state, hass),
  };
}

function toMetricList(entries, hass) {
  return entries
    .map((entry) => metric(entry, hass))
    .filter(Boolean)
    .sort((left, right) => left.label.localeCompare(right.label));
}

export function buildModel(hass, rawConfig = {}) {
  const config = normalizeConfig(rawConfig);
  const devices = discoverDevices(hass);
  const deviceId = config.device_id || (devices.length === 1 ? devices[0].id : "");
  const allEntries = registryEntries(hass);
  const directEntries = allEntries.filter((entry) => entry.device_id === deviceId);
  const childDeviceIds = new Set(
    Object.values(hass?.devices || {})
      .filter((device) => device.via_device_id === deviceId)
      .map((device) => device.id),
  );
  const relatedEntries = allEntries.filter(
    (entry) => directEntries.includes(entry) || childDeviceIds.has(entry.device_id),
  );
  const entities = {};
  const temperatures = [];
  const fans = [];
  const partitions = [];
  const raids = [];

  for (const entry of relatedEntries) {
    const role = inferFunctionId(entry, entityState(hass, entry));
    if (role === "temperature") temperatures.push(entry);
    else if (role === "fan") fans.push(entry);
    else if (role === "partition_free_space") partitions.push(entry);
    else if (role === "raid_degraded") raids.push(entry);
    else if (role && role !== "client_tracker" && !entities[role]) {
      entities[role] = entry;
    }
  }

  const routerConfigIds = new Set();
  for (const entry of directEntries) {
    for (const id of entryConfigIds(entry)) routerConfigIds.add(id);
  }
  const allowAllClients = routerConfigIds.size === 0 && devices.length === 1;
  const clientEntries = allEntries.filter((entry) => {
    if (entry.entity_id?.split(".")[0] !== "device_tracker") return false;
    if (entry.device_id === deviceId) return false;
    if (inferFunctionId(entry, entityState(hass, entry)) !== "client_tracker") {
      return false;
    }
    return allowAllClients || setsOverlap(routerConfigIds, entryConfigIds(entry));
  });
  const clients = clientEntries
    .map((entry) => {
      const state = entityState(hass, entry);
      return {
        entry,
        state,
        label: entityLabel(entry, state, hass),
        connected: state?.state === "home",
        available: Boolean(state && state.state !== "unavailable"),
      };
    })
    .sort(
      (left, right) =>
        Number(right.connected) - Number(left.connected) ||
        left.label.localeCompare(right.label),
    );

  const device = hass?.devices?.[deviceId] || {};
  const router = metric(entities.router_tracker, hass);
  const download = metric(entities.rate_down, hass);
  const upload = metric(entities.rate_up, hass);
  const wifi = metric(entities.wifi, hass);
  const missedCalls = metric(entities.missed, hass);
  const systemUptime = connectionValue(router, ["system_uptime", "uptime"]);
  const connectionUptime = connectionValue(router, [
    "connection_uptime",
    "connection_uptime_val",
    "uptime_connection",
    "connection_since",
  ]);
  const online =
    router?.state?.state === "home" ||
    directEntries.some((entry) => isAvailable(entityState(hass, entry)));

  return {
    config,
    deviceId,
    device,
    devices,
    entities,
    online,
    hasEntities: directEntries.length > 0,
    title: config.title || device.name_by_user || device.name || "Freebox Pop Server",
    router,
    connection: router?.state?.attributes || {},
    download,
    upload,
    wifi,
    missedCalls,
    systemUptime,
    connectionUptime,
    temperatures: toMetricList(temperatures, hass),
    fans: toMetricList(fans, hass),
    partitions: toMetricList(partitions, hass),
    raids: toMetricList(raids, hass),
    clients,
    connectedClients: clients.filter((client) => client.connected).length,
  };
}

function connectionValue(router, keys) {
  const attributes = router?.state?.attributes || {};
  const key = keys.find((candidate) => attributes[candidate] !== undefined);
  return key ? attributes[key] : undefined;
}

export function formatEntityState(hass, state) {
  if (!state) return "—";
  if (typeof hass?.formatEntityState === "function") {
    try {
      return hass.formatEntityState(state);
    } catch {
      // Fall through for Home Assistant versions without this formatter shape.
    }
  }
  if (UNAVAILABLE_STATES.has(state.state)) return "—";
  const unit = state.attributes?.unit_of_measurement;
  return unit ? `${state.state} ${unit}` : state.state;
}

export function numericState(state) {
  if (!isAvailable(state)) return undefined;
  const value = Number(state.state);
  return Number.isFinite(value) ? value : undefined;
}

export function formatUptime(value, translate = (key) => key) {
  if (!value) return "—";
  const numeric = Number(value);
  let totalMinutes;
  if (Number.isFinite(numeric) && String(value).trim() !== "") {
    totalMinutes =
      numeric > 1_000_000_000
        ? Math.max(0, Math.floor((Date.now() - numeric * 1000) / 60000))
        : Math.max(0, Math.floor(numeric / 60));
  } else {
    const bootTime = new Date(value).getTime();
    if (!Number.isFinite(bootTime)) return String(value);
    totalMinutes = Math.max(0, Math.floor((Date.now() - bootTime) / 60000));
  }
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days) return `${days} ${translate("day")} ${hours} ${translate("hour")}`;
  if (hours) {
    return `${hours} ${translate("hour")} ${minutes} ${translate("minute")}`;
  }
  return `${minutes} ${translate("minute")}`;
}

export function safeHttpUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}
