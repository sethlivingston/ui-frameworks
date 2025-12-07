#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const researchDir = path.join(__dirname, '../research');
const indexFile = path.join(researchDir, 'frameworks.json');

// Load the index
const indexData = JSON.parse(fs.readFileSync(indexFile, 'utf-8'));

// Create a map of file -> index entry
const indexMap = {};
indexData.forEach(entry => {
  indexMap[entry.file] = entry;
});

// Get all markdown files
const files = fs.readdirSync(researchDir)
  .filter(f => f.endsWith('.md'))
  .sort();

files.forEach(file => {
  const filePath = path.join(researchDir, file);
  const fileKey = file.replace('.md', '');
  const indexEntry = indexMap[fileKey];

  if (!indexEntry) {
    console.warn(`⚠️  ${file}: Not found in index`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');

  // Extract frontmatter and body
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!frontmatterMatch) {
    console.warn(`⚠️  ${file}: No frontmatter found`);
    return;
  }

  const body = frontmatterMatch[2];

  // Build frontmatter from index entry, preserving order
  const frontmatter = {};

  // REQUIRED FIELDS (always include, even if null)
  frontmatter.name = indexEntry.name;
  frontmatter.category = indexEntry.category;
  frontmatter.github_url = indexEntry.github_url;
  frontmatter.docs_url = indexEntry.docs_url;
  frontmatter.implementation_language = indexEntry.implementation_language;
  frontmatter.status = indexEntry.status;
  frontmatter.ai_friendliness_score = indexEntry.ai_friendliness_score;
  frontmatter.reusability_score = indexEntry.reusability_score;
  frontmatter.maintainability_score = indexEntry.maintainability_score;

  // OPTIONAL FIELDS (only include if not null)
  if (indexEntry.version) frontmatter.version = indexEntry.version;
  if (indexEntry.type) frontmatter.type = indexEntry.type;

  if (indexEntry.npm_package) frontmatter.npm_package = indexEntry.npm_package;
  if (indexEntry.mcp_server) frontmatter.mcp_server = indexEntry.mcp_server;

  if (indexEntry.typescript_support) {
    frontmatter.typescript_support = indexEntry.typescript_support;
  }
  if (indexEntry.license) frontmatter.license = indexEntry.license;
  if (indexEntry.runtime) frontmatter.runtime = indexEntry.runtime;

  if (indexEntry.capabilities) {
    frontmatter.capabilities = indexEntry.capabilities;
  }

  if (indexEntry.paradigm) frontmatter.paradigm = indexEntry.paradigm;
  if (indexEntry.state_model) frontmatter.state_model = indexEntry.state_model;
  if (indexEntry.rendering_strategy) {
    frontmatter.rendering_strategy = indexEntry.rendering_strategy;
  }

  if (indexEntry.maintainer) frontmatter.maintainer = indexEntry.maintainer;
  if (indexEntry.first_released) frontmatter.first_released = indexEntry.first_released;

  if (indexEntry.reviewed_date) {
    frontmatter.reviewed_date = indexEntry.reviewed_date;
  }
  if (indexEntry.reviewed_by_model) {
    frontmatter.reviewed_by_model = indexEntry.reviewed_by_model;
  }

  // Convert to YAML
  const newFrontmatterText = yaml.dump(frontmatter, {
    lineWidth: 500,
    quotingType: '"',
    forceQuotes: true
  });

  const updatedContent = `---\n${newFrontmatterText}---\n${body}`;
  fs.writeFileSync(filePath, updatedContent, 'utf-8');

  console.log(`✅ ${file}: Synced with index`);
});

console.log('\n✨ Done! All markdown frontmatter synced with index.');
