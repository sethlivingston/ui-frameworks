#!/usr/bin/env node

import fs from 'fs';

const data = JSON.parse(fs.readFileSync('./research/frameworks.json', 'utf-8'));

// Separate UI frameworks from state libraries
const uiFrameworks = data.filter(f =>
  ['full-framework', 'meta-framework', 'server-framework', 'web-components-library', 'reactive-primitive'].includes(f.category)
);

const stateLibraries = data.filter(f =>
  f.category === 'state-library' || (f.capabilities?.state_management === true && f.category !== 'full-framework')
);

console.log('=== BEST COMPLETE SOLUTIONS (UI + STATE) ===\n');

// For each metric, find best combinations
const metrics = [
  { key: 'ai_friendliness_score', label: 'AI-Friendliness' },
  { key: 'reusability_score', label: 'Reusability' },
  { key: 'maintainability_score', label: 'Maintainability' }
];

metrics.forEach(metric => {
  console.log(`\n📊 TOP 3 BY ${metric.label.toUpperCase()}\n`);

  // Get top UI frameworks
  const topUI = uiFrameworks
    .filter(f => f[metric.key] !== null && f[metric.key] !== undefined)
    .sort((a, b) => (b[metric.key] || 0) - (a[metric.key] || 0))
    .slice(0, 5);

  // Get top state libraries
  const topState = stateLibraries
    .filter(f => f[metric.key] !== null && f[metric.key] !== undefined)
    .sort((a, b) => (b[metric.key] || 0) - (a[metric.key] || 0))
    .slice(0, 5);

  // Get top standalone complete frameworks (have both rendering and state management)
  const topComplete = data
    .filter(f => f.capabilities?.state_management === true && f.capabilities?.rendering === true)
    .filter(f => f[metric.key] !== null && f[metric.key] !== undefined)
    .sort((a, b) => (b[metric.key] || 0) - (a[metric.key] || 0))
    .slice(0, 3);

  // Generate combinations
  const combinations = [];

  // Option 1: Best UI + Best State combos
  for (let i = 0; i < Math.min(2, topUI.length); i++) {
    for (let j = 0; j < Math.min(2, topState.length); j++) {
      const ui = topUI[i];
      const state = topState[j];
      const score = ((ui[metric.key] || 0) + (state[metric.key] || 0)) / 2;
      combinations.push({
        type: 'UI + State Library',
        name: `${ui.name} + ${state.name}`,
        score,
        ui,
        state,
        combined: true
      });
    }
  }

  // Option 2: Standalone frameworks with state management
  topComplete.forEach(f => {
    combinations.push({
      type: 'Complete Framework',
      name: f.name,
      score: f[metric.key] || 0,
      ui: f,
      state: null,
      combined: false
    });
  });

  // Sort by score
  combinations.sort((a, b) => b.score - a.score);

  // Show top 3
  combinations.slice(0, 3).forEach((combo, idx) => {
    console.log(`${idx + 1}. ${combo.type}: ${combo.name}`);
    if (combo.combined) {
      console.log(`   ├─ UI: ${combo.ui.name} (${metric.key}: ${combo.ui[metric.key]}/10)`);
      console.log(`   ├─ State: ${combo.state.name} (${metric.key}: ${combo.state[metric.key]}/10)`);
      console.log(`   └─ Average Score: ${combo.score.toFixed(2)}/10`);
    } else {
      console.log(`   ├─ Framework: ${combo.ui.category}`);
      console.log(`   └─ Score: ${combo.score}/10`);
    }
    console.log();
  });
});

// Show individual top scores for reference
console.log('\n=== INDIVIDUAL SCORES (for reference) ===\n');

metrics.forEach(metric => {
  console.log(`Top 5 by ${metric.label}:`);
  const top = data
    .filter(f => f[metric.key] !== null && f[metric.key] !== undefined)
    .sort((a, b) => (b[metric.key] || 0) - (a[metric.key] || 0))
    .slice(0, 5);

  top.forEach((f, idx) => {
    console.log(`  ${idx + 1}. ${f.name} (${f[metric.key]}/10) - ${f.category}`);
  });
  console.log();
});
