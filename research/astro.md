---
name: "Astro"
category: "meta-framework"
github_url: "https://github.com/withastro/astro"
docs_url: "https://docs.astro.build"
implementation_language: "TypeScript"
status: "active"
type_system_score: 7.5
compiler_feedback_score: 7.5
locality_score: 8
explicitness_score: 8.5
convention_strength_score: 7.5
token_efficiency_score: 7.5
familiarity_score: 6.5
stability_score: 6.5
tooling_score: 8
version: "6.4.4"
npm_package: "astro"
ai_tooling:
  mcp_server:
    available: true
    url: "https://mcp.docs.astro.build/mcp"
    party: "first-party"
  guidelines: "https://docs.astro.build/en/guides/build-with-ai/ — official AI-assisted development guide with recommended workflow, integration setup, and project rules"
  llms_txt: false
  style_guides: null
  observed_delta: "Ran the canonical token-efficiency exercise (a blog page with a content collection, an interactive Like button island using React, and a server action for form submission) twice: once without context, once with the official Astro MCP server (mcp.docs.astro.build/mcp) active in a Claude Code session. Without tooling: model produced correct .astro component syntax but used the deprecated Astro.glob() API for content loading (removed in v6), and used the old <ViewTransitions /> component name (renamed to <ClientRouter /> in v6). With MCP server active: model produced correct v6 Content Layer API (getCollection() with defineCollection), used <ClientRouter /> correctly, and correctly placed the actions definition in src/actions/index.ts. Observed delta: two v6-specific API renames corrected (Astro.glob removal, ViewTransitions rename) without manual intervention. The delta is moderate — Astro 6 is recent enough that training data still reflects v5/v4 idioms, and the MCP server's live-docs access directly patches that gap."
next_release:
  name: "Astro 7.0"
  status: "alpha"
  changes: "Astro 7.0-alpha.2 (June 8, 2026) upgrades to Vite 8, makes the Rust-based compiler (introduced experimentally in v5, default in v6) the sole compiler, and adds background dev-server management targeted at AI coding agents. Svelte integration upgrades to vite-plugin-svelte v7. MDX integration bumps to 6.0-alpha."
  anticipated_impact: "Vite 8 upgrade is a breaking change for integrations using Vite internals; most user-facing code should not require changes. Rust compiler becoming sole option removes the fallback Go compiler — build behavior is unchanged for standard projects. The background dev server feature is additive and agent-focused. The stability_score is not penalized because no user-facing API conventions are changing in 7.0."
  stability_penalty: false
components: null
supersedes: null
superseded_by: null
typescript_support: "native"
license: "MIT"
runtime: "both"
capabilities:
  state_management: false
  rendering: true
  event_handling: false
paradigm: "declarative"
rendering_strategy: "compiler"
maintainer: "The Astro Technology Company / Community"
first_released: "2021"
reviewed_date: "2026-06-08"
reviewed_by_model: "Claude Sonnet 4.6"
reviewer_notes: "Full rewrite from unscored shell to complete 9-dimension rubric. Version confirmed from npm (npm view astro version = 6.4.4, June 3 2026). Astro is a compiler meta-framework — it has no client-side state management or event handling of its own; those capabilities belong to the UI-framework islands (React/Vue/Svelte/etc.) embedded within it. The rubric scores therefore evaluate the Astro layer itself: how well the .astro component model, Content Collections API, Actions, and client-directive system support agentic development. Documentation friction: no friction on core concepts. Some effort was needed to locate the canonical Content Layer API patterns (the v5 → v6 migration renamed the API surface significantly, and several community blog posts still describe the legacy API). This is noted in the Convention strength evidence section."
---

# Astro

Astro is a compiler-output meta-framework built for content-driven websites. It pioneered **Islands Architecture**: pages are server-rendered to static HTML by default, and JavaScript is shipped only for components that explicitly opt into client-side hydration via `client:*` directives. Astro is framework-agnostic — React, Vue, Svelte, Solid, and Preact components can coexist on the same page, each hydrating independently.

**Current stable version:** 6.4.4 (June 3, 2026). Confirmed via `npm view astro version`.

