const fs = require("node:fs");
const path = require("node:path");
const frontend = path.resolve(__dirname, "../../frontend");
const output = path.resolve(process.argv[2]);
process.env.JSL_FRONTEND_ROOT = frontend;
const dependency = require("node:module").createRequire(
  path.join(frontend, "package.json"),
);
const bundled = dependency("next/dist/compiled/webpack/webpack");
if (bundled.init) bundled.init();
const webpack = bundled.webpack;
async function main() {
  fs.mkdirSync(output, { recursive: true });
  const compiler = webpack({
    mode: "development",
    devtool: false,
    cache: false,
    entry: path.join(__dirname, "entry.tsx"),
    output: { path: output, filename: "contact.js" },
    resolve: {
      extensions: [".tsx", ".ts", ".js", ".json"],
      modules: [path.join(frontend, "node_modules")],
      alias: {
        "@/i18n/navigation$": path.join(__dirname, "navigation.tsx"),
        "@": path.join(frontend, "src"),
      },
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: path.join(__dirname, "typescript-loader.cjs"),
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        "process.env.NEXT_PUBLIC_API_URL": JSON.stringify(""),
      }),
    ],
  });
  await new Promise((resolve, reject) =>
    compiler.run((error, stats) => {
      compiler.close(() => {});
      if (error || stats.hasErrors())
        reject(
          error ?? new Error(stats.toString({ all: false, errors: true })),
        );
      else resolve();
    }),
  );
  const { compile } = dependency("@tailwindcss/node");
  const { Scanner } = dependency("@tailwindcss/oxide");
  const css = fs.readFileSync(
    path.join(frontend, "src/app/globals.css"),
    "utf8",
  );
  const compiled = await compile(css, {
    base: path.join(frontend, "src/app"),
    onDependency() {},
  });
  const scanner = new Scanner({
    sources: [
      {
        base: path.join(frontend, "src"),
        pattern: "**/*.{ts,tsx}",
        negated: false,
      },
    ],
  });
  fs.writeFileSync(
    path.join(output, "contact.css"),
    compiled.build(scanner.scan()),
  );
  fs.writeFileSync(
    path.join(output, "index.html"),
    '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>JSL contact integration test</title><link rel="stylesheet" href="/contact.css"></head><body><main id="root"></main><script src="/contact.js"></script></body></html>',
  );
  console.log("Contact component harness built (Next routing excluded).");
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
