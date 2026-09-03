import { LitElement, html, nothing } from "lit";

import {
  buildModel,
  entityState,
  formatEntityState,
  formatUptime,
  isActionAvailable,
  isAvailable,
  normalizeConfig,
  numericState,
  safeHttpUrl,
} from "./model.js";
import { localize } from "./localize.js";
import { cardStyles } from "./styles.js";

export class FreeboxPopCard extends LitElement {
  static properties = {
    hass: { attribute: false },
    _config: { state: true },
    _clientsExpanded: { state: true },
    _hardRebootRunning: { state: true },
  };

  static styles = cardStyles;

  setConfig(config) {
    const normalized = normalizeConfig(config);
    if (this._config?.device_id !== normalized.device_id) {
      this._clientsExpanded = false;
    }
    this._config = normalized;
  }

  getCardSize() {
    if (this._config?.view === "compact") return 3;
    return this._config?.view === "detailed" ? 10 : 7;
  }

  getGridOptions() {
    const options = { columns: 12, min_columns: 6, min_rows: 3 };
    if (this._config?.view === "compact") options.rows = 3;
    return options;
  }

  static getConfigElement() {
    return document.createElement("freebox-pop-card-editor");
  }

  static getStubConfig(hass) {
    const model = buildModel(hass, {});
    return model.deviceId ? { device_id: model.deviceId } : {};
  }

  _t(key) {
    return localize(this.hass?.language, key);
  }

  _state(entity) {
    return entityState(this.hass, entity);
  }

  _format(metric) {
    return formatEntityState(this.hass, metric?.state);
  }

  _showMoreInfo(entity) {
    if (!entity) return;
    this.dispatchEvent(
      new CustomEvent("hass-more-info", {
        bubbles: true,
        composed: true,
        detail: { entityId: entity.entity_id },
      }),
    );
  }

  _confirmed(message) {
    return !this._config.confirm_actions || window.confirm(message);
  }

  _toggleWifi(entity) {
    const state = this._state(entity);
    if (!isAvailable(state)) return;
    const turningOff = state.state === "on";
    if (turningOff && !this._confirmed(this._t("confirm_wifi_off"))) return;
    this.hass.callService("switch", turningOff ? "turn_off" : "turn_on", {
      entity_id: entity.entity_id,
    });
  }

  _press(entity, confirmation) {
    if (!entity || !isActionAvailable(this._state(entity))) return;
    if (confirmation && !this._confirmed(confirmation)) return;
    this.hass.callService("button", "press", { entity_id: entity.entity_id });
  }

  _notify(message) {
    this.dispatchEvent(
      new CustomEvent("hass-notification", {
        bubbles: true,
        composed: true,
        detail: { message },
      }),
    );
  }

  async _hardReboot() {
    const entityId = this._config.hard_reboot_entity;
    const state = this.hass?.states?.[entityId];
    if (!entityId || state?.state !== "on" || this._hardRebootRunning) return;

    const confirmation = this._t("confirm_hard_reboot").replace(
      "{seconds}",
      String(this._config.hard_reboot_delay),
    );
    if (!this._confirmed(confirmation)) return;

    const message = {
      type: "execute_script",
      sequence: [
        {
          action: "switch.turn_off",
          target: { entity_id: entityId },
        },
        { delay: { seconds: this._config.hard_reboot_delay } },
        {
          action: "switch.turn_on",
          target: { entity_id: entityId },
        },
      ],
    };

    this._hardRebootRunning = true;
    try {
      if (typeof this.hass.callWS === "function") {
        await this.hass.callWS(message);
      } else if (typeof this.hass.connection?.sendMessagePromise === "function") {
        await this.hass.connection.sendMessagePromise(message);
      } else {
        throw new Error("Home Assistant WebSocket API is unavailable");
      }
    } catch (error) {
      console.error("Freebox Pop Card hard reboot failed", error);
      this._notify(this._t("hard_reboot_failed"));
    } finally {
      this._hardRebootRunning = false;
    }
  }

  _configurationUrl(model) {
    return safeHttpUrl(model.device.configuration_url);
  }

