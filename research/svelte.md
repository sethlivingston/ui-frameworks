---
framework: "Svelte"
version: "5.45.6"
category: "full-framework"

# Links & Resources
github_url: "https://github.com/sveltejs/svelte"
docs_url: "https://svelte.dev"
npm_package: "svelte"
mcp_server:
  available: false
  url: null
  party: null

# Technical metadata
implementation_language: "JavaScript"
typescript_support: "native"
license: "MIT"
runtime: "browser"

# Capabilities
capabilities:
  state_management: true
  rendering: true
  event_handling: true

# Classification (for searching)
paradigm: "reactive"
state_model: "signals"
rendering_strategy: "compiler"

# Maintenance
maintainer: "Rich Harris / Community"
first_released: "2016"
status: "active"

# Review metadata
reviewed_date: "2025-12-06"
reviewed_by_model: "Claude Sonnet 4.5"
reviewer_notes: "Compiler-first framework with signals-based reactivity. Svelte 5 introduces runes ($state, $derived, $effect) replacing older reactive declarations. No Virtual DOM - compiles to direct DOM manipulation."
---

# Svelte

## State Management

### Philosophy & Mental Model

Svelte's state philosophy: **"Reactivity through compiler magic + signals"**

**Core paradigm shift**: Svelte is a **compiler**, not a runtime framework like React or Vue.

Key concepts:
- **Compiler-first**: Components compile to highly optimized vanilla JavaScript
- **No runtime overhead**: Framework disappears at build time
- **Signals under the hood**: Fine-grained reactivity (Svelte 5)
- **Reactive assignments**: `count++` just works (compiler makes it reactive)
- **Runes**: Compiler instructions for reactivity (`$state`, `$derived`, `$effect`)

**Mental model shift**:
- React/Vue: Runtime framework watches for changes
- Svelte: Compiler instruments your code to update DOM directly

**Philosophy**: "Write less code." Svelte aims for the most concise, readable syntax possible, letting the compiler handle complexity.

**Svelte 5 revolution**: Introduces **runes** (signals-based), replacing older `$:` reactive declarations with explicit primitives.

### Core Primitives

**Svelte 5 Runes** (modern, recommended):

**1. $state** - Reactive state:

```svelte
<script>
let count = $state(0)
let user = $state({ name: 'John', age: 30 })

function increment() {
  count++  // Reactive update!
}
</script>

<button onclick={increment}>{count}</button>
```

**Key feature**: Assignment is reactive. `count++` triggers UI update automatically.

**2. $derived** - Computed values:

```svelte
<script>
let count = $state(0)

// Auto-recomputes when count changes
let doubled = $derived(count * 2)

// Derived from derived
let quadrupled = $derived(doubled * 2)
</script>

<p>{count} × 2 = {doubled}</p>
<p>{count} × 4 = {quadrupled}</p>
```

**No dependency arrays!** Compiler tracks what `$derived` uses automatically.

**3. $effect** - Side effects:

```svelte
<script>
let count = $state(0)

// Runs when count changes
$effect(() => {
  console.log(`Count is now ${count}`)

  // Cleanup function (optional)
  return () => console.log('Cleanup')
})
</script>
```

**Automatic dependency tracking** - no dependency array needed!

**4. $props** - Component props:

```svelte
<script>
let { title, count = 0 } = $props()
// title is required, count has default value
</script>

<h1>{title}</h1>
<p>{count}</p>
```

**5. $state.frozen** - Immutable state:

```svelte
<script>
let data = $state.frozen({ value: 0 })

// ❌ Can't mutate frozen state
// data.value = 1  // Error!

// ✅ Must replace entire object
data = { value: 1 }
</script>
```

**Legacy Svelte (pre-5)** - Still works but deprecated:

```svelte
<script>
let count = 0  // Reactive by default (compiler magic)

// Reactive statement
$: doubled = count * 2

// Reactive block
$: {
  console.log(`Count is ${count}`)
}

// Reactive if
$: if (count > 5) {
  console.log('Count is high')
}
</script>
```

**The `$:` label** was Svelte's original reactivity mechanism. Svelte 5 runes are more explicit and portable.

### Update Mechanism

**Reactive assignments** - Svelte's magic:

```svelte
<script>
let count = $state(0)
let items = $state([1, 2, 3])
let user = $state({ name: 'John', age: 30 })

// All of these are reactive!
count++
count += 1
count = count + 1

items.push(4)  // Array mutations work!
items = [...items, 5]  // Reassignment works!

user.age++  // Property updates work!
user = { ...user, age: 31 }  // Replacement works!
</script>
```

**Huge difference from React**: Direct mutations work! Compiler instruments the code.

**How it works** (Svelte 5):
1. Compiler sees `count++`
2. Generates code like: `set_count(count + 1)`
3. `set_count` updates signal + invalidates dependencies
4. Only affected DOM nodes update (fine-grained!)

