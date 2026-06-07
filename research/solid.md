---
name: "Solid"
category: "full-framework"
github_url: "https://github.com/solidjs/solid"
docs_url: "https://www.solidjs.com"
implementation_language: "TypeScript"
status: "active"
ai_friendliness_score: null
reusability_score: 8
maintainability_score: 8.5
version: "1.8.x"
npm_package: "solid-js"
typescript_support: "native"
license: "MIT"
runtime: "browser"
capabilities:
  state_management: true
  rendering: true
  event_handling: true
paradigm: "reactive"
state_model: "signals"
rendering_strategy: "compiler"
maintainer: "Ryan Carniato"
first_released: "2018"
reviewed_date: "2025-12-06"
reviewed_by_model: "Claude Sonnet 4.5"
---

# Solid

> **2026 update note (2026-06-07):** Solid 2.0 (beta, May 2026) reworks the async model significantly — first-class Promises inside `createMemo`, a redesigned Suspense/loading story, `createEffect` split into separate compute/apply phases, and `<For keyed={false}>` replacing `<Index>`. The "Async Handling" section below describes the 1.x model; revisit once 2.0 stabilizes.

## State Management

### Philosophy & Mental Model

Solid's state philosophy: **"Fine-grained reactivity everywhere"**

**Core paradigm**: Signals all the way down - state, rendering, and effects use the same reactive primitive.

Key concepts:
- **Signals-based**: Like Jotai, but for rendering too
- **Fine-grained reactivity**: Changes propagate to exact DOM nodes, not components
- **No Virtual DOM**: Compiler generates direct DOM updates
- **Explicit subscriptions**: Call signal as function `count()` to subscribe
- **Maximum performance**: Near-native JavaScript speed

**Mental model**:
- React: Components re-render → Virtual DOM diff → DOM update
- Vue: Components re-render → fine-grained tracking → selective updates
- Svelte: Compiler generates update code → direct DOM updates
- Solid: **Signals trigger effects → direct DOM updates** (components run once!)

**Revolutionary**: Components don't re-run. Only reactive expressions (signal reads) re-execute.

**Philosophy**: "Like React hooks done right." Take the best ideas from React but with fine-grained reactivity.

### Core Primitives

**1. createSignal** - Reactive state:

```javascript
import { createSignal } from 'solid-js'

const [count, setCount] = createSignal(0)

// Read by calling as function
console.log(count())  // 0

// Write with setter
setCount(1)
setCount(c => c + 1)  // Functional update
```

**Key difference from React**: `count` is a **getter function**, not a value!

**2. createEffect** - Side effects:

```javascript
import { createEffect } from 'solid-js'

createEffect(() => {
  console.log(`Count is ${count()}`)
  // Automatically re-runs when count changes!
})
```

**No dependency array!** Solid tracks which signals you read (`count()` call subscribes).

**3. createMemo** - Derived state:

```javascript
import { createMemo } from 'solid-js'

const doubled = createMemo(() => count() * 2)

// Use like a signal
console.log(doubled())  // Read by calling
```

**Automatically memoized** - only recomputes when `count` changes.

**4. createStore** - Complex nested state:

```javascript
import { createStore } from 'solid-js/store'

const [state, setState] = createStore({
  user: { name: 'John', age: 30 },
  items: [1, 2, 3]
})

// Read (reactive)
console.log(state.user.name)

// Write (immutable-style API)
setState('user', 'age', 31)
setState('items', items => [...items, 4])

// Nested updates
setState('user', user => ({ ...user, name: 'Jane' }))
```

**Stores vs Signals**:
- Signals: Single value (primitive or object)
- Stores: Nested objects with fine-grained tracking per property

**5. createResource** - Async data:

```javascript
import { createResource } from 'solid-js'

const [data] = createResource(fetchUser)

return (
  <Show when={data()} fallback={<p>Loading...</p>}>
    {user => <p>{user.name}</p>}
  </Show>
)
```

**6. createContext** - Context sharing:

