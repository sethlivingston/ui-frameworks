#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const researchDir = path.join(__dirname, '../research');

// Get all markdown files
const files = fs.readdirSync(researchDir).filter(f => f.endsWith('.md'));

files.forEach(file => {
  const filePath = path.join(researchDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Split into frontmatter and body
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!frontmatterMatch) {
    console.log(`⚠️  ${file}: No frontmatter found`);
    return;
  }

  const frontmatterText = frontmatterMatch[1];
  const body = frontmatterMatch[2];

  // Extract reusability score (Component or State Reusability Assessment)
  const reusabilityMatch = body.match(
    /^### (?:Component|State) Reusability Assessment\s*\n+\*\*Quality:.*?\((\d+(?:\.\d+)?)\/10\)\*\*/m
  );
  const reusabilityScore = reusabilityMatch ? parseFloat(reusabilityMatch[1]) : null;

  // Extract maintainability score
  const maintainabilityMatch = body.match(
    /^## Maintainability\s*\n+\*\*Quality:.*?\((\d+(?:\.\d+)?)\/10\)\*\*/m
  );
  const maintainabilityScore = maintainabilityMatch ? parseFloat(maintainabilityMatch[1]) : null;

  if (!reusabilityScore || !maintainabilityScore) {
    console.log(`⚠️  ${file}: Missing scores - reusability: ${reusabilityScore}, maintainability: ${maintainabilityScore}`);
    return;
  }

  // Update frontmatter
  let updatedFrontmatter = frontmatterText;

  // Remove existing scores if present
  updatedFrontmatter = updatedFrontmatter.replace(/^reusability_score:.*$/m, '');
  updatedFrontmatter = updatedFrontmatter.replace(/^maintainability_score:.*$/m, '');

  // Add new scores at the end before the closing ---
  updatedFrontmatter = updatedFrontmatter.replace(/\n$/, '');
  updatedFrontmatter += `\nreusability_score: ${reusabilityScore}\nmaintainability_score: ${maintainabilityScore}\n`;

  // Reconstruct file
  const updatedContent = `---\n${updatedFrontmatter}---\n${body}`;
  fs.writeFileSync(filePath, updatedContent, 'utf-8');

  console.log(`✅ ${file}: reusability=${reusabilityScore}, maintainability=${maintainabilityScore}`);
});

console.log('\n✨ Done! All scores extracted and added to frontmatter.');
