---
name: corpus-sweep
description: Periodic freshness sweep of the research corpus. Finds gaps (frameworks the landscape now discusses that research/ doesn't cover) and staleness (reviews whose tracked releases have shipped, whose versions have drifted, or whose reviewed_date is old). Produces a findings file for human review — never dispatches research itself. Use when asked to "sweep the corpus", "check for stale reviews", "what's missing from the corpus", or on a periodic freshness pass (~every 6 months).
---

# Corpus Freshness Sweep

You are running the recurring maintenance sweep for this repo's framework-review
corpus. Your job is **detection and recommendation only**: find what's missing and
what's gone stale, write it up, and stop. The expensive work — actually researching
or refreshing reviews — happens later, through `/refresh-reviews` or a
`framework-researcher` dispatch, after a human has reviewed your findings and made
the in/out calls.

**Hard constraints:**

- **Never dispatch the `framework-researcher` agent from this skill.** Your output
  is a findings file, not updated reviews.
- **Every version/registry fact comes from a live lookup** (npm, Packagist, hex.pm,
  GitHub releases) — never from training data. Training-data versions are stale by
  construction; citing one defeats the purpose of a freshness sweep.
- **Don't edit any review file**, even for drift you're certain about. Drift is a
  finding; fixing it is the refresh pass's job (the researcher brief's
  verification-first protocol exists precisely to fix it with evidence).

## Part A — Gap check (outward-looking)

Cross-reference the current corpus against what the landscape actually discusses
today.

1. List current coverage: every file in `research/` (check `components:` frontmatter
   too — combo files cover multiple technologies; `rg "components:" research/`).
2. Web-search the current landscape. Probe at minimum these historically thin
   categories, plus anything that surfaces:
   - meta-frameworks (new or newly-prominent ones)
   - signal-based / fine-grained reactive libraries
   - compiler-output frameworks
   - server-driven / HTML-over-the-wire approaches
   - anything frequently discussed alongside agentic/AI-assisted development
3. For each candidate not in the corpus, decide what *shape* its review would take
   before recommending it:
   - Does it have a coherent standalone review, or is it only reviewable as a
     pairing? (CLAUDE.md's combo-file convention — htmx and Alpine have no rendering
     or component model of their own, so they're reviewed as `htmx-html.md` /
     `alpine-html.md`. Apply the same test to new candidates.)
   - Is it a rewrite of something already reviewed (the Angular 1→2 problem)? If so,
     flag it as a `supersedes` case, not a plain new entry.
4. Popularity judgment caveat: CDN/script-tag-distributed tools structurally
   undercount on npm — lean on GitHub stars/activity and community volume for those,
   the same way the Familiarity rubric evidence does.

## Part B — Staleness check (inward-looking, mechanical)

No web judgment calls here beyond registry lookups — this half is cheap and
scriptable. Three signals, in increasing order of urgency:

1. **Old reviews:** `reviewed_date` older than ~6 months. Extract with
   `rg "^reviewed_date:" research/` and compare against today. Age alone is a weak
   signal — pair it with signals 2–3 before recommending a refresh.
2. **Version drift:** the frontmatter `version:` field vs. the registry's current
   stable. Look up per ecosystem:
   - npm: `npm view <package> version`
   - Packagist: `https://repo.packagist.org/p2/<vendor>/<package>.json`
   - hex.pm: `https://hex.pm/api/packages/<package>`
   - no registry (platform/spec entries): GitHub releases or the spec's status page
   A major-version jump is a strong refresh trigger; a patch bump is not.
3. **Tracked releases that have shipped:** for every review with a non-null
   `next_release` block (`rg "next_release:" research/ -A 5`), check whether the
   tracked release has since landed (compare its `name`/`status` against the
   registry's current version). A shipped tracked release is the *strongest* refresh
   trigger in the system — it's the wake-up call the review explicitly queued for
   itself, and entries with `stability_penalty: true` have a rank in
   `AGENTIC-DEV-RANKINGS.md` waiting to be re-judged.

## Output — the findings file

Write `SWEEP-FINDINGS-<YYYY-MM-DD>.md` at the repo root. This is a **scratch
artifact**: it gets reviewed with the user, its accepted contents get captured into
tasks, and then it gets **deleted** — it must not linger as a second source of truth.
Structure:

```markdown
# Corpus Sweep Findings — <date>

## New-entry candidates
| Candidate | Shape (standalone / combo with X / supersedes Y) | Rationale (one line) | Recommendation (in/out) |

## Refresh queue (for /refresh-reviews)
| Review file | Trigger (shipped release / version drift / age) | Evidence (registry fact + link) | Urgency |

## Shipped tracked releases
One line per next_release that has landed since the last sweep — these are
guaranteed "On the Horizon" updates even if nothing else in the review moved.

## No-action notes
Anything checked and found current — so the next sweep knows it was looked at,
not skipped.
```

## Closing protocol

1. Present the findings file to the user and walk through the recommendations.
2. Capture the accepted items into tasks (new-entry tasks → `framework-researcher`
   dispatches; refresh queue → a `/refresh-reviews` run).
3. Delete the findings file once captured.
4. Do not start any of the captured work in the same session unless explicitly asked
   — sweeps are cheap, research is not, and the user budgets them separately.
