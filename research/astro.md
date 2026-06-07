---
name: "Astro"
category: "meta-framework"
github_url: "https://github.com/withastro/astro"
docs_url: "https://astro.build"
implementation_language: "TypeScript"
status: "active"
type_system_score: null
compiler_feedback_score: null
locality_score: null
explicitness_score: null
convention_strength_score: null
token_efficiency_score: null
familiarity_score: null
stability_score: null
tooling_score: null
capabilities:
  state_management: false
  rendering: false
  event_handling: false
---

# Astro

> **2026 update note (2026-06-07):** Astro 6.0 (March 2026) shipped an experimental Rust compiler (replacing the Go-based one), a rewrite of the dev/build pipeline on Vite's Environment API, a built-in Fonts API, a CSP API, and Live Content Collections. It also raised the minimum to Node 22+. The Islands Architecture and "zero JS by default" philosophy described below are unchanged — this is a tooling/performance overhaul underneath the same mental model, not a paradigm shift.

## Philosophy & Mental Model

Astro is **"a server-first, content-driven web framework"** that pioneered **Islands Architecture**—rendering pages as static HTML with JavaScript only where interactivity is needed.

**Mental model**: **Content-first, JavaScript-last**. Most frameworks start with JavaScript and try to optimize. Astro starts with zero JavaScript and adds it only where explicitly requested. It's the opposite of a SPA.

**Core principles:**

1. **Zero JavaScript by Default** - Components render to HTML/CSS, no JS shipped
2. **Islands Architecture** - Interactive components ("islands") hydrate independently
3. **Framework-Agnostic** - Use React, Vue, Svelte, Solid in same project
4. **Content-Focused** - Built for content sites (blogs, docs, marketing)
5. **Server-First** - Rendering happens on the server at build time or request time

**Key insight**: Astro inverts the typical framework model. Instead of "JavaScript everywhere, optimize later," it's "HTML everywhere, add JavaScript selectively." The framework asks: **"Does this component need to be interactive?"** Most don't.

Astro achieves **63% Core Web Vitals passing rate** in real-world sites vs Next.js (27%), Nuxt (24%), Gatsby (42%).

## State Management

### No State Management (By Design)

Astro is **content-driven**, not app-driven. Most Astro sites have minimal state:

```astro
---
// Component script (server-side only)
const posts = await fetch('https://api.example.com/posts').then(r => r.json());
---

<ul>
  {posts.map(post => (
    <li>{post.title}</li>
  ))}
</ul>
```

Data fetches happen at build time or server render. No client-side state needed.

### Client State (Framework Components)

For interactive components, use framework-specific state:

**React component** (with state):

```tsx
// components/Counter.tsx
import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
```

**Astro page** (integrating React):

```astro
---
import Counter from '../components/Counter.tsx';
---

<html>
  <body>
    <h1>Static HTML</h1>
    <Counter client:load />
  </body>
</html>
```

`client:load` tells Astro to ship JavaScript for this component. Without it, renders as static HTML.

### Read Pattern

**Astro components** access data from frontmatter:

```astro
---
const { name, age } = Astro.props;
const greeting = `Hello, ${name}!`;
---

<p>{greeting}</p>
<p>Age: {age}</p>
```

**Framework components** use their own patterns (useState, Vue ref, Svelte stores, etc.).

### Update Pattern

**Astro components** are static—no updates. For interactivity, use framework components:

```astro
---
import TodoList from '../components/TodoList.svelte';
---

<TodoList client:load />
```

The Svelte component handles its own state updates.

### Async Handling

**Server-side async** in frontmatter:

```astro
---
const [user, posts] = await Promise.all([
  fetch('/api/user').then(r => r.json()),
  fetch('/api/posts').then(r => r.json()),
]);
---

<div>
  <h2>{user.name}</h2>
  <ul>
    {posts.map(post => <li>{post.title}</li>)}
  </ul>
</div>
```

Async happens at build/render time. HTML is fully resolved before sent to browser.

**Client-side async** in framework components:

```tsx
// React component
import { useEffect, useState } from 'react';

export default function LiveData() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/data')
      .then(r => r.json())
      .then(setData);
  }, []);

  return <div>{data ? data.message : 'Loading...'}</div>;
}
```

