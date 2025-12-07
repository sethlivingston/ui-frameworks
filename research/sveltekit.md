---
name: SvelteKit
category: Meta-Framework
type: Svelte Framework
docs_url: https://kit.svelte.dev
github_url: https://github.com/sveltejs/kit
mcp_servers: null
implementation_language: TypeScript
reviewed_with_model: claude-sonnet-4-5-20250929
ai_friendliness_score: 9
---

# SvelteKit

## Philosophy & Mental Model

SvelteKit is **"the fastest way to build Svelte apps"**—a full-stack meta-framework built on Svelte. It's to Svelte what Next.js is to React or Nuxt is to Vue.

**Mental model**: **File-system routing + Svelte's reactivity**. SvelteKit handles routing, data fetching, server rendering, and deployment. Svelte handles UI reactivity and rendering. The framework extends Svelte's compiler-first approach to full-stack development.

**Core principles:**

1. **File-System Routing** - Directory structure defines routes
2. **Progressive Enhancement** - Forms work without JavaScript, enhance with it
3. **Server-First** - Load functions fetch data on server before rendering
4. **Type Safety** - Auto-generated TypeScript types from route structure
5. **Compiler-Powered** - Build-time optimization from Svelte's compiler

**Key insight**: SvelteKit treats **load functions as the server boundary**. `+page.js` runs anywhere. `+page.server.js` runs only on server. This explicit naming makes server/client split obvious.

SvelteKit is for building production Svelte apps with SSR, routing, and API endpoints.

## State Management

### Server State (Load Functions)

**Universal load** (`+page.js`) - runs on server and client:

```js
// src/routes/blog/[slug]/+page.js
export async function load({ params, fetch }) {
  const post = await fetch(`/api/posts/${params.slug}`).then(r => r.json());
  return { post };
}
```

**Server-only load** (`+page.server.js`) - server-only:

```js
// src/routes/dashboard/+page.server.js
import { db } from '$lib/database';

export async function load({ cookies }) {
  const userId = cookies.get('userId');
  const user = await db.user.findUnique({ where: { id: userId } });

  return { user };
}
```

`.server.js` never runs in browser—can access databases, private keys, etc.

**Read pattern**: Component receives data via `$props()`:

```svelte
<!-- +page.svelte -->
<script>
  let { data } = $props();
</script>

<h1>{data.user.name}</h1>
<p>{data.user.email}</p>
```

### Client State (Svelte Runes)

**$state** for local state:

```svelte
<script>
  let count = $state(0);
</script>

<button onclick={() => count++}>
  Count: {count}
</button>
```

**$derived** for computed values:

```svelte
<script>
  let count = $state(0);
  let doubled = $derived(count * 2);
</script>

<p>Count: {count}</p>
<p>Doubled: {doubled}</p>
```

### Mutations (Form Actions)

**Actions** handle POST requests:

```js
// src/routes/login/+page.server.js
import { fail, redirect } from '@sveltejs/kit';

export const actions = {
  default: async ({ request, cookies }) => {
    const formData = await request.formData();
    const email = formData.get('email');
    const password = formData.get('password');

    if (!email) {
      return fail(400, { email, missing: true });
    }

    const user = await authenticateUser(email, password);

    if (!user) {
      return fail(400, { email, incorrect: true });
    }

    cookies.set('sessionId', user.sessionId, { path: '/' });
    throw redirect(303, '/dashboard');
  }
};
```

**Form in component**:

```svelte
<!-- +page.svelte -->
<script>
  import { enhance } from '$app/forms';
  let { form } = $props(); // Receives validation errors
</script>

<form method="POST" use:enhance>
  <input name="email" type="email" value={form?.email ?? ''} />
  {#if form?.missing}
    <p>Email is required</p>
  {/if}
  {#if form?.incorrect}
    <p>Invalid credentials</p>
  {/if}
  <button type="submit">Login</button>
</form>
```

**Progressive enhancement**: Works without JavaScript. `use:enhance` adds client-side enhancements (loading states, focus management).

**Named actions**:

```js
export const actions = {
  login: async ({ request }) => { /* ... */ },
  register: async ({ request }) => { /* ... */ }
};
```

```svelte
<form method="POST" action="?/login">...</form>
<form method="POST" action="?/register">...</form>
```

### Update Mechanism

**After action completes**, load functions rerun automatically:

```js
// +page.server.js
export async function load() {
  return { todos: await db.todo.findMany() };
}

export const actions = {
  create: async ({ request }) => {
    const formData = await request.formData();
    await db.todo.create({ data: { title: formData.get('title') } });
    // Load function reruns automatically, fetching updated todos
  }
};
```

No manual invalidation needed—SvelteKit tracks dependencies.

### Async Handling

**Parallel loading**:

