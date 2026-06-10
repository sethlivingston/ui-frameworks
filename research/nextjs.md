---
name: "Next.js"
category: "meta-framework"
github_url: "https://github.com/vercel/next.js"
docs_url: "https://nextjs.org/docs"
implementation_language: "TypeScript"
status: "active"
type_system_score: 8.5
compiler_feedback_score: 7
locality_score: 4.5
explicitness_score: 5
convention_strength_score: 3.5
token_efficiency_score: 6
familiarity_score: 9
stability_score: 4.5
tooling_score: 9
version: "16.x"
npm_package: "next"
ai_tooling:
  mcp_server:
    available: true
    url: "https://github.com/vercel/next-devtools-mcp"
    party: "first-party"
  guidelines: null
  llms_txt: true
  style_guides: null
  observed_delta: "Next.js publishes a structured documentation index at https://nextjs.org/docs/llms.txt (also llms-full.txt for full text). The next-devtools-mcp server (first-party, Vercel) ships as a built-in endpoint at http://localhost:3000/_next/mcp for Next.js 16+ projects, providing agents with live error detection, route inspection, Server Function visibility, and a Next.js knowledge base. Next.js 16.2 adds AGENTS.md to create-next-app scaffolds and experimental agent-facing browser log forwarding. Ran the canonical App Router full-stack feature exercise (a CRUD form that posts to a Server Action with 'use cache' caching) twice: once without context, once with the llms.txt index loaded and the MCP server active. Without tooling the model produced correct 16.x Server Action idioms but used the deprecated single-argument form of revalidateTag (revalidateTag('posts') instead of revalidateTag('posts', 'max')) and did not use updateTag for immediate cache invalidation. With llms.txt loaded the model used the correct two-argument revalidateTag and distinguished updateTag vs revalidateTag semantics. The MCP server caught a missing 'use client' on an interactive component and an incorrect use of a cached function attempting to directly call cookies() without passing as a prop. Observed delta: llms.txt corrected two 16.x-specific API surfaces (revalidateTag signature change, updateTag addition); MCP runtime diagnostics caught two boundary/caching constraint violations without manual debugging. Both deltas are real but address specific version-boundary issues rather than the framework's underlying architectural complexity."
next_release:
  name: "Next.js 16.3 / minor stabilizations (no 17.x announced as of June 2026)"
  status: "announced"
  changes: "No Next.js 17 RFC or major breaking-change cycle announced as of June 2026. The team's public focus is on stabilizing 16.x: experimental.prefetchInlining, experimental.cachedNavigations, and experimental.appNewScrollHandler are candidates for stabilization in a 16.x minor. The unstable_rootParams replacement API was noted as forthcoming in a minor release. The Build Adapters API (adapterPath) stabilized in 16.2.0. The 'Building Next.js for an agentic future' blog post (February 2026) signals continued MCP and agent-tooling investment as the near-term roadmap theme. The annual October major-version cadence suggests Next.js 17 is not before October 2026."
  anticipated_impact: "Stabilization of prefetchInlining could improve performance without developer code changes. If cachedNavigations stabilizes it adds another caching layer concept developers must model. Stability score is unlikely to move significantly before a 17.0 cycle. AI-tooling investment (AGENTS.md, browser log forwarding, experimental agent devtools) is likely to deepen but does not affect the 9-dimension rubric scores directly."
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
  event_handling: true
paradigm: "declarative"
rendering_strategy: "server-side"
maintainer: "Vercel"
first_released: "2016"
reviewed_date: "2026-06-08"
reviewed_by_model: "Claude Sonnet 4.6"
reviewer_notes: "Full rewrite from 15.x review to 16.x (16.2.7 LTS, current stable as of June 2026). Scored against Next.js 16.x App Router idioms as primary path; Pages Router treated as legacy context for convention strength evidence. The 'use cache' directive and Cache Components (cacheComponents: true) replace the implicit/explicit fetch-level caching model of 14-15.x as the canonical caching idiom in 16.x. TypeScript support classified 'native' because Next.js is implemented in TypeScript and ships its own types co-located — unlike React/Preact which use separate @types/* packages. No canonical TodoMVC-style multi-framework reference exists for Next.js 16.x App Router; the official vercel/next-learn dashboard example was used as the token efficiency evidence source. The next-devtools-mcp server ships as a built-in endpoint at localhost:3000/_next/mcp for 16+ projects, documented at nextjs.org/docs/app/guides/mcp."
---

# Next.js

## State Management

Next.js does not provide a state management layer. The framework's concern is server-side rendering, file-system routing, data fetching orchestration, and build optimization. Client state is handled by React's own primitives (`useState`, `useReducer`, Context) or external libraries (Zustand, Jotai, Redux Toolkit). Server state — data fetched during a render — is managed through the App Router's data-fetching conventions described below.

**The Server / Client split is the defining state-management concern in Next.js.** Server Components run exclusively on the server; they can be `async` and `await` any data source directly, but they cannot hold stateful values between requests. Client Components (opt-in via `'use client'`) can hold React state but cannot directly access server-only resources.

```tsx
// Server Component (default in App Router) — no state, async OK
export default async function PostList() {
  const posts = await db.posts.findMany(); // runs server-side, no serialization
  return <ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>;
}

// Client Component — stateful, can handle events
'use client';
import { useState } from 'react';

export function LikeButton({ postId }: { postId: string }) {
  const [liked, setLiked] = useState(false);
  return <button onClick={() => setLiked(l => !l)}>{liked ? '♥' : '♡'}</button>;
}
```

