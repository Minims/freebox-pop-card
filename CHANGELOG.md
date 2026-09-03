# Changelog

All notable changes to this project are documented here.

## 2026.9.2

- Keep **Mark calls as read** available whenever the official Freebox action is exposed.
- Let the supplemental-client link expand and collapse the complete connected-client list.
- Align icons and labels consistently across metrics, panels, controls, and actions.
- Add a Freebox equipment panel that reports Player, Wi-Fi repeater, and DECT phone activity from
  official `device_tracker` entities.
- Add an optional, confirmed hard-reboot action for a configured Freebox power plug. The off → delay →
  on sequence runs in Home Assistant, not in the browser.

## 2026.9.1

- Make responsive breakpoints follow the card width instead of the browser window.
- Shorten entity labels by removing repeated Freebox, disk, and MAC prefixes.
- Distinguish system uptime from connection uptime and identify unsupported connection uptime.
- Detect the official reboot button through its `restart` device class and localized names.

## 2026.9.0

- Initial HACS-compatible release.
- Add automatic official Freebox integration discovery by `device_id`.
- Add compact, overview, and detailed responsive layouts.
- Add WAN, throughput, system, storage, RAID, calls, and connected-client views.
- Add Wi-Fi, Freebox OS, mark-calls-read, and reboot controls.
- Add English and French localization and a visual card editor.
