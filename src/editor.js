import { LitElement, html, nothing } from "lit";

import { buildModel, discoverDevices, normalizeConfig } from "./model.js";
import { localize } from "./localize.js";
import { editorStyles } from "./styles.js";

export class FreeboxPopCardEditor extends LitElement {
  static properties = {
    hass: { attribute: false },
    _config: { state: true },
  };

  static styles = editorStyles;

  setConfig(config) {
    this._config = normalizeConfig(config);
  }

  _t(key) {
    return localize(this.hass?.language, key);
  }

  _update(key, value) {
    const config = { ...this._config, [key]: value };
    this._config = config;
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        bubbles: true,
        composed: true,
        detail: { config },
      }),
    );
  }

  render() {
    if (!this.hass || !this._config) return nothing;
    const devices = discoverDevices(this.hass);
    const model = buildModel(this.hass, this._config);
    const checkboxes = [
      ["show_connection", "show_connection"],
      ["show_system", "show_system"],
      ["show_storage", "show_storage"],
      ["show_clients", "show_clients"],
      ["show_equipment", "show_equipment"],
      ["show_controls", "show_controls"],
      ["confirm_actions", "confirm_actions"],
    ];

    return html`
      <div class="editor">
        <label>
          ${this._t("choose_device")}
          <select
            @change=${(event) => this._update("device_id", event.currentTarget.value)}
          >
            <option value="">—</option>
            ${devices.map(
              (device) => html`
                <option value=${device.id} ?selected=${model.deviceId === device.id}>
                  ${device.name} · ${device.model}
                </option>
              `,
            )}
          </select>
        </label>
        <label>
          ${this._t("title")}
          <input
            type="text"
            .value=${this._config.title}
            @change=${(event) =>
              this._update("title", event.currentTarget.value.trim())}
          />
        </label>
        <label>
          ${this._t("view")}
          <select @change=${(event) => this._update("view", event.currentTarget.value)}>
            ${["compact", "overview", "detailed"].map(
              (view) => html`
                <option value=${view} ?selected=${this._config.view === view}>
                  ${this._t(view)}
                </option>
              `,
            )}
          </select>
        </label>
        <label>
          ${this._t("max_clients")}
          <input
            type="number"
            min="0"
            max="20"
            .value=${String(this._config.max_clients)}
            @change=${(event) =>
              this._update("max_clients", Number(event.currentTarget.value))}
          />
        </label>
        <label>
          ${this._t("hard_reboot_entity")}
          <ha-entity-picker
            .hass=${this.hass}
            .value=${this._config.hard_reboot_entity}
            .includeDomains=${["switch"]}
            allow-custom-entity
            @value-changed=${(event) =>
              this._update("hard_reboot_entity", event.detail.value || "")}
          ></ha-entity-picker>
          <small>${this._t("hard_reboot_help")}</small>
        </label>
        ${
          this._config.hard_reboot_entity
            ? html`
                <label>
                  ${this._t("hard_reboot_delay")}
                  <input
                    type="number"
                    min="5"
                    max="300"
                    .value=${String(this._config.hard_reboot_delay)}
                    @change=${(event) =>
                      this._update(
                        "hard_reboot_delay",
                        Number(event.currentTarget.value),
                      )}
                  />
                </label>
              `
            : nothing
        }
        <fieldset>
          <legend>${this._t("options")}</legend>
          ${checkboxes.map(
            ([key, label]) => html`
              <label class="checkbox">
                <input
                  type="checkbox"
                  .checked=${this._config[key]}
                  @change=${(event) => this._update(key, event.currentTarget.checked)}
                />
                ${this._t(label)}
              </label>
            `,
          )}
        </fieldset>
      </div>
    `;
  }
}