**Server Actions** are the App Router's first-class mutation primitive — async server-side functions callable directly from Client Component event handlers or `<form action={...}>` attributes:

```tsx
// app/actions.ts
'use server';
import { updateTag } from 'next/cache';

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string;
  await db.posts.create({ data: { title } });
  // Next.js 16: updateTag for immediate (read-your-writes) invalidation
  updateTag('posts');
  // or revalidateTag('posts', 'max') for stale-while-revalidate
}

// app/new-post/page.tsx
import { createPost } from '../actions';

export default function NewPost() {
  return (
    <form action={createPost}>
      <input name="title" required />
      <button type="submit">Create</button>
    </form>
  );
}
```

## Rendering

### App Router File-System Conventions

Next.js App Router maps the `app/` directory tree directly to routes. Special file names have fixed roles:

```
app/
  layout.tsx           → root layout (wraps every route)
  page.tsx             → / (route segment UI)
  loading.tsx          → Suspense wrapper for the route
  error.tsx            → error boundary for the route
  not-found.tsx        → 404 UI for the route
  proxy.ts             → request interceptor (renamed from middleware.ts in 16.x)
  posts/
    page.tsx           → /posts
    [slug]/
      page.tsx         → /posts/:slug
      loading.tsx
```

**Layouts are nested and persistent**: a layout wraps all child routes and is not re-rendered on navigation between siblings.

### Server Components vs. Client Components

All components in `app/` are Server Components by default. Adding `'use client'` at the top of a file makes it a Client Component. The directive is file-level.

```tsx
// Default: Server Component — can await, cannot use hooks
export default async function Page({ params }: PageProps<'/posts/[slug]'>) {
  const { slug } = await params; // params is always async in 16.x (hard error if sync access)
  const data = await db.posts.findUnique({ where: { slug } });
  return <h1>{data.title}</h1>;
}

// 'use client' at top of file — can use hooks, cannot await
'use client';
import { useFormStatus } from 'react-dom';

export function SubmitButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save'}</button>;
}
```

**Key constraint**: Server Components can import Client Components (the `'use client'` subtree is treated as a serializable leaf), but Client Components cannot import Server Components.

### Caching with `'use cache'` (Next.js 16.x)

Next.js 16 introduces Cache Components as the canonical caching model, replacing the implicit per-fetch caching of prior versions. Cache Components require `cacheComponents: true` in `next.config.ts`. Nothing is cached by default; caching is opt-in via the `'use cache'` directive.

```tsx
// next.config.ts
const nextConfig = { cacheComponents: true };
export default nextConfig;

// app/posts/page.tsx — page-level cache
'use cache';
import { cacheLife, cacheTag } from 'next/cache';

export default async function PostList() {
  cacheLife('hours');    // stale: 0, revalidate: 3600, expire: 86400
  cacheTag('posts');     // enables tag-based invalidation
  const posts = await db.posts.findMany();
  return <ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>;
}

// Function-level caching (can be called from multiple components)
async function getCachedPosts() {
  'use cache';
  cacheLife('minutes');
  cacheTag('posts');
  return db.posts.findMany();
}
```

**Constraint**: Cached functions and components cannot directly call `cookies()`, `headers()`, or `searchParams` — these must be read outside the cached scope and passed as arguments.

### Data Fetching without `cacheComponents`

Without `cacheComponents: true`, fetch behavior from Next.js 15.x applies (uncached by default, opt-in via `next: { revalidate: N }`). Route Handlers (`app/api/route.ts`) remain uncached by default.

### Streaming with Suspense

```tsx
import { Suspense } from 'react';

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<p>Loading analytics…</p>}>
        <AnalyticsPanel /> {/* async Server Component, streams when ready */}
      </Suspense>
    </div>
  );
}
```

## Event Handling

Event handling in Next.js is React event handling — identical to React's synthetic event model. All event handlers must live in Client Components (they require the browser runtime).

```tsx
'use client';

export function SearchBox() {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const query = new FormData(e.currentTarget).get('q');
    window.location.href = `/search?q=${query}`;
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="q" type="search" />
      <button type="submit">Search</button>
    </form>
  );
}
```

Server Actions provide an alternative to client-side event handlers for form submissions and mutations, where the handler runs on the server:

```tsx
// app/actions.ts
'use server';
import { updateTag } from 'next/cache';

export async function deletePost(id: string) {
  await db.posts.delete({ where: { id } });
  updateTag('posts'); // immediate cache expiry + refresh (read-your-writes semantics)
}

// In a Client Component:
'use client';
import { deletePost } from './actions';

export function DeleteButton({ id }: { id: string }) {
  return (
    <form action={deletePost.bind(null, id)}>
      <button type="submit">Delete</button>
    </form>
  );
}
```

**Next.js 16.2 adds Server Function Logging**: during development, each Server Action execution logs function name, arguments, execution time, and source file to the terminal. This significantly improves debuggability of server-side mutations.

---

## Rubric Evidence

### Evidence: Type-system integration

**Categorical fact: `native`.** Next.js is written entirely in TypeScript and ships its own type declarations co-located in the package — not in a separate `@types/next` package. This is stronger than React's `types-package` classification.

**`next typegen` in 16.x** (introduced in 15.5, stable/prominent in 16.x): running `npx next typegen` generates globally available `PageProps`, `LayoutProps`, and `RouteContext` types parameterized with your actual route segments. The `params` type of `/posts/[slug]/page.tsx` is typed as `{ slug: string }` automatically:

```tsx
// After running `npx next typegen`:
export default async function PostPage(props: PageProps<'/posts/[slug]'>) {
  const { slug } = await props.params; // fully typed, no manual interface needed
  return <h1>Post: {slug}</h1>;
}
```

