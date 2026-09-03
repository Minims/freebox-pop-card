import { css } from "lit";

export const cardStyles = css`
  :host {
    display: block;
    --freebox-red: #e10600;
    --freebox-red-soft: color-mix(in srgb, var(--freebox-red) 14%, transparent);
    --freebox-green: #2eae65;
    --freebox-amber: #f3a712;
    --freebox-panel: color-mix(
      in srgb,
      var(--ha-card-background, var(--card-background-color)) 92%,
      var(--primary-text-color) 8%
    );
    --freebox-border: color-mix(in srgb, var(--divider-color) 72%, transparent);
  }

  * {
    box-sizing: border-box;
  }

  ha-card {
    container-type: inline-size;
    overflow: hidden;
    color: var(--primary-text-color);
  }

  button,
  select,
  input {
    font: inherit;
  }

  button {
    color: inherit;
  }

  .card {
    position: relative;
  }

  .card::before {
    position: absolute;
    inset: 0 0 auto;
    height: 3px;
    background: linear-gradient(90deg, var(--freebox-red), #ff5a52 55%, transparent);
    content: "";
  }

  .header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: 20px 20px 14px;
  }

  .heading {
    min-width: 0;
  }

  h2,
  h3,
  p {
    margin: 0;
  }

  h2 {
    overflow: hidden;
    font-size: 1.25rem;
    font-weight: 650;
    line-height: 1.3;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  h3 {
    font-size: 0.93rem;
    font-weight: 650;
  }

  .summary,
  .metadata {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }

  .summary {
    margin-top: 5px;
    color: var(--secondary-text-color);
    font-size: 0.86rem;
  }

  .metadata {
    margin-top: 7px;
    color: var(--secondary-text-color);
    font-size: 0.76rem;
  }

  .metadata span:not(:last-child)::after {
    margin-inline-start: 6px;
    color: var(--divider-color);
    content: "·";
  }

  .status-dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--disabled-text-color);
    box-shadow: 0 0 0 3px
      color-mix(in srgb, var(--disabled-text-color) 12%, transparent);
  }

  .status-dot.online {
    background: var(--freebox-green);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--freebox-green) 18%, transparent);
  }

  .header-actions,
  .control-actions {
    display: flex;
    gap: 8px;
  }

  .icon-button,
  .action-button,
  .control,
  .metric-button,
  .client {
    border: 1px solid var(--freebox-border);
    background: var(--freebox-panel);
    cursor: pointer;
    transition:
      transform 120ms ease,
      border-color 120ms ease,
      background 120ms ease;
  }

  .icon-button:hover:not(:disabled),
  .action-button:hover:not(:disabled),
  .control:hover:not(:disabled),
  .metric-button:hover:not(:disabled),
  .client:hover:not(:disabled) {
    border-color: color-mix(in srgb, var(--primary-color) 45%, var(--freebox-border));
    transform: translateY(-1px);
  }

  .icon-button:focus-visible,
  .action-button:focus-visible,
  .control:focus-visible,
  .metric-button:focus-visible,
  .client:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }

  .icon-button {
    display: grid;
    width: 40px;
    height: 40px;
    place-items: center;
    border-radius: 13px;
  }

  button:disabled {
    cursor: default;
    opacity: 0.45;
  }

  .hero {
    display: grid;
    grid-template-columns: 150px minmax(0, 1fr);
    gap: 18px;
    align-items: center;
    margin: 0 20px 16px;
    padding: 18px;
    border: 1px solid var(--freebox-border);
    border-radius: 22px;
    background:
      radial-gradient(circle at 15% 10%, var(--freebox-red-soft), transparent 34%),
      var(--freebox-panel);
  }

  .server-visual {
    position: relative;
    display: grid;
    width: 132px;
    height: 132px;
    place-items: center;
    justify-self: center;
    border: 1px solid color-mix(in srgb, var(--primary-text-color) 13%, transparent);
    border-radius: 50%;
    background:
      radial-gradient(circle at 40% 34%, #fff 0 5%, transparent 6%),
      linear-gradient(145deg, #fafafa, #d7d7d7);
    box-shadow:
      0 15px 30px rgb(0 0 0 / 16%),
      inset 0 -5px 9px rgb(0 0 0 / 10%),
      inset 0 3px 8px rgb(255 255 255 / 85%);
    color: #1c1c1c;
  }

  .server-visual::before,
  .server-visual::after {
    position: absolute;
    border-radius: 50%;
    content: "";
  }

  .server-visual::before {
    inset: 12px;
    border: 1px solid rgb(0 0 0 / 8%);
  }

  .server-visual::after {
    right: 25px;
    bottom: 22px;
    width: 7px;
    height: 7px;
    background: var(--disabled-text-color);
    box-shadow: 0 0 0 3px rgb(0 0 0 / 5%);
  }

  .server-visual.online::after {
    background: var(--freebox-green);
  }

  .free-mark {
    z-index: 1;
    font-family: Arial, sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    letter-spacing: -0.09em;
  }

  .hero-copy {
    min-width: 0;
  }

  .hero-copy h3 {
    font-size: 1rem;
  }

  .hero-copy p {
    margin-top: 5px;
    color: var(--secondary-text-color);
    font-size: 0.82rem;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 9px;
    margin-top: 14px;
  }

  .compact .stats {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    margin: 0 20px 20px;
  }

  .stat {
    min-width: 0;
    padding: 10px 11px;
    border: 1px solid var(--freebox-border);
    border-radius: 14px;
    background: color-mix(
      in srgb,
      var(--ha-card-background, var(--card-background-color)) 78%,
      transparent
    );
  }

  button.stat {
    width: 100%;
    text-align: start;
    cursor: pointer;
  }

  .stat-top {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    color: var(--secondary-text-color);
    font-size: 0.72rem;
  }

  .stat-top ha-icon {
    width: 17px;
    height: 17px;
    color: var(--primary-color);
  }

  .stat strong {
    display: block;
    overflow: hidden;
    margin-top: 5px;
    font-size: 0.95rem;
    font-weight: 650;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .content {
    padding: 0 20px 20px;
  }

  .panels-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .detailed .panels-grid {
    grid-template-columns: 1fr;
  }

  .panel {
    min-width: 0;
    padding: 15px;
    border: 1px solid var(--freebox-border);
    border-radius: 17px;
    background: color-mix(in srgb, var(--freebox-panel) 68%, transparent);
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 12px;
  }

  .panel-title {
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .panel-title ha-icon {
    width: 19px;
    height: 19px;
    color: var(--primary-color);
  }

  .panel-count {
    color: var(--secondary-text-color);
    font-size: 0.75rem;
  }

  .key-values {
    display: grid;
    gap: 8px;
  }

  .key-value {
    display: grid;
    grid-template-columns: minmax(95px, 0.75fr) minmax(0, 1.25fr);
    gap: 12px;
    align-items: baseline;
    font-size: 0.82rem;
  }

  .key-value span {
    color: var(--secondary-text-color);
  }

  .key-value strong {
    overflow-wrap: anywhere;
    text-align: end;
  }

  .metric-list,
  .storage-list,
  .client-list,
  .controls-list {
    display: grid;
    gap: 8px;
  }

  .metric-button,
  .client {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 9px 10px;
    border-radius: 12px;
    text-align: start;
  }

  .metric-name,
  .client-name {
    overflow: hidden;
    min-width: 0;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .metric-value {
    flex: 0 0 auto;
    font-weight: 650;
  }

  .subheading {
    margin: 12px 0 7px;
    color: var(--secondary-text-color);
    font-size: 0.72rem;
    font-weight: 650;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .subheading:first-child {
    margin-top: 0;
  }

  .system-uptime {
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--freebox-border);
  }

  .storage-item {
    padding: 10px;
    border: 1px solid var(--freebox-border);
    border-radius: 12px;
  }

  .storage-line,
  .raid-line {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    font-size: 0.8rem;
  }

  .storage-line button,
  .raid-line button {
    overflow: hidden;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    text-align: start;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
  }

  .progress {
    overflow: hidden;
    height: 6px;
    margin-top: 8px;
    border-radius: 99px;
    background: color-mix(in srgb, var(--disabled-text-color) 20%, transparent);
  }

  .progress > span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--primary-color), var(--freebox-green));
  }

  .raid-state {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: var(--freebox-green);
    font-weight: 650;
  }

  .raid-state.problem {
    color: var(--error-color);
  }

  .client {
    justify-content: flex-start;
  }

  .client .status-dot {
    flex: 0 0 auto;
    width: 7px;
    height: 7px;
  }

  .more {
    color: var(--secondary-text-color);
    font-size: 0.76rem;
    text-align: center;
  }

  .control {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 11px 12px;
    border-radius: 13px;
  }

  .control-label {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .control-label ha-icon {
    width: 20px;
    height: 20px;
  }

  .control-state {
    position: relative;
    width: 34px;
    height: 19px;
    flex: 0 0 auto;
    border-radius: 99px;
    background: var(--disabled-text-color);
  }

  .control-state::after {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: white;
    content: "";
    transition: transform 150ms ease;
  }

  .control.on {
    border-color: color-mix(in srgb, var(--freebox-green) 42%, var(--freebox-border));
    background: color-mix(in srgb, var(--freebox-green) 10%, var(--freebox-panel));
  }

  .control.on .control-state {
    background: var(--freebox-green);
  }

  .control.on .control-state::after {
    transform: translateX(15px);
  }

  .action-button {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 13px;
  }

  .action-button.danger {
    color: var(--error-color);
  }

  .empty {
    display: grid;
    min-height: 150px;
    place-items: center;
    padding: 30px;
    color: var(--secondary-text-color);
    text-align: center;
  }

  .empty ha-icon {
    width: 42px;
    height: 42px;
    margin-bottom: 12px;
    color: var(--disabled-text-color);
  }

  @container (max-width: 600px) {
    .header {
      padding-inline: 16px;
    }

    .hero {
      grid-template-columns: 105px minmax(0, 1fr);
      gap: 12px;
      margin-inline: 16px;
      padding: 14px;
    }

    .server-visual {
      width: 96px;
      height: 96px;
    }

    .server-visual::after {
      right: 18px;
      bottom: 16px;
    }

    .stats,
    .compact .stats {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .compact .stats {
      margin-inline: 16px;
    }

    .content {
      padding-inline: 16px;
    }

    .panels-grid {
      grid-template-columns: 1fr;
    }
  }

  @container (max-width: 390px) {
    .hero {
      grid-template-columns: 1fr;
    }

    .server-visual {
      display: none;
    }

    .metadata {
      display: none;
    }
  }
`;

export const editorStyles = css`
  :host {
    display: block;
  }

  * {
    box-sizing: border-box;
  }

  .editor {
    display: grid;
    gap: 14px;
    padding: 8px 0;
  }

  label {
    display: grid;
    gap: 6px;
    color: var(--primary-text-color);
    font-size: 0.88rem;
  }

  input,
  select {
    width: 100%;
    min-height: 42px;
    padding: 8px 10px;
    border: 1px solid var(--divider-color);
    border-radius: 8px;
    background: var(--card-background-color);
    color: var(--primary-text-color);
    font: inherit;
  }

  fieldset {
    display: grid;
    gap: 10px;
    margin: 0;
    padding: 12px;
    border: 1px solid var(--divider-color);
    border-radius: 10px;
  }

  legend {
    padding: 0 6px;
    color: var(--secondary-text-color);
    font-size: 0.8rem;
  }

  .checkbox {
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .checkbox input {
    width: 18px;
    min-height: auto;
    height: 18px;
    margin: 0;
  }
`;