```javascript
import { createContext, useContext } from 'solid-js'

const CountContext = createContext()

function Provider(props) {
  const [count, setCount] = createSignal(0)

  return (
    <CountContext.Provider value={[count, setCount]}>
      {props.children}
    </CountContext.Provider>
  )
}

function Child() {
  const [count, setCount] = useContext(CountContext)
  return <button onClick={() => setCount(c => c + 1)}>{count()}</button>
}
```

### Update Mechanism

**Signal updates** - Reactive propagation:

```javascript
const [count, setCount] = createSignal(0)

// Update
setCount(1)

// Functional update
setCount(c => c + 1)

// Triggers all effects/memos that read count()
```

**How it works**:
1. `setCount(1)` updates signal value
2. Signal notifies all subscribers (effects, memos, DOM bindings)
3. **Only subscribed code re-executes**, not entire component!

**Store updates** - Immutable-style API:

```javascript
const [state, setState] = createStore({ count: 0, items: [] })

// Path-based updates
setState('count', c => c + 1)

// Nested path
setState('user', 'profile', 'age', 31)

// Array updates
setState('items', items => [...items, newItem])

// Multiple properties
setState({
  count: c => c + 1,
  message: 'Updated'
})
```

**Fine-grained updates**:
```javascript
const [state, setState] = createStore({
  firstName: 'John',
  lastName: 'Doe'
})

// Only components/effects reading firstName update
setState('firstName', 'Jane')

// lastName readers don't re-execute!
```

**Batching** - Automatic:

```javascript
function update() {
  setCount(c => c + 1)
  setMessage('Updated')
  setItems(items => [...items, 4])
  // All updates batched, effects run once
}
```

### Read Pattern

**Signals - call as function**:

```javascript
const [count, setCount] = createSignal(0)

// ✅ Reactive - subscribes to count
const value = count()

// ❌ Not reactive - just gets the function
const fn = count

// In JSX
<div>{count()}</div>  // Reactive
```

**Critical pattern**: **Must call signal as function to subscribe!**

**Stores - property access**:

```javascript
const [state, setState] = createStore({ count: 0 })

// ✅ Reactive
const value = state.count

// In JSX
<div>{state.count}</div>  // Reactive
```

**Memos - call as function**:

```javascript
const doubled = createMemo(() => count() * 2)

// Read
console.log(doubled())  // Call as function
```

**In components**:

```jsx
function Counter() {
  const [count, setCount] = createSignal(0)

  // Component only runs ONCE!
  console.log('Component rendered')

  return (
    <button onClick={() => setCount(c => c + 1)}>
      {/* This expression re-executes when count changes */}
      {count()}
    </button>
  )
}
```

**Mind-blowing**: Component function runs **once**. Only reactive expressions (signal reads) re-execute.

### Reactivity & Granularity

**Maximum fine-grained reactivity** - The finest of all frameworks:

**DOM-level granularity**:
```jsx
function App() {
  const [count, setCount] = createSignal(0)
  const [message, setMessage] = createSignal('Hello')

  console.log('Component runs ONCE')

  return (
    <div>
      {/* Only this text node updates when count changes */}
      <span>{count()}</span>

      {/* Only this text node updates when message changes */}
      <span>{message()}</span>

      {/* This never updates */}
      <span>Static</span>
    </div>
  )
}
```

**How it works**:
1. Compiler sees `{count()}` in JSX
2. Generates `createEffect(() => textNode.data = count())`
3. When count changes, **only that text node updates**!

**No component re-rendering**:
- Component function runs **once** on mount
- Effects run when dependencies change
- DOM updates directly

**Comparison**:
- **React**: Whole component + children re-render (coarsest)
- **Vue**: Component re-renders, but smart tracking (medium)
- **Svelte**: Fine-grained DOM updates (fine)
- **Solid**: Fine-grained DOM updates (finest)

**Performance**:
- Fastest framework in benchmarks
- No Virtual DOM overhead
- No component re-execution
- Only exact DOM nodes update

### Async Handling

**createResource** - Built-in async primitive:

```jsx
import { createResource, Show } from 'solid-js'

function UserProfile(props) {
  const [user] = createResource(() => props.userId, fetchUser)

  return (
    <Show when={user()} fallback={<p>Loading...</p>}>
      {userData => <p>{userData.name}</p>}
    </Show>
  )
}
```

