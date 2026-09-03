import { build } from "esbuild";
import { mkdir, readFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));

await mkdir("dist", { recursive: true });
await build({
  entryPoints: ["src/index.js"],
  outfile: "dist/freebox-pop-card.js",
  bundle: true,
  minify: true,
  sourcemap: false,
  target: ["es2022"],
  supported: {
    "template-literal": false,
  },
  legalComments: "none",
  define: {
    __CARD_VERSION__: JSON.stringify(packageJson.version),
  },
  banner: {
    js: `/* Freebox Pop Card ${packageJson.version} | MIT | Minims */`,
  },
});

console.info(`Built Freebox Pop Card ${packageJson.version}`);
