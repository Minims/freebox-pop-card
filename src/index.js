import { FreeboxPopCard } from "./card.js";
import { FreeboxPopCardEditor } from "./editor.js";
import { discoverDevices } from "./model.js";

/* global __CARD_VERSION__ */

if (!customElements.get("freebox-pop-card")) {
  customElements.define("freebox-pop-card", FreeboxPopCard);
}

if (!customElements.get("freebox-pop-card-editor")) {
  customElements.define("freebox-pop-card-editor", FreeboxPopCardEditor);
}

window.customCards = window.customCards || [];
const cardMetadata = {
  type: "freebox-pop-card",
  name: "Freebox Pop Card",
  description: "Monitoring and controls for the Freebox Pop Server.",
  preview: true,
  documentationURL: "https://github.com/Minims/freebox-pop-card",
  getEntitySuggestion: (hass, entityId) => {
    const entry = hass?.entities?.[entityId];
    if (entry?.platform !== "freebox") return null;

    const routers = discoverDevices(hass);
    const device = hass?.devices?.[entry.device_id];
    const candidates = new Set([entry.device_id, device?.via_device_id]);
    const deviceId = routers.find((router) => candidates.has(router.id))?.id;
    if (!deviceId && routers.length !== 1) return null;
    return {
      config: {
        type: "custom:freebox-pop-card",
        device_id: deviceId || routers[0].id,
      },
    };
  },
};

if (!window.customCards.some((card) => card.type === cardMetadata.type)) {
  window.customCards.push(cardMetadata);
}

console.info(
  `%c FREEBOX-POP-CARD %c ${__CARD_VERSION__} `,
  "color: white; background: #e10600; font-weight: 700;",
  "color: #e10600; background: white; font-weight: 700;",
);
