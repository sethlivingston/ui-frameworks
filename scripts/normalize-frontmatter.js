#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const researchDir = path.join(__dirname, '../research');

// Get all markdown files
const files = fs.readdirSync(researchDir).filter(f => f.endsWith('.md')).sort();

// Mapping for category enum normalization
const categoryMap = {
  'Library': 'utility-library',
  'Full Framework': 'full-framework',
  'Full-Framework': 'full-framework',
  'Meta-Framework': 'meta-framework',
  'Meta Framework': 'meta-framework',
  'State Management Library': 'state-library',
  'State-Management': 'state-library',
  'Web Components Library': 'web-components-library',
  'Web-Components Library': 'web-components-library',
  'Web Components Compiler': 'web-components-compiler',
  'Compiler': 'web-components-compiler',
  'Server Framework': 'server-framework',
  'Server-side Framework': 'server-framework',
  'Framework': 'full-framework',
  'Resumable Framework': 'reactive-primitive',
  'Progressive Enhancement Framework': 'reactive-primitive',
  'Language': 'language',
  'Async State Library': 'utility-library',
  'Utility Library': 'utility-library',
  'Reactive Primitive': 'reactive-primitive',
  'no-framework': 'no-framework',
  'State Management Library': 'state-library'
};

// Implementation language mappings
const languageMap = {
  'Haskell': 'Haskell (not in standard enum, needs decision)',
};

files.forEach(file => {
  const filePath = path.join(researchDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Split into frontmatter and body
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!frontmatterMatch) {
    console.log(`⏭️  ${file}: No frontmatter found`);
    return;
  }

  const frontmatterText = frontmatterMatch[1];
  const body = frontmatterMatch[2];

  let frontmatter = yaml.load(frontmatterText);
  let changed = false;

  // 1. Rename 'framework' to 'name' if needed
  if ('framework' in frontmatter && !('name' in frontmatter)) {
    frontmatter.name = frontmatter.framework;
    delete frontmatter.framework;
    changed = true;
  }

  // 2. Fix category enum
  if (frontmatter.category && categoryMap[frontmatter.category]) {
    const oldCategory = frontmatter.category;
    frontmatter.category = categoryMap[oldCategory];
    changed = true;
  }

  // 3. Add status if missing
  if (!frontmatter.status) {
    frontmatter.status = 'active';
    changed = true;
  }

  // 4. Ensure required fields exist (with null if not present)
  const requiredFields = [
    'name',
    'category',
    'github_url',
    'docs_url',
    'implementation_language',
    'status',
    'type_system_score',
    'compiler_feedback_score',
    'locality_score',
    'explicitness_score',
    'convention_strength_score',
    'token_efficiency_score',
    'familiarity_score',
    'stability_score',
    'tooling_score'
  ];

  requiredFields.forEach(field => {
    if (!(field in frontmatter)) {
      frontmatter[field] = null;
      changed = true;
    }
  });

  if (!changed) {
    console.log(`✅ ${file}: Already valid`);
    return;
  }

  // Reconstruct frontmatter in consistent order
  const orderedFrontmatter = {};

  // Core identity fields
  ['name', 'version', 'category', 'type'].forEach(field => {
    if (field in frontmatter) orderedFrontmatter[field] = frontmatter[field];
  });

  // Links & Resources
  const linkFields = ['github_url', 'docs_url', 'npm_package', 'ai_tooling'];
  if (linkFields.some(f => f in frontmatter)) {
    linkFields.forEach(field => {
      if (field in frontmatter) orderedFrontmatter[field] = frontmatter[field];
    });
  }

  // Technical metadata
  const techFields = ['implementation_language', 'typescript_support', 'license', 'runtime'];
  if (techFields.some(f => f in frontmatter)) {
    techFields.forEach(field => {
      if (field in frontmatter) orderedFrontmatter[field] = frontmatter[field];
    });
  }

  // Capabilities
  if ('capabilities' in frontmatter) {
    orderedFrontmatter.capabilities = frontmatter.capabilities;
  }

  // Classification
  const classifyFields = ['paradigm', 'state_model', 'rendering_strategy'];
  if (classifyFields.some(f => f in frontmatter)) {
    classifyFields.forEach(field => {
      if (field in frontmatter) orderedFrontmatter[field] = frontmatter[field];
    });
  }

  // Maintenance
  const maintainFields = ['maintainer', 'first_released', 'status'];
  if (maintainFields.some(f => f in frontmatter)) {
    maintainFields.forEach(field => {
      if (field in frontmatter) orderedFrontmatter[field] = frontmatter[field];
    });
  }

  // Scores
  [
    'type_system_score',
    'compiler_feedback_score',
    'locality_score',
    'explicitness_score',
    'convention_strength_score',
    'token_efficiency_score',
    'familiarity_score',
    'stability_score',
    'tooling_score'
  ].forEach(field => {
    if (field in frontmatter) orderedFrontmatter[field] = frontmatter[field];
  });

  // On the Horizon
  ['next_release', 'components', 'supersedes', 'superseded_by'].forEach(field => {
    if (field in frontmatter) orderedFrontmatter[field] = frontmatter[field];
  });

  // Review metadata
  const reviewFields = ['reviewed_date', 'reviewed_by_model', 'reviewer_notes'];
  if (reviewFields.some(f => f in frontmatter)) {
    reviewFields.forEach(field => {
      if (field in frontmatter) orderedFrontmatter[field] = frontmatter[field];
    });
  }

  // Any remaining fields
  Object.keys(frontmatter).forEach(field => {
    if (!(field in orderedFrontmatter)) {
      orderedFrontmatter[field] = frontmatter[field];
    }
  });

  // Convert back to YAML
  const newFrontmatterText = yaml.dump(orderedFrontmatter, {
    lineWidth: 500,
    quotingType: '"',
    forceQuotes: true
  });

  const updatedContent = `---\n${newFrontmatterText}---\n${body}`;
  fs.writeFileSync(filePath, updatedContent, 'utf-8');

  console.log(`📝 ${file}: Normalized`);
});

console.log('\n✨ Done! All frontmatter normalized.');