### Derived State

Use JavaScript in frontmatter:

```astro
---
const items = [{ price: 10, qty: 2 }, { price: 5, qty: 3 }];
const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
const tax = subtotal * 0.08;
const total = subtotal + tax;
---

<p>Subtotal: ${subtotal.toFixed(2)}</p>
<p>Tax: ${tax.toFixed(2)}</p>
<p>Total: ${total.toFixed(2)}</p>
```

No reactivity needed—runs once at build/render time.

## Rendering

### Islands Architecture

**Static HTML** (default):

```astro
---
const title = "Welcome";
---

<h1>{title}</h1>
<p>This is static HTML. No JavaScript shipped.</p>
```

**Interactive Island** (opt-in):

```astro
---
import Counter from '../components/Counter.tsx';
---

<div>
  <h1>Static header</h1>
  <Counter client:load /> {/* JavaScript only for this */}
  <footer>Static footer</footer>
</div>
```

Only `Counter` ships JavaScript. Header and footer are plain HTML.

### Client Directives

Control **when** JavaScript loads:

**client:load** - Hydrate immediately:

```astro
<Header client:load />
```

**client:idle** - Hydrate when browser is idle:

```astro
<Newsletter client:idle />
```

**client:visible** - Hydrate when scrolled into view:

```astro
<CommentsSection client:visible />
```

**client:media** - Hydrate based on media query:

```astro
<Sidebar client:media="(min-width: 768px)" />
```

**client:only** - Skip server rendering, client-only:

```astro
<ClientOnlyWidget client:only="react" />
```

### Server Islands

**server:defer** - Defer expensive server rendering:

```astro
<RecommendedProducts server:defer>
  <div slot="fallback">Loading recommendations...</div>
</RecommendedProducts>
```

Static page shell loads fast. Expensive component renders separately.

### Component Structure

**Astro component** syntax:

```astro
---
// Component script (server-side)
interface Props {
  title: string;
  count?: number;
}

const { title, count = 0 } = Astro.props;
---

<!-- Template (HTML) -->
<div>
  <h2>{title}</h2>
  <p>Count: {count}</p>
</div>

<style>
  div {
    border: 1px solid #ccc;
  }
</style>
```

**Code fence** (`---`) separates server-side script from template.

### Slots

**Default slot**:

```astro
<!-- Card.astro -->
<div class="card">
  <slot />
</div>

<!-- Usage -->
<Card>
  <p>This goes in the slot</p>
</Card>
```

**Named slots**:

```astro
<!-- Layout.astro -->
<html>
  <head>
    <slot name="head" />
  </head>
  <body>
    <slot name="body" />
  </body>
</html>

<!-- Usage -->
<Layout>
  <title slot="head">My Page</title>
  <main slot="body">Content</main>
</Layout>
```

### Conditional Rendering

Standard JavaScript:

```astro
---
const user = await getUser();
---

{user ? (
  <p>Welcome, {user.name}!</p>
) : (
  <a href="/login">Login</a>
)}
```

### List Rendering

Map in template:

```astro
---
const posts = await getPosts();
---

<ul>
  {posts.map((post) => (
    <li>
      <a href={`/posts/${post.slug}`}>{post.title}</a>
    </li>
  ))}
</ul>
```

### Multi-Framework Support

Mix React, Vue, Svelte in **one Astro file**:

```astro
---
import ReactCounter from '../components/Counter.tsx';
import VueCalendar from '../components/Calendar.vue';
import SvelteChart from '../components/Chart.svelte';
---

<div>
  <ReactCounter client:load />
  <VueCalendar client:visible />
  <SvelteChart client:idle />
</div>
```

Each framework component hydrates independently.

## Event Handling

### Static Components (No Events)

Astro components are static—no event handling:

```astro
<!-- This button does nothing -->
<button>Click me</button>
```

### Framework Components (Full Events)

Use framework-specific event handling:

**React**:

```tsx
export default function Button() {
  return <button onClick={() => alert('Clicked!')}>Click</button>;
}
```

**Vue**:

```vue
<template>
  <button @click="handleClick">Click</button>
</template>

<script setup>
function handleClick() {
  alert('Clicked!');
}
</script>
```

