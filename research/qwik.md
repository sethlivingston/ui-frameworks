---
name: "Qwik"
category: "full-framework"
github_url: "https://github.com/QwikDev/qwik"
docs_url: "https://qwik.dev"
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

# Qwik

> **2026 update note (2026-06-07):** Qwik 2.0 (beta) is close to a rewrite — packages move from `@builder.io/qwik` to `@qwik.dev/*`, serialized output drops comment-node markers, and new primitives (`useAsyncComputed$`, `worker$`) extend the resumability model into async state and Web Workers. The core "resumability instead of hydration" philosophy below is unchanged, but component-model and serialization details will likely need a refresh once 2.0 ships stable.

## Philosophy & Mental Model

Qwik is **"a framework reimagined for the edge"** that eliminates traditional hydration through **resumability**—the ability to pause execution on the server and resume it on the client without re-running application logic.

**Mental model**: **Instant interactivity through lazy execution**. Where other frameworks download and execute all component code to "hydrate" the page, Qwik serializes listeners, state, and component boundaries directly into HTML. JavaScript only loads when users interact with specific features.

**Core principles:**

1. **Resumability, Not Hydration** - No client-side re-execution of server logic
2. **Lazy Execution** - Download and execute code only when needed
3. **Fine-Grained Lazy Loading** - Every function can be a separate chunk
4. **Serialization-First** - State, listeners, and closures serialize to HTML
5. **$ = Lazy Boundary** - `$` suffix marks optimizer split points

**Key insight**: Qwik inverts the typical framework startup. Instead of "download all code, execute, attach listeners," it's "HTML has everything, load code on-demand." The framework asks: **"What's the minimum JavaScript needed at startup?"** Answer: **~1KB**.

Qwik achieves instant Time to Interactive (TTI) regardless of application size. A 1MB app and a 10KB app both start in ~1KB of JavaScript.

Created by Miško Hevery (creator of Angular) and team, focusing on performance as a core architectural principle.

## State Management

### Signals (Fine-Grained Reactivity)

**useSignal** for reactive primitives:

```typescript
import { component$, useSignal } from '@builder.io/qwik';

export default component$(() => {
  const count = useSignal(0);

  return (
    <button onClick$={() => count.value++}>
      Count: {count.value}
    </button>
  );
});
```

Signals automatically track dependencies and update only affected components.

**useStore** for reactive objects:

```typescript
export default component$(() => {
  const state = useStore({
    name: 'John',
    age: 30,
    todos: []
  });

  return (
    <div>
      <p>{state.name}, {state.age}</p>
      <button onClick$={() => state.age++}>Increment age</button>
    </div>
  );
});
```

Both signals and stores are **serializable**—Qwik can pause them on server, resume on client.

### Read Pattern

Access signal values via `.value`:

```typescript
const count = useSignal(10);
console.log(count.value); // 10
```

Access store properties directly:

```typescript
const state = useStore({ name: 'Alice' });
console.log(state.name); // 'Alice'
```

### Update Pattern

**Signals**: Mutate `.value`:

```typescript
count.value = 42;
count.value++;
```

**Stores**: Mutate properties directly:

```typescript
state.name = 'Bob';
state.todos.push({ id: 1, text: 'Buy milk' });
```

Updates trigger fine-grained re-renders—only components subscribed to changed values update.

### Server State (Route Loaders)

**routeLoader$** for server-side data fetching:

```typescript
// src/routes/products/[id]/index.tsx
import { routeLoader$ } from '@builder.io/qwik-city';

export const useProductDetails = routeLoader$(async (requestEvent) => {
  const productId = requestEvent.params.id;
  const product = await db.products.findUnique({ where: { id: productId } });

  if (!product) {
    throw requestEvent.fail(404, { message: 'Product not found' });
  }

  return { product };
});

export default component$(() => {
  const productSignal = useProductDetails();

  return (
    <div>
      <h1>{productSignal.value.product.name}</h1>
      <p>${productSignal.value.product.price}</p>
    </div>
  );
});
```

Loaders run **only on the server** after every navigation. Data is serialized into HTML and available immediately in components.

### Mutations (Route Actions)

**routeAction$** for server-side mutations:

