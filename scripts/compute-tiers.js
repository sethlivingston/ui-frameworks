#!/usr/bin/env node

// Computes ranking tiers for AGENTIC-DEV-RANKINGS.md.
//
// Method (documented in that doc's Methodology > Tiers):
//   1. Weighted total per framework = Σ(weight × dimension score), using the
//      same published weights as the ranking tables.
//   2. Jenks natural breaks (Fisher's optimal 1-D partitioning) over the
//      weighted totals, solved exactly by dynamic programming.
//   3. Tier count k = smallest k whose goodness-of-variance-fit (GVF)
//      reaches GVF_TARGET.
//   4. Boundaries on gaps below NOISE_FLOOR are flagged "soft" — rubric
//      scores move in 0.5 steps, so totals carry ~±0.1–0.2 of fuzz.
//
// Lists with fewer than MIN_TIER_N entries are not tiered.

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const researchDir = path.join(__dirname, '../research');

const GVF_TARGET = 0.95;
const NOISE_FLOOR = 0.25;
const MIN_TIER_N = 10;

const WEIGHTS = {
  type_system_score: 0.15,
  compiler_feedback_score: 0.15,
  locality_score: 0.13,
  explicitness_score: 0.13,
  convention_strength_score: 0.11,
  token_efficiency_score: 0.10,
  familiarity_score: 0.11,
  stability_score: 0.07,
  tooling_score: 0.05,
};

function loadEntries() {
  const entries = [];
  for (const file of fs.readdirSync(researchDir)) {
    if (!file.endsWith('.md')) continue;
    const raw = fs.readFileSync(path.join(researchDir, file), 'utf-8');
    const match = raw.match(/^---\n([\s\S]*?)\n---/);
    if (!match) continue;
    const fm = yaml.load(match[1]);
    const scores = Object.keys(WEIGHTS).map(k => fm[k]);
    if (scores.some(s => typeof s !== 'number')) {
      console.warn(`skipping ${file}: missing or null rubric scores`);
      continue;
    }
    const weighted = Object.entries(WEIGHTS)
      .reduce((sum, [k, w]) => sum + w * fm[k], 0);
    entries.push({ name: fm.name, category: fm.category, weighted });
  }
  return entries;
}

function ssd(xs) {
  const m = xs.reduce((a, b) => a + b, 0) / xs.length;
  return xs.reduce((a, b) => a + (b - m) ** 2, 0);
}

// Exact optimal partition of sorted xs into k contiguous groups.
function jenks(xs, k) {
  const n = xs.length;
  const cost = Array.from({ length: n + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j <= n; j++) cost[i][j] = ssd(xs.slice(i, j));
  }
  const dp = Array.from({ length: k + 1 }, () => new Array(n + 1).fill(Infinity));
  const back = Array.from({ length: k + 1 }, () => new Array(n + 1).fill(0));
  dp[0][0] = 0;
  for (let g = 1; g <= k; g++) {
    for (let j = 1; j <= n; j++) {
      for (let i = g - 1; i < j; i++) {
        const c = dp[g - 1][i] + cost[i][j];
        if (c < dp[g][j]) { dp[g][j] = c; back[g][j] = i; }
      }
    }
  }
  const bounds = [];
  for (let g = k, j = n; g > 0; g--) {
    const i = back[g][j];
    bounds.unshift([i, j]);
    j = i;
  }
  return { withinSSD: dp[k][n], bounds };
}

function tierList(label, entries) {
  console.log(`\n=== ${label} (${entries.length} entries) ===`);
  entries.sort((a, b) => b.weighted - a.weighted);

  if (entries.length < MIN_TIER_N) {
    console.log(`fewer than ${MIN_TIER_N} entries — not tiered. Totals:`);
    for (const e of entries) console.log(`  ${e.weighted.toFixed(2)}  ${e.name}`);
    return;
  }

  const xs = entries.map(e => e.weighted);
  const total = ssd(xs);
  const maxK = Math.min(8, entries.length - 1);

  console.log('\n k   GVF');
  let chosen = null;
  const results = {};
  for (let k = 2; k <= maxK; k++) {
    const r = jenks(xs, k);
    const gvf = 1 - r.withinSSD / total;
    results[k] = { ...r, gvf };
    console.log(`  ${k}  ${gvf.toFixed(3)}${!chosen && gvf >= GVF_TARGET ? '  <- chosen (first k with GVF >= ' + GVF_TARGET + ')' : ''}`);
    if (!chosen && gvf >= GVF_TARGET) chosen = k;
  }
  if (!chosen) chosen = maxK;

  console.log(`\nTiers (k=${chosen}):`);
  const { bounds } = results[chosen];
  bounds.forEach(([i, j], t) => {
    if (t > 0) {
      const gap = xs[i - 1] - xs[i];
      const soft = gap < NOISE_FLOOR ? `  <- SOFT boundary (gap ${gap.toFixed(2)} < ${NOISE_FLOOR})` : `     (gap ${gap.toFixed(2)})`;
      console.log(`  ----${soft}`);
    }
    for (let x = i; x < j; x++) {
      console.log(`  T${t + 1}  ${xs[x].toFixed(2)}  ${entries[x].name}`);
    }
  });
}

const entries = loadEntries();
tierList('List 1: Frameworks & rendering libraries', entries.filter(e => e.category !== 'state-library'));
tierList('List 2: State-management libraries', entries.filter(e => e.category === 'state-library'));
