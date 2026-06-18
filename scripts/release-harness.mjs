import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";

const args = new Set(process.argv.slice(2));
const localOnly = args.has("--local-only");
const iosOnly = args.has("--ios-only");
const failures = [];
const warnings = [];

function recordFailure(message) {
  failures.push(message);
  console.error(`FAIL ${message}`);
}

function recordPass(message) {
  console.log(`PASS ${message}`);
}

function recordWarning(message) {
  warnings.push(message);
  console.warn(`WARN ${message}`);
}

function run(label, command, commandArgs, options = {}) {
  console.log(`\n> ${label}`);
  const result = spawnSync(command, commandArgs, {
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
    shell: false
  });

  if (result.status !== 0) {
    recordFailure(`${label} failed`);
  } else {
    recordPass(label);
  }

  return result;
}

function runAudit() {
  console.log("\n> npm audit");
  return spawnSync("npm", ["audit", "--json"], {
    encoding: "utf8",
    stdio: "pipe",
    shell: false
  });
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function assert(condition, message) {
  if (condition) {
    recordPass(message);
  } else {
    recordFailure(message);
  }
}

function requireHttpsEnv(name) {
  const value = process.env[name] ?? "";
  assert(/^https:\/\/.+/u.test(value), `${name} is set to an HTTPS URL`);
}

function checkConfig() {
  const appConfig = readJson("app.json").expo;
  const easConfig = readJson("eas.json");

  assert(appConfig.name === "기름값 계산기", "Expo display name is store-ready");
  assert(appConfig.version === "1.0.0", "Expo version is set");
  assert(appConfig.ios?.bundleIdentifier === "com.jyb1126.fccalc", "iOS bundle identifier is production");
  assert(appConfig.ios?.buildNumber === "1", "iOS buildNumber is set");
  assert(appConfig.ios?.infoPlist?.ITSAppUsesNonExemptEncryption === false, "iOS export compliance flag is set");
  assert(appConfig.android?.package === "com.jyb1126.fuelcostcalculator", "Android package identifier is production");
  assert(Number.isInteger(appConfig.android?.versionCode), "Android versionCode is set");
  assert(appConfig.owner === "jyb1126", "EAS owner is set");
  assert(Boolean(appConfig.extra?.eas?.projectId), "EAS projectId is set");
  assert(easConfig.build?.production?.ios?.resourceClass === "m-medium", "EAS production iOS profile is configured");
  assert(easConfig.build?.production?.android?.buildType === "app-bundle", "EAS production Android profile builds an AAB");
}

function checkDocs() {
  [
    "docs/privacy.html",
    "docs/support.html",
    "docs/release-state.md",
    "docs/store-metadata-ko.md",
    "docs/store-submission-runbook.md",
    "docs/security-gate.md"
  ].forEach((path) => {
    assert(existsSync(path), `${path} exists`);
  });
}

function checkExpoPublicConfig() {
  const result = run("expo public config", "npx", ["expo", "config", "--type", "public", "--json"], { capture: true });
  if (result.status !== 0) {
    return;
  }

  try {
    const config = JSON.parse(result.stdout);
    assert(config.ios?.bundleIdentifier === "com.jyb1126.fccalc", "Expo public config has production iOS ID");
    assert(config.android?.package === "com.jyb1126.fuelcostcalculator", "Expo public config has production Android ID");
  } catch {
    recordFailure("expo public config JSON is parseable");
  }
}

function checkAudit() {
  const result = runAudit();
  if (!result.stdout) {
    recordFailure("npm audit returned JSON output");
    return;
  }

  try {
    const audit = JSON.parse(result.stdout);
    const vulnerabilities = audit.metadata?.vulnerabilities ?? {};
    const critical = vulnerabilities.critical ?? 0;
    const high = vulnerabilities.high ?? 0;
    const moderate = vulnerabilities.moderate ?? 0;
    const low = vulnerabilities.low ?? 0;

    assert(critical === 0, "npm audit has no critical vulnerabilities");
    assert(high === 0, "npm audit has no high vulnerabilities");
    if (moderate > 0 || low > 0) {
      recordWarning(`npm audit reports ${moderate} moderate and ${low} low vulnerabilities`);
    } else {
      recordPass("npm audit has no moderate or low vulnerabilities");
    }
  } catch {
    recordFailure("npm audit JSON is parseable");
  }
}

function checkAssets() {
  const assets = [
    "assets/icon.png",
    "assets/splash-icon.png",
    "assets/android-icon-foreground.png",
    "assets/android-icon-background.png",
    "assets/android-icon-monochrome.png",
    "assets/favicon.png"
  ];

  assets.forEach((path) => {
    assert(existsSync(path), `${path} exists`);
  });
}

function collectFiles(root) {
  const ignoredDirs = new Set([".git", ".expo", "node_modules", "dist", "web-build", "ios", "android", "qa"]);
  const ignoredFiles = new Set(["package-lock.json"]);
  const ignoredExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".ico"]);
  const files = [];

  function walk(current) {
    for (const entry of readdirSync(current)) {
      if (ignoredDirs.has(entry)) {
        continue;
      }

      const fullPath = join(current, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (ignoredFiles.has(entry) || ignoredExtensions.has(extname(entry).toLowerCase())) {
        continue;
      }

      files.push(fullPath);
    }
  }

  walk(root);
  return files;
}

function checkSecrets() {
  const patterns = [
    /AKIA[0-9A-Z]{16}/u,
    /-----BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY-----/u,
    /\bgh[pousr]_[A-Za-z0-9_]{30,}\b/u,
    /\bexpo_[A-Za-z0-9_-]{20,}\b/u,
    /\bsk-[A-Za-z0-9]{20,}\b/u
  ];
  const matches = [];

  for (const path of collectFiles(".")) {
    const contents = readFileSync(path, "utf8");
    if (patterns.some((pattern) => pattern.test(contents))) {
      matches.push(path);
    }
  }

  assert(matches.length === 0, `secret scan found no hardcoded tokens${matches.length ? `: ${matches.join(", ")}` : ""}`);
}

function checkExternalGates() {
  if (localOnly) {
    recordWarning("external store gates skipped by --local-only");
    return;
  }

  requireHttpsEnv("STORE_PRIVACY_POLICY_URL");
  requireHttpsEnv("STORE_SUPPORT_URL");
  assert(/^\d+$/u.test(process.env.ASC_APP_ID ?? ""), "ASC_APP_ID is set after App Store Connect app creation");

  if (!iosOnly) {
    assert(process.env.GOOGLE_PLAY_APP_CREATED === "1", "Google Play app record is created");
  }
}

checkConfig();
checkDocs();
checkAssets();
run("unit tests", "npm", ["test"]);
run("typecheck", "npm", ["run", "typecheck"]);
run("expo dependency check", "npx", ["expo", "install", "--check"]);
checkExpoPublicConfig();
checkAudit();
checkSecrets();
checkExternalGates();

console.log(`\nRelease harness completed with ${failures.length} failure(s), ${warnings.length} warning(s).`);

if (failures.length > 0) {
  process.exit(1);
}
