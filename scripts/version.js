#!/usr/bin/env node

const { execSync } = require('child_process');
const { readFileSync, writeFileSync } = require('fs');

const versionType = process.argv[2];

if (!versionType) {
  console.error('❌ Usage: node version.js <patch|minor|major|alpha|beta|rc>');
  process.exit(1);
}

const validTypes = ['patch', 'minor', 'major', 'alpha', 'beta', 'rc'];
if (!validTypes.includes(versionType)) {
  console.error(`❌ Invalid version type. Must be one of: ${validTypes.join(', ')}`);
  process.exit(1);
}

// Build npm version command
let npmCommand = 'npm version';
if (['alpha', 'beta', 'rc'].includes(versionType)) {
  npmCommand += ` prerelease --preid=${versionType}`;
} else {
  npmCommand += ` ${versionType}`;
}

console.log(`🔄 Updating version with: ${npmCommand}`);

// Update package.json version
execSync(npmCommand, { stdio: 'inherit' });

// Read updated package.json to get new version
const updatedPackageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const newVersion = updatedPackageJson.version;

// Update jsr.json with the same version
const jsrJson = JSON.parse(readFileSync('jsr.json', 'utf8'));
jsrJson.version = newVersion;
writeFileSync('jsr.json', JSON.stringify(jsrJson, null, 2) + '\n');

// Add jsr.json to git and amend the commit to include it
execSync('git add jsr.json', { stdio: 'inherit' });
execSync('git commit --amend --no-edit', { stdio: 'inherit' });

console.log(`✅ Version updated to ${newVersion} in both package.json and jsr.json`);