**Core capabilities owned by Astro itself:**
- `.astro` component format (server-only front-matter + HTML template)
- File-system routing (`src/pages/`)
- Content Collections API (type-safe structured content via Zod schemas)
- Server Islands (`server:defer` for deferred server rendering)
- Actions (type-safe server functions, `src/actions/index.ts`)
- View Transitions (`<ClientRouter />`)
- Client directives (`client:load`, `client:idle`, `client:visible`, `client:media`, `client:only`)

**Capabilities delegated to islands:** state management, event handling, reactivity — these are the responsibility of whichever UI framework you embed.

## State Management

### Philosophy & Mental Model

Astro deliberately provides no client-side state management. The model is: if state is needed, it lives in an island component (React `useState`, Svelte `$state`, etc.), not in Astro itself. Server-side data is computed once in the component front-matter and serialized to HTML.

```astro
---
// Server-side only — runs at build or request time
const posts = await getCollection('blog');
---

<ul>
  {posts.map(post => (
    <li><a href={`/blog/${post.slug}`}>{post.data.title}</a></li>
  ))}
</ul>
```

For cross-island state sharing, the Astro docs recommend: nanostores (a 265-byte signal store), URL/search params, or a shared framework store. There is no "Astro state" primitive.

### Core Primitives

**Front-matter variables** — server-side computed values, not reactive:

```astro
---
const { title, count = 0 } = Astro.props;
const greeting = `Hello, ${title}!`;
---
<h1>{greeting}: {count}</h1>
```

**Content Collections** — type-safe structured data from local files or remote loaders:

```ts
// src/content.config.ts
import { defineCollection, z } from 'astro:content';

export const collections = {
  blog: defineCollection({
    schema: z.object({
      title: z.string(),
      date: z.date(),
      draft: z.boolean().default(false),
    }),
  }),
};
```

**Actions** (v4+ stable) — type-safe server functions callable from client:

```ts
// src/actions/index.ts
import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';

export const server = {
  subscribe: defineAction({
    input: z.object({ email: z.string().email() }),
    handler: async ({ email }) => {
      await db.subscriptions.create({ email });
      return { success: true };
    },
  }),
};
```

### Async Handling

All server-side async happens synchronously in front-matter (top-level `await` is supported):

```astro
---
const [user, posts] = await Promise.all([
  getUser(Astro.locals.userId),
  getCollection('blog'),
]);
---
```

For client-side async in islands, each island uses its own framework's async patterns (React `useEffect`, Svelte `$effect`, etc.).

### Reactivity & Granularity

Astro has no client-side reactivity. Server renders happen once; islands hydrate independently. There is no global render cycle triggered by data changes. This is the core architectural guarantee: static parts of the page are never re-rendered, regardless of island state changes.

## Rendering

### Philosophy & Approach

Compiler-output rendering: `.astro` files are compiled to optimized HTML (not shipped as JS). Only `client:*`-marked components produce JavaScript bundles.

**Three rendering modes coexist:**
1. **Static (build-time)** — default; HTML generated once at build
2. **SSR (request-time)** — via server adapters (Node, Cloudflare, Netlify, Vercel)
3. **Server Islands** — deferred server components that render after the shell loads

### Component Structure

```astro
---
// Front-matter: TypeScript/JavaScript, server-only
interface Props {
  title: string;
  count?: number;
}
const { title, count = 0 } = Astro.props;
---

<!-- Template: HTML + JSX-like expressions -->
<div class="card">
  <h2>{title}</h2>
  <p>Count: {count}</p>
</div>

<style>
  /* Scoped automatically */
  .card { border: 1px solid #ccc; }
</style>
```

The code fence (`---`) boundary is a hard compiler boundary: front-matter code never runs in the browser. This is explicit and enforced.

### Client Directives

The `client:*` system is Astro's primary rendering configuration surface:

| Directive | When hydration happens |
|---|---|
| `client:load` | Immediately on page load |
| `client:idle` | When browser is idle (`requestIdleCallback`) |
| `client:visible` | When scrolled into viewport (IntersectionObserver) |
| `client:media="(query)"` | When a CSS media query matches |
| `client:only="react"` | Client-only, no SSR |

```astro
---
import Counter from '../components/Counter.tsx';
import Newsletter from '../components/Newsletter.tsx';
import HeavyChart from '../components/HeavyChart.tsx';
---

<Counter client:load />
<Newsletter client:idle />
<HeavyChart client:visible />
```

### Server Islands

```astro
<!-- Deferred server rendering — page shell loads instantly -->
<UserDashboard server:defer>
  <div slot="fallback">Loading dashboard...</div>
</UserDashboard>
```

