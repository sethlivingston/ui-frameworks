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

      // Scores
      ai_friendliness_score: frontmatter.ai_friendliness_score || null,
      reusability_score: frontmatter.reusability_score || null,
      maintainability_score: frontmatter.maintainability_score || null,

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
  by_rendering_strategy: {},
  score_ranges: {
    ai_friendliness: { min: 10, max: 0, avg: 0 },
    reusability: { min: 10, max: 0, avg: 0 },
    maintainability: { min: 10, max: 0, avg: 0 }
  }
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

  // Score statistics
  if (f.ai_friendliness_score) {
    stats.score_ranges.ai_friendliness.min = Math.min(stats.score_ranges.ai_friendliness.min, f.ai_friendliness_score);
    stats.score_ranges.ai_friendliness.max = Math.max(stats.score_ranges.ai_friendliness.max, f.ai_friendliness_score);
    stats.score_ranges.ai_friendliness.avg += f.ai_friendliness_score;
  }

  if (f.reusability_score) {
    stats.score_ranges.reusability.min = Math.min(stats.score_ranges.reusability.min, f.reusability_score);
    stats.score_ranges.reusability.max = Math.max(stats.score_ranges.reusability.max, f.reusability_score);
    stats.score_ranges.reusability.avg += f.reusability_score;
  }

  if (f.maintainability_score) {
    stats.score_ranges.maintainability.min = Math.min(stats.score_ranges.maintainability.min, f.maintainability_score);
    stats.score_ranges.maintainability.max = Math.max(stats.score_ranges.maintainability.max, f.maintainability_score);
    stats.score_ranges.maintainability.avg += f.maintainability_score;
  }
});

// Average scores
const scored_frameworks = frameworks.filter(f => f.ai_friendliness_score);
stats.score_ranges.ai_friendliness.avg = scored_frameworks.length > 0
  ? (stats.score_ranges.ai_friendliness.avg / scored_frameworks.length).toFixed(2)
  : 'N/A';

const reusable_frameworks = frameworks.filter(f => f.reusability_score);
stats.score_ranges.reusability.avg = reusable_frameworks.length > 0
  ? (stats.score_ranges.reusability.avg / reusable_frameworks.length).toFixed(2)
  : 'N/A';

const maintainable_frameworks = frameworks.filter(f => f.maintainability_score);
stats.score_ranges.maintainability.avg = maintainable_frameworks.length > 0
  ? (stats.score_ranges.maintainability.avg / maintainable_frameworks.length).toFixed(2)
  : 'N/A';

console.log('\n📈 Index Statistics:');
console.log(JSON.stringify(stats, null, 2));
