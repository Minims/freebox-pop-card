# Contributing

Contributions and compatibility reports are welcome. Before opening an issue, search existing reports
and include the Freebox model, Home Assistant version, Freebox firmware version, and the behavior you
expect.

1. Fork the repository and create a focused branch.
2. Run `npm ci`.
3. Make source changes under `src/`; never edit the generated `dist/` bundle manually.
4. Add or update focused tests under `test/`.
5. Run `npm run check` before opening a pull request.

Pull requests should explain the user-visible change, list validation performed, and include screenshots
for visual changes. Never submit authentication tokens, public IP addresses, serial numbers, MAC
addresses, cookies, or unredacted diagnostic exports.

Backend entities belong to Home Assistant's official `freebox` integration. Changes that require new
Freebox API data should first be proposed to `home-assistant/core`; this card should remain a frontend
consumer and must not authenticate directly with the router.
