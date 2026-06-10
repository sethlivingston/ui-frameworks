---
name: refresh-reviews
description: Batched refresh of existing framework reviews. Takes an explicit list of review files (typically a /corpus-sweep refresh queue, or "X just shipped"), dispatches the framework-researcher agent per file on its normal verification-first follow-on path, and manages batching, pipeline runs, spot-checks, and commits. Use when asked to "refresh the X review", "run the refresh queue", or "update reviews for the frameworks that shipped".
---

# Review Refresh

You are orchestrating follow-on passes over existing reviews in `research/`. The
per-file research itself is the `framework-researcher` agent's job — this skill owns
the batching, sequencing, verification gates, and budget pauses around those
dispatches. The rules below are not style preferences; each one exists because the
corpus migration hit the failure mode it prevents.

## Input

An explicit list of review files. Sources, in the usual order:

- the **Refresh queue** table from a `/corpus-sweep` findings file (preferred — it
  arrives with a trigger and registry evidence per file)
- an ad-hoc "X just shipped" request — confirm the file exists in `research/` first
- never self-selected: if asked to "refresh whatever is stale" without a list, run
  `/corpus-sweep` first (or its Part B staleness check) to *produce* the list —
  don't improvise staleness judgments here

## Dispatch — the normal follow-on path

Dispatch the `framework-researcher` agent once per file, instructing it to run its
**normal follow-on pass** as defined in `.claude/agents/framework-researcher.md`:
verification first (mechanical facts → re-derivable claims → internal consistency),
then delta-based updates only for the dimensions verification flagged. Pass along the
trigger evidence from the refresh queue so the agent starts with the "what likely
moved" signal instead of re-deriving it.

**Do not** instruct a from-scratch rewrite. That instruction existed once, for the
one-time rubric migration — every file is already on the current template, and the
follow-on protocol's whole value is preserving the git-diffable history of what
genuinely changed. Manufactured churn destroys that signal.

**The rewrite gate is live.** The agent's brief covers the Angular 1→2 problem: if
its verification finds the framework is no longer the thing the review describes
(name kept, framework replaced), it will branch into a fresh file with
`supersedes`/`superseded_by` links instead of updating in place. Expect this —
relay it to the user as a finding, not a problem.

## Batching rules

1. **Max 3 files per batch.** Larger batches outrun both session budgets and the
   spot-check's ability to catch a systemic problem before it propagates.
2. **Sequential dispatch only — never parallel.** Every agent run ends by
   regenerating `research/frameworks.json` (`npm run normalize && npm run index &&
   npm run sync`); concurrent runs race on that shared index.
3. **After each batch, run the pipeline yourself** (`npm run normalize && npm run
   index && npm run sync`) and confirm every file still validates clean — even
   though each agent already ran it, this catches cross-file interactions.
4. **Spot-check 1–2 files per batch before starting the next:**
   - every non-null `*_score` has its `### Evidence:` section, headings matching
     `CLAUDE.md`'s rubric table verbatim (`rg -c "^### Evidence:" <file>` — expect 9)
   - the updated evidence actually supports the updated score (read it, don't count it)
   - `reviewed_date`/`reviewed_by_model` bumped; `## On the Horizon` updated —
     a shipped tracked release must have moved out of `next_release` tracking
   - at least one documentation-friction note, or an explicit "none found"
5. **Pause between batches** and check in: report what moved, surface anything odd,
   and let the user gauge remaining session budget before the next batch. Batches
   are also natural stopping points for resuming in a fresh session.
6. **Commit per batch** (conventional message, e.g. `feat: refresh <a>, <b>, <c>
   reviews`), so a session that dies mid-run loses at most one batch.

## Tail — after all batches land

1. **Report score motion**: for each refreshed file, which dimensions moved, which
   direction, and the one-line reason from its evidence.
2. **Recommend (don't run) a rankings pass if warranted.** If any weighted total
   moved enough to plausibly reorder `AGENTIC-DEV-RANKINGS.md` — or any
   `stability_penalty` flag flipped — say so and point at that doc's own
   "How to re-run this in six months" section, which is the canonical runbook.
   Re-ranking is its own session-sized decision; don't fold it into the refresh.
3. If the input came from a sweep findings file and all its refresh-queue items are
   now done or captured, remind the user the findings file can be deleted (per
   `/corpus-sweep`'s closing protocol).