The `server:defer` directive is Astro's answer to React Suspense for MPA architectures. The component is replaced by a script that fetches the rendered HTML separately.

### Multi-Framework Support

```astro
---
import ReactCounter from '../components/Counter.tsx';
import VueCalendar from '../components/Calendar.vue';
import SvelteChart from '../components/Chart.svelte';
---

<ReactCounter client:load />
<VueCalendar client:visible />
<SvelteChart client:idle />
```

Each island hydrates with its own framework runtime, independently. There is no shared framework overhead for static content.

## Event Handling

Astro has no event system of its own. Event handling lives in island components.

**For static HTML**, standard browser behavior applies:

```astro
<!-- A form that submits to a server endpoint — no JavaScript required -->
<form method="POST" action="/api/subscribe">
  <input name="email" type="email" />
  <button type="submit">Subscribe</button>
</form>
```

**For Actions (progressive enhancement pattern):**

```astro
---
import { actions } from 'astro:actions';
---

<form method="POST" action={actions.newsletter.subscribe}>
  <input name="email" type="email" />
  <button>Subscribe</button>
</form>

<script>
import { actions, isInputError } from 'astro:actions';

const form = document.querySelector('form');
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const { error } = await actions.newsletter.subscribe(formData);
  if (isInputError(error)) {
    // handle validation errors
  }
});
</script>
```

**For island components**, use the native framework:

```tsx
// React island — event handling stays inside the island
export default function LikeButton({ postId }: { postId: string }) {
  const [liked, setLiked] = useState(false);
  return (
    <button onClick={() => setLiked(!liked)}>
      {liked ? 'Liked' : 'Like'}
    </button>
  );
}
```

## Rubric Evidence

### Evidence: Type-system integration

**Category: native** — Astro is implemented in TypeScript and ships its own types; no separate `@types/*` package is needed.

**What the type checker catches:**

TypeScript is enabled by default in new Astro projects. The `astro check` CLI command type-checks both `.astro` and `.ts` files. The `@astrojs/ts-plugin` (automatically installed with the official VS Code extension) enables in-editor type checking for `.astro` files.

**Deliberate type error — missing required prop:**

```astro
---
// BlogPost.astro
interface Props {
  title: string;
  date: Date;  // required
}
const { title, date } = Astro.props;
---
<article>
  <h1>{title}</h1>
  <time>{date.toLocaleDateString()}</time>
</article>
```

```astro
---
// index.astro — missing 'date' prop
import BlogPost from '../components/BlogPost.astro';
---
<BlogPost title="Hello" />
```

Running `astro check` produces:

```
src/pages/index.astro:5:1 - error ts(2741):
  Property 'date' is missing in type 'Record<string, any>'
  but required in type '{ title: string; date: Date; }'.
```

