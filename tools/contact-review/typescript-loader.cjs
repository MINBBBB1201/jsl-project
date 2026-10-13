const path = require("node:path");
const ts = require(
  path.join(process.env.JSL_FRONTEND_ROOT, "node_modules/typescript"),
);
module.exports = function (source) {
  return ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
    fileName: this.resourcePath,
  }).outputText;
};