**Svelte**:

```svelte
<button on:click={() => alert('Clicked!')}>
  Click
</button>
```

### Forms

**Static form** (server-rendered):

```astro
<form action="/api/subscribe" method="POST">
  <input name="email" type="email" />
  <button type="submit">Subscribe</button>
</form>
```

**Interactive form** (framework component):

```tsx
// React component
export default function ContactForm() {
  const [email, setEmail] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    fetch('/api/contact', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={email} onChange={e => setEmail(e.target.value)} />
      <button type="submit">Submit</button>
    </form>
  );
}
```

## Reuse Patterns

### Astro Components

**Reusable layout**:

```astro
<!-- layouts/Layout.astro -->
---
interface Props {
  title: string;
}

const { title } = Astro.props;
---

<html>
  <head>
    <title>{title}</title>
  </head>
  <body>
    <slot />
  </body>
</html>

<!-- pages/index.astro -->
---
import Layout from '../layouts/Layout.astro';
---

<Layout title="Home">
  <h1>Welcome</h1>
</Layout>
```

### Framework Components

**Component library**:

```astro
---
import Button from '@/components/ui/Button.tsx';
import Card from '@/components/ui/Card.tsx';
---

<Card>
  <Button client:load>Click me</Button>
</Card>
```

Only `Button` is interactive. `Card` is static HTML.

### API Routes

**Endpoint** for data:

```ts
// src/pages/api/posts.json.ts
export async function GET() {
  const posts = await db.posts.findMany();
  return new Response(JSON.stringify(posts), {
    headers: { 'Content-Type': 'application/json' },
  });
}
```

Accessed at `/api/posts.json`.

## Developer Experience

### Learning Curve

**Low for HTML/CSS developers**. If you know HTML, you know Astro:

```astro
---
const greeting = "Hello";
---

<h1>{greeting}</h1>
```

**Moderate for framework users**. Understanding when to use Astro components vs framework components takes practice.

### TypeScript

**First-class support**:

```astro
---
interface Props {
  title: string;
  count?: number;
}

const { title, count = 0 } = Astro.props;
---

<h1>{title}: {count}</h1>
```

Type checking in frontmatter and templates.

### Tooling

**Astro CLI**: `npm create astro@latest`

**Dev server**: Fast refresh, instant feedback

**Integrations**: 100+ integrations (Tailwind, MDX, Partytown, etc.)

**Deployment**: Works anywhere—Vercel, Netlify, Cloudflare Pages, AWS, self-hosted

### File-Based Routing

```
src/pages/
  index.astro          → /
  about.astro          → /about
  blog/[slug].astro    → /blog/:slug
  api/posts.json.ts    → /api/posts.json
```

### Boilerplate

**Minimal**:

```astro
---
const posts = await fetch('/api/posts').then(r => r.json());
---

<ul>
  {posts.map(post => <li>{post.title}</li>)}
</ul>
```

~6 lines for full page with data fetching.

### Documentation

**Excellent**. https://docs.astro.build has comprehensive guides, clear examples, and concept explanations.

### Component Reusability Assessment

**Quality: Excellent (9/10)**

**Strengths**: Framework-agnostic - use React, Vue, Svelte, Solid components in same project. Astro components are portable across Astro projects. Content collections pattern reusable. Islands architecture makes any component portable. TypeScript support for type-safe props. Layouts and partials work like traditional templates.

**Weaknesses**: Astro-specific syntax (.astro files) not usable outside Astro. Component scripts run at build time, not runtime - different mental model. Islands require framework-specific wrappers. No runtime state management (by design).

**Cross-Project Reuse**: Excellent for framework components (React/Vue/etc work anywhere). Astro components require Astro. Content collections can be ported. Integration ecosystem (MDX, images, etc.) reusable.

**Design System Support**: Excellent. Can use any framework's component library. Tailwind, Shoelace, etc. all work. Multiple frameworks in one design system possible.

## Maintainability

**Quality: Excellent (8.5/10)**

**Strengths**: Zero JS by default means no runtime bugs. TypeScript-first. Build-time errors catch issues early. Content collections provide type-safe frontmatter. Static output is simple to debug. File-system routing is predictable. Island architecture isolates interactivity failures.