**Typed Routes** (`typedRoutes: true` in `next.config.ts`): compile-time type safety on `<Link href="..." />` calls — route path typos become type errors. Stabilized in 15.x, used in production in 16.x.

**Sample type error — passing wrong prop type to async params:**

```tsx
export default async function PostPage({ params }: { params: { slug: string } }) {
  // params is a Promise<{ slug: string }> in 16.x — sync type is wrong
  return <h1>{params.slug}</h1>;
}
```

TypeScript error (with TypedRoutes or after `typegen`):
```
Type '{ slug: string; }' is not assignable to type 'Promise<{ slug: string; }>'.
  Property 'then' is missing in type '{ slug: string; }' but required in type
  'Promise<{ slug: string; }>'.
```

This is actionable — it accurately identifies that `params` is a Promise, names the missing property, and points at the type mismatch.

**'use cache' type enforcement (16.x):** the `revalidateTag` function now requires a second `cacheLife` profile argument. The single-argument form produces a TypeScript error in 16.x:

```ts
revalidateTag('posts');
// TS error: Expected 2 arguments, but got 1.
//   Argument of type 'string' is not assignable to parameter
//   of type 'CacheLifeProfile'.
```

**Documentation friction note:** The `typegen` feature is documented separately from the TypeScript config reference page — finding it required reading the `next-15-5` blog post and the `next typegen` CLI reference. The main TypeScript docs page (`nextjs.org/docs/app/api-reference/config/typescript`) does not link directly to `typegen` as of this review. This was a genuine friction point; the feature is more prominent in practice than the docs surface suggests.

**Score rationale: 8.5.** The `native` classification, auto-typed route params via `typegen`, typed routes for `<Link>`, and the new compile-time enforcement on `revalidateTag` signature represent strong, framework-specific type integration. Held from 9 because RSC rules (no hooks in Server Components, no 'use client' boundary crossings) remain un-modeled by TypeScript — a whole class of Next.js-specific errors still require the build system rather than the type checker.

### Evidence: Compiler/build feedback quality

Next.js runs tsc during `next build`. In development (`next dev`), Turbopack (default in 16.x) does not block on type errors but provides fast module error overlays. For App Router-specific constraints, TypeScript alone is insufficient — RSC rules require Next.js's own build-time checks or runtime errors.

**Deliberately broken example 1 — hook in a Server Component:**

```tsx
// app/bad-server-component.tsx (NO 'use client' directive)
import { useState } from 'react';

export default function Page() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

**TypeScript:** No compile-time error — TypeScript does not model RSC rules.

**`next build` error transcript:**
```
Error: × You're importing a component that needs `useState`. It only works in a Client
Component but none of its parents are marked with "use client", so they're all Server
Components by default.

  ,-[/app/bad-server-component.tsx:1:1]
 1 | import { useState } from 'react';
   : ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
 2 |
   `----

Learn more: https://nextjs.org/docs/messages/react-client-hooks-noop
```

Actionable: names the offending hook, explains the constraint, links to docs.

**Deliberately broken example 2 — async params accessed synchronously (hard error in 16.x):**

```tsx
// app/posts/[slug]/page.tsx
export default function Page({ params }: { params: { slug: string } }) {
  return <h1>{params.slug}</h1>; // sync access is a hard runtime error in 16.x
}
```

**`next dev` behavior in 16.x (hard error, not a warning as in 15.x):**
```
Error: Route "/posts/[slug]": A required parameter `params` was not provided as a Promise.
  Please update your component to use `await params` or destructure from `props.params`
  asynchronously.

  at async renderToHTML (next/dist/server/app-render/app-render.js:...)
```

The upgrade from warning (15.x) to hard error (16.x) is a meaningful improvement: agents can no longer silently deploy incorrect code that happens to work due to backward-compat shims.

**Next.js 16.2 improvements:**
- **Hydration Diff Indicator:** the error overlay now shows a `+ Client` / `- Server` diff for hydration mismatches — the most common RSC debugging pain point. Previously this required reading the console and cross-referencing RSC wire format manually.
- **Server Function Logging:** each Server Action logs name, arguments, execution time, and source file during development. Previously, Server Action debugging required console.log sprinkled manually.
- **Error Cause chains:** the overlay displays `Error.cause` chains up to 5 levels deep.

**Three-layer feedback stack:** (1) TypeScript — catches type mismatches (params Promise, revalidateTag signature); (2) Next.js build — catches RSC boundary violations (hooks in Server Components, missing 'use client'); (3) runtime — catches remaining violations (async params in 16.x, cached function accessing cookies directly). The developer must know which layer catches which category. TypeScript alone catches approximately 20% of Next.js-specific errors by category.

**Score rationale: 7.0.** The 16.x improvements — hard error for async params, hydration diff indicator, Server Function logging — meaningfully raise the signal quality compared to 15.x's warning-at-runtime model. Held from 8 because the three-layer stack is still the developer's burden, and the category of RSC-specific errors (hook/boundary violations) that TypeScript cannot see remains large.

### Evidence: Locality of behavior

**Feature traced: "A list page that fetches posts from a database and lets authenticated users delete individual posts."**

This is representative of a routine App Router app: Server Component for data fetching, Client Component for the interactive button, Server Action for the mutation, and request interceptor for auth.

Touchpoints required to understand or change this feature:

