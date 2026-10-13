const fs = require("node:fs");
const LANGUAGES = ["ko", "en", "zh", "vi"];

// Policy content is an operational input. Never substitute fixture or draft values.
function loadContactPolicies({
  policyPath = process.env.CONTACT_POLICY_PATH,
  readFile = fs.readFileSync,
} = {}) {
  const unavailable = Object.fromEntries(
    LANGUAGES.map((language) => [language, null]),
  );
  if (typeof policyPath !== "string" || !policyPath.trim()) return unavailable;
  try {
    const value = JSON.parse(readFile(policyPath, "utf8"));
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value) ||
      Object.keys(value).some((key) => !LANGUAGES.includes(key))
    )
      return unavailable;
    return Object.fromEntries(
      LANGUAGES.map((language) => [language, value[language] ?? null]),
    );
  } catch {
    return unavailable;
  }
}
module.exports = { loadContactPolicies, LANGUAGES };