```typescript
import { routeAction$, Form, zod$, z } from '@builder.io/qwik-city';

export const useAddProduct = routeAction$(
  async (data, requestEvent) => {
    const product = await db.products.create({
      data: {
        name: data.name,
        price: parseFloat(data.price)
      }
    });

    return { success: true, productId: product.id };
  },
  zod$({
    name: z.string().min(1),
    price: z.string().regex(/^\d+\.?\d*$/)
  })
);

export default component$(() => {
  const action = useAddProduct();

  return (
    <Form action={action}>
      <input name="name" />
      <input name="price" />
      <button type="submit">Add Product</button>

      {action.value?.success && (
        <p>Product {action.value.productId} added!</p>
      )}
      {action.value?.fieldErrors?.name && (
        <p>Error: {action.value.fieldErrors.name}</p>
      )}
    </Form>
  );
});
```

Actions run **only on the server**. Forms work without JavaScript, enhanced when JS loads.

### Async Handling

**useResource$** for async data:

```typescript
import { component$, useResource$, Resource } from '@builder.io/qwik';

export default component$(() => {
  const resource = useResource$(async ({ track }) => {
    const response = await fetch('https://api.example.com/data');
    return response.json();
  });

  return (
    <Resource
      value={resource}
      onPending={() => <p>Loading...</p>}
      onRejected={(error) => <p>Error: {error.message}</p>}
      onResolved={(data) => <p>Data: {data.value}</p>}
    />
  );
});
```

### Derived State

**useComputed$** for computed values:

```typescript
import { component$, useSignal, useComputed$ } from '@builder.io/qwik';

export default component$(() => {
  const count = useSignal(5);
  const doubled = useComputed$(() => count.value * 2);

  return (
    <div>
      <p>Count: {count.value}</p>
      <p>Doubled: {doubled.value}</p>
      <button onClick$={() => count.value++}>Increment</button>
    </div>
  );
});
```

Or use plain JavaScript for simple derivations:

```typescript
const items = useStore([
  { price: 10, qty: 2 },
  { price: 5, qty: 3 }
]);

const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
const tax = subtotal * 0.08;
const total = subtotal + tax;
```

## Rendering

### Resumability Mechanism

**Server rendering** serializes everything into HTML:

```html
<button on:click="./chunk-abc123.js#handleClick_symbol" q:id="0">
  Click me
</button>
<script type="qwik/json">
  {"ctx":{"count":{"value":0}},"subs":[["1","count"]]}
</script>
```

**HTML contains**:
- Event listeners as attributes (`on:click="..."`)
- State serialized as JSON
- Component subscriptions for fine-grained updates

**Client resumption**:
1. Qwikloader (~1KB) installs global listener
2. User clicks button
3. Lazy-load `chunk-abc123.js`
4. Execute `handleClick_symbol`
5. Update only subscribed components

No hydration—app is instantly interactive.

### Component Model

**component$** defines components:

```typescript
import { component$ } from '@builder.io/qwik';

export const Header = component$(() => {
  return (
    <header>
      <h1>My App</h1>
    </header>
  );
});
```

`$` suffix tells optimizer to split into separate chunk.

**Props**:

```typescript
interface ButtonProps {
  text: string;
  onClick$: () => void;
}

export const Button = component$<ButtonProps>((props) => {
  return <button onClick$={props.onClick$}>{props.text}</button>;
});

// Usage
<Button text="Click me" onClick$={() => console.log('clicked')} />
```

Props are shallowly immutable. Use signals for mutable data:

```typescript
interface CounterProps {
  count: Signal<number>;
}

export const Counter = component$<CounterProps>((props) => {
  return (
    <div>
      Count: {props.count.value}
      <button onClick$={() => props.count.value++}>+</button>
    </div>
  );
});
```

### Lazy Loading

**Every function can be lazy**:

```typescript
export default component$(() => {
  const handleClick$ = $(() => {
    console.log('Clicked!');
  });

  return <button onClick$={handleClick$}>Click</button>;
});
```

`$()` creates a QRL (Qwik URL)—a reference to code that loads on-demand.

### Conditional Rendering

Standard JSX:

```typescript
export default component$(() => {
  const user = useSignal<User | null>(null);

  return (
    <div>
      {user.value ? (
        <p>Welcome, {user.value.name}!</p>
      ) : (
        <a href="/login">Login</a>
      )}
    </div>
  );
});
```

### List Rendering