**Features**:
- Automatic loading/error states
- Refetches when source changes
- Suspense-compatible
- SSR-friendly

**Manual async**:

```jsx
function fetchData() {
  const [data, setData] = createSignal(null)
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal(null)

  const load = async () => {
    setLoading(true)
    try {
      const result = await fetch('/api/data')
      setData(await result.json())
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, load }
}
```

**Suspense** (built-in):

```jsx
import { Suspense } from 'solid-js'

<Suspense fallback={<Loading />}>
  <AsyncComponent />
</Suspense>
```

**External libraries**:
- @tanstack/solid-query (TanStack Query for Solid)
- Custom resources

### Derived State

**createMemo** - Primary pattern:

```javascript
const [items, setItems] = createSignal([
  { price: 10, qty: 2 },
  { price: 5, qty: 3 }
])

// Simple derivation
const total = createMemo(() =>
  items().reduce((sum, item) => sum + item.price * item.qty, 0)
)

// Chained memos
const tax = createMemo(() => total() * 0.1)
const grandTotal = createMemo(() => total() + tax())

// Use like signals
<p>Total: ${total()}</p>
```

**Automatic dependency tracking** - No dependency arrays!

**Store-based derivation**:

```javascript
const [state, setState] = createStore({
  items: [...],
  get total() {
    return this.items.reduce((sum, item) => sum + item.price, 0)
  }
})

// Access like property
<p>{state.total}</p>
```

**Comparison**:
- **React**: `useMemo` with manual deps (error-prone)
- **Vue**: `computed` with auto-tracking (good)
- **Jotai**: Derived atoms with auto-tracking (good)
- **Svelte**: `$derived` with auto-tracking (good)
- **Solid**: `createMemo` with auto-tracking (good)

All modern reactive frameworks have automatic dependency tracking!

### Reuse Patterns

**1. Custom primitives** (like React custom hooks):

```javascript
// useCounter.js
function useCounter(initial = 0) {
  const [count, setCount] = createSignal(initial)

  const increment = () => setCount(c => c + 1)
  const decrement = () => setCount(c => c - 1)

  return { count, increment, decrement }
}

// Component
function Counter() {
  const counter = useCounter(0)

  return (
    <button onClick={counter.increment}>
      {counter.count()}
    </button>
  )
}
```

**2. Component composition**:

```jsx
// Button component
function Button(props) {
  return (
    <button onClick={props.onClick}>
      {props.children}
    </button>
  )
}

// Usage
<Button onClick={() => console.log('Clicked')}>
  Click me
</Button>
```

**3. Context providers**:

```javascript
const ThemeContext = createContext()

function ThemeProvider(props) {
  const [theme, setTheme] = createSignal('light')

  return (
    <ThemeContext.Provider value={[theme, setTheme]}>
      {props.children}
    </ThemeContext.Provider>
  )
}

function useTheme() {
  return useContext(ThemeContext)
}
```

**4. Higher-order components** (less common):

```javascript
function withLogging(Component) {
  return (props) => {
    console.log('Rendering with props:', props)
    return <Component {...props} />
  }
}
```

**5. Render props / children as functions**:

```jsx
<Show when={data()} fallback={<Loading />}>
  {(userData) => <Profile user={userData} />}
</Show>
```

**Reuse assessment**:
- **Custom primitives**: Excellent (like React hooks, but better)
- **Component composition**: Standard props/children
- **Context**: Built-in, reactive
- **Unique**: Resources for async

### Developer Experience

**Boilerplate: Low**
- Similar to React (JSX, components)
- Signal API is minimal
- No class components, just functions

**Comparison**:
```jsx
// Solid
function Counter() {
  const [count, setCount] = createSignal(0)
  return <button onClick={() => setCount(c => c + 1)}>{count()}</button>
}

// React
function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}

// Very similar! But Solid is more performant
```

**DevTools: Good**
- Solid DevTools browser extension
- Component tree
- Signal inspection
- Performance profiling
- Not as mature as React DevTools

**Debugging: Good**
- Compiled JSX is readable
- Source maps work
- Can inspect signals
- `console.log(count())` works

**Time travel: Possible**
- Not built-in
- Can implement with signals
- Community libraries available