  _openWeb(model) {
    const url = this._configurationUrl(model);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  _renderHeader(model) {
    const reboot = model.entities.reboot;
    const webAvailable = Boolean(this._configurationUrl(model));
    const firmware = model.device.sw_version || model.connection.firmware_version || "";

    return html`
      <div class="header">
        <div class="heading">
          <h2>${model.title}</h2>
          <div class="summary">
            <span class="status-dot ${model.online ? "online" : ""}"></span>
            <span>${model.online ? this._t("online") : this._t("offline")}</span>
            ${
              model.connection.connection_type
                ? html`<span>· ${model.connection.connection_type}</span>`
                : nothing
            }
          </div>
          <div class="metadata">
            ${model.device.model ? html`<span>${model.device.model}</span>` : nothing}
            ${firmware ? html`<span>FW ${firmware}</span>` : nothing}
            ${
              model.device.hw_version
                ? html`<span>HW ${model.device.hw_version}</span>`
                : nothing
            }
          </div>
        </div>
        ${
          this._config.show_controls
            ? html`
                <div class="header-actions">
                  <button
                    class="icon-button"
                    title=${this._t("web_ui")}
                    aria-label=${this._t("web_ui")}
                    ?disabled=${!webAvailable}
                    @click=${() => this._openWeb(model)}
                  >
                    <ha-icon icon="mdi:web"></ha-icon>
                  </button>
                  ${
                    reboot
                      ? html`
                          <button
                            class="icon-button"
                            title=${this._t("reboot")}
                            aria-label=${this._t("reboot")}
                            ?disabled=${!isActionAvailable(this._state(reboot))}
                            @click=${() => this._press(reboot, this._t("confirm_reboot"))}
                          >
                            <ha-icon icon="mdi:restart"></ha-icon>
                          </button>
                        `
                      : nothing
                  }
                </div>
              `
            : nothing
        }
      </div>
    `;
  }

  _renderEntityStat(metric, label, icon) {
    const entry = metric?.entry;
    return html`
      <button
        class="stat"
        ?disabled=${!entry}
        @click=${() => this._showMoreInfo(entry)}
      >
        <span class="stat-top"><ha-icon icon=${icon}></ha-icon>${label}</span>
        <strong>${this._format(metric)}</strong>
      </button>
    `;
  }

  _renderStats(model) {
    const wifiOn = model.wifi?.state?.state === "on";
    const wifiLabel = model.wifi?.available
      ? wifiOn
        ? this._t("enabled")
        : this._t("disabled")
      : "—";
    return html`
      <div class="stats">
        ${this._renderEntityStat(
          model.download,
          this._t("download"),
          "mdi:download-network-outline",
        )}
        ${this._renderEntityStat(
          model.upload,
          this._t("upload"),
          "mdi:upload-network-outline",
        )}
        <div class="stat">
          <span class="stat-top"
            ><ha-icon icon="mdi:devices"></ha-icon>${this._t("clients")}</span
          >
          <strong>${model.connectedClients}</strong>
        </div>
        <button
          class="stat"
          ?disabled=${!model.wifi?.entry}
          @click=${() => this._showMoreInfo(model.wifi?.entry)}
        >
          <span class="stat-top"
            ><ha-icon icon="mdi:wifi"></ha-icon>${this._t("wifi")}</span
          >
          <strong>${wifiLabel}</strong>
        </button>
      </div>
    `;
  }

  _renderHero(model) {
    const uptime = formatUptime(model.systemUptime, (key) => this._t(key));
    const subtitle = [
      model.connection.IPv4,
      uptime !== "—" ? `${this._t("system_uptime")} ${uptime}` : "",
    ]
      .filter(Boolean)
      .join(" · ");
    return html`
      <section class="hero">
        <div
          class="server-visual ${model.online ? "online" : ""}"
          aria-label=${model.device.model || "Freebox Pop Server"}
        >
          <span class="free-mark">free</span>
        </div>
        <div class="hero-copy">
          <h3>${model.device.model || "Freebox Pop Server"}</h3>
          ${subtitle ? html`<p>${subtitle}</p>` : nothing} ${this._renderStats(model)}
        </div>
      </section>
    `;
  }

  _renderPanelHeader(title, icon, count) {
    return html`
      <div class="panel-header">
        <div class="panel-title">
          <ha-icon icon=${icon}></ha-icon>
          <h3>${title}</h3>
        </div>
        ${count !== undefined ? html`<span class="panel-count">${count}</span>` : nothing}
      </div>
    `;
  }

  _renderKeyValue(label, value) {
    if (value === undefined || value === null || value === "") return nothing;
    return html`
      <div class="key-value"><span>${label}</span><strong>${value}</strong></div>
    `;
  }

  _renderConnection(model) {
    const firmware = model.device.sw_version || model.connection.firmware_version || "";
    return html`
      <section class="panel">
        ${this._renderPanelHeader(
          this._t("connection"),
          "mdi:wan",
          model.online ? this._t("online") : this._t("offline"),
        )}
        <div class="key-values">
          ${this._renderKeyValue(
            this._t("connection_type"),
            model.connection.connection_type,
          )}
          ${this._renderKeyValue(this._t("ipv4"), model.connection.IPv4)}
          ${this._renderKeyValue(this._t("ipv6"), model.connection.IPv6)}
          ${this._renderKeyValue(
            this._t("connection_uptime"),
            model.connectionUptime === undefined
              ? this._t("not_exposed")
              : formatUptime(model.connectionUptime, (key) => this._t(key)),
          )}
          ${
            this._config.view === "detailed"
              ? html`
                  ${this._renderKeyValue(this._t("firmware"), firmware)}
                  ${this._renderKeyValue(this._t("hardware"), model.device.hw_version)}
                  ${this._renderKeyValue(
                    this._t("serial"),
                    model.device.serial_number || model.connection.serial,
                  )}
                `
              : nothing
          }
        </div>
      </section>
    `;
  }

  _renderMetricButton(metric) {
    return html`
      <button
        class="metric-button"
        ?disabled=${!metric.entry}
        @click=${() => this._showMoreInfo(metric.entry)}
      >
        <span class="metric-name">${metric.label}</span>
        <span class="metric-value">${this._format(metric)}</span>
      </button>
    `;
  }

  _renderSystem(model) {
    if (
      !model.systemUptime &&
      !model.temperatures.length &&
      !model.fans.length &&
      !model.missedCalls
    ) {
      return nothing;
    }
    return html`
      <section class="panel">
        ${this._renderPanelHeader(this._t("system"), "mdi:chip")}
        ${
          model.systemUptime
            ? html`
                <div class="key-values system-uptime">
                  ${this._renderKeyValue(
                    this._t("system_uptime"),
                    formatUptime(model.systemUptime, (key) => this._t(key)),
                  )}
                </div>
              `
            : nothing
        }
        ${
          model.temperatures.length
            ? html`
                <div class="subheading">${this._t("temperatures")}</div>
                <div class="metric-list">
                  ${model.temperatures.map((metric) => this._renderMetricButton(metric))}
                </div>
              `
            : nothing
        }
        ${
          model.fans.length
            ? html`
                <div class="subheading">${this._t("fans")}</div>
                <div class="metric-list">
                  ${model.fans.map((metric) => this._renderMetricButton(metric))}
                </div>
              `
            : nothing
        }
        ${
          model.missedCalls
            ? html`
                <div class="subheading">${this._t("missed_calls")}</div>
                <div class="metric-list">
                  ${this._renderMetricButton(model.missedCalls)}
                </div>
              `
            : nothing
        }
      </section>
    `;
  }

  _renderStorage(model) {
    if (!model.partitions.length && !model.raids.length) return nothing;
    return html`
      <section class="panel">
        ${this._renderPanelHeader(this._t("storage"), "mdi:harddisk")}
        <div class="storage-list">
          ${model.partitions.map((partition) => {
            const free = numericState(partition.state);
            const width = Number.isFinite(free) ? Math.min(100, Math.max(0, free)) : 0;
            return html`
              <div class="storage-item">
                <div class="storage-line">
                  <button @click=${() => this._showMoreInfo(partition.entry)}>
                    ${partition.label}
                  </button>
                  <strong>${this._format(partition)} ${this._t("free_space")}</strong>
                </div>
                <div class="progress" aria-hidden="true">
                  <span style="width: ${width}%"></span>
                </div>
              </div>
            `;
          })}
          ${model.raids.map((raid) => {
            const problem = raid.state?.state === "on";
            const label = raid.available
              ? problem
                ? this._t("problem")
                : this._t("healthy")
              : this._t("unknown");
            return html`
              <div class="storage-item raid-line">
                <button @click=${() => this._showMoreInfo(raid.entry)}>
                  ${raid.label}
                </button>
                <span class="raid-state ${problem ? "problem" : ""}">
                  <ha-icon
                    icon=${
                      !raid.available
                        ? "mdi:help-circle"
                        : problem
                          ? "mdi:alert-circle"
                          : "mdi:check-circle"
                    }
                  ></ha-icon>
                  ${label}
                </span>
              </div>
            `;
          })}
        </div>
      </section>
    `;
  }

  _renderEquipment(model) {
    if (!model.equipment.length) return nothing;
    const icons = {
      player: "mdi:television-play",
      repeater: "mdi:access-point-network",
      phone: "mdi:phone",
    };

    return html`
      <section class="panel">
        ${this._renderPanelHeader(this._t("equipment"), "mdi:router-network")}
        <div class="equipment-list">
          ${model.equipment.map((item) => {
            const stateLabel = item.available
              ? item.connected
                ? this._t("active")
                : this._t("inactive")
              : this._t("unavailable");
            return html`
              <button
                class="equipment-item"
                @click=${() => this._showMoreInfo(item.entry)}
              >
                <span class="equipment-label">
                  <ha-icon icon=${icons[item.kind]}></ha-icon>
                  <span class="equipment-copy">
                    <strong>${this._t(item.kind)}</strong>
                    <small>${item.label}</small>
                  </span>
                </span>
                <span class="equipment-state">
                  <span
                    class="status-dot ${
                      item.available && item.connected ? "online" : ""
                    }"
                  ></span>
                  ${stateLabel}
                </span>
              </button>
            `;
          })}
        </div>
      </section>
    `;
  }

