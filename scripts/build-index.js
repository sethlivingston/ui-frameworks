#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const researchDir = path.join(__dirname, '../research');
const indexFile = path.join(researchDir, 'frameworks.json');
const schemaFile = path.join(__dirname, '../schema/framework-review.schema.json');

// Load schema
const schema = JSON.parse(fs.readFileSync(schemaFile, 'utf-8'));

// Simple schema validator
function validateFrontmatter(frontmatter, filename) {
  const errors = [];
  const warnings = [];

  // Check required fields
  schema.required.forEach(field => {
    if (!(field in frontmatter)) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // Check field types
  Object.entries(schema.properties).forEach(([field, fieldSchema]) => {
    if (!(field in frontmatter)) return;

    const value = frontmatter[field];

    // Skip null values (allowed for optional fields)
    if (value === null) return;

    // Type checking
    const expectedType = Array.isArray(fieldSchema.type)
      ? fieldSchema.type.filter(t => t !== 'null')
      : [fieldSchema.type];

    const actualType = Array.isArray(value) ? 'array' : typeof value;

    if (
      expectedType.length > 0 &&
      !expectedType.includes(actualType) &&
      actualType !== 'object'
    ) {
      warnings.push(`${field}: expected ${expectedType.join(' or ')}, got ${actualType}`);
    }

    // Enum checking
    if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
      warnings.push(`${field}: "${value}" not in allowed values: ${fieldSchema.enum.join(', ')}`);
    }

    // Number range checking
    if (fieldSchema.minimum !== undefined && value < fieldSchema.minimum) {
      warnings.push(`${field}: ${value} is below minimum ${fieldSchema.minimum}`);
    }
    if (fieldSchema.maximum !== undefined && value > fieldSchema.maximum) {
      warnings.push(`${field}: ${value} is above maximum ${fieldSchema.maximum}`);
    }
  });

  return { errors, warnings };
}


// Get all markdown files
const files = fs.readdirSync(researchDir)
  .filter(f => f.endsWith('.md'))
  .sort();

const frameworks = [];
const validationResults = {};

files.forEach(file => {
  const filePath = path.join(researchDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');

  // Extract frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    console.warn(`⚠️  ${file}: No frontmatter found`);
    return;
  }

  try {
    const frontmatter = yaml.load(frontmatterMatch[1]);

    // Validate frontmatter
    const validation = validateFrontmatter(frontmatter, file);
    validationResults[file] = validation;

    if (validation.errors.length > 0) {
      console.error(`❌ ${file}`);
      validation.errors.forEach(e => console.error(`   ERROR: ${e}`));
    }

    if (validation.warnings.length > 0) {
      console.warn(`⚠️  ${file}`);
      validation.warnings.forEach(w => console.warn(`   WARNING: ${w}`));
    }

    if (validation.errors.length === 0 && validation.warnings.length === 0) {
      console.log(`✅ ${file}`);
    }

    // Build index entry with all relevant fields
    const entry = {
      file: file.replace('.md', ''),
      name: frontmatter.name || frontmatter.framework,
      version: frontmatter.version || null,
      category: frontmatter.category || null,

      // Links
      github_url: frontmatter.github_url || null,
      docs_url: frontmatter.docs_url || null,
      npm_package: frontmatter.npm_package || null,

      // Technical
      implementation_language: frontmatter.implementation_language || null,
      typescript_support: frontmatter.typescript_support || null,
      license: frontmatter.license || null,
      runtime: frontmatter.runtime || null,

      // Capabilities
      capabilities: frontmatter.capabilities || {
        state_management: false,
        rendering: false,
        event_handling: false
      },

      // Classification
      paradigm: frontmatter.paradigm || null,
      state_model: frontmatter.state_model || null,
      rendering_strategy: frontmatter.rendering_strategy || null,

      // Maintenance
      maintainer: frontmatter.maintainer || null,
      first_released: frontmatter.first_released || null,
      status: frontmatter.status || null,

      // Scores — raw 9-dimension rubric values, passed through as the single
      // source of truth for any weighted view AGENTIC-DEV-RANKINGS.md computes
      type_system_score: frontmatter.type_system_score ?? null,
      compiler_feedback_score: frontmatter.compiler_feedback_score ?? null,
      locality_score: frontmatter.locality_score ?? null,
      explicitness_score: frontmatter.explicitness_score ?? null,
      convention_strength_score: frontmatter.convention_strength_score ?? null,
      token_efficiency_score: frontmatter.token_efficiency_score ?? null,
      familiarity_score: frontmatter.familiarity_score ?? null,
      stability_score: frontmatter.stability_score ?? null,
      tooling_score: frontmatter.tooling_score ?? null,

      // On the Horizon
      next_release: frontmatter.next_release || null,
      ai_tooling: frontmatter.ai_tooling || null,

      // Metadata
      reviewed_date: frontmatter.reviewed_date || null,
      reviewed_by_model: frontmatter.reviewed_by_model || null
    };

    frameworks.push(entry);
  } catch (error) {
    console.error(`❌ ${file}: ${error.message}`);
  }
});

// Write index
fs.writeFileSync(indexFile, JSON.stringify(frameworks, null, 2), 'utf-8');

// Validation summary
const filesWithErrors = Object.values(validationResults).filter(r => r.errors.length > 0).length;
const filesWithWarnings = Object.values(validationResults).filter(r => r.warnings.length > 0).length;

console.log(`\n✨ Index created: ${indexFile}`);
console.log(`📊 Total frameworks: ${frameworks.length}`);
console.log(`\n📋 Validation Report:`);
console.log(`   ✅ Valid: ${frameworks.length - filesWithErrors}`);
if (filesWithErrors > 0) {
  console.log(`   ❌ Errors: ${filesWithErrors}`);
}
if (filesWithWarnings > 0) {
  console.log(`   ⚠️  Warnings: ${filesWithWarnings}`);
}

// Print summary statistics
const stats = {
  total: frameworks.length,
  by_paradigm: {},
  by_state_model: {},
  by_rendering_strategy: {}
};

frameworks.forEach(f => {
  // Count paradigms
  if (f.paradigm) {
    stats.by_paradigm[f.paradigm] = (stats.by_paradigm[f.paradigm] || 0) + 1;
  }

  // Count state models
  if (f.state_model) {
    stats.by_state_model[f.state_model] = (stats.by_state_model[f.state_model] || 0) + 1;
  }

  // Count rendering strategies
  if (f.rendering_strategy) {
    stats.by_rendering_strategy[f.rendering_strategy] = (stats.by_rendering_strategy[f.rendering_strategy] || 0) + 1;
  }
});

console.log('\n📈 Index Statistics:');
console.log(JSON.stringify(stats, null, 2));