**TypeScript support: Excellent**
- Written in TypeScript
- Strong type inference
- Generic components
- JSX type-safe

### AI-Friendly Assessment

**What makes Solid state management AI-friendly:**

✅ **Explicit subscriptions**
- Must call `count()` to subscribe
- Explicit what's reactive vs not
- Clear mental model

✅ **Simple primitives**
- createSignal, createEffect, createMemo
- Limited API surface
- Easy to understand

✅ **Automatic dependency tracking**
- No dependency arrays
- Hard to make mistakes
- Compiler tracks subscriptions

✅ **No magic unwrapping**
- Always call `count()` - consistent
- No Vue-style `.value` confusion
- Same in JSX and JS

✅ **Like React, but better**
- Familiar to React developers
- Same JSX syntax
- But simpler mental model (components run once)

**What creates friction:**

⚠️ **Must remember to call signals**
- `count()` not `count`
- Easy to forget `()`
- Breaks reactivity silently if forgotten

⚠️ **Component runs once**
- Different from React mental model
- Closures can be confusing
- Need to understand fine-grained reactivity

⚠️ **Smaller ecosystem**
- Less popular than React/Vue
- Fewer libraries/examples
- Less AI training data

⚠️ **Build step required**
- JSX needs compilation
- Can't run directly in browser
- Tooling configuration

⚠️ **Two reactive models** (signals vs stores)
- Need to know when to use each
- Stores have complex API
- More to learn

**Overall AI-Friendliness: 8.5/10**

Solid is very AI-friendly due to explicit subscriptions, simple primitives, and automatic tracking. Main challenges are smaller ecosystem and remembering to call signals as functions.

**Compared to others**:
- **Better than React**: Auto-tracking, simpler mental model
- **Better than Vue**: No `.value` confusion
- **Similar to Jotai**: Both signals-based, auto-tracking
- **Similar to Svelte**: Both fine-grained, compiler-optimized

## Rendering

### Philosophy & Approach

Solid rendering philosophy: **"JSX without Virtual DOM - compiled to direct DOM updates"**

**Revolutionary approach**:
- **JSX like React** - Familiar syntax
- **Compiles differently** - Not to render functions, to DOM manipulation
- **No Virtual DOM** - Direct updates to real DOM
- **Fine-grained reactivity** - Only affected nodes update

**Mental model**:
- React: JSX → Virtual DOM → reconcile → update DOM
- Solid: JSX → compile to effects → update DOM directly

**Key insight**: JSX is just syntax. Solid compiles it completely differently than React.

### Update Strategy

**Reactive DOM updates** - Compiler magic:

**Source**:
```jsx
function Counter() {
  const [count, setCount] = createSignal(0)

  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => setCount(c => c + 1)}>+</button>
    </div>
  )
}
```

**Compiles to** (simplified):
```javascript
function Counter() {
  const [count, setCount] = createSignal(0)

  const div = document.createElement('div')
  const p = document.createElement('p')
  const textNode = document.createTextNode('')

  // Effect for reactive text
  createEffect(() => {
    textNode.data = 'Count: ' + count()
  })

  p.appendChild(textNode)

  const button = document.createElement('button')
  button.textContent = '+'
  button.addEventListener('click', () => setCount(c => c + 1))

  div.appendChild(p)
  div.appendChild(button)

  return div
}
```

**No Virtual DOM diffing!** Compiler generates precise update code.

**Batching** - Automatic (like all frameworks).

### Reconciliation

**No reconciliation needed** - Effects update exactly what changed:

**Lists** - Special handling:

```jsx
import { For } from 'solid-js'

<For each={items()}>
  {(item, index) => (
    <div>
      {index()}: {item.name}
    </div>
  )}
</For>
```

**`<For>` component**:
- Efficient list rendering
- Reuses DOM nodes
- Only creates/destroys nodes when items added/removed
- Updates existing nodes when data changes

**No keys needed!** (But can use if items can reorder):

```jsx
<For each={items()} fallback={<p>No items</p>}>
  {(item) => <div>{item.name}</div>}
</For>
```