```typescript
export default component$(() => {
  const items = useStore([
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' }
  ]);

  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
});
```

### Slots

```typescript
// Card.tsx
export const Card = component$(() => {
  return (
    <div class="card">
      <div class="header">
        <Slot name="header" />
      </div>
      <div class="body">
        <Slot />
      </div>
    </div>
  );
});

// Usage
<Card>
  <h2 q:slot="header">Title</h2>
  <p>Body content</p>
</Card>
```

## Event Handling

### Standard Events

**onClick$** (lazy):

```typescript
<button onClick$={() => console.log('Clicked')}>
  Click me
</button>
```

**Event object**:

```typescript
<input
  onInput$={(event, element) => {
    console.log('Value:', element.value);
    console.log('Event:', event);
  }}
/>
```

**Event types**:

```typescript
<div
  onClick$={() => {}}
  onMouseEnter$={() => {}}
  onKeyDown$={() => {}}
  onSubmit$={() => {}}
/>
```

### Forms

**Basic form** (works without JS):

```typescript
export const useCreateTodo = routeAction$(async (data) => {
  await db.todos.create({ data: { text: String(data.text) } });
  return { success: true };
});

export default component$(() => {
  const action = useCreateTodo();

  return (
    <Form action={action}>
      <input name="text" />
      <button type="submit">Add Todo</button>
    </Form>
  );
});
```

**Programmatic submission**:

```typescript
const action = useCreateTodo();

<button
  onClick$={async () => {
    const result = await action.submit({ text: 'New todo' });
    if (result.value.success) {
      console.log('Added!');
    }
  }}
>
  Add via JavaScript
</button>
```

### Custom Events

```typescript
// Child component
export const Child = component$(() => {
  return (
    <button
      onClick$={(event, element) => {
        element.dispatchEvent(
          new CustomEvent('custom', {
            detail: { message: 'Hello' },
            bubbles: true
          })
        );
      }}
    >
      Trigger
    </button>
  );
});

// Parent component
<div onCustom$={(event) => console.log(event.detail.message)}>
  <Child />
</div>
```

## Reuse Patterns

### Qwik City Routing

**File-based routing**:

```
src/routes/
  index.tsx              → /
  about/index.tsx        → /about
  blog/[slug]/index.tsx  → /blog/:slug
```

### Layouts

```typescript
// src/routes/layout.tsx
export default component$(() => {
  return (
    <div>
      <header>Shared Header</header>
      <main>
        <Slot />
      </main>
      <footer>Shared Footer</footer>
    </div>
  );
});
```

Nested layouts work like SvelteKit/Next.js.

### API Endpoints

```typescript
// src/routes/api/posts/index.ts
import type { RequestHandler } from '@builder.io/qwik-city';

export const onGet: RequestHandler = async (requestEvent) => {
  const posts = await db.posts.findMany();
  return requestEvent.json(200, posts);
};

export const onPost: RequestHandler = async (requestEvent) => {
  const body = await requestEvent.request.json();
  const post = await db.posts.create({ data: body });
  return requestEvent.json(201, post);
};
```

### Middleware

```typescript
// src/routes/layout.tsx
import { routeLoader$ } from '@builder.io/qwik-city';

export const onRequest = async (requestEvent) => {
  const user = await getUserFromCookie(requestEvent.cookie.get('sessionId'));
  requestEvent.sharedMap.set('user', user);
};
```

### server$ Functions

**Call server functions from client**:

```typescript
import { server$ } from '@builder.io/qwik-city';

const sendEmail = server$(async (email: string) => {
  await emailService.send(email);
  return { success: true };
});

export default component$(() => {
  return (
    <button onClick$={async () => {
      const result = await sendEmail('user@example.com');
      console.log(result);
    }}>
      Send Email
    </button>
  );
});
```

Server functions run only on server, callable from client.

## Developer Experience

### Learning Curve

**Moderate**. Familiar concepts (JSX, components, signals) but new paradigm (resumability).