**Weaknesses**: Build-time vs runtime distinction can confuse. Multiple frameworks in one project increases complexity. Content layer abstraction adds learning curve. SSR mode debugging harder than static.

**Code Organization**: File-system routing. Content separated into collections. Components in `src/components/`. Layouts in `src/layouts/`. Clear separation of concerns.

**Testing**: Static sites easy to test (Playwright, Cypress). Components can be tested in isolation with their native framework tools. Content collections validate data at build time. Visual regression testing straightforward.

**Debugging**: Build errors very clear. TypeScript catches most issues. Static HTML easy to inspect. SSR debugging uses standard Node.js tools. Astro DevTools for island hydration.

**Scalability**: Excellent for content sites. Thousands of pages build quickly. Partial hydration means performance stays high. Can integrate with CMS at scale. Edge deployment for global performance.

**Breaking Changes**: Astro moves fast but provides clear migration guides. v2 → v3 → v4 required updates but automated codemods available. Content layer in v4 was significant change.

## AI-Friendly Assessment

**Overall Score: 8.5/10**

### Strengths for AI-Assisted Development

**Explicit Interactivity**: `client:*` directives make JavaScript boundaries crystal clear:

```astro
<Header />                  {/* Static HTML */}
<Counter client:load />     {/* Interactive */}
<Footer />                  {/* Static HTML */}
```

AI can instantly identify what's server-rendered vs client-hydrated.

**Zero JavaScript by Default**: Simplest possible output. AI doesn't need to reason about React hooks, virtual DOM, or state management for static content.

**TypeScript-First**:

```astro
---
interface Props {
  name: string;
  age?: number;
}
---
```

Types are explicit and easy to generate.

**Framework-Agnostic**: AI can use React, Vue, Svelte patterns independently. No need to learn Astro-specific state management—just use what the framework provides.

**HTML-Like Syntax**:

```astro
<h1>{title}</h1>
```

Familiar to AI trained on HTML and JSX.

**File-Based Routing**: Routes are explicit in file structure:
- `pages/blog/[slug].astro` → `/blog/:slug`

**Content-First**: Eliminates complex app state. Most Astro sites are read-heavy with minimal interactivity.

### Weaknesses for AI-Assisted Development

**Multi-Framework Complexity**: Supporting React, Vue, Svelte, Solid requires AI to understand all their patterns. Flexibility creates cognitive overhead.

**Frontmatter Syntax**: Code fence pattern is unique to Astro:

```astro
---
const data = await fetch(...);
---
```

Less common in training data than pure JS/JSX.

**Props vs Astro.props**:

```astro
const { title } = Astro.props; // Astro-specific
```

Not standard React/Vue props syntax.

**Static vs Interactive Mental Model**: AI must understand "this component won't have state" vs "this needs client:load." Requires architectural reasoning.

**Islands Coordination**: Multiple independent islands require understanding how they communicate (URL state, shared framework stores, custom events).

### Why 8.5/10?

Astro scores very high for:
- **Explicit server/client boundaries** (client:* directives)
- **Zero JavaScript default** (simplest output)
- **TypeScript-first**
- **Framework-agnostic** (leverage existing patterns)

But loses points for:
- Multi-framework complexity (need to know many frameworks)
- Unique frontmatter syntax
- Static vs interactive mental model

**Key Insight**: Astro shows that **inverting the default** (zero JS → opt-in JS) dramatically simplifies mental models. Most web content is static. By making that the default, Astro eliminates the complexity of state management, reactivity, and hydration for 80% of components.

For AI, the explicit `client:*` directives are ideal—no guessing about execution context. The tradeoff is needing to understand multiple framework paradigms, but that's manageable since each island is independent.

**Islands architecture is AI-friendly** because components are isolated, reducing cognitive load. AI can reason about one island at a time without tracking global state or complex interactions.

---

Sources:
- [Astro Islands Architecture](https://docs.astro.build/en/concepts/islands/)
- [Astro Framework Components](https://docs.astro.build/en/guides/framework-components/)
- [Astro Component Syntax](https://docs.astro.build/en/basics/astro-components/)
- [Astro Islands Explained](https://strapi.io/blog/astro-islands-architecture-explained-complete-guide)