**No Virtual DOM diffing** - Direct DOM manipulation generated at compile time.

**Batching** - Automatic:

```svelte
<script>
function update() {
  count++
  message = 'Updated'
  items.push(4)
  // All updates batched, UI updates once
}
</script>
```

**Svelte 5 signals** (under the hood):

```javascript
// Conceptually, $state compiles to signals
const count = signal(0)

// $derived compiles to computed signals
const doubled = computed(() => count.value * 2)

// $effect compiles to effect subscriptions
effect(() => console.log(count.value))
```

**But you never see signals directly!** The compiler abstracts them.

**Fine-grained reactivity**:
- Only specific DOM nodes update, not entire components
- More efficient than Virtual DOM approaches
- Comparable to Solid's reactivity

### Read Pattern

**In templates** - Direct access:

```svelte
<script>
let count = $state(0)
let user = $state({ name: 'John' })
</script>

<div>{count}</div>
<div>{user.name}</div>
```

**In JavaScript** - Direct access (no `.value`!):

```svelte
<script>
let count = $state(0)

function increment() {
  count++  // No .value needed (unlike Vue)
  console.log(count)  // Direct access
}

let doubled = $derived(count * 2)  // Read directly
</script>
```

**Huge advantage over Vue**: No `.value` confusion. Same syntax everywhere.

**Stores** (for global state):

```javascript
// stores.js
import { writable } from 'svelte/store'

export const count = writable(0)

// Component
<script>
import { count } from './stores.js'

// Auto-subscribe with $
$count++  // Updates store

// Manual subscribe
count.subscribe(value => {
  console.log(value)
})

// Manual update
count.update(n => n + 1)
count.set(5)
</script>

<div>{$count}</div>
```

**Store auto-subscription** (`$` prefix):
- Svelte automatically subscribes on mount
- Automatically unsubscribes on unmount
- No memory leaks!

### Reactivity & Granularity

**Fine-grained reactivity** - Best in class:

**Svelte 5** (signals-based):
- Updates only specific DOM nodes that changed
- No component re-rendering
- No Virtual DOM diffing
- Comparable to Solid

**Example**:
```svelte
<script>
let count = $state(0)
let message = $state('Hello')
</script>

<div>
  <!-- Only this text node updates when count changes -->
  <span>{count}</span>

  <!-- Only this text node updates when message changes -->
  <span>{message}</span>

  <!-- This never updates -->
  <span>Static</span>
</div>
```

**Compiler generates code like**:
```javascript
// When count changes:
textNode1.data = count  // Only this node updates!

// When message changes:
textNode2.data = message  // Only this node updates!
```

**No component re-renders** - individual DOM elements update.

**Comparison**:
- **React**: Component + children re-render (coarse)
- **Vue**: Component re-renders, but fine-grained tracking (medium)
- **Svelte**: DOM nodes update directly (finest)
- **Solid**: DOM nodes update directly (finest, similar to Svelte 5)
- **Vanilla**: Manual updates (you control granularity)

**Performance**:
- No Virtual DOM overhead
- No diffing cost
- Minimal runtime code
- Extremely fast

### Async Handling

**No built-in async state primitives** (like TanStack Query):

**Common patterns**:

**1. Async/await in event handlers**:

```svelte
<script>
let data = $state(null)
let loading = $state(false)
let error = $state(null)

async function fetchData() {
  loading = true
  error = null

  try {
    const res = await fetch('/api/data')
    data = await res.json()
  } catch (e) {
    error = e
  } finally {
    loading = false
  }
}
</script>

<button onclick={fetchData}>Fetch</button>

{#if loading}
  <p>Loading...</p>
{:else if error}
  <p>Error: {error.message}</p>
{:else if data}
  <p>{JSON.stringify(data)}</p>
{/if}
```