**New concepts**:
- `$` suffix everywhere (lazy boundaries)
- Serialization constraints (what can/can't serialize)
- QRL (Qwik URLs) for lazy references
- Resumability mental model (vs hydration)

**Familiar concepts**:
- JSX templating
- Component composition
- Signals (similar to Solid, Svelte runes)
- Route loaders/actions (similar to Remix, SvelteKit)

### TypeScript

**First-class support**:

```typescript
export const Button = component$<{ text: string }>((props) => {
  return <button>{props.text}</button>;
});
```

Qwik infers types from loaders and actions automatically.

### Tooling

**Qwik CLI**: `pnpm create qwik@latest`

**Optimizer**: Build-time tool that:
- Splits code at `$` boundaries
- Generates QRL references
- Extracts lazy-loadable chunks

**Dev server**: Vite-powered, instant feedback

**Testing**: Built-in Vitest and Playwright

**Deployment**: Adapters for Vercel, Netlify, Cloudflare, AWS, self-hosted

### Serialization Constraints

**Can serialize**:
- Primitives (string, number, boolean)
- Objects, arrays
- Dates, URLs, Maps, Sets, RegExp, BigInt
- DOM references
- Signals and stores
- Functions wrapped in `$()` (QRLs)
- Promises

**Cannot serialize**:
- Class instances (without custom serialization)
- Functions not wrapped in `$()`
- Streams
- WeakMaps, WeakSets

Requires "thinking in serialization" when architecting apps.

### Boilerplate

**Minimal**:

```typescript
// src/routes/index.tsx
import { component$ } from '@builder.io/qwik';

export default component$(() => {
  return <h1>Hello World</h1>;
});
```

~6 lines for a page.

### Documentation

**Excellent**. https://qwik.dev has comprehensive guides, interactive playground, and clear explanations of resumability.

### Component Reusability Assessment

**Quality: Good (7.5/10)**

**Strengths**: Components are TypeScript JSX - familiar to React developers. Resumability makes components inherently performant. Lazy loading automatic - components loaded on interaction. Qwik City routes reusable. Stores work across components. TypeScript-first for type safety.

**Weaknesses**: `$` suffix convention (useSignal$, component$) is Qwik-specific. Optimizer required - can't use components outside Qwik. Serialization constraints limit what can be passed to components. Smaller ecosystem than React/Vue.

**Cross-Project Reuse**: Limited outside Qwik ecosystem. Within Qwik, excellent - components, stores, routes all portable. Cannot directly reuse React/Vue components (but community adapters exist). Middleware and loaders Qwik-specific.

**Design System Support**: Growing. Qwik UI provides headless components. Can adapt existing design systems with effort. Tailwind works well. Component libraries less mature than React/Vue.

## Maintainability

**Quality: Good (8/10)**

**Strengths**: TypeScript-first catches errors. Resumability means no hydration bugs. Optimizer errors clear. Signals prevent stale closures. File-system routing predictable. Progressive enhancement built-in. Serialization constraints force better architecture. Qwik Insights shows resumability analysis.

**Weaknesses**: `$` optimizer syntax requires learning. Serialization constraints can be confusing. Smaller community means less help. New paradigm (resumability) has learning curve. Debugging serialization issues tricky.

**Code Organization**: File-system routing (Qwik City). Components in `src/components/`. Routes in `src/routes/`. Stores and context for state. Layouts and middleware clear.

**Testing**: Vitest for unit tests. Playwright for E2E. Component testing requires understanding lazy loading. Stores can be tested in isolation. Progressive enhancement makes E2E testing simpler.

**Debugging**: Browser DevTools work. Network tab shows lazy-loaded chunks. Qwik Insights for performance analysis. TypeScript catches most bugs. Serialization errors shown at build time.

**Scalability**: Excellent. Resumability means instant interactivity at any scale. Lazy loading keeps bundles tiny. Streaming SSR for fast TTFB. Edge deployment supported. Prefetching strategies configurable.

**Breaking Changes**: Qwik is pre-1.0 (as of v1.x) but API stable. Optimizer updates can require changes. Migration guides provided. Community smaller so ecosystem changes faster.

## AI-Friendly Assessment

**Overall Score: 8/10**

### Strengths for AI-Assisted Development

**Explicit Lazy Boundaries**: The `$` suffix makes optimization split points visible:

```typescript
component$()     // Lazy-loaded component
onClick$()       // Lazy-loaded event handler
routeLoader$()   // Lazy-loaded server function
$()              // Lazy-loaded inline function
```

AI can see exactly where code splits happen.

**Serialization is Traceable**: Everything in HTML is serialized and visible:

```html
<button on:click="./chunk.js#handler" q:id="0">Click</button>
<script type="qwik/json">{"ctx":{"count":0}}</script>
```

AI can reason about what state exists and where.

**TypeScript-First**:

```typescript
export const Button = component$<{ text: string }>((props) => {
  return <button>{props.text}</button>;
});
```

Full type safety with inference from loaders/actions.

**Clear Server Boundary**: `routeLoader$` and `routeAction$` are obviously server-only:

```typescript
export const useUser = routeLoader$(async () => {
  return await db.user.findUnique(...); // Clearly server-side
});
```

No confusion about execution context.

**Fine-Grained Reactivity**: Signals are explicit:

```typescript
const count = useSignal(0);
count.value++; // Explicit mutation
```

AI can trace dependency graphs.

**Progressive Enhancement**: Forms work without JavaScript:

```typescript
<Form action={action}>
  <input name="email" />
  <button type="submit">Subscribe</button>
</Form>
```

AI can reason about fallback behavior.

**JSX Familiarity**: Standard JSX templating—AI trained on React patterns applies.

### Weaknesses for AI-Assisted Development

**$ Suffix Everywhere**: Unique to Qwik, less training data:

```typescript
component$()
onClick$={() => {}}
useTask$(() => {})
routeLoader$()
$(() => {})
```

AI must learn this convention specific to Qwik.

**Serialization Constraints**: AI must understand what can/can't serialize:

```typescript
// ✅ OK - primitives, objects, arrays
const state = useStore({ name: 'Alice', age: 30 });

// ❌ Not serializable - class instance
const state = useStore(new User('Alice', 30));

// ✅ OK - wrapped in $()
const fn = $(() => console.log('hello'));

// ❌ Not serializable - plain function
const fn = () => console.log('hello');
```

Requires understanding Qwik-specific constraints.

**QRL Abstraction**: Qwik URLs (QRLs) are novel:

```typescript
const handler = $(() => console.log('hello'));
// handler is QRL, not a function
```

AI must understand QRL references vs actual functions.

**Resumability Mental Model**: Different from all other frameworks. AI must understand:
- No hydration
- Serialization into HTML
- Lazy execution model
- How state/listeners "resume"

**Optimizer Magic**: The `$` tells optimizer to split code. AI must understand build-time transformations:

```typescript
// Source
onClick$={() => count.value++}

// Transformed to
onClick$={qrl('./chunk.js', 'handler_symbol')}
```

**Less Common Framework**: Newer framework with less training data than React, Vue, Svelte.

### Why 8/10?

Qwik scores high for:
- **Explicit lazy boundaries** (`$` suffix)
- **Clear server/client split** (routeLoader$, routeAction$)
- **Traceable serialization** (visible in HTML)
- **TypeScript-first**
- **Fine-grained signals**
- **Progressive enhancement**

Loses points for:
- Qwik-specific syntax (`$` everywhere)
- Serialization constraints unique to resumability
- QRL abstraction novelty
- Newer framework (less training data)
- Resumability mental model differs from all others

**Key Insight**: Qwik shows that **making optimization boundaries explicit** (via `$`) is highly AI-friendly. Rather than relying on framework magic, developers mark exactly where code should split. This explicitness helps both humans and AI understand performance implications.

The resumability paradigm eliminates hydration complexity, which is a win for AI—no need to reason about client-side re-execution of server logic. But the tradeoff is serialization constraints that AI must learn.

**Resumability is revolutionary** for performance but requires a mental shift. For AI trained primarily on hydration-based frameworks (React, Vue, etc.), Qwik's approach is novel. However, the explicit `$` markers make the model learnable.

Qwik's philosophy of "instant interactivity" aligns with future web performance needs. As apps grow larger, hydration costs increase linearly. Resumability stays constant at ~1KB regardless of app size—a paradigm worth understanding for next-gen framework design.

---

Sources:
- [Qwik Resumability Concept](https://qwik.dev/docs/concepts/resumable/)
- [Qwik Components Overview](https://qwik.dev/docs/components/overview/)
- [Qwik Route Loaders](https://qwik.dev/docs/route-loader/)
- [Qwik Actions](https://qwik.dev/docs/action/)
- [Understanding Resumability vs Hydration](https://leapcell.io/blog/unraveling-qwik-s-resumability-to-eliminate-hydration-overhead)