```js
export async function load({ fetch }) {
  const [user, posts, comments] = await Promise.all([
    fetch('/api/user').then(r => r.json()),
    fetch('/api/posts').then(r => r.json()),
    fetch('/api/comments').then(r => r.json()),
  ]);

  return { user, posts, comments };
}
```

SvelteKit runs all load functions concurrently—no waterfall.

**Streaming promises**:

```js
export async function load() {
  return {
    instant: 'This loads immediately',
    streamed: fetchSlowData() // Promise streams to browser
  };
}
```

```svelte
<script>
  let { data } = $props();
</script>

<p>{data.instant}</p>

{#await data.streamed}
  <p>Loading...</p>
{:then value}
  <p>{value}</p>
{/await}
```

### Derived State

Use `$derived`:

```svelte
<script>
  let { data } = $props();

  let subtotal = $derived(
    data.items.reduce((sum, item) => sum + item.price * item.qty, 0)
  );
  let tax = $derived(subtotal * 0.08);
  let total = $derived(subtotal + tax);
</script>

<p>Subtotal: ${subtotal.toFixed(2)}</p>
<p>Tax: ${tax.toFixed(2)}</p>
<p>Total: ${total.toFixed(2)}</p>
```

## Rendering

### File-System Routing

```
src/routes/
  +page.svelte           → /
  about/+page.svelte     → /about
  blog/[slug]/+page.svelte → /blog/:slug
```

**Route files**:

- `+page.svelte` - Page component
- `+page.js` - Universal load function
- `+page.server.js` - Server-only load + actions
- `+layout.svelte` - Layout wrapper
- `+layout.js` / `+layout.server.js` - Layout load
- `+server.js` - API endpoint
- `+error.svelte` - Error boundary

**`+` prefix** indicates route file (vs regular component).

### Layouts

**Root layout**:

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  let { children } = $props();
</script>

<nav>
  <a href="/">Home</a>
  <a href="/about">About</a>
</nav>

{@render children()}

<footer>© 2025</footer>
```

**Nested layouts**:

```
src/routes/
  +layout.svelte              → Root layout
  blog/+layout.svelte         → Blog layout
  blog/[slug]/+page.svelte    → Blog post
```

Layouts nest: Root → Blog → Page.

**Layout load functions** cascade data:

```js
// src/routes/+layout.server.js
export async function load({ cookies }) {
  const userId = cookies.get('userId');
  const user = userId ? await getUser(userId) : null;
  return { user };
}
```

All pages access `data.user`.

### Server Rendering

**Default**: SSR for initial request, client-side navigation after:

```svelte
<!-- +page.svelte -->
<script>
  let { data } = $props();
</script>

<h1>{data.title}</h1>
```

First load: server renders full HTML.
Navigation: client-side routing with data fetch.

**Page options**:

```js
// +page.js
export const ssr = true;  // Server-side render (default)
export const csr = true;  // Client-side render (default)
export const prerender = false; // Static generation
```

**Static site generation**:

```js
export const prerender = true;
```

Renders at build time to static HTML.

### Conditional Rendering

Standard Svelte:

```svelte
<script>
  let { data } = $props();
</script>