**Index tracking**:
```jsx
<For each={items()}>
  {(item, index) => (
    <div>
      {/* index is a signal! */}
      Item #{index() + 1}: {item.name}
    </div>
  )}
</For>
```

**`<Index>` component** (for primitive arrays):

```jsx
<Index each={numbers()}>
  {(number, index) => (
    <div>
      {/* number is a signal, index is number */}
      {index}: {number()}
    </div>
  )}
</Index>
```

### Templating & Syntax

**JSX** - React-like syntax:

**Text interpolation**:
```jsx
<p>Hello {name()}!</p>
<p>Count: {count()}</p>
<p>Result: {count() * 2 + 1}</p>
```

**Attributes**:
```jsx
<img src={imageSrc()} alt="Image" />

{/* Boolean attributes */}
<button disabled={isDisabled()}>Click</button>

{/* Spread */}
<div {...props} />
```

**Conditionals** - Control flow components:

```jsx
import { Show } from 'solid-js'

<Show when={condition()} fallback={<p>Else</p>}>
  <p>When true</p>
</Show>

{/* With data */}
<Show when={user()} fallback={<Login />}>
  {(userData) => <p>Hello {userData.name}</p>}
</Show>
```

**Why `<Show>` not ternary?**
- Prevents re-creating DOM nodes
- More efficient than `{condition() ? <A /> : <B />}`

**Switches**:

```jsx
import { Switch, Match } from 'solid-js'

<Switch fallback={<p>Default</p>}>
  <Match when={state() === 'loading'}>
    <Loading />
  </Match>
  <Match when={state() === 'error'}>
    <Error />
  </Match>
  <Match when={state() === 'success'}>
    <Success />
  </Match>
</Switch>
```

**Lists**:

```jsx
<For each={items()}>
  {(item, index) => (
    <li>{index()}: {item.name}</li>
  )}
</For>
```

**Dynamic** (dynamic component):

```jsx
import { Dynamic } from 'solid-js/web'

<Dynamic component={componentType()} {...props} />
```

**Portal**:

```jsx
import { Portal } from 'solid-js/web'

<Portal mount={document.body}>
  <Modal />
</Portal>
```

### Component Model

**Functional components** - JSX syntax:

```jsx
function Button(props) {
  return (
    <button onClick={props.onClick}>
      {props.children}
    </button>
  )
}

// Usage
<Button onClick={() => console.log('Clicked')}>
  Click me
</Button>
```

**Props** - Reactive proxies:

```jsx
function Component(props) {
  // ✅ Reactive
  return <div>{props.value}</div>

  // ❌ Not reactive (destructuring breaks reactivity)
  const { value } = props
  return <div>{value}</div>

  // ✅ Can destructure signals
  const { value: getValue } = props
  return <div>{getValue()}</div>
}
```

**Children** - Special handling:

```jsx
import { children } from 'solid-js'

function Parent(props) {
  const resolved = children(() => props.children)

  createEffect(() => {
    console.log(resolved())  // Access resolved children
  })

  return <div>{props.children}</div>
}
```

**Refs**:

```jsx
function Component() {
  let divRef

  onMount(() => {
    console.log(divRef)  // DOM element
  })

  return <div ref={divRef}>Content</div>
}
```

**Lifecycle**:

```jsx
import { onMount, onCleanup } from 'solid-js'

function Component() {
  onMount(() => {
    console.log('Mounted')
  })

  onCleanup(() => {
    console.log('Cleanup')
  })

  return <div>Content</div>
}
```

### Performance Optimizations

**1. No optimization needed!**

Solid is automatically optimal:
- No Virtual DOM overhead
- No component re-rendering
- Fine-grained updates
- Compiler optimizations

**2. Lazy loading**:

```jsx
import { lazy } from 'solid-js'

const Heavy = lazy(() => import('./Heavy'))

<Suspense fallback={<Loading />}>
  <Heavy />
</Suspense>
```

**3. Memoization** (rarely needed):

```jsx
// Rarely needed since components run once
const value = createMemo(() => expensiveComputation())
```

**4. Keyed lists** (for reordering):

```jsx
<For each={items()} fallback={<p>Empty</p>}>
  {(item) => <div>{item.name}</div>}
</For>
```