**2. {#await} template block** (unique to Svelte):

```svelte
<script>
let dataPromise = $state(fetch('/api/data').then(r => r.json()))
</script>

{#await dataPromise}
  <p>Loading...</p>
{:then data}
  <p>Data: {JSON.stringify(data)}</p>
{:catch error}
  <p>Error: {error.message}</p>
{/await}
```

**This is brilliant!** Declarative async handling in templates.

**3. Stores for async state**:

```javascript
// stores.js
import { readable } from 'svelte/store'

export const time = readable(new Date(), (set) => {
  const interval = setInterval(() => {
    set(new Date())
  }, 1000)

  return () => clearInterval(interval)
})

// Component
<script>
import { time } from './stores.js'
</script>

<p>Time: {$time}</p>
```

**4. External libraries**:
- TanStack Query (Svelte Query)
- SWR equivalents
- Custom stores

### Derived State

**$derived rune** - Primary pattern (Svelte 5):

```svelte
<script>
let items = $state([
  { price: 10, qty: 2 },
  { price: 5, qty: 3 }
])

// Simple derivation
let total = $derived(
  items.reduce((sum, item) => sum + item.price * item.qty, 0)
)

// Chained derivations
let tax = $derived(total * 0.1)
let grandTotal = $derived(total + tax)
</script>

<p>Total: ${total}</p>
<p>Tax: ${tax}</p>
<p>Grand Total: ${grandTotal}</p>
```

**Automatic dependency tracking** - compiler figures out dependencies!

**Derived stores** (global derived state):

```javascript
import { writable, derived } from 'svelte/store'

const count = writable(0)

// Derive from one store
const doubled = derived(count, $count => $count * 2)

// Derive from multiple stores
const total = derived(
  [price, quantity],
  ([$price, $quantity]) => $price * $quantity
)
```

**Legacy reactive statements**:

```svelte
<script>
let count = 0

// Reactive statement
$: doubled = count * 2

// Reactive block
$: {
  const result = count * 3
  console.log(result)
}
</script>
```

**Comparison**:
- **React**: `useMemo` with dependency arrays (manual)
- **Vue**: `computed` with auto-tracking (automatic)
- **Svelte**: `$derived` with auto-tracking (automatic)
- **Jotai**: Derived atoms with auto-tracking (automatic)

Svelte's derivation is as good as Vue's, more concise than React's.

### Reuse Patterns

**1. Component composition** (primary):

```svelte
<!-- Button.svelte -->
<script>
let { text, onclick } = $props()
</script>

<button {onclick}>{text}</button>

<!-- App.svelte -->
<script>
import Button from './Button.svelte'
</script>

<Button text="Click me" onclick={() => alert('Clicked!')} />
```

**2. Stores** (shared state):

```javascript
// stores.js - Reusable store
export function createCounter(initial = 0) {
  const { subscribe, update } = writable(initial)

  return {
    subscribe,
    increment: () => update(n => n + 1),
    decrement: () => update(n => n - 1),
    reset: () => update(() => initial)
  }
}

// Multiple components can use same store
import { createCounter } from './stores.js'
const counter = createCounter(0)
```

**3. Actions** (reusable element behavior):

```javascript
// clickOutside.js
export function clickOutside(node) {
  function handleClick(event) {
    if (!node.contains(event.target)) {
      node.dispatchEvent(new CustomEvent('outclick'))
    }
  }

  document.addEventListener('click', handleClick, true)

  return {
    destroy() {
      document.removeEventListener('click', handleClick, true)
    }
  }
}

// Usage
<script>
import { clickOutside } from './clickOutside.js'
</script>

<div use:clickOutside on:outclick={() => console.log('Clicked outside')}>
  Content
</div>
```

**4. Snippets** (Svelte 5 - reusable template fragments):

```svelte
<script>
let items = $state([...])
</script>

{#snippet itemTemplate(item)}
  <li>{item.name} - ${item.price}</li>
{/snippet}

<ul>
  {#each items as item}
    {@render itemTemplate(item)}
  {/each}
</ul>
```

**5. Functions** (logic reuse):

```javascript
// useCounter.js
export function useCounter(initial = 0) {
  let count = $state(initial)

  return {
    get count() { return count },
    increment: () => count++,
    decrement: () => count--
  }
}

// Component
<script>
import { useCounter } from './useCounter.js'
const counter = useCounter(0)
</script>

<button onclick={counter.increment}>{counter.count}</button>
```

**Reuse assessment**:
- **Component composition**: Straightforward props/slots
- **Stores**: Global state sharing
- **Actions**: Element-level behavior reuse (unique to Svelte)
- **Snippets**: Template fragment reuse (new in Svelte 5)
- **Functions**: Logic reuse with runes

### Developer Experience

**Boilerplate: Very Low**
- Minimal syntax
- No imports for state (runes are language-level)
- Single-file components (.svelte)
- Less code than React or Vue

**Comparison**:
```svelte
<!-- Svelte - ultra concise -->
<script>
let count = $state(0)
</script>

<button onclick={() => count++}>{count}</button>

<!-- React - more verbose -->
<script>
const [count, setCount] = useState(0)
return <button onClick={() => setCount(count + 1)}>{count}</button>
</script>

<!-- Vue - medium -->
<script setup>
const count = ref(0)
</script>

<template>
  <button @click="count++">{{ count }}</button>
</template>
```

**DevTools: Good**
- Svelte DevTools browser extension
- Component tree inspection
- Props/state inspection
- Limited compared to React/Vue DevTools
- No time-travel debugging (yet)

**Debugging: Good**
- Compiled code is readable
- Source maps work
- Can inspect generated JavaScript
- Less magic than Vue (no Proxy confusion)

**Time travel: No**
- Not built into DevTools
- Could implement with stores

**TypeScript support: Excellent**
- Native TypeScript support
- Strong type inference
- Generic components
- `<script lang="ts">` for TypeScript

### AI-Friendly Assessment

**What makes Svelte state management AI-friendly:**

✅ **Minimal syntax**
- `let count = $state(0)` is extremely clear
- No ceremony, no imports for basic state
- Less code = less to generate/understand

✅ **No `.value` confusion**
- Unlike Vue, same syntax everywhere
- `count++` works in script and template
- Consistent mental model

✅ **Automatic dependency tracking**
- `$derived` and `$effect` auto-track
- No dependency arrays (unlike React)
- Hard to make mistakes

✅ **Compiler handles complexity**
- Write simple code, compiler optimizes
- Don't need to think about fine-grained updates
- Framework "disappears"

✅ **Clear primitives**
- `$state`, `$derived`, `$effect`, `$props`
- Limited API surface
- Easy to understand what each does

**What creates friction:**

⚠️ **Compiler magic**
- Harder to understand "how it works"
- Generated code is different from source
- Can't just "read the code" - need to understand compiler

⚠️ **Two syntaxes** (legacy `$:` vs runes)
- Need to know both for existing codebases
- Migration path adds complexity
- AI needs to handle both patterns

⚠️ **Store auto-subscription rules**
- `$` prefix only works in components
- Can't use in regular JavaScript
- Special syntax to learn

⚠️ **Limited training data**
- Less popular than React/Vue
- AI has seen fewer examples
- Fewer Stack Overflow answers

⚠️ **Build step required**
- Can't run .svelte files directly
- Must understand compiler pipeline
- More tooling complexity

**Overall AI-Friendliness: 9/10**

Svelte is exceptionally AI-friendly due to minimal syntax, automatic dependencies, and compiler handling complexity. Main challenge is smaller ecosystem/training data.

**Compared to others**:
- **Better than React**: Less boilerplate, auto-dependencies
- **Better than Vue**: No `.value` confusion
- **Similar to Jotai**: Both have auto-tracking and minimal syntax
- **Challenge**: Less ubiquitous than React

## Rendering

### Philosophy & Approach

Svelte rendering philosophy: **"Compiler-optimized direct DOM manipulation - no Virtual DOM"**

**Revolutionary approach**:
- **Compile-time rendering**: Svelte analyzes templates at build time
- **No Virtual DOM**: Direct, surgical DOM updates
- **No runtime diffing**: Compiler knows exactly what to update
- **Minimal JavaScript**: Framework code disappears

**Mental model**:
- React/Vue: Runtime framework diffs Virtual DOM → updates DOM
- Svelte: Compiler generates imperative update code directly

**Philosophy**: "Write less code, ship less JavaScript." The framework itself shouldn't bloat your bundle.

### Update Strategy

**Compiler-generated updates** - Surgical precision:

**Source code**:
```svelte
<script>
let count = $state(0)
</script>

<p>{count}</p>
<button onclick={() => count++}>Increment</button>
```

**Compiled to** (simplified):
```javascript
function create_fragment() {
  let p, t0, button

  return {
    c() {  // create
      p = element('p')
      t0 = text(count)
      button = element('button')
      button.textContent = 'Increment'
    },
    m(target) {  // mount
      insert(target, p)
      append(p, t0)
      insert(target, button)
    },
    p(changed) {  // update
      if (changed.count) {
        t0.data = count  // Only update this text node!
      }
    }
  }
}
```

**Key insight**: Compiler knows `count` only affects that one text node!

**No diffing needed** - Compiler generates exact update paths.

**Invalidation-based** (Svelte 5):
- State changes invalidate specific signals
- Only dependent DOM nodes update
- Fine-grained, like Solid

**Batching** - Automatic:
- Multiple state changes batched
- UI updates once per tick
- No manual batching needed

### Reconciliation

**No reconciliation** - Compiler knows what changed:

**Problem solved differently**:
- React/Vue: Runtime diffing to find changes
- Svelte: Compiler instruments code to know changes

**Lists** - Keys still important:

```svelte
{#each items as item (item.id)}
  <div>{item.name}</div>
{/each}
```

**With keys**: Svelte efficiently updates/reorders DOM nodes.
**Without keys**: Svelte updates by index (can be wrong).

**But**: No Virtual DOM diffing! Svelte uses keys to match nodes for efficient reordering, not for diffing.

**Transitions/animations**:

```svelte
<script>
import { fade, slide } from 'svelte/transition'
let visible = $state(true)
</script>

{#if visible}
  <div transition:fade>Fades in/out</div>
{/if}

{#each items as item (item.id)}
  <div transition:slide>{item.name}</div>
{/each}
```

Svelte handles DOM lifecycle for smooth transitions.

### Templating & Syntax

**Enhanced HTML** - Svelte templates:

**Text interpolation**:
```svelte
<p>Hello {name}!</p>
<p>Count: {count}</p>
<p>Calculation: {count * 2 + 1}</p>
```

**Attributes**:
```svelte
<img src={imageSrc} alt={imageAlt} />

<!-- Shorthand when name matches -->
<img {src} {alt} />

<!-- Spread attributes -->
<button {...props}>Click</button>
```

**Conditionals**:
```svelte
{#if condition}
  <p>True branch</p>
{:else if other}
  <p>Else if branch</p>
{:else}
  <p>Else branch</p>
{/if}
```

**Lists**:
```svelte
{#each items as item, index (item.id)}
  <div>{index}: {item.name}</div>
{:else}
  <p>No items</p>
{/each}
```

**Await blocks** (unique feature!):
```svelte
{#await promise}
  <p>Loading...</p>
{:then data}
  <p>Success: {data}</p>
{:catch error}
  <p>Error: {error.message}</p>
{/await}
```

**Bindings** (two-way):
```svelte
<input bind:value={name} />
<input type="checkbox" bind:checked={accepted} />
<input type="range" bind:value={volume} />

<!-- Component binding -->
<Child bind:value={parentValue} />

<!-- Element binding -->
<div bind:clientWidth={width} bind:clientHeight={height}>
```

**Directives**:
```svelte
<!-- use: actions -->
<div use:clickOutside>

<!-- transition: -->
<div transition:fade>

<!-- animate: -->
<div animate:flip>

<!-- class: -->
<div class:active={isActive}>

<!-- style: -->
<div style:color={textColor}>
```

### Component Model

**Single File Components** - .svelte files:

```svelte
<script>
// JavaScript (or TypeScript with lang="ts")
let count = $state(0)
let { title } = $props()  // Props

function increment() {
  count++
}
</script>

<!-- Template -->
<div>
  <h1>{title}</h1>
  <button onclick={increment}>{count}</button>
</div>

<style>
/* Scoped by default! */
button {
  color: blue;
}

/* Global styles */
:global(body) {
  margin: 0;
}
</style>
```

**Props** (Svelte 5):
```svelte
<script>
let { title, count = 0, optional } = $props()
// title required, count has default, optional is optional
</script>
```

**Slots** (content projection):
```svelte
<!-- Card.svelte -->
<div class="card">
  <slot />  <!-- Default slot -->
</div>

<!-- Named slots -->
<div class="card">
  <header><slot name="header" /></header>
  <slot />  <!-- Default -->
  <footer><slot name="footer" /></footer>
</div>

<!-- Usage -->
<Card>
  <h1 slot="header">Title</h1>
  <p>Content</p>
  <p slot="footer">Footer</p>
</Card>
```

**Snippets** (Svelte 5 - template reuse):
```svelte
{#snippet card(title, content)}
  <div class="card">
    <h2>{title}</h2>
    <p>{content}</p>
  </div>
{/snippet}

{@render card('Title 1', 'Content 1')}
{@render card('Title 2', 'Content 2')}
```

**Lifecycle**:
```svelte
<script>
import { onMount, onDestroy } from 'svelte'

onMount(() => {
  console.log('Component mounted')
  return () => console.log('Cleanup')
})

onDestroy(() => {
  console.log('Component destroyed')
})
</script>
```

### Performance Optimizations

**1. Compiler optimizations** (automatic):
- Static hoisting
- Constant folding
- Dead code elimination
- Minimal runtime code

**2. No optimization needed!**

```svelte
<!-- This is already optimal -->
<script>
let expensive = $derived(computeExpensive(data))
</script>

<p>{expensive}</p>
```

No `memo`, `useMemo`, `useCallback` needed! Compiler handles it.

**3. Lazy loading**:
```javascript
const HeavyComponent = () => import('./Heavy.svelte')
```

**4. Transitions** (built-in):
```svelte
<div transition:fade={{ duration: 300 }}>
```

**5. Virtual lists** (external library):
```svelte
<script>
import { VirtualList } from 'svelte-virtual-list'
</script>

<VirtualList items={10000} let:item>
  <div>{item.name}</div>
</VirtualList>
```

**Philosophy**: Compiler optimizes, you don't have to!

### Developer Experience

**Learning curve: Low to Medium**
- HTML-like templates are familiar
- Less framework-specific knowledge than React/Vue
- Compiler magic can be surprising
- Overall: easier than React

**DevTools: Good (not great)**
- Svelte DevTools extension
- Component tree
- Props/state inspection
- Less mature than React/Vue DevTools

**Hot reload: Excellent**
- Fast Refresh (preserves state)
- Instant feedback
- Works great with Vite/SvelteKit

### AI-Friendly Assessment

**What makes Svelte rendering AI-friendly:**

✅ **HTML-like templates**
- Familiar syntax
- Easy to read and generate
- Less framework-specific than JSX

✅ **Minimal syntax**
- `{#if}`, `{#each}` are clear
- Less boilerplate than React/Vue
- Concise and readable

✅ **Automatic optimizations**
- No manual memoization
- Compiler handles performance
- AI doesn't need to know when to optimize

✅ **Scoped styles by default**
- CSS scoping automatic
- No className libraries needed
- Simple mental model

✅ **Unique features are powerful**
- `{#await}` blocks for async
- Transitions built-in
- Bindings are concise

**What creates friction:**

⚠️ **Compiler-first is different**
- AI needs to understand compilation
- Generated code is different from source
- Can't just run .svelte files

⚠️ **Template syntax is Svelte-specific**
- Not standard HTML or JSX
- Need to learn Svelte syntax
- Less training data than React

⚠️ **Build tooling required**
- Must set up Vite/SvelteKit
- Can't use plain HTML
- Configuration complexity

⚠️ **Smaller ecosystem**
- Fewer libraries/examples
- Less Stack Overflow
- AI has less training data

**Overall Rendering AI-Friendliness: 9/10**

Svelte's rendering is highly AI-friendly due to minimal syntax, automatic optimizations, and readable templates. Compiler-first approach is different but powerful.

## Event Handling

### Philosophy & Approach

Svelte event philosophy (Svelte 5): **"Event handlers as props - standard JavaScript"**

**Major shift in Svelte 5**:
- Old: `on:click={handler}` directive
- New: `onclick={handler}` prop (standard HTML attribute)

**Core concepts**:
- **Event handlers are props**: Just like React
- **No special directive**: Use standard names
- **Native events**: Browser's event system
- **Legacy modifiers removed**: Use explicit code instead

**Philosophy**: Move toward web standards, away from framework-specific syntax.

### Event Binding

**Svelte 5** (modern):

```svelte
<script>
function handleClick(event) {
  console.log('Clicked!', event)
}
</script>

<!-- Standard event prop -->
<button onclick={handleClick}>Click</button>

<!-- Inline handler -->
<button onclick={() => console.log('Clicked')}>Click</button>

<!-- With event object -->
<button onclick={(e) => console.log(e.target)}>Click</button>
```

**All event names**:
- `onclick`, `onsubmit`, `oninput`, `onchange`
- `onkeydown`, `onkeyup`
- `onmouseenter`, `onmouseleave`
- Standard HTML event attributes!

**Legacy (Svelte 4)**:

```svelte
<!-- on: directive (deprecated) -->
<button on:click={handleClick}>Click</button>
<button on:click|preventDefault|stopPropagation={handleClick}>
```

**Event modifiers removed** in Svelte 5 - use explicit code:

```svelte
<!-- Old way (Svelte 4) -->
<button on:click|preventDefault={handleSubmit}>

<!-- New way (Svelte 5) -->
<button onclick={(e) => {
  e.preventDefault()
  handleSubmit()
}}>
```

### Event Flow

**Standard DOM event flow**:
- Capture phase (top → bottom)
- Target phase
- Bubble phase (bottom → top)

**Preventing propagation**:

```svelte
<div onclick={(e) => {
  e.stopPropagation()
  handleParent()
}}>
  <button onclick={(e) => {
    e.stopPropagation()
    handleChild()
  }}>
    Click
  </button>
</div>
```

**Preventing default**:

```svelte
<form onsubmit={(e) => {
  e.preventDefault()
  handleSubmit()
}}>
  <button type="submit">Submit</button>
</form>
```

**Event delegation** (manual):

```svelte
<ul onclick={(e) => {
  const li = e.target.closest('li')
  if (li) {
    handleItemClick(li.dataset.id)
  }
}}>
  {#each items as item}
    <li data-id={item.id}>{item.name}</li>
  {/each}
</ul>
```

### Event Object

**Native Event** - Standard browser events:

```svelte
<script>
function handleClick(e) {
  e.type              // 'click'
  e.target            // Element that triggered
  e.currentTarget     // Element handler is on
  e.preventDefault()
  e.stopPropagation()

  // MouseEvent properties
  e.clientX, e.clientY
  e.altKey, e.ctrlKey, e.shiftKey
}
</script>

<button onclick={handleClick}>Click</button>
```

**TypeScript types**:

```svelte
<script lang="ts">
function handleClick(e: MouseEvent) {
  console.log(e.clientX)
}

function handleInput(e: Event) {
  const target = e.target as HTMLInputElement
  console.log(target.value)
}
</script>
```

### Common Patterns

**1. Component events** (Svelte 5):

```svelte
<!-- Child.svelte -->
<script>
let { onsubmit } = $props()  // Event handler as prop
</script>

<button onclick={onsubmit}>Submit</button>

<!-- Parent.svelte -->
<Child onsubmit={() => console.log('Submitted')} />
```

**Legacy component events** (Svelte 4):

```svelte
<!-- Child - createEventDispatcher -->
<script>
import { createEventDispatcher } from 'svelte'
const dispatch = createEventDispatcher()

function handleClick() {
  dispatch('message', { text: 'Hello' })
}
</script>

<button on:click={handleClick}>Click</button>

<!-- Parent -->
<Child on:message={(e) => console.log(e.detail.text)} />
```

**2. Form handling**:

```svelte
<script>
let name = $state('')
let email = $state('')

function handleSubmit(e) {
  e.preventDefault()
  console.log({ name, email })
}
</script>

<form onsubmit={handleSubmit}>
  <input bind:value={name} />
  <input bind:value={email} />
  <button type="submit">Submit</button>
</form>
```

**3. Event forwarding** (legacy):

```svelte
<!-- Child - forward all clicks -->
<button on:click>Click me</button>

<!-- Parent - receives forwarded event -->
<Child on:click={(e) => console.log('Clicked')} />
```

**4. Passing data to handlers**:

```svelte
<script>
let items = $state([...])

function handleClick(item, event) {
  console.log('Clicked:', item)
}
</script>

{#each items as item}
  <button onclick={(e) => handleClick(item, e)}>
    {item.name}
  </button>
{/each}
```

### Performance Considerations

**Event delegation** (manual):
- Svelte doesn't auto-delegate like React
- Must implement yourself for large lists
- Pattern shown above

**Handler creation**:

```svelte
<!-- Creates new function each render -->
<button onclick={() => handleClick(item)}>

<!-- But Svelte is fine-grained, so less of an issue -->
<!-- No component re-render, just DOM updates -->
```

**Memory management**:
- Svelte auto-removes listeners on unmount
- No manual cleanup needed
- Actions can have cleanup

### Developer Experience

**Debugging: Good**
- Standard browser DevTools
- Event breakpoints
- Console logging
- Source maps work

**Svelte 5 improvement**:
- Standard event names (onclick vs on:click)
- More familiar to web developers
- Less framework-specific

**Common mistakes**:
- Forgetting to prevent default
- Not stopping propagation when needed
- Event forwarding only in legacy mode

### AI-Friendly Assessment

**What makes Svelte events AI-friendly:**

✅ **Standard HTML attributes** (Svelte 5)
- `onclick={handler}` is standard JavaScript
- No framework-specific syntax to learn
- Familiar to anyone who knows web dev

✅ **Simple and explicit**
- No magic modifiers
- Explicit `e.preventDefault()`
- Clear what code does

✅ **No special directive**
- Not `on:click`, just `onclick`
- Closer to web standards
- Less Svelte-specific knowledge

✅ **Component events as props**
- Standard prop passing
- No special event dispatcher in Svelte 5
- Simpler mental model

**What creates friction:**

⚠️ **Two syntaxes** (legacy vs modern)
- Need to know both for existing code
- `on:click` vs `onclick`
- Migration complexity

⚠️ **Lost modifiers**
- Old `on:click|preventDefault` was convenient
- Now must write explicit code
- More verbose

⚠️ **Event delegation manual**
- Unlike React (auto-delegated)
- Must implement pattern yourself
- More boilerplate for lists

**Overall Event Handling AI-Friendliness: 8/10**

Svelte 5 events are AI-friendly due to standard syntax and simplicity. Loss of modifiers is slight regression but move toward standards is good.

### Component Reusability Assessment

**Quality: Excellent (9/10)**

**Strengths**: .svelte components compile to minimal JavaScript - highly portable. Scoped styles by default. Props typed with TypeScript. Slots for composition. Stores work across components universally. Components can compile to web components for ultimate portability. Minimal runtime. Preprocessors enable variants. Very small bundle sizes make components lightweight.

**Weaknesses**: .svelte files require Svelte compiler. Template syntax not portable to other frameworks. Svelte-specific features (reactive statements, stores) don't translate. Smaller ecosystem than React/Vue. Magic (reactive assignments) harder to port.

**Cross-Project Reuse**: Excellent within Svelte ecosystem. Component libraries growing (Skeleton, Carbon, shadcn-svelte). Stores reusable everywhere. Can compile to web components for framework-agnostic use. Cannot directly use React/Vue components without adapters.

**Design System Support**: Excellent. Scoped styles perfect for design systems. Skeleton UI, Carbon Components Svelte, daisyUI, shadcn-svelte available. CSS variables pierce component boundaries. Preprocessors (Sass/PostCSS) supported. Tailwind integration excellent.

## Maintainability

**Quality: Excellent (9.5/10)**

**Strengths**: Compiler catches errors at build time - fewer runtime bugs. Minimal code - less to maintain. Reactive assignments intuitive. Scoped styles prevent conflicts. TypeScript support excellent. Svelte DevTools for debugging. No virtual DOM - performance "just works." Component file combines HTML/JS/CSS - easy to understand. Svelte 5 runes more explicit than magic $:. Small runtime means less framework code to debug.

**Weaknesses**: Compiler errors can be cryptic. Reactive statement (`$:`) order can matter. Smaller ecosystem means fewer solutions. Svelte 4 → 5 (runes) significant paradigm shift. Less Stack Overflow content than React/Vue. Some edge cases in reactivity (array mutations, object properties).

**Code Organization**: Components in .svelte files. Stores in separate files. Utils extracted easily. SvelteKit enforces routes structure. Layouts and pages clear. Actions and form handlers co-located.

**Testing**: Vitest for unit tests. Svelte Testing Library for components. Playwright for E2E. Stores easy to test. Components straightforward to mount and test. Progressive enhancement makes E2E simpler.

**Debugging**: Svelte DevTools show component tree and state. Build errors clear. TypeScript catches type issues. Console logs work normally. Reactive statements can be traced. Network tab for SvelteKit forms.

**Scalability**: Excellent. Compiler scales to thousands of components. Code-splitting automatic in SvelteKit. Scoped styles prevent global conflicts. Stores handle complex state. Small bundle sizes keep apps fast at scale.

**Breaking Changes**: Svelte 4 → 5 (runes) major change but backward compatible. Migration gradual. Svelte 3 → 4 minimal changes. SvelteKit post-1.0 stable. Clear migration guides. Compiler provides warnings.

## AI-Assisted Development Considerations

### What Works Well with AI

**Minimal, concise syntax**
- Less code to write
- Less code to understand
- "Write less code" philosophy

**Automatic optimizations**
- Compiler handles performance
- No manual memoization
- AI doesn't need to know when to optimize

**Clear primitives**
- `$state`, `$derived`, `$effect` are obvious
- Limited API surface
- Easy to learn

**No .value confusion**
- Unlike Vue, consistent everywhere
- `count++` just works
- Simpler mental model

**Automatic dependency tracking**
- No dependency arrays
- No forgotten deps
- Hard to make mistakes

**Unique, powerful features**
- `{#await}` blocks
- Transitions/animations built-in
- Two-way binding

### What Creates Friction

**Compiler magic**
- Harder to understand internals
- Generated code different from source
- Build step required

**Smaller ecosystem**
- Less training data for AI
- Fewer examples/libraries
- Less Stack Overflow content

**Two eras** (pre-5 vs Svelte 5)
- Legacy syntax (`$:`) vs runes
- Need to handle both
- Migration complexity

**Svelte-specific syntax**
- `{#if}`, `{#each}` not standard
- Template language to learn
- Less transferable knowledge

**Build tooling required**
- Can't run .svelte files directly
- Must configure bundler
- More complexity

### Opportunities for Improvement

**What Svelte teaches for next-gen frameworks:**

1. **Compiler-first is powerful**
   - Eliminate runtime overhead
   - Optimize at build time
   - Ship minimal JavaScript

2. **Less code is better**
   - Concise syntax improves readability
   - Reduces cognitive load
   - Makes AI's job easier

3. **Automatic dependency tracking wins**
   - No manual dependency arrays
   - Fewer bugs
   - Better DX

4. **Fine-grained reactivity is fastest**
   - No Virtual DOM needed
   - Direct DOM updates
   - Maximum performance

5. **But: Some magic is too much**
   - Compiler transformations can surprise
   - Generated code can be confusing
   - Balance explicitness with conciseness

6. **Web standards matter**
   - Svelte 5 moves toward standards (onclick vs on:click)
   - Reduces framework-specific knowledge
   - Easier to learn

**For next-gen AI-optimized frameworks:**
- Keep Svelte's conciseness and auto-dependencies
- Keep fine-grained reactivity (no Virtual DOM)
- Add more explicitness (less compiler magic)
- Larger ecosystem/more training data
- Balance innovation with web standards

**Final AI-Friendliness: 9/10**
- State Management: 9/10 (concise, auto-tracking, no .value)
- Rendering: 9/10 (minimal syntax, compiler-optimized)
- Event Handling: 8/10 (standard in Svelte 5, but lost modifiers)

**Svelte's biggest advantages**:
1. **Ultra-concise syntax** - Least code of all frameworks
2. **Automatic dependencies** - No manual arrays
3. **Compiler handles optimization** - No manual memoization
4. **Fine-grained reactivity** - Maximum performance
5. **No .value confusion** - Consistent syntax

**Biggest disadvantages**:
1. **Smaller ecosystem** - Less AI training data
2. **Compiler magic** - Harder to understand internals
3. **Build required** - Can't run .svelte files directly
4. **Two eras** - Legacy vs modern syntax
5. **Framework-specific templates** - Not standard HTML/JSX

**Verdict**: Svelte is **exceptionally AI-friendly** for its conciseness and simplicity. The compiler-first approach is different but powerful. Main limitation is smaller ecosystem compared to React/Vue.

**Svelte proves**: You don't need Virtual DOM for great DX. Compiler optimization + fine-grained reactivity is the future.