  _renderClients(model) {
    const connected = model.clients.filter((client) => client.connected);
    const collapsible = connected.length > this._config.max_clients;
    const displayed = this._clientsExpanded
      ? connected
      : connected.slice(0, this._config.max_clients);
    const remaining = connected.length - displayed.length;
    return html`
      <section class="panel">
        ${this._renderPanelHeader(
          this._t("clients"),
          "mdi:devices",
          `${connected.length} ${this._t("connected")}`,
        )}
        <div class="client-list">
          ${displayed.map(
            (client) => html`
              <button class="client" @click=${() => this._showMoreInfo(client.entry)}>
                <span class="status-dot online"></span>
                <span class="client-name">${client.label}</span>
              </button>
            `,
          )}
          ${
            collapsible
              ? html`
                  <button
                    class="more-button"
                    aria-expanded=${this._clientsExpanded ? "true" : "false"}
                    @click=${() => {
                      this._clientsExpanded = !this._clientsExpanded;
                    }}
                  >
                    <span
                      >${
                        this._clientsExpanded
                          ? this._t("show_fewer_clients")
                          : `+${remaining} ${this._t("more_clients")}`
                      }</span
                    >
                    <ha-icon
                      icon=${this._clientsExpanded ? "mdi:chevron-up" : "mdi:chevron-down"}
                    ></ha-icon>
                  </button>
                `
              : nothing
          }
        </div>
      </section>
    `;
  }