**Philosophy**: Write idiomatic code, Solid handles performance.

### Developer Experience

**Learning curve: Medium**
- JSX is familiar to React devs
- But mental model is different (components run once)
- Fine-grained reactivity takes time to understand
- Control flow components are new

**DevTools: Good**
- Solid DevTools extension
- Component tree
- Signal/store inspection
- Performance profiling

**Hot reload: Excellent**
- Fast Refresh
- Preserves state
- Works great with Vite

### AI-Friendly Assessment

**What makes Solid rendering AI-friendly:**

✅ **JSX is familiar**
- Same syntax as React
- Easy to generate
- Vast training data for JSX

✅ **Control flow components are explicit**
- `<Show>`, `<For>`, `<Switch>` are clear
- Intent is obvious
- Self-documenting

✅ **No optimization needed**
- Write simple code
- Solid handles performance
- No manual memoization

✅ **Predictable**
- Components run once
- Effects run when signals change
- Clear cause and effect

**What creates friction:**

⚠️ **Different from React**
- JSX compiles differently
- Components run once (React: many times)
- Need to understand fine-grained reactivity
- AI trained on React might generate wrong patterns

⚠️ **Props are proxies**
- Destructuring breaks reactivity
- Not obvious from syntax
- Easy to make mistakes

⚠️ **Control flow components**
- `<Show>` instead of ternary
- `<For>` instead of map
- More to learn

⚠️ **Smaller ecosystem**
- Less training data than React
- Fewer examples
- Less Stack Overflow

**Overall Rendering AI-Friendliness: 8/10**

Solid rendering is AI-friendly due to familiar JSX and explicit control flow. Different compilation model requires understanding but results in better performance.

## Event Handling

### Philosophy & Approach

Solid event philosophy: **"Standard DOM events with JSX syntax"**

**Core concepts**:
- **JSX event handlers** - Like React (`onClick`)
- **Native events** - Browser's event system
- **Camel case** - `onClick`, `onInput`, `onChange`
- **No synthetic events** - Direct DOM events

**Very similar to React event handling!**

### Event Binding

**JSX syntax**:

```jsx
function Component() {
  const handleClick = (event) => {
    console.log('Clicked!', event)
  }

  return (
    <>
      {/* Function reference */}
      <button onClick={handleClick}>Click</button>

      {/* Inline */}
      <button onClick={() => console.log('Clicked')}>Click</button>

      {/* With event */}
      <button onClick={(e) => console.log(e.target)}>Click</button>

      {/* Pass arguments */}
      <button onClick={() => handleClick(data)}>Click</button>
    </>
  )
}
```

**Event names**:
- `onClick`, `onSubmit`, `onInput`, `onChange`
- `onKeyDown`, `onKeyUp`, `onKeyPress`
- `onMouseEnter`, `onMouseLeave`, `onFocus`, `onBlur`
- Standard JSX event names (like React)

**on: namespace** (advanced):

```jsx
{/* Standard bubbling */}
<div onClick={handleClick}>

{/* Capture phase */}
<div on:click={handleClick} capture>

{/* Both */}
<div onClick={bubble} on:click={capture} capture>
```

### Event Flow

**Standard DOM event flow**:
- Capture (top → bottom)
- Target
- Bubble (bottom → top)

**Preventing propagation**:

```jsx
<button onClick={(e) => {
  e.stopPropagation()
  handleClick()
}}>
  Click
</button>
```

**Preventing default**:

```jsx
<form onSubmit={(e) => {
  e.preventDefault()
  handleSubmit()
}}>
  <button type="submit">Submit</button>
</form>
```

**Event delegation** (automatic for most events):

Solid uses event delegation for common events (click, input, etc.) for performance.

### Event Object

**Native Event** - Standard DOM events:

```jsx
function handleClick(e) {
  e.type              // 'click'
  e.target            // Triggered element
  e.currentTarget     // Handler element
  e.preventDefault()
  e.stopPropagation()

  // Mouse events
  e.clientX, e.clientY
  e.altKey, e.ctrlKey
}

<button onClick={handleClick}>Click</button>
```

**TypeScript**:

```tsx
function handleClick(e: MouseEvent) {
  console.log(e.clientX)
}

function handleInput(e: InputEvent) {
  const target = e.target as HTMLInputElement
  console.log(target.value)
}
```

### Common Patterns

**1. Component events**:

```jsx
function Child(props) {
  return (
    <button onClick={() => props.onSubmit?.(data)}>
      Submit
    </button>
  )
}

<Child onSubmit={(data) => console.log(data)} />
```

**2. Form handling**:

```jsx
function Form() {
  const [name, setName] = createSignal('')

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log(name())
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={name()}
        onInput={(e) => setName(e.target.value)}
      />
      <button type="submit">Submit</button>
    </form>
  )
}
```

**3. Passing data**:

```jsx
<For each={items()}>
  {(item) => (
    <button onClick={() => handleClick(item)}>
      {item.name}
    </button>
  )}
</For>
```

**4. Custom events**:

```jsx
function Child(props) {
  const dispatch = () => {
    const event = new CustomEvent('custom', {
      detail: { data: 'value' }
    })
    props.ref?.dispatchEvent(event)
  }

  return <div ref={props.ref} onClick={dispatch} />
}

let childRef
<Child
  ref={childRef}
  addEventListener('custom', (e) => console.log(e.detail))
/>
```

### Performance Considerations

**Automatic event delegation**:
- Solid delegates common events
- Performance benefit for large lists
- No manual delegation needed

**Handler stability**:
```jsx
// Creates new function each time, but fine in Solid
<button onClick={() => handleClick(data)}>
```

Components run once, so function creation isn't a perf issue.

**Cleanup** - Automatic:
- Solid removes listeners on cleanup
- No memory leaks
- No manual removeEventListener

### Developer Experience

**Debugging: Excellent**
- Standard browser DevTools
- Native events
- Source maps work
- No synthetic event confusion

**Very similar to React** - Easy for React devs to learn.

### AI-Friendly Assessment

**What makes Solid events AI-friendly:**

✅ **Same as React**
- JSX event syntax (`onClick`)
- Familiar patterns
- Lots of training data

✅ **Simple and standard**
- Native DOM events
- No framework wrapper
- Predictable behavior

✅ **Clear patterns**
- Function references or inline
- Standard propagation/prevention
- No surprises

**What creates friction:**

⚠️ **Same as React weaknesses**
- Must remember `onClick` not `onclick`
- Camel case can be forgotten
- But minimal friction

**Overall Event Handling AI-Friendliness: 9/10**

Solid events are extremely AI-friendly - identical to React, which AI knows well. Standard, simple, predictable.

### Component Reusability Assessment

**Quality: Good (8/10)**

**Strengths**: JSX components familiar to React developers. Fine-grained reactivity means components are inherently performant. TypeScript-first. Signals work universally. Component functions run once - no re-render bugs. Context and stores for shared state. Small runtime (~7KB). Can compile to web components.

**Weaknesses**: Solid-specific - cannot use in React/Vue. Different mental model than React (no re-renders). Control flow components (<Show>, <For>) not standard JSX. Smaller ecosystem - fewer component libraries. Some patterns (reactive transforms) feel like magic.

**Cross-Project Reuse**: Good within Solid ecosystem. Components package as npm modules. Smaller ecosystem means less reuse. Cannot directly port React components (similar but different reactivity). Signals pattern spreading to other frameworks (Angular, Vue) - could improve portability.

**Design System Support**: Growing. Solid UI provides primitives. Hope UI, SUID (Solid MUI port) available. Kobalte for headless components. Tailwind works well. Smaller selection than React/Vue but improving.

## Maintainability

**Quality: Excellent (8.5/10)**

**Strengths**: TypeScript-first. Fine-grained reactivity prevents performance issues - no manual optimization needed. Signals prevent stale closures. Component functions run once - simpler mental model. No dependency arrays like React. Small runtime. DevTools for debugging. Predictable - signals always up-to-date. No useEffect complexity.

**Weaknesses**: Different paradigm from React - learning curve. Control flow components (<Show>, <For>) less familiar. Reactive transforms can feel like magic. Smaller community means less help. Fewer Stack Overflow answers. Some edge cases with reactive scope.

