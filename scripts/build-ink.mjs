#!/usr/bin/env node
/**
 * @file build-ink.mjs
 * @description Compiles .ink source files to .json and copies to build/client for static serving.
 * Run: bun run build:ink
 *
 * Requires inklecate to be installed:
 * - macOS: brew install inklecate
 * - npm: npx inklecate (if using wrapper package)
 * - Or download from: https://github.com/inkle/ink/releases
 *
 * Output:
 * - stories/dist/*.json (source of truth)
 * - build/client/stories/*.json (for production static serving via ASSETS)
 */

import { execSync } from "node:child_process";
import { readdirSync, mkdirSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT, "stories/src");
const DIST_DIR = path.join(ROOT, "stories/dist");
const ASSETS_DIR = path.join(ROOT, "build/client/stories");

// Ensure directories exist
mkdirSync(DIST_DIR, { recursive: true });
mkdirSync(ASSETS_DIR, { recursive: true });

// Check if inklecate is available
function checkInklecate() {
  try {
    execSync("inklecate -h", { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

if (!checkInklecate()) {
  console.error("❌ inklecate not found. Please install it:");
  console.error("   macOS: brew install inklecate");
  console.error("   npm (wrapper): npx inklecate");
  console.error("   Or download from: https://github.com/inkle/ink/releases");
  process.exit(1);
}

// Find all .ink files
if (!existsSync(SRC_DIR)) {
  console.log("📁 Creating stories/src/ directory...");
  mkdirSync(SRC_DIR, { recursive: true });
}

const inkFiles = readdirSync(SRC_DIR).filter((f) => f.endsWith(".ink"));

if (inkFiles.length === 0) {
  console.log("⚠️  No .ink files found in stories/src/");
  console.log("   Add your Ink story files there and run again.");
  process.exit(0);
}

const manifest = {};

console.log("🔨 Compiling Ink stories...\n");

for (const file of inkFiles) {
  const base = file.replace(/\.ink$/, "");
  const inPath = path.join(SRC_DIR, file);
  const distPath = path.join(DIST_DIR, `${base}.json`);
  const assetsPath = path.join(ASSETS_DIR, `${base}.json`);

  console.log(`📝 ${file}`);

  try {
    // Compile .ink -> .json
    execSync(`inklecate "${inPath}" -o "${distPath}"`, { stdio: "inherit" });
    console.log(`   ✅ Compiled → stories/dist/${base}.json`);

    // Copy to assets for static serving
    copyFileSync(distPath, assetsPath);
    console.log(`   📦 Copied → build/client/stories/${base}.json`);

    // Add to manifest with the static URL path
    manifest[base] = {
      path: `/stories/${base}.json`,
      compiledAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`   ❌ Failed to compile ${file}`);
    process.exit(1);
  }
}

// Write manifest to both locations
const distManifest = path.join(DIST_DIR, "manifest.json");
const assetsManifest = path.join(ASSETS_DIR, "manifest.json");
const manifestContent = JSON.stringify(manifest, null, 2);

writeFileSync(distManifest, manifestContent);
writeFileSync(assetsManifest, manifestContent);

console.log("");
console.log("✅ Ink build complete!");
console.log(`   Stories: ${Object.keys(manifest).join(", ")}`);
console.log(`   Static path: /stories/<scenarioKey>.json`);
console.log("");
console.log("📌 Next: Run 'bun run dev' and test the Ink API");