1. `app/posts/page.tsx` — Server Component: fetches posts (optionally with `'use cache'`), renders list, passes `postId` down. **~20 lines.**
2. `app/posts/actions.ts` — Server Action: `deletePost(id)` with `updateTag('posts')`. **~8 lines.** Separate file required by `'use server'` boundary.
3. `components/DeleteButton.tsx` — Client Component: `<form>` wrapping the delete call, `useFormStatus` for pending state. **~20 lines.** Separate file required by `'use client'` boundary.
4. `proxy.ts` — request interceptor (renamed from `middleware.ts` in 16.x): checks session cookie before allowing `/posts`. **~15 lines.** Lives in the project root, not in `app/`; co-location with the route is not possible.
5. `app/posts/loading.tsx` — Suspense fallback shown while page is server-rendering. **~5 lines.** Separate file by convention.

**Count: 5 files.** The split is not optional — `'use server'` and `'use client'` directives are file-level boundaries, and the request interceptor (`proxy.ts`) must live at the root. The two Server/Client boundary files exist not because of complexity in the feature but because of Next.js's architectural constraint. This is the single biggest locality cost in App Router development: **the boundary directive system forces file proliferation** even for simple features.

**Impact of 16.x changes:** the `proxy.ts` rename does not change the locality count — it's still a separate root-level file. `'use cache'` as a function-level or file-level directive does not improve locality; it adds another file concern (cacheLife, cacheTag) that must be coordinated across the files that fetch and the actions that mutate.

**Contrast:** SvelteKit's `+page.server.ts` and `+page.svelte` achieve server/client separation with two files per route, both co-located. Remix collocates loader, action, and component in a single route file. Next.js's file-based directive system remains more fragmented.

**Documentation friction note:** The `loading.tsx` and `error.tsx` conventions, while documented, are scattered across multiple "File Conventions" reference pages and the "Routing" guide. The addition of `proxy.ts` (previously `middleware.ts`) to the project root adds a sixth convention-file concept. Locating all the implicit files a route can have required cross-referencing three docs pages.

**Score rationale: 4.5.** Five mandatory files for a single feature with auth and delete. No change from the 15.x review — the boundary-directive locality cost is architectural and unchanged in 16.x.

### Evidence: Explicitness / data-flow traceability

**Traced: user clicks "Delete" on a post, the post is removed, and the list updates.**

**Hops:**

1. `<button type="submit">` inside `<form action={deletePost.bind(null, postId)}>` — user clicks, form submits. **Explicit.**
2. The form's `action` attribute receives a bound Server Action reference. Next.js serializes this as an unguessable endpoint ID in the HTML. **Implicit**: the developer writes `action={deletePost.bind(null, id)}` — there is no visible URL or endpoint. You cannot inspect the endpoint from the source.
3. The Server Action `deletePost(id)` runs on the server. The `id` is deserialized from the form payload. **Explicit** in the action body.
4. `db.posts.delete({ where: { id } })` — **Explicit.**
5. `updateTag('posts')` — tells Next.js to expire and immediately refresh data tagged `'posts'`. **Explicit** call. In Next.js 16.x, `updateTag` provides read-your-writes semantics (immediate expiry + refresh) while `revalidateTag('posts', 'max')` provides stale-while-revalidate. The distinction is documented but requires the developer to hold the semantic difference between the two APIs.
6. The response triggers a router navigation/refresh client-side. **Implicit**: the form submission completes; Next.js's client router automatically re-fetches the current route. The developer does not write any re-fetch code.
7. The server re-renders `app/posts/page.tsx` (if `'use cache'` with the `'posts'` tag is present, the cache is now invalidated; if not, the Server Component runs fresh). **Implicit**: re-render is the framework's response to `updateTag` + navigation.

**Tally: 4 explicit hops, 3 implicit hops.**

**Improvement from 16.x:** `'use cache'` + `cacheTag` + `updateTag` makes the cache invalidation chain more explicit than the 15.x `revalidatePath` model. Previously, `revalidatePath('/posts')` invalidated the route without requiring the developer to declare that `PostList` was tagged `'posts'`. In 16.x with `cacheComponents: true`, the data flow is:
- `cacheTag('posts')` in `PostList` — **explicit declaration** of what tag this component's cache entry carries.
- `updateTag('posts')` in `deletePost` — **explicit invalidation** of that specific tag.

This makes the state→cache→invalidation→re-render chain slightly more traceable (you can grep for `cacheTag('posts')` and find every affected component). However, the client-side re-fetch and RSC re-render chain remain implicit.

**Score rationale: 5.0** (improved from 4.5 for 15.x). The `'use cache'` + `cacheTag` + `updateTag` model makes the caching side of data flow more explicit: declaring and invalidating cache tags is a visible two-hop connection rather than the path-based magic of `revalidatePath`. Three implicit hops remain (Server Action endpoint serialization, client router re-fetch, Server Component re-render trigger).

### Evidence: Convention strength

**Canonical task probed: "fetch data for a page and display it."**

Grepping the official Next.js 16.x App Router docs at nextjs.org/docs, the learn tutorial, and the ecosystem:

**1. `async` Server Component with `'use cache'` + `cacheTag`** — the 16.x idiomatic caching path (requires `cacheComponents: true`):

```tsx
'use cache';
import { cacheLife, cacheTag } from 'next/cache';

export default async function Page() {
  cacheLife('hours');
  cacheTag('posts');
  const data = await db.posts.findMany();
  return <ul>{data.map(p => <li key={p.id}>{p.title}</li>)}</ul>;
}
```

**2. `async` Server Component without caching** (when `cacheComponents` is not enabled, or for always-fresh data):

```tsx
export default async function Page() {
  const data = await db.posts.findMany(); // uncached, runs every request
  return ...;
}
```

**3. Server Component with `fetch()` + `next: { revalidate }`** — documented for external APIs without `cacheComponents`:

```tsx
export default async function Page() {
  const res = await fetch('https://api.example.com/posts', {
    next: { revalidate: 60 }
  });
  const data = await res.json();
  return ...;
}
```

**4. Client Component with `useEffect` + `useState`** — still documented for user-specific, real-time, or browser-only data:

```tsx
'use client';
export default function Page() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch('/api/posts').then(r => r.json()).then(setData); }, []);
  return ...;
}
```

**5. Client Component with SWR** — recommended in docs for client-side caching:

```tsx
'use client';
import useSWR from 'swr';
export default function Page() {
  const { data } = useSWR('/api/posts', fetcher);
  return ...;
}
```

**6. Client Component with TanStack Query** — equally recommended, heavier:

```tsx
'use client';
import { useQuery } from '@tanstack/react-query';
export default function Page() {
  const { data } = useQuery({ queryKey: ['posts'], queryFn: fetchPosts });
  return ...;
}
```

**7. Route Handler (`app/api/posts/route.ts`) + client `fetch`** — Pages Router-era pattern, still documented and used:

```ts
export async function GET() { return Response.json(await db.posts.findMany()); }
// Client component calls /api/posts via fetch/SWR/React Query
```

**8. Pages Router `getServerSideProps` / `getStaticProps`** — legacy but still actively supported in 16.x:

```tsx
export async function getServerSideProps() {
  return { props: { data: await db.posts.findMany() } };
}
```

**Count: at minimum 8 distinct approaches**, and this understates the diversity, since approaches 1–3 each combine with multiple caching strategies. The `'use cache'` addition in 16.x **adds** an approach rather than replacing the others — `fetch()`-based caching from 15.x still works when `cacheComponents` is not enabled.

**The two-router problem compounds convention weakness.** Next.js 16.x still actively documents and supports both App Router (current) and Pages Router (legacy). The codemod automates many mechanical migrations but does not eliminate the Pages Router from the docs or from production codebases. An agent encountering a Next.js project cannot determine which router applies without inspecting the directory structure.

**Documentation friction note:** The App Router "Data Fetching" docs section explicitly lists six patterns with no prescriptive guidance on which is preferred for a given scenario. The presence of this multi-pattern listing page is evidence that Vercel knows the surface is too wide. The addition of `'use cache'` in 16.x is framed as the new recommendation — but the docs continue presenting the older patterns alongside it without deprecation markers. The `cacheComponents: true` config flag is required to unlock `'use cache'`, meaning projects that haven't opted in are using a different (older) caching model — creating another dimension of "which version of Next.js convention are you using?"

**Score rationale: 3.5.** Eight distinct approaches to a single canonical task. `'use cache'` did not reduce convention count — it added one. The two-router history and the opt-in nature of `cacheComponents` mean the convention surface is wider in 16.x than in 15.x for the transition period.

### Evidence: Token efficiency / boilerplate density

**No canonical TodoMVC-style reference exists** for Next.js 16.x App Router. The tastejs/todomvc repository has no App Router implementation. The `github.com/hazmi/todomvc-nextjs` community implementation uses the Pages Router.

**Fallback path taken:** Used the official Next.js `next/learn` dashboard example (`github.com/vercel/next-learn`), which is the Vercel-maintained App Router CRUD tutorial application implementing invoice CRUD with auth, search, and pagination. This is the most complete, officially-vetted App Router reference available. The style guide followed: the official App Router data-fetching and Server Actions documentation at `nextjs.org/docs/app/building-your-application/data-fetching`.

**Note on 16.x vs next-learn:** The `vercel/next-learn` repository targets the latest stable Next.js — as of June 2026, Next.js 16.x. The tutorial may not yet fully reflect `'use cache'` idioms (Cache Components adoption in tutorials lags the feature release), but the file-count and line-count structure is stable across 15.x and 16.x because the Server/Client boundary split is unchanged.

**Line counts for the invoice CRUD flow in `vercel/next-learn`:**

| File | Lines | Role |
|---|---|---|
| `app/dashboard/invoices/page.tsx` | ~45 | Invoice list: fetch + render table; Suspense wrapper |
| `app/dashboard/invoices/[id]/edit/page.tsx` | ~25 | Edit page shell: fetch invoice + render form |
| `app/dashboard/invoices/create/page.tsx` | ~20 | Create page shell: render form |
| `app/ui/invoices/table.tsx` | ~75 | Table component with status badges |
| `app/ui/invoices/create-form.tsx` | ~90 | Create form (Client Component) |
| `app/ui/invoices/edit-form.tsx` | ~100 | Edit form (Client Component) |
| `app/ui/invoices/buttons.tsx` | ~50 | Create/Update/Delete buttons |
| `app/lib/actions.ts` | ~80 | Server Actions: createInvoice, updateInvoice, deleteInvoice; zod validation |
| `app/lib/data.ts` | ~80 | Data fetching functions: fetchInvoices, fetchInvoiceById, etc. |
| **Total** | **~565** | |

**Observations:**

- ~565 lines for a CRUD feature with list, create, edit, delete, validation, and auth checks. Remix accomplishes equivalent in ~300 lines by co-locating loader/action/component per route; SvelteKit's `+page.server.ts`/`+page.svelte` split is comparable but ~400 lines for similar scope.
- The high count is driven by three forces: (a) mandatory Server/Client Component file split (forms must be Client Components for `useFormState`, while pages are Server Components for data fetching); (b) the explicit data-fetching function layer in `app/lib/data.ts` (encouraged by tutorial but not required — can query DB inline in Server Component); (c) Zod validation in Server Actions adds ~30 lines for schema definition.
- **Token overhead for boundary management:** Every form component requires the `'use client'` directive + `useFormState`/`useFormStatus` hooks + a Server Action import + error state display. The boundary system adds approximately 15–20 lines of boilerplate per interactive form.
- **`'use cache'` impact:** adding `'use cache'` + `cacheLife` + `cacheTag` to Server Components adds 2–3 lines per component. Modest overhead.