**Code Organization**: JSX components in .tsx files. Signals and stores separate. SolidStart enforces routing structure. Similar to React organization. Utils easily extracted.

**Testing**: Vitest for unit tests. Solid Testing Library for components. Signals easy to test - just call them. No re-renders means simpler test logic. E2E with Playwright/Cypress.

**Debugging**: Solid DevTools show component tree and signals. TypeScript catches errors. Console logs work. Signal values always current - no stale closures to debug. Smaller surface area than React.

**Scalability**: Excellent. Fine-grained reactivity scales to complex apps. No re-render performance issues. Code-splitting with lazy. SolidStart for SSR/SSG. Small runtime keeps bundles small. Large apps perform well.

**Breaking Changes**: Solid 1.x stable. Minor version updates smooth. Reactive transforms changed but gradual migration. SolidStart in beta (evolving). Smaller ecosystem means less churn than React.

## AI-Assisted Development Considerations

### What Works Well with AI

**Familiar JSX syntax**
- Same as React
- Huge training corpus
- Easy for AI to generate

**Explicit subscriptions**
- `count()` makes reactivity visible
- Clear what's reactive
- No hidden magic

**Automatic dependency tracking**
- No dependency arrays
- Hard to make mistakes
- AI doesn't need to track deps

**Simple primitives**
- createSignal, createEffect, createMemo
- Limited API surface
- Easy to understand

**Maximum performance by default**
- No optimization needed
- Write simple code
- Solid handles the rest

### What Creates Friction

**Different from React mental model**
- Components run once (React: many times)
- Must understand fine-grained reactivity
- AI trained on React might generate wrong patterns

**Must call signals as functions**
- `count()` not `count`
- Easy to forget
- Breaks reactivity silently

**Props are proxies**
- Destructuring breaks reactivity
- Not obvious
- Easy mistake

**Smaller ecosystem**
- Less training data
- Fewer examples
- Less popular than React/Vue

**Build step required**
- JSX needs compilation
- Can't run directly
- Tooling complexity

### Opportunities for Improvement

**What Solid teaches for next-gen frameworks:**

1. **Fine-grained reactivity is the future**
   - No Virtual DOM needed
   - Maximum performance
   - Direct DOM updates

2. **Components running once is powerful**
   - Less re-execution
   - More efficient
   - Simpler mental model (once you get it)

3. **Explicit subscriptions are clear**
   - `count()` shows subscription
   - No hidden reactivity
   - Predictable behavior

4. **Automatic dependency tracking is essential**
   - No manual dependency arrays
   - Fewer bugs
   - Better DX

5. **JSX is good syntax**
   - Familiar
   - Flexible
   - Powerful

6. **But: Need better prop reactivity**
   - Destructuring should work
   - Props proxies are confusing
   - Could be more intuitive

**For next-gen AI-optimized frameworks:**
- Keep Solid's fine-grained reactivity
- Keep JSX (familiar to AI)
- Keep automatic dependency tracking
- Fix prop destructuring issue
- Grow ecosystem/training data
- Consider: Compile-time hints for AI

**Final AI-Friendliness: 8.5/10**
- State Management: 8.5/10 (signals are great, but calling them is friction)
- Rendering: 8/10 (JSX is familiar, but different compilation)
- Event Handling: 9/10 (identical to React)

**Solid's biggest advantages**:
1. **Maximum performance** - Fastest framework
2. **Fine-grained reactivity** - Only exact DOM nodes update
3. **Familiar JSX** - Like React
4. **Automatic dependency tracking** - No manual arrays
5. **Simple primitives** - createSignal, createEffect, createMemo

**Biggest disadvantages**:
1. **Different mental model** - Components run once
2. **Must call signals** - `count()` not `count`
3. **Props destructuring breaks** - Proxy confusion
4. **Smaller ecosystem** - Less training data
5. **Build required** - JSX compilation

**Verdict**: Solid is the **performance king** and shows the future (fine-grained reactivity, no Virtual DOM). Very AI-friendly for those who understand the mental model. Main limitation is smaller ecosystem and different approach from React.

**Solid proves**: React's component re-rendering model isn't necessary. Fine-grained reactive signals + JSX is the optimal combination for performance.