The error points at the call site, identifies the missing property by name, and shows the type it expects. Source: confirmed via language-tools issue tracker (https://github.com/withastro/language-tools/issues/600).

**Content Collections schema validation:**

```ts
// src/content.config.ts
export const collections = {
  blog: defineCollection({
    schema: z.object({
      title: z.string(),
      date: z.date(),
    }),
  }),
};
```

At build time (or `astro check`), any `.md`/`.mdx` file whose frontmatter violates the Zod schema produces an actionable error:

```
[content] blog/my-post.md - date field: Expected date, received string "2024-01-01"
```

**Score rationale: 7.5.** Type coverage is strong for props and Content Collections. The major gap is that `.astro` template expressions (e.g., passing a wrong type into an expression like `{count + 1}`) sometimes resolve to `any` rather than raising a type error, because the language-tools transform pipeline has known limitations with complex generic inference inside templates. TypeScript in the front-matter script is fully covered; template-expression coverage is partial.

No documentation friction on this dimension — TypeScript guide is thorough and clearly maintained.

### Evidence: Compiler/build feedback quality

**Deliberately broken example — wrong client directive framework:**

```astro
---
import MyVueComponent from '../components/MyVue.vue';
---
<!-- Wrong: client:only requires the framework hint -->
<MyVueComponent client:only />
```

Astro produces:

```
[error] Missing hint on 'client:only' directive: expected 'client:only="vue"'
  Hint: You may add a client:only directive to your Vue component,
  but you need to provide which renderer to use.
  If you're using Vue, add client:only="vue"
```

The error names the exact fix. It is actionable on first read.

**Broken content collection schema:**

```ts
// A collection referencing a non-existent schema field
const posts = await getCollection('blog');
posts[0].data.nonexistent; // TS error at editor time
```

Editor: `Property 'nonexistent' does not exist on type '{ title: string; date: Date; }'`

**Score rationale: 7.5.** Astro's own compiler errors (routing, directives, content collections) are well-formed and actionable. The dev server displays errors as overlays with file+line references. The gap: TypeScript errors from within island components sometimes appear in the Astro error overlay without the surrounding framework context, making them slightly harder to trace than native compiler errors for those frameworks. And `astro check` does not run during `astro dev` by default — developers must run it separately (CI or editor integration) to catch TS errors.

### Evidence: Locality of behavior

**Traced feature: an interactive blog post "Like" button with a server action**

Files touched to understand, implement, or modify the full feature:

1. `src/actions/index.ts` — defines the `likePost` server action (Zod input schema + handler)
2. `src/components/LikeButton.tsx` — React island component (reads props, calls `actions.blog.likePost`, updates local state)
3. `src/pages/blog/[slug].astro` — imports `LikeButton`, passes `postId` prop, applies `client:load` directive
4. `src/content.config.ts` — Content Collections schema where the blog collection is defined (needed to understand the `postId` type)

**Touchpoint count: 4 files** for a complete feature crossing server actions, client islands, routing, and content types.

Contrast: most static page features require only 1-2 files (the `.astro` page component and optionally a layout). The island pattern adds 1 file per interactive component + the actions file for server-side logic.

**Score rationale: 8.0.** The `client:*` directive system keeps interactivity boundaries at the call site — you can see exactly which component is interactive and how it hydrates without opening the component file. The code fence boundary (`---`) makes server vs. client code visually explicit within a single file. Feature locality is notably better than React meta-frameworks where SSR/client transitions involve multiple convention layers (Server Components, `"use client"` boundary, route segments). Slight deduction: understanding what data a Server Island serializes requires opening the island component to check what's serializable — not always apparent from the call site.

### Evidence: Explicitness / data-flow traceability

**Traced state change: user submits a form, server action runs, page data refreshes**

```
User click on <button type="submit">
  → form.submit() (browser-native)
  → POST to /_actions/newsletter.subscribe (Astro Actions routing)
  → src/actions/index.ts: handler() runs, validates input (Zod), writes to DB
  → Response with redirect or JSON
  → Page reload / router.refresh() (explicit in the calling component)
  → Page re-renders from server with new data
```

**Hop-by-hop analysis:**

1. `<form method="POST" action={actions.newsletter.subscribe}>` — explicit: the action URL is derived from the action definition, visible at the call site
2. `handler: async ({ email }) => { ... }` — explicit: the handler function is the exact code that runs, no middleware magic
3. Zod validation — explicit: the `input` schema is co-located with the handler
4. `return { success: true }` — explicit: the handler's return value becomes `data` on the client
5. `const { error, data } = await actions.newsletter.subscribe(formData)` — explicit: the client-side call returns a discriminated union; no implicit error swallowing

**Implicit hops: 1** — the routing from `actions.newsletter.subscribe` to the `/_actions/newsletter.subscribe` endpoint URL is implicit (you don't see the URL in `src/actions/index.ts`). Everything else is traceable by reading the source.

**Score rationale: 8.5.** Astro's architecture is unusually explicit for a meta-framework. The front-matter/template boundary enforces a visible server/client split that React's `"use client"` / `"use server"` directive system only approximates. Actions produce typed return values and discriminated error objects, eliminating implicit error states. The main implicit element is framework-side hydration: when a `client:load` island receives its props from the server and mounts, the serialization/deserialization of those props is invisible (but also not developer-modifiable, so it rarely needs tracing).

### Evidence: Convention strength

**Task: "fetch data from a CMS or API on page load"**

Counted approaches in the Astro docs and integration guide as of June 2026:

1. **Content Collections with a loader** — `defineCollection({ loader: glob({ pattern: '**/*.md' }) })`, `getCollection()` — the canonical "local file" path, fully documented
2. **Content Collections with a remote loader** — `loader: async () => fetch(...).then(r => r.json())` — documented in Content Collections guide as the "remote data" path
3. **fetch() in front-matter** — `const data = await fetch('https://api.example.com').then(r => r.json())` — documented in the Data Fetching guide as an alternative for ad-hoc fetches
4. **API routes** — `src/pages/api/data.ts` exports a `GET` function, then the page fetches from it — documented but described as "mainly useful for exposing data to the frontend," not the recommended pattern for page data
5. **SSR with `Astro.locals`** (via middleware) — populate data in middleware, access in component — documented in SSR + Middleware guide, advanced path
6. **Framework-component data fetching** (`useEffect` / SWR / TanStack Query inside a `client:load` island) — not documented by Astro but implied when using React/Vue integrations

**Count: 5 documented Astro-layer approaches + 1 implicit island-layer approach.**

Documentation friction: The Content Layer API underwent a significant naming change between v4 (where it was called "Content Layer" experimentally) and v5/v6 (where the legacy API was removed entirely). Multiple community blog posts (dated 2024) still describe the legacy `defineCollection` with `type: 'content'` syntax, which is now unsupported. Searching Astro docs for "data fetching" surfaces the current approaches clearly, but community search results frequently return outdated patterns. This is worth noting as a convention-strength deduction: the ecosystem's historical written record contains conflicting examples for a period after the v5 → v6 transition.

**Score rationale: 7.5.** The Astro-layer convention (Content Collections) is strong and clearly documented. The score deducts for: (a) multiple valid approaches to the same task within the Astro layer itself (3 reasonable choices for a simple API fetch), and (b) the migration-era noise from deprecated APIs in the community corpus.

### Evidence: Token efficiency / boilerplate density

**TodoMVC search result:** todomvc.com does not list an official Astro implementation. A community implementation exists — `tony-sull/todomvc-astro-htmx` (https://github.com/tony-sull/todomvc-astro-htmx) — but it pairs Astro with htmx and hyperscript, making it unsuitable as an Astro-standalone baseline. No Astro-only TodoMVC in the tastejs/todomvc canonical repository.

**Fallback: official Astro tutorial app (blog site)**

The official Astro tutorial (https://docs.astro.build/en/tutorial/0-introduction/) builds a complete multi-page blog site. The final file count for the tutorial output (excluding configuration and style files):

- `src/pages/index.astro` — 18 lines
- `src/pages/about.astro` — 16 lines
- `src/pages/blog/index.astro` — 12 lines
- `src/pages/blog/[post].astro` — 22 lines (dynamic route + `getStaticPaths`)
- `src/layouts/BaseLayout.astro` — 28 lines (with slot, styles, global navigation)
- `src/layouts/MarkdownPostLayout.astro` — 20 lines
- `src/components/Navigation.astro` — 15 lines
- `src/components/Footer.astro` — 8 lines
- `src/content.config.ts` — 12 lines

**Total: ~151 lines** for a complete, functional, multi-page blog with routing, layouts, data fetching from content collections, and dynamic routes.

**Comparison point:** the official Astro "Add an RSS feed" integration takes 8 lines of configuration in `astro.config.mjs` — a dimension that Next.js and Remix require significantly more setup to replicate.

**A minimal interactive feature (a counter island):**

```astro
---
// src/pages/index.astro — 6 meaningful lines
import Counter from '../components/Counter.tsx';
---
<Counter client:load />
```

```tsx
// src/components/Counter.tsx — 9 meaningful lines
import { useState } from 'react';
export default function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>;
}
```

15 lines total for a complete, hydrated interactive counter. The Astro layer itself contributes 6 lines; the island is vanilla React.

**Score rationale: 7.5.** Astro is genuinely low-boilerplate for static content — the tutorial blog at 151 lines competes favorably with any meta-framework. The score doesn't reach 9 (Svelte-tier) because: (a) interactive features require at least two files (`.astro` page + island component file), adding a structural overhead that pure-component frameworks don't have; and (b) Actions require a dedicated `src/actions/index.ts` file regardless of how few actions you define.

### Evidence: Familiarity composite

**First released:** 2021 (open-sourced; 1.0 stable June 2022). Relatively young — 4-5 years of community corpus.

**GitHub stars:** 59,900 (as of June 2026, per github.com/withastro/astro). Grew from ~53,000 to ~59,900 during 2025 (roughly 7,000 stars/year). Ranked 293rd among all GitHub repositories globally (from Astro's 2025 Year in Review).

**npm weekly downloads:** 3.0–3.1 million/week as of June 2026 (per npmtrends.com/astro). This is a strong, upward-trending signal — downloads grew from ~360,000/week (Jan 2025) to ~900,000/week (Dec 2025) to ~3M/week (Jun 2026).

**Stack Overflow Developer Survey 2025:** Astro ranked **4th most admired web framework** at 62.2% among respondents who had used it. Rising Stars 2025: 4th in Back-end/Full-stack, 3rd in Static Sites.

**Ecosystem signal:** Starlight (Astro's documentation theme) has 10,000+ active projects, suggesting significant real-world adoption as infrastructure.

**Community size:** Discord, GitHub Discussions, and documented 113 releases during 2025 alone indicate a highly active core team and contributor base.

**Score rationale: 6.5.** Astro is growing fast and gaining recognition, but it is young (4 years old) and its `.astro` component syntax is novel enough that LLM training data will contain significantly less Astro-specific material than React, Vue, or even Next.js. The 3M/week download figure and SO survey placement are strong but represent very recent momentum (2025–2026) rather than deep historical corpus. The island architecture patterns and v5/v6 API changes are recent enough that models trained before 2025 will have outdated Astro knowledge. Score is calibrated against the corpus: better than niche frameworks (Qwik ~5.5) but behind React/Next.js/Vue (8–9.5) which have 8–10 years of community writing.

### Evidence: Stability / convention durability

**Changelog review: Astro v5 → v6 (released early 2026)**

Breaking changes from the upgrade guide (https://docs.astro.build/en/guides/upgrade-to/v6/):

- **Removed `Astro.glob()`** — replaced by Content Collections (already deprecated in v4)
- **Removed legacy Content Collections API** — all projects must use Content Layer API
- **Removed deprecated `<ViewTransitions />`** — renamed `<ClientRouter />` (deprecated since v4)
- **Node 22 minimum** — dropped Node 18 and 20
- **Vite 7 upgrade** — breaking for integrations using Vite internals
- **Zod 4 upgrade** — Zod 3 no longer supported
- **`import.meta.env` behavior change** — values no longer coerced to booleans
- **`getStaticPaths()` params must be strings** — no numeric params
- **`i18n.redirectToDefaultLocale` default changed**

This is a substantial list for a minor-to-major version jump. However, most removals (Astro.glob, ViewTransitions, legacy content collections) were deprecated 1-2 major versions earlier with clear migration paths documented, and automated codemods were provided.

**Astro 7.0-alpha (June 2026, tracked in `next_release`):**

No user-facing API changes announced. Vite 8 upgrade + Rust compiler as sole option + background dev server. See `next_release` frontmatter — `stability_penalty: false`.

**Historical cadence:** Astro ships approximately one major version per year (v3: Sept 2023, v4: Dec 2023, v5: Dec 2024, v6: early 2026). Each major removes APIs deprecated in the prior cycle. The removal-with-deprecation-path pattern is consistent.

**Score rationale: 6.5.** Astro is in an active development phase. The v5 → v6 migration required changes for most non-trivial projects (Content Layer API adoption, ViewTransitions rename, env behavior changes). However, the predictable annual major-version cadence, the use of deprecation-before-removal, and codemods reduce the effective disruption. The score matches the pattern seen in other active young meta-frameworks (SvelteKit is similar). The AI-tooling gap from training data lag (models may generate v4/v5 idioms) effectively amplifies the stability risk for agentic workflows.

### Evidence: Ecosystem tooling facts

**Devtools:**
- [x] Built-in dev toolbar: islands inspector, accessibility auditor, performance hints — included in every `astro dev` session (https://docs.astro.build/en/guides/dev-toolbar/)
- [x] AstroSpect Chrome DevTools extension: full island tree, props inspection, client directive display (https://github.com/oslabs-beta/AstroSpect)
- [x] Astro 6.2: experimental JSON logger (`--experimentalJson`) for structured output, targeted at coding agents

**IDE / LSP:**
- [x] Official VS Code extension: `astro-build.astro-vscode` — syntax highlighting, IntelliSense, diagnostics, formatting for `.astro` files (https://marketplace.visualstudio.com/items?itemName=astro-build.astro-vscode)
- [x] `@astrojs/ts-plugin`: TypeScript language service plugin for `.astro` file type checking (installed automatically by VS Code extension)
- [x] `astro check` CLI: type checks `.astro` + `.ts` files; suitable for CI
- [ ] Breakpoints in `.astro` files in VS Code debugger: **not fully supported** — `debugger` statement works; visual breakpoints in `.astro` files do not (known limitation per Medium debugging guide)

**Test utilities:**
- [x] Vitest: first-class support via `getViteConfig()` helper; Container API for testing `.astro` components in isolation (https://docs.astro.build/en/guides/testing/)
- [x] Playwright: documented official E2E testing approach
- [x] Cypress: documented
- [x] NightwatchJS: documented
- [ ] No Astro-specific component testing library equivalent to Testing Library

**AI tooling (verification-side, not ranking):**
- [x] Official MCP server: `https://mcp.docs.astro.build/mcp` — first-party, provides live documentation access to AI tools (Claude Code, Cursor, Copilot, etc.)
- [x] Official "Build with AI" guide (https://docs.astro.build/en/guides/build-with-ai/) with workflow recommendations and project rules

**Score rationale: 8.0.** The tooling story is strong for a framework of Astro's age. The built-in dev toolbar, official VS Code extension, `astro check` CLI, and first-party MCP server cover the most important bases. Deducted from a higher score because: `.astro` file debugger support is incomplete, there is no Astro-native component testing library (you must use framework-specific ones or E2E), and the Chrome extension (AstroSpect) is community-maintained, not first-party.

## On the Horizon

### Next release

- **Name/version:** Astro 7.0 (alpha.2 available as of June 8, 2026)
- **Status:** alpha
- **What's changing:** Upgrades to Vite 8 (breaking for integrations that use Vite internals, not for user-facing code); makes the Rust-based compiler the sole compiler (the Go-based fallback is removed); adds background dev server management API targeted at AI coding agents. Associated integrations (`@astrojs/svelte` 9.0-alpha, `@astrojs/mdx` 6.0-alpha) track Vite 8.
- **Anticipated impact:** No user-facing API changes. The Vite 8 upgrade may require integration/plugin authors to update; end-user Astro code should be unaffected. The background dev server API is additive and focused on agent workflows. Rust compiler as sole option removes an experimental escape hatch but delivers consistent build behavior.
- **Stability penalty:** No — the 7.0 alpha does not introduce convention changes. See `next_release.stability_penalty: false`. The stability_score of 6.5 reflects Astro's general active-development cadence and the recent v6 migration burden, not imminent breakage from 7.0.

### AI-tooling investment

- **What exists:**
  - First-party MCP server at `https://mcp.docs.astro.build/mcp` — announced and documented in the official "Build with AI" guide. Integrates with Claude Code, Cursor, VS Code with Copilot, GitHub Copilot in any IDE, and others. Provides live documentation access to counter LLM training data lag.
  - Official "Build with AI" guide (`docs.astro.build/en/guides/build-with-ai/`) — a dedicated documentation page covering recommended workflow, how to set up the MCP server, suggested project rules, and caveats about AI tool limitations with Astro. Not a Boost-style generated-guidelines package, but a maintained, first-person documentation section.
  - Astro 6.2 JSON logger (`--experimentalJson`) — structured JSON output from the dev server, explicitly designed "for coding agents."
  - Astro 7.0 alpha: background dev server management — explicitly described as targeting AI agents in the release notes.
  - Community ecosystem: `astro-agent-skills` (skills for Cursor/Codex/Claude Code) and `@omniaura/astro-grab` (element context extraction for AI agents) indicate community investment in agent-friendly tooling.
  - No `llms.txt` published at `astro.build/llms.txt` as of research date (checked via WebFetch during MCP server investigation — the build-with-ai guide points to MCP as the primary mechanism, not llms.txt).

- **Observed delta:** (from `ai_tooling.observed_delta` frontmatter, summarized) Ran the canonical exercise twice: without tooling, the model used the deprecated `Astro.glob()` API and the old `<ViewTransitions />` component name — both removed in v6. With the MCP server active, both v6-specific API changes were produced correctly on the first attempt. The delta is meaningful and specific to Astro's recent major-version migration: the MCP server's live docs access directly patches the training-data lag for recently-removed/renamed APIs. This is a more targeted benefit than React/Next.js MCP tooling, because Astro's API surface changes more frequently and its training corpus is younger.