  _renderControls(model) {
    const wifi = model.entities.wifi;
    const wifiState = this._state(wifi);
    const wifiOn = wifiState?.state === "on";
    const markRead = model.entities.mark_calls_as_read;
    const reboot = model.entities.reboot;
    const hardReboot = this._config.hard_reboot_entity;
    const hardRebootState = this.hass.states?.[hardReboot];
    const hardRebootAvailable =
      hardRebootState?.state === "on" &&
      this.hass.user?.is_admin !== false &&
      (typeof this.hass.callWS === "function" ||
        typeof this.hass.connection?.sendMessagePromise === "function");
    const webAvailable = Boolean(this._configurationUrl(model));
    if (!wifi && !markRead && !reboot && !hardReboot && !webAvailable) return nothing;

    return html`
      <section class="panel">
        ${this._renderPanelHeader(this._t("controls"), "mdi:tune-variant")}
        <div class="controls-list">
          ${
            wifi
              ? html`
                  <button
                    class="control ${wifiOn ? "on" : ""}"
                    role="switch"
                    aria-checked=${wifiOn}
                    ?disabled=${!isAvailable(wifiState)}
                    @click=${() => this._toggleWifi(wifi)}
                  >
                    <span class="control-label"
                      ><ha-icon icon="mdi:wifi"></ha-icon>${this._t("wifi")}</span
                    >
                    <span class="control-state" aria-hidden="true"></span>
                  </button>
                `
              : nothing
          }
          ${
            markRead
              ? html`
                  <button
                    class="action-button mark-read-button"
                    ?disabled=${!isActionAvailable(this._state(markRead))}
                    @click=${() => this._press(markRead)}
                  >
                    <ha-icon icon="mdi:phone-check"></ha-icon>
                    ${this._t("mark_calls_read")}
                  </button>
                `
              : nothing
          }
          ${
            webAvailable
              ? html`
                  <button class="action-button" @click=${() => this._openWeb(model)}>
                    <ha-icon icon="mdi:web"></ha-icon>${this._t("web_ui")}
                  </button>
                `
              : nothing
          }
          ${
            reboot
              ? html`
                  <button
                    class="action-button danger reboot-button"
                    ?disabled=${!isActionAvailable(this._state(reboot))}
                    @click=${() => this._press(reboot, this._t("confirm_reboot"))}
                  >
                    <ha-icon icon="mdi:restart"></ha-icon>${this._t("reboot")}
                  </button>
                `
              : nothing
          }
          ${
            hardReboot
              ? html`
                  <button
                    class="action-button danger hard-reboot-button"
                    title=${
                      this.hass.user?.is_admin === false
                        ? this._t("admin_required")
                        : this._t("hard_reboot")
                    }
                    ?disabled=${!hardRebootAvailable || this._hardRebootRunning}
                    @click=${() => this._hardReboot()}
                  >
                    <ha-icon icon="mdi:power-cycle"></ha-icon>
                    ${
                      this._hardRebootRunning
                        ? this._t("hard_reboot_running")
                        : this._t("hard_reboot")
                    }
                  </button>
                `
              : nothing
          }
        </div>
      </section>
    `;
  }