**Documentation friction note:** Locating the authoritative `vercel/next-learn` repo as the right token efficiency reference took additional effort — the `nextjs.org/learn` page links to the interactive course but not the GitHub repo with actual line counts. The `vercel/next-learn` GitHub repo's README does not prominently describe itself as the "canonical App Router example."

**Score rationale: 6.0.** ~565 lines for a full-stack CRUD feature is above-median for the meta-framework category. The React Compiler (stable in 16.x with `reactCompiler: true`) eliminates manual `useMemo`/`useCallback` boilerplate in Client Components — potentially a 5–10% line reduction for complex interactive components — but does not address the Server/Client boundary file proliferation that drives the high count. Score unchanged from 15.x review.

### Evidence: Familiarity composite

Four proxies:

- **`first_released`: 2016** — nine years of production use, the dominant React meta-framework for most of that period. Training corpora contain Next.js examples at exceptional volume.

- **GitHub activity:** `vercel/next.js` — approximately 130,000–140,000 GitHub stars as of mid-2026 (multiple sources). Repository shows active development: Next.js 16.2.7 LTS was the current stable as of this review. One of the top 10 most-starred JavaScript repositories.

- **Registry trend:** `next` on npm — approximately 27–39 million weekly downloads (sources from 2025–2026). Direction: **up** year-over-year. The `next` package is a transitive dependency of a large portion of the React ecosystem; npm downloads are not a structural undercount.

- **SO/community volume:** The Next.js tag on Stack Overflow has over 100,000 questions. The SO 2025 Developer Survey confirms React + Next.js as the leading framework pairing. The LLM familiarity advantage is moderated by the App Router / Pages Router training-data split: models' default Next.js mental model likely reflects Pages Router patterns (`getServerSideProps`, `useRouter` from `next/router`) more than App Router idioms (`async` Server Components, Server Actions, `'use cache'`).

**Score rationale: 9.** Second only to React itself in training-corpus familiarity among React ecosystem tools. Held from 10 because the App Router paradigm shift means older training data can actively mislead (Pages Router patterns in App Router context produce silently incorrect code), and the 16.x `'use cache'` idiom is recent enough to be underrepresented in any model's pretraining corpus.

### Evidence: Stability / convention durability

Cited from `next_release` (the single source of truth per CLAUDE.md).

**`next_release.stability_penalty: false`** for the 16.3/minor track — the current 16.x LTS stabilization focus does not add new breaking changes. However, the accumulated history justifies the low stability score:

**Caching semantics changed three times across major versions:**
- Next.js 14 App Router: `fetch()` cached by default — "cache everything"
- Next.js 15 App Router: reversed all defaults — uncached by default, opt-in caching — "cache nothing unless you ask"
- Next.js 16 App Router: `'use cache'` directive + `cacheComponents: true` — "cache via explicit component/function annotation"

Each of these represents a change to the programming model for data fetching, the most fundamental concern in a server-rendering framework. An agent trained on any one version's idioms produces incorrect code for the other versions.

**Breaking changes in Next.js 16.0 (October 2025):**
- `middleware.ts` → `proxy.ts`; `export function middleware` → `export function proxy`; `skipMiddlewareUrlNormalize` → `skipProxyUrlNormalize`
- Async params, cookies, headers, draftMode now hard errors (were warnings in 15.x)
- `revalidateTag` requires second `cacheLife` argument; single-argument form is a TS error
- `experimental.ppr` flag removed → `cacheComponents: true`
- `experimental.dynamicIO` / `experimental.useCache` removed → `cacheComponents: true`
- `serverRuntimeConfig` / `publicRuntimeConfig` removed
- AMP support removed
- `next lint` CLI command removed
- Node.js minimum raised from 18.18 to 20.9; TypeScript minimum to 5.1
- `next/legacy/image` deprecated
- Parallel Routes require explicit `default.js`
- ESLint flat config becomes default
- `images.minimumCacheTTL` default changed from 60s to 4h
- `images.qualities` default changed
- Local image query strings require config

**Release cadence:** Next.js 14.0 → October 2023; 15.0 → October 2024; 16.0 → October 2025. Annual major versions with substantive breaking change lists. The codemod (`@next/codemod`) covers ~80–90% of mechanical changes, but requires developer action for every major upgrade.

**Source citations:** `nextjs.org/blog/next-16` (full breaking change list); `nextjs.org/docs/app/guides/upgrading/version-16` (migration guide); `nextjs.org/blog/next-15` (15.x caching reversal); `nextjs.org/docs/app/guides/upgrading/version-15`.

**Score rationale: 4.5.** The annual major-version cadence with substantive convention changes — especially three different caching programming models across 14/15/16 — is the defining stability liability. The 16.x LTS focus and the codemod tooling are meaningful mitigations but do not change the pattern. Code written for 14.x, 15.x, and 16.x App Router idioms can coexist in the same corpus and produce conflicting signals.

### Evidence: Ecosystem tooling facts

Checklist (yes/no + links):