{#if data.user}
  <p>Welcome, {data.user.name}!</p>
{:else}
  <a href="/login">Login</a>
{/if}
```

### List Rendering

```svelte
<script>
  let { data } = $props();
</script>

<ul>
  {#each data.posts as post (post.id)}
    <li>
      <a href="/blog/{post.slug}">{post.title}</a>
    </li>
  {/each}
</ul>
```

`(post.id)` is the key for efficient updates.

## Event Handling

### Standard Events

```svelte
<script>
  let count = $state(0);
</script>

<button onclick={() => count++}>
  Increment: {count}
</button>
```

### Forms (Progressive Enhancement)

**Basic form** (works without JS):

```svelte
<form method="POST">
  <input name="title" />
  <button type="submit">Create</button>
</form>
```

**Enhanced form** (loading states, focus):

```svelte
<script>
  import { enhance } from '$app/forms';
</script>

<form method="POST" use:enhance>
  <input name="title" />
  <button type="submit">Create</button>
</form>
```

**Custom enhancement**:

```svelte
<script>
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';

  let loading = $state(false);
</script>

<form
  method="POST"
  use:enhance={() => {
    loading = true;

    return async ({ result }) => {
      loading = false;
      if (result.type === 'redirect') {
        goto(result.location);
      }
    };
  }}
>
  <input name="title" />
  <button type="submit" disabled={loading}>
    {loading ? 'Creating...' : 'Create'}
  </button>
</form>
```

### Custom Events

```svelte
<!-- Child.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
</script>

<button onclick={() => dispatch('message', { text: 'Hello' })}>
  Send
</button>

<!-- Parent.svelte -->
<Child onmessage={(e) => console.log(e.detail.text)} />
```

## Reuse Patterns

### Shared Layouts

```svelte
<!-- src/routes/app/+layout.svelte -->
<script>
  let { children, data } = $props();
</script>

<aside>{data.user.name}</aside>

<main>
  {@render children()}
</main>
```

All `/app/*` routes share this layout.

### API Routes

**Endpoint**:

```js
// src/routes/api/posts/+server.js
import { json } from '@sveltejs/kit';

export async function GET({ url }) {
  const limit = Number(url.searchParams.get('limit') ?? '10');
  const posts = await db.post.findMany({ take: limit });
  return json(posts);
}

export async function POST({ request }) {
  const data = await request.json();
  const post = await db.post.create({ data });
  return json(post, { status: 201 });
}
```

Accessed at `/api/posts`.

### Hooks

**Server hooks** (`src/hooks.server.js`):

```js
export async function handle({ event, resolve }) {
  event.locals.user = await getUserFromCookie(event.cookies.get('sessionId'));
  return resolve(event);
}
```

Runs before every request. `event.locals` available in load functions.

### Error Boundaries

**Per-route errors**:

```svelte
<!-- src/routes/blog/+error.svelte -->
<script>
  import { page } from '$app/stores';
</script>

<h1>{$page.status}: {$page.error.message}</h1>
```

Errors don't crash whole app—just the route segment.

## Developer Experience

### Learning Curve

**Low to Moderate**. If you know Svelte, SvelteKit is straightforward:
- File-system routing is intuitive
- Load functions are clear
- Actions are simpler than manual fetch

Requires understanding:
- When to use `+page.js` vs `+page.server.js`
- How layouts cascade
- Progressive enhancement patterns

### TypeScript

**Auto-generated types**:

```svelte
<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  // data is fully typed based on load function return
</script>
```

SvelteKit generates `./$types.d.ts` files automatically. No manual type definitions needed.

### Tooling

**SvelteKit CLI**: `npm create svelte@latest`

**Adapters** for deployment:
- `@sveltejs/adapter-auto` - Auto-detect platform
- `@sveltejs/adapter-vercel` - Vercel
- `@sveltejs/adapter-node` - Node.js server
- `@sveltejs/adapter-static` - Static site generation
- `@sveltejs/adapter-cloudflare` - Cloudflare Workers

**Dev server**: Hot module replacement, fast refresh

### Boilerplate

**Minimal**:

```svelte
<!-- src/routes/hello/+page.svelte -->
<script>
  let { data } = $props();
</script>

<h1>{data.message}</h1>
```

```js
// src/routes/hello/+page.js
export function load() {
  return { message: 'Hello World' };
}
```

~10 lines for full page with data.

### Documentation

**Excellent**. https://kit.svelte.dev has comprehensive guides, interactive tutorial, and API reference.

### Component Reusability Assessment

**Quality: Excellent (9/10)**

**Strengths**: Svelte components compile to framework-agnostic JS - can even use in React with adapters. .svelte files are clean and portable across SvelteKit projects. Layouts, load functions, actions all reusable. Stores work anywhere. TypeScript props for type safety. Preprocessors enable component variants.

**Weaknesses**: .svelte components need Svelte to render (but can package as web components). SvelteKit-specific features (load, actions) tied to framework. File-system routing creates coupling. Adapters are deployment-specific.

**Cross-Project Reuse**: Excellent within Svelte ecosystem. Components can be packaged and published. Stores work universally. Load functions pattern portable. Forms and actions require SvelteKit or similar. Can compile to web components for ultimate portability.

**Design System Support**: Excellent. Svelte's scoped styles perfect for design systems. Skeleton UI, Carbon, daisyUI all available. Component libraries (shadcn-svelte) thriving. Preprocessors enable theming.

## Maintainability

**Quality: Excellent (9.5/10)**

**Strengths**: Compiler catches errors at build time. Minimal runtime means fewer bugs. TypeScript support excellent. Scoped styles prevent CSS conflicts. Reactive statements explicit. File-system routing clear. Forms work without JS (progressive enhancement). Svelte DevTools for debugging. Updates rarely break existing code.

**Weaknesses**: Learning curve for reactive statements (`$:`). SvelteKit-specific features (load, actions) require understanding. Compiler errors can be cryptic. Smaller ecosystem means fewer third-party solutions.

**Code Organization**: File-system routing enforces structure. +page.svelte for UI, +page.server.ts for data, +layout.svelte for layouts. Clear separation. Stores in separate files. Utilities easily extracted.

**Testing**: Vitest for unit tests. Playwright for E2E. Svelte Testing Library for component tests. Load functions are pure functions - easy to test. Progressive enhancement makes testing simpler.

**Debugging**: Svelte DevTools show component tree and state. Build errors are clear. TypeScript catches most issues. Server logs vs client logs separated. Form actions use standard HTTP - Network tab works.

**Scalability**: Excellent. File-system routing scales to hundreds of routes. Code-splitting automatic. Adapters for Vercel, Cloudflare, Node. Edge deployment supported. Streaming and progressive enhancement keep sites fast.

**Breaking Changes**: Svelte 4 → 5 (runes) is significant shift but backward compatible. SvelteKit has stabilized post-1.0. Migration guides excellent. Compiler provides warnings for deprecated patterns.

## AI-Friendly Assessment

**Overall Score: 9/10**

### Strengths for AI-Assisted Development

**Explicit File Types**: Route files have explicit purposes:

```
+page.svelte        → Component
+page.js            → Universal load
+page.server.js     → Server load + actions
+layout.svelte      → Layout component
+server.js          → API endpoint
```

AI can instantly identify what each file does from its name.

**Clear Server/Client Boundary**: `.server.js` suffix makes server-only code obvious:

```js
// +page.server.js - NEVER runs in browser
import { db } from '$lib/database';
```

No guessing about execution context.

**Progressive Enhancement by Default**: Forms work without JavaScript:

```svelte
<form method="POST">
  <input name="email" />
  <button type="submit">Subscribe</button>
</form>
```

AI can reason about fallback behavior.

**Auto-Generated Types**: TypeScript types generated from load functions:

```ts
import type { PageData } from './$types'; // Auto-generated
```

AI doesn't need to write manual interfaces.

**Compiler-First**: Svelte's compiler (reviewed separately at 9/10) carries over. Explicit runes (`$state`, `$derived`) make reactivity visible.

**Explicit Data Flow**:
1. Load function fetches data
2. Component receives via `data` prop
3. Action handles mutation
4. Load reruns automatically

No complex state management libraries needed.

**Web Standards**: Form actions use standard FormData, Response objects:

```js
const formData = await request.formData();
const email = formData.get('email');
```

AI trained on web platform understands these patterns.

### Weaknesses for AI-Assisted Development

**Multiple File Types**: Each route can have 5+ files:
- `+page.svelte`
- `+page.js`
- `+page.server.js`
- `+layout.svelte`
- `+error.svelte`

AI must track which file to modify for each task.

**Universal vs Server Load Distinction**: Understanding when to use `+page.js` vs `+page.server.js` requires knowing:
- Does this need database access? (server)
- Does this return non-serializable data? (universal)
- Does this run on navigation? (universal runs both places)

Not immediately obvious from code.

**Layout Data Cascade**: Understanding which data comes from which layout requires tracing hierarchy:

```js
const { user } = await parent(); // Which parent? How far up?
```

**Runes Syntax**: Svelte 5 runes (`$state`, `$derived`, `$props`) are newer. Less training data than React hooks.

**Form Enhancement Magic**: `use:enhance` does a lot implicitly:

```svelte
<form method="POST" use:enhance>
```

AI must know what this directive does (updates `form` prop, handles redirects, manages focus, etc.).

### Why 9/10?

SvelteKit scores very high for:
- **Explicit file naming** (`+page.server.js` = server-only)
- **Auto-generated TypeScript types**
- **Clear data flow** (load → component → action → load)
- **Progressive enhancement** (forms work without JS)
- **Web standards** (FormData, Response)
- **Svelte's compiler** (explicit reactivity via runes)

Loses only 1 point for:
- Multiple file types per route (cognitive overhead)
- Universal vs server load distinction
- Layout data cascade complexity

**Key Insight**: SvelteKit demonstrates that **explicit file naming conventions** drastically improve AI-friendliness. The `+` prefix and `.server` suffix immediately communicate purpose. Compare:

**Unclear** (Next.js):
```
page.tsx        → Could be server or client component
route.ts        → API endpoint
layout.tsx      → Could be server or client
```

**Clear** (SvelteKit):
```
+page.svelte      → Client component
+page.server.js   → Server-only (load + actions)
+server.js        → API endpoint
```

SvelteKit's conventions make execution context explicit, which is exactly what AI needs to generate correct code.

The framework also shows that **compiler-first + progressive enhancement** is highly AI-friendly. Svelte's explicit runes eliminate "magic" reactivity, and forms working without JavaScript provide clear fallback behavior AI can reason about.

---

Sources:
- [SvelteKit Routing Documentation](https://svelte.dev/docs/kit/routing)
- [SvelteKit Form Actions](https://svelte.dev/docs/kit/form-actions)
- [SvelteKit Load Functions](https://svelte.dev/docs/kit/load)
- [SvelteKit 2.0 Routing Best Practices](https://www.javacodegeeks.com/2025/05/sveltekit-2-0-routing-and-layouts-best-practices-for-building-maintainable-apps.html)