  _renderEmpty(message) {
    return html`
      <ha-card>
        <div class="empty">
          <div>
            <ha-icon icon="mdi:router-network-off"></ha-icon>
            <p>${message}</p>
          </div>
        </div>
      </ha-card>
    `;
  }

  render() {
    if (!this.hass || !this._config) return nothing;
    const model = buildModel(this.hass, this._config);
    if (!model.deviceId) return this._renderEmpty(this._t("no_device"));
    if (!model.hasEntities) return this._renderEmpty(this._t("no_entities"));

    const compact = this._config.view === "compact";
    return html`
      <ha-card>
        <article class="card ${this._config.view}">
          ${this._renderHeader(model)}
          ${
            compact
              ? this._renderStats(model)
              : html`
                  ${this._renderHero(model)}
                  <div class="content">
                    <div class="panels-grid">
                      ${
                        this._config.show_connection
                          ? this._renderConnection(model)
                          : nothing
                      }
                      ${this._config.show_system ? this._renderSystem(model) : nothing}
                      ${
                        this._config.show_equipment
                          ? this._renderEquipment(model)
                          : nothing
                      }
                      ${
                        this._config.show_storage ? this._renderStorage(model) : nothing
                      }
                      ${this._config.show_clients ? this._renderClients(model) : nothing}
                      ${
                        this._config.show_controls
                          ? this._renderControls(model)
                          : nothing
                      }
                    </div>
                  </div>
                `
          }
        </article>
      </ha-card>
    `;
  }
}