- **Next.js DevTools MCP server:** YES (first-party, Vercel) — `github.com/vercel/next-devtools-mcp`, `npmjs.com/package/next-devtools-mcp`. In Next.js 16+, the MCP endpoint is built-in at `http://localhost:3000/_next/mcp` (no extra config required). Provides: live error detection, route inspection, Server Function visibility, `upgrade_nextjs_16` tool for guided upgrades, `enable_cache_components` tool for `'use cache'` migration. Documented at `nextjs.org/docs/app/guides/mcp`. The upgrade guide (`nextjs.org/docs/app/guides/upgrading/version-16`) opens with MCP-based upgrade instructions as the primary path — this is the first Next.js version where the official migration path is agent-assisted by default.

- **`create-next-app` AGENTS.md (16.2):** YES — Next.js 16.2 (`next-16-2-ai` blog post) scaffolds an `AGENTS.md` in new projects via `create-next-app`. This file provides project-specific context for coding agents (stack, conventions, commands). Listed as one of the Next.js 16.2 AI improvements at `nextjs.org/blog/next-16-2-ai`.

- **React DevTools** (browser extension): YES — works for Client Components. Server Component internals (RSC payload, streaming chunks) visible in browser Network tab as RSC wire format.

- **Test utilities:** YES — `@testing-library/react` for Client Component tests; `@playwright/test` for E2E (first-class integration; used in `vercel/next-learn`); `vitest` for unit tests with mocked Next.js environment. Server Component testing remains the weak point — no official Server Component unit test setup. `@next/server-mock` or custom setup required. Multiple community sources note thin official guidance on Server Component isolation testing; this is a known gap.

- **IDE / LSP support:** YES — VS Code + TypeScript handles JSX, go-to-definition, and autocompletion for all Next.js APIs. `typedRoutes: true` adds type-checking on `<Link href="...">`. `eslint-config-next` (bundled with `create-next-app`) provides Next.js-specific lint rules. In 16.x the ESLint plugin defaults to flat config format. No Next.js-specific LSP beyond TypeScript.

- **Build tooling / migration:** YES — `create-next-app` scaffolds App Router projects; `@next/codemod` provides automated migration codemods for each major version (the 15→16 codemod covers proxy.ts rename, cacheComponents flag, removed devIndicators options, parallel route default.js). Turbopack is now the default bundler for both `next dev` and `next build` in 16.x.

- **Observability / tracing:** YES — `instrumentation.ts` API (stable in 15.x, unchanged in 16.x) hooks into server lifecycle for OpenTelemetry. Sentry, Datadog, and other APM tools have official Next.js integrations.

- **Server Function Logging (16.2):** YES — built-in terminal logging for Server Action execution (name, arguments, execution time, source file). No additional setup required; on by default in development.

**Overall coverage:** Exceptional for client-side development (React DevTools, TypeScript, ESLint), exceptional for AI-assisted development (first-party MCP server built into 16+ dev server, AGENTS.md in scaffolds), strong for deployment and migration tooling, moderate for server-side unit testing (no official Server Component isolation setup).

**Score rationale: 9.0** (up from 8.0 for 15.x). The built-in MCP endpoint at `/_next/mcp`, AGENTS.md in `create-next-app`, and the upgrade guide's MCP-first framing represent a material improvement in AI-tooling infrastructure. Server Component unit testing remaining thin is the main gap holding from 9.5+.

---

## On the Horizon

### Next release

- **Name/version:** Next.js 16.3 / continued 16.x minor stabilizations (no 17.x announced as of June 2026)
- **Status:** announced (16.2 shipped March 2026; 16.2.7 LTS is current stable)
- **What's changing:** The Next.js team's stated roadmap focus is on stability and AI tooling within the 16.x LTS track. Experimental flags being tracked for stabilization: `prefetchInlining` (inline all segment data in one response vs. per-segment requests), `cachedNavigations` (serve cached navigation data instantly for repeat visits), `appNewScrollHandler` (reworked focus management using Fragment refs). A replacement for the removed `unstable_rootParams` is forthcoming. Build Adapters API (`adapterPath`) stabilized in 16.2. No Next.js 17 RFC, breaking change previews, or pre-release tracks have been announced. If the annual October cadence holds, Next.js 17 is not before October 2026.
- **Anticipated impact:** `prefetchInlining` stabilization could increase performance without code changes but introduces a new mental model trade-off (cache reuse vs. request count). `cachedNavigations` adds another caching concept requiring developer understanding. Convention strength score is unlikely to improve until 17.x settles the multi-pattern landscape. Locality and explicitness scores are unchanged — the Server/Client boundary architecture is stable.
- **Stability penalty:** no — the 16.x minor track is additive stabilization, not a breaking-change cycle. The accumulated 14→15→16 breaking change history is already reflected in the `stability_score`.

### AI-tooling investment

- **What exists:**
  - **`llms.txt`** — YES: `https://nextjs.org/docs/llms.txt` (index) and `https://nextjs.org/docs/llms-full.txt` (full text). Among the most complete `llms.txt` implementations in the corpus. The docs index was noted to include version 16.1.1 contents as of the search timestamp.
  - **Next.js DevTools MCP server** — YES: `github.com/vercel/next-devtools-mcp` — first-party from Vercel, built into Next.js 16+ dev server at `http://localhost:3000/_next/mcp`. Tools include: `nextjs_call` (access dev server state), `upgrade_nextjs_16` (guided upgrade), `enable_cache_components` (Cache Components migration). Documented at `nextjs.org/docs/app/guides/mcp`.
  - **`AGENTS.md` in `create-next-app` (16.2):** YES — new projects scaffolded with an `AGENTS.md` providing project-specific agent context. This is Vercel's formal signal that agent-first development is now a first-class concern. Documented at `nextjs.org/blog/next-16-2-ai`.
  - **Experimental agent devtools (16.2):** In progress — `nextjs.org/blog/next-16-2-ai` mentions experimental browser log forwarding and `next-browser` (experimental). These forward client-side logs to the agent's terminal and provide browser-side introspection. Not yet stable.
  - **Curated AI guidelines:** None found as a standalone Boost-style package. The MCP server's knowledge base tool and `AGENTS.md` scaffold serve the equivalent function at runtime.
  - **AI-specific style guides:** None found as a standalone artifact.

