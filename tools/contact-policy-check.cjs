#!/usr/bin/env node
"use strict";

const {
  loadContactPolicies,
  LANGUAGES,
} = require("../backend/src/config/contact-policy");
const {
  policyReadiness,
  notice,
} = require("../backend/src/services/contact-inquiry.service");

function checkPolicyFile(inputPath) {
  // An explicit path prevents the loader's operational environment fallback.
  if (typeof inputPath !== "string" || !inputPath.trim()) {
    throw new TypeError("Explicit input path required");
  }
  const policies = loadContactPolicies({ policyPath: inputPath });
  const languages = LANGUAGES.map((language) => {
    const policy = policies[language];
    const { ready, missing } = policyReadiness(policy);
    return {
      language,
      ready,
      missing,
      ...(ready ? { noticeHash: notice(policy).noticeHash } : {}),
    };
  });
  return { ready: languages.every((entry) => entry.ready), languages };
}

function runCli(args, output = process.stdout, errorOutput = process.stderr) {
  if (args.length === 1 && args[0] === "--help") {
    output.write("Usage: node tools/contact-policy-check.cjs --input POLICY_FILE\n");
    return 0;
  }
  if (
    args.length !== 2 ||
    args[0] !== "--input" ||
    !args[1].trim() ||
    args[1].startsWith("--")
  ) {
    errorOutput.write("Explicit --input POLICY_FILE is required. Use --help.\n");
    return 2;
  }
  try {
    const report = checkPolicyFile(args[1]);
    output.write(`${JSON.stringify(report, null, 2)}\n`);
    return report.ready ? 0 : 1;
  } catch {
    // Never echo paths, policy values, parser excerpts, or environment details.
    errorOutput.write("Policy check could not complete.\n");
    return 1;
  }
}

if (require.main === module) {
  process.exitCode = runCli(process.argv.slice(2));
}

module.exports = { checkPolicyFile, runCli };