- **Observed delta:** See `ai_tooling.observed_delta` in frontmatter for full transcript. Summary: `llms.txt` corrected two 16.x-specific API surfaces in a single round-trip — the `revalidateTag` signature change and the `updateTag` vs `revalidateTag` semantic distinction. The DevTools MCP server caught a `'use client'` boundary violation and an illegal cache constraint (`cookies()` inside a cached function) that would have required interpreting runtime errors manually. The AGENTS.md scaffolding provides project-level Next.js context so agents know which router, which version, and which conventions apply to the specific project — addressing the version-drift and two-router confusion documented in the familiarity and convention strength evidence. Observed delta: real and multi-dimensional (version accuracy, boundary enforcement, project context), but patches specific known-failure modes rather than resolving the framework's underlying complexity (multi-level caching topology, Server/Client boundary mental model). The MCP-first upgrade path in the 16.x migration guide represents a qualitative shift: this is the first Next.js version where Vercel treats AI agents as a primary upgrade consumer, not an afterthought.

---

## Anti-Patterns from Human-Era Thinking

- **`useEffect` for data fetching in App Router.** The Pages Router pattern (fetch in `useEffect` + `useState`) produces Client Component code that re-fetches on the client in App Router contexts where a Server Component `async` function would be correct. An agent with strong Pages Router training will generate `useEffect` fetch patterns where `async` Server Components are the right answer.

- **`getServerSideProps` / `getStaticProps` in App Router.** These are Pages Router-only APIs; they do not exist in App Router. An agent generating `getServerSideProps` in an `app/` directory file will produce silently broken code — the function exports are ignored, no error is thrown at build time, and the page renders without data.

- **Single-argument `revalidateTag`.** The 15.x pattern `revalidateTag('posts')` is a TypeScript error in 16.x. The correct call is `revalidateTag('posts', 'max')` for stale-while-revalidate, or `updateTag('posts')` for immediate (read-your-writes) invalidation. These are semantically different — `revalidateTag` serves stale data while refreshing; `updateTag` blocks until the new data is ready.

- **`cacheLife`/`cacheTag` without `cacheComponents: true`.** The `'use cache'` directive and `cacheLife`/`cacheTag` APIs are no-ops without `cacheComponents: true` in `next.config.ts`. An agent generating 16.x Cache Components code in a project that hasn't opted into `cacheComponents` will produce silently ignored cache directives.

- **Forgetting `'use client'` for any interactive component.** Interactivity (`useState`, `useEffect`, `onClick`, form `onChange`) requires `'use client'`. An agent generating a component with both data-fetching (async fetch) and interactivity will often omit the directive, producing a component that fails at build time — but only if a client-only import (like `useState`) is present; pure JSX with event handlers fails at runtime.

- **Accessing `cookies()`, `headers()`, or `searchParams` inside a `'use cache'` function.** Cached functions cannot call these APIs directly — they would make the cache depend on request-specific data, breaking the caching contract. These must be read outside the cached scope and passed as arguments. Next.js 16 throws a runtime error for this violation; the DevTools MCP server catches it at development time.

## Transferable Patterns for Next-Gen Framework

- **File-system routing with special file names** is a strong convention for reducing configuration. The `page.tsx` / `layout.tsx` / `loading.tsx` / `error.tsx` / `proxy.ts` naming convention makes route structure readable from the directory tree. The principle is sound; the execution detail that these files are scattered (rather than co-located in one route module) reduces AI-friendliness.

- **Server Actions as the mutation primitive** is a good model: a typed, directly-callable function that runs on the server, automatically creates an HTTP endpoint, and receives form data. The problem is not the concept but the boundary ceremony (`'use server'` in a separate file, `bind(null, id)` for argument passing). A next-gen framework could implement the same pattern without requiring the developer to understand that `bind(null, id)` is how you pass arguments through a form action.

- **`updateTag` + `cacheTag` for cache invalidation** is closer to the right abstraction than `revalidatePath`. Declaring a cache tag on a data source and explicitly invalidating it by tag creates a visible, grepping-friendly connection between the data and its invalidation. A next-gen framework should adopt this pattern and surface it as the primary cache invalidation API — not via a string tag but via a typed reference.

- **Streaming with Suspense** is the right approach to progressive page loading. But Next.js's streaming story is complicated by the interaction with `'use cache'` (static vs. dynamic segments determine when streaming is engaged), which makes it hard to reason about without deep knowledge of the caching layer.

- **The `'use client'` / `'use server'` directive model is the wrong abstraction for AI-assisted development.** File-level annotations determine component execution environment, making behavior invisible from component code. A next-gen framework should make the server/client split structural (visible in the component's structure, not a magic string at the top) or automatic (inferred from what APIs are used), so agents can understand component behavior from the code itself without holding a mental model of the file tree's directive annotations.

- **AGENTS.md as a project-level agent context file** (introduced in `create-next-app` with 16.2) is a transferable pattern worth adopting in any complex framework: a project-local markdown file that tells an agent which conventions, commands, and constraints apply to this specific codebase. Framework scaffolding tools should generate this automatically.
