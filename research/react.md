---
framework: "React"
version: "19.2.1"
category: "full-framework"

# Links & Resources
github_url: "https://github.com/facebook/react"
docs_url: "https://react.dev"
npm_package: "react"
mcp_server:
  available: false
  url: null
  party: null

# Technical metadata
implementation_language: "JavaScript"
typescript_support: "types-package"
license: "MIT"
runtime: "browser"

# Capabilities
capabilities:
  state_management: true
  rendering: true
  event_handling: true

# Classification (for searching)
paradigm: "declarative"
state_model: "immutable"
rendering_strategy: "virtual-dom"

# Maintenance
maintainer: "Meta"
first_released: "2013"
status: "active"

# Review metadata
reviewed_date: "2025-12-06"
reviewed_by_model: "Claude Sonnet 4.5"
reviewer_notes: "First full-framework review covering state, rendering, and events. React 19 includes Server Components, Actions API, and production-ready compiler."
---

# React

## State Management

### Philosophy & Mental Model

React's state philosophy centers on **component-local, immutable state** with a clear mental model:

**"State is a component's memory"**

Key concepts:
- **Local by default**: State belongs to individual component instances, not global stores
- **Immutable updates**: Never mutate state directly; always create new values
- **Declarative**: Describe what the UI should look like for a given state, React handles updates
- **Unidirectional data flow**: State flows down through props, updates flow up through callbacks
- **Isolation**: Each component instance maintains completely independent state

**Mental model**:
- Regular variables: Don't persist across renders, changes don't trigger re-renders
- State variables: Persist across renders, setter triggers re-render
- Props: Read-only data passed from parent
- Context: "Teleport" data deep into tree without prop drilling

**Philosophy shift from imperative to declarative**:
- Imperative (jQuery): "When user clicks, update this DOM element"
- Declarative (React): "Given this state, render this UI. When state changes, React updates UI automatically."

React doesn't prescribe global state solutions - that's intentionally left to libraries (Redux, Jotai, Zustand) or built manually with Context.

### Core Primitives

**1. useState** - Local component state:

```typescript
const [count, setCount] = useState(0)

// Update
setCount(count + 1)

// Functional update (safer for async)
setCount(prev => prev + 1)

// Multiple state variables
const [name, setName] = useState('')
const [items, setItems] = useState([])
```

**Returns**: `[currentValue, setterFunction]`

**Key behaviors**:
- Initial value only used on first render
- Setter triggers re-render
- State persists between renders
- Each component instance has isolated state

**2. useReducer** - Complex state logic:

```typescript
const [state, dispatch] = useReducer(reducer, initialState)

function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1 }
    case 'decrement':
      return { count: state.count - 1 }
    default:
      return state
  }
}

// Usage
dispatch({ type: 'increment' })
```

**When to use**: Multiple related state values, complex update logic, or when you want Redux-style patterns without Redux.

**3. useContext** - Share state across tree:

```typescript
const ThemeContext = createContext('light')

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <DeepChild />
    </ThemeContext.Provider>
  )
}

function DeepChild() {
  const theme = useContext(ThemeContext)
  return <div>Theme: {theme}</div>
}
```

**Not a state management solution** - Context provides value distribution, not state updates. Commonly combined with `useState` or `useReducer`:

```typescript
const [state, dispatch] = useReducer(reducer, initialState)

return (
  <StateContext.Provider value={state}>
    <DispatchContext.Provider value={dispatch}>
      <App />
    </DispatchContext.Provider>
  </StateContext.Provider>
)
```

**4. React 19: useActionState** - Form state management:

```typescript
const [state, formAction] = useActionState(
  async (prevState, formData) => {
    // Server action
    const result = await updateUser(formData)
    return result
  },
  initialState
)
```

**5. React 19: useOptimistic** - Optimistic updates:

```typescript
const [optimisticState, addOptimistic] = useOptimistic(
  state,
  (currentState, optimisticValue) => {
    return [...currentState, optimisticValue]
  }
)
```

### Update Mechanism

**Immutable update pattern** - Never mutate state directly:

```typescript
// ❌ Wrong - mutation
const [items, setItems] = useState([1, 2, 3])
items.push(4)  // Mutates array
setItems(items)  // React won't detect change

// ✅ Correct - new array
setItems([...items, 4])
setItems(items.concat(4))

// Objects
const [user, setUser] = useState({ name: 'John', age: 30 })

// ❌ Wrong
user.age = 31
setUser(user)

// ✅ Correct
setUser({ ...user, age: 31 })

// Nested objects
setUser({
  ...user,
  address: {
    ...user.address,
    city: 'New York'
  }
})
```

**Why immutability matters**: React compares state by reference (`===`). If you mutate an object, the reference doesn't change, so React won't re-render.

**Batching** (React 18+):
```typescript
function handleClick() {
  setCount(count + 1)  // Queued
  setName('John')      // Queued
  setAge(30)           // Queued
  // React batches all three into one re-render
}
```

**Automatic batching** now works in:
- Event handlers (always worked)
- Promises (React 18+)
- setTimeout (React 18+)
- Native event handlers (React 18+)

**React 19 improvements**: 32% reduction in render cycles during heavy updates due to expanded batching.

**Async updates**:
```typescript
// State updates are asynchronous
setCount(count + 1)
console.log(count)  // Still shows old value!

// Use functional updates for dependent updates
setCount(prev => prev + 1)
setCount(prev => prev + 1)
// Both increments apply correctly
```

### Read Pattern

**Within components** - Hooks:

```typescript
function Component() {
  const [value, setValue] = useState(0)
  const dispatch = useContext(DispatchContext)

  return <div>{value}</div>
}
```

**Hook rules**:
- Only call at top level (never in conditions/loops)
- Only call from React functions (components or custom hooks)
- Call in same order every render

**Why**: React relies on call order to match state variables across renders.

**Passing state down** - Props:
```typescript
function Parent() {
  const [count, setCount] = useState(0)
  return <Child count={count} onIncrement={() => setCount(count + 1)} />
}

function Child({ count, onIncrement }) {
  return <button onClick={onIncrement}>{count}</button>
}
```

**Lifting state up** - Share state between siblings:
```typescript
function Parent() {
  const [value, setValue] = useState('')

  return (
    <>
      <InputComponent value={value} onChange={setValue} />
      <DisplayComponent value={value} />
    </>
  )
}
```

**Outside components** - No official API:
- Can't call hooks outside components
- Store state in module-level variables (loses reactivity)
- Use external state libraries (Jotai, Zustand) for global state

### Reactivity & Granularity

**Component-level granularity** - coarsest of all modern frameworks:

**What triggers re-renders**:
1. State change (via setter) in the component
2. Props change from parent
3. Parent re-renders (even if props unchanged!)
4. Context value changes

**Re-render cascade**:
```typescript
function Parent() {
  const [count, setCount] = useState(0)
  return (
    <div>
      <Child1 />  {/* Re-renders even though doesn't use count! */}
      <Child2 count={count} />
    </div>
  )
}
```

When `Parent` re-renders, ALL children re-render by default, regardless of whether their props changed.

**Optimization required** - Manual memoization:

```typescript
// Prevent re-render if props unchanged
const Child1 = memo(function Child1() {
  return <div>Static content</div>
})

// Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return computeExpensive(data)
}, [data])

// Memoize callbacks to prevent child re-renders
const handleClick = useCallback(() => {
  setCount(count + 1)
}, [count])
```

**React 19 Compiler** (production-ready):
- Automatically memoizes components and values
- Analyzes dependency graph
- No manual `memo`, `useMemo`, `useCallback` needed in many cases
- Opt-in at build time

**Structural sharing** - React prevents re-renders when new value deeply equals old value:
```typescript
setUser({ name: 'John', age: 30 })
setUser({ name: 'John', age: 30 })  // No re-render, same structure
```

**Performance characteristics**:
- **Coarse granularity**: Whole component + children re-render
- **Virtual DOM overhead**: Diffing cost on every render
- **Requires manual optimization**: memo, useMemo, useCallback
- **Gets expensive with deep trees**: Re-render cascades

This is React's biggest weakness compared to fine-grained reactive frameworks (Solid, Svelte).

### Async Handling

**No built-in async state primitives** - React focuses on rendering, not data fetching.

**Common patterns**:

**1. useEffect + useState** (manual):
```typescript
function Component() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    fetchData()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loading />
  if (error) return <Error error={error} />
  return <div>{data}</div>
}
```

**Problems**: Boilerplate, race conditions, no caching, manual cleanup.

**2. React 19: use() Hook** - Unwrap promises:
```typescript
function Component({ dataPromise }) {
  const data = use(dataPromise)  // Suspends until promise resolves
  return <div>{data}</div>
}

<Suspense fallback={<Loading />}>
  <Component dataPromise={fetchData()} />
</Suspense>
```

**3. Suspense** (React 18+):
```typescript
const resource = fetchData()  // Returns Suspense-compatible resource

function Component() {
  const data = resource.read()  // Suspends if not ready
  return <div>{data}</div>
}

<Suspense fallback={<Loading />}>
  <Component />
</Suspense>
```

**4. Server Components** (React 19):
```typescript
// Server Component (async function!)
async function BlogPost({ id }) {
  const post = await db.posts.findOne(id)  // Runs on server
  return <article>{post.content}</article>
}
```

**5. External libraries** (recommended for complex async):
- TanStack Query - async state management
- SWR - data fetching hooks
- Apollo Client - GraphQL

**React's philosophy**: Provide primitives (Suspense, use()), let ecosystem build solutions.

### Derived State

**Pattern: Calculate during render**

React's primary recommendation is **compute, don't store**:

```typescript
function TodoList({ todos }) {
  // ✅ Calculate during render
  const completedCount = todos.filter(t => t.completed).length

  // ❌ Don't store as state
  // const [completedCount, setCompletedCount] = useState(0)

  return <div>Completed: {completedCount}</div>
}
```

**Memoize expensive calculations**:
```typescript
const sortedTodos = useMemo(() => {
  return todos.slice().sort((a, b) => a.priority - b.priority)
}, [todos])
```

**Multi-source derivation**:
```typescript
function ShoppingCart({ items, taxRate }) {
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price, 0),
    [items]
  )

  const tax = useMemo(
    () => subtotal * taxRate,
    [subtotal, taxRate]
  )

  const total = subtotal + tax

  return <div>Total: ${total}</div>
}
```

**No built-in derived primitives** like Jotai's derived atoms or Solid's computed signals. Derivation is manual with `useMemo` or plain calculations.

**React 19 Compiler** automatically memoizes calculations, reducing need for manual `useMemo`.

### Developer Experience

**Boilerplate: Low to Medium**
- Simple cases: Very low (`useState` is minimal)
- Complex state: Medium (manual immutable updates verbose)
- Global state: High (need Context Provider boilerplate or external library)

**Comparison**:
```typescript
// Simple case - very clean
const [count, setCount] = useState(0)

// Nested object updates - verbose
setUser({
  ...user,
  profile: {
    ...user.profile,
    address: {
      ...user.profile.address,
      city: 'NYC'
    }
  }
})

// Libraries like Immer help:
import { useImmer } from 'use-immer'
const [user, updateUser] = useImmer(initialUser)
updateUser(draft => {
  draft.profile.address.city = 'NYC'  // Mutable API, immutable result
})
```

**DevTools: Excellent**
- React DevTools (browser extension)
- Component tree inspection
- Props/state/hooks inspection
- Profiler for performance analysis
- Time-travel debugging (with Redux DevTools)
- Highlights which components re-rendered
- Shows why components re-rendered
- Heap snapshots and memory analysis

**Debugging: Good**
- Clear component tree in DevTools
- `useDebugValue` for custom hooks
- Error boundaries catch render errors
- Strict Mode catches side effects
- Console warnings for common mistakes

**Time travel: Via Redux DevTools**
- Not built into React itself
- Available when using Redux or compatible state libraries
- Can replay actions and inspect state at any point

**TypeScript support: Good**
- `@types/react` package (not native)
- Strong type inference for props
- Generic components supported
- Hooks are well-typed
- Some rough edges (event types, ref types)

### AI-Friendly Assessment

**What makes React easy for AI to work with:**

✅ **Extremely popular = vast training data**
- React is THE most common UI framework
- AI models have seen millions of React examples
- Patterns are well-established and consistent

✅ **Explicit component boundaries**
- Each component is a clear function
- Props are explicit parameters
- Easy to understand component dependencies

✅ **Declarative**
- Describe UI for given state
- No imperative DOM manipulation to trace
- Predictable: same state + props = same UI

✅ **Hook dependencies are explicit**
- `useEffect(() => {...}, [dep1, dep2])` shows exactly what triggers effect
- AI can verify dependency arrays
- Lint rules help catch mistakes

✅ **Simple primitives**
- `useState` is trivial to understand
- Patterns are consistent across codebases
- Limited API surface for core features

**What creates friction:**

⚠️ **Immutable update verbosity**
- Nested object updates are verbose and error-prone
- Easy to accidentally mutate
- AI might generate mutation instead of spread operators

⚠️ **Re-render cascade complexity**
- Understanding when components re-render requires deep knowledge
- `memo`, `useMemo`, `useCallback` usage is subtle
- Performance debugging is non-obvious

⚠️ **useEffect complexity**
- Dependency arrays are a common source of bugs
- Cleanup functions often forgotten
- Infinite loop risks

⚠️ **Stale closures**
- Callbacks can capture old state values
- Requires understanding JavaScript closure semantics
- Common mistake: `setCount(count + 1)` vs `setCount(c => c + 1)`

⚠️ **Context re-render issues**
- Context value changes cause all consumers to re-render
- Requires manual splitting or memoization
- Not obvious from reading code

⚠️ **Hook ordering rules**
- Must call hooks in same order every render
- Can't be called conditionally
- Error messages aren't always clear

**Overall AI-Friendliness: 7/10**

React is highly AI-friendly due to popularity and declarative model, but has rough edges around performance optimization, immutable updates, and useEffect complexity.

**Compared to Jotai/TanStack Query**: Less AI-friendly due to:
- More implicit re-render behavior
- Manual optimization required
- Verbose immutable updates
- Hook rules and closure gotchas

## Rendering

### Philosophy & Approach

React's rendering philosophy: **Declarative UI via Virtual DOM**

**Core concept**: "Describe what the UI should look like, not how to build it."

Key principles:
- **Component composition**: Build complex UIs from simple, reusable components
- **Virtual DOM**: Maintain lightweight representation of actual DOM
- **Reconciliation**: Efficiently compute minimal DOM changes
- **Declarative**: `UI = f(state)` - UI is pure function of state
- **One-way data flow**: Data flows down, events flow up

**Mental model shift**:
- Imperative (jQuery): "Find element, change its text, add class, append child"
- Declarative (React): "Given this data, this is what should render. React handles DOM updates."

**Philosophy**: React provides the "View" layer. It doesn't prescribe routing, data fetching, or state management - focusing purely on rendering UI efficiently.

### Update Strategy

**Three-phase rendering process**:

**1. Trigger** - What causes a render:
- Initial render (`createRoot().render()`)
- State update (`setState`)
- Parent re-render (cascades down)
- Context value change

**2. Render** - React calls components:
- Pure calculation: same inputs → same output
- Returns JSX describing UI
- Recursive: if component returns other components, render those too
- **No side effects allowed** - rendering must be pure

**3. Commit** - Update DOM:
- Compare new virtual DOM with previous
- Apply minimal changes to actual DOM
- Only touch elements that changed

**Batching** (automatic in React 18+):
```typescript
function handleClick() {
  setCount(c => c + 1)
  setName('John')
  setAge(30)
  // One render, not three
}
```

**Concurrent rendering** (React 18+):
- Can pause and resume rendering
- Can prioritize urgent updates (user input) over low-priority (data fetching)
- `startTransition` marks low-priority updates

```typescript
import { startTransition } from 'react'

startTransition(() => {
  setSearchQuery(input)  // Non-urgent, can be interrupted
})
```

### Reconciliation

**The "diffing" algorithm** - How React determines what changed:

**Key heuristics**:
1. **Different element types** → Tear down old tree, build new one
2. **Same element type** → Update props, keep DOM node
3. **Keys** → Match elements across renders

**Example - Different types**:
```jsx
// Before
<div><Counter /></div>

// After
<span><Counter /></span>

// Result: Counter unmounts and remounts (state lost!)
```

**Example - Same type**:
```jsx
// Before
<div className="before" />

// After
<div className="after" />

// Result: Just updates className attribute
```

**Keys** - Critical for lists:
```jsx
// ❌ Without keys - inefficient, buggy
{items.map(item => <Item item={item} />)}

// ✅ With keys - efficient, correct
{items.map(item => <Item key={item.id} item={item} />)}
```

**How keys work**:
- React matches elements by key across renders
- Same key → update existing element
- Different key → unmount old, mount new
- No key → match by position (fragile)

**Reconciliation optimization**:
- React only updates DOM nodes that changed
- Preserves input focus, scroll position when structure stays same
- **Very efficient** for most common UI update patterns

**Limitations**:
- Diffing algorithm is O(n³) worst case, but heuristics make it O(n) in practice
- Deep component trees still expensive to diff
- Fine-grained frameworks (Solid, Svelte) avoid diffing entirely

### Templating & Syntax

**JSX** - JavaScript syntax extension:

```jsx
const element = <h1 className="greeting">Hello, {name}!</h1>

// Compiles to:
const element = React.createElement(
  'h1',
  { className: 'greeting' },
  'Hello, ',
  name,
  '!'
)
```

**JSX features**:
- Embed JavaScript expressions with `{}`
- HTML-like syntax for familiar feel
- `className` instead of `class` (JS reserved word)
- `htmlFor` instead of `for`
- camelCase props: `onClick`, `onChange`
- Self-closing tags: `<img />`, `<Component />`

**Conditional rendering**:
```jsx
// Ternary
{isLoggedIn ? <Dashboard /> : <Login />}

// &&
{showWarning && <Warning />}

// If-else with variables
let content
if (isLoading) {
  content = <Loading />
} else if (error) {
  content = <Error />
} else {
  content = <Data />
}
return <div>{content}</div>
```

**List rendering**:
```jsx
{items.map(item => (
  <li key={item.id}>{item.name}</li>
))}
```

**Fragments** - Return multiple elements:
```jsx
<>
  <Header />
  <Content />
  <Footer />
</>

// Or with key
<Fragment key={item.id}>
  <dt>{item.term}</dt>
  <dd>{item.description}</dd>
</Fragment>
```

**JSX vs alternatives**:
- More powerful than templates (full JavaScript)
- Less separated than string templates (HTML/JS interleaved)
- Type-safe with TypeScript
- Requires build step (Babel/SWC)

### Component Model

**Functional components** (modern, recommended):

```typescript
function Welcome({ name, age }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    console.log('Mounted')
    return () => console.log('Unmounted')
  }, [])

  return <h1>Hello, {name}!</h1>
}

// With TypeScript
interface Props {
  name: string
  age: number
}

function Welcome({ name, age }: Props) {
  return <h1>Hello, {name}!</h1>
}
```

**Class components** (legacy, avoid):
```typescript
class Welcome extends React.Component {
  state = { count: 0 }

  componentDidMount() {
    console.log('Mounted')
  }

  render() {
    return <h1>Hello, {this.props.name}!</h1>
  }
}
```

**Hooks replaced class lifecycle**:
- `useState` → `this.state` / `this.setState`
- `useEffect` → `componentDidMount` / `componentDidUpdate` / `componentWillUnmount`
- `useContext` → `static contextType` / `<Context.Consumer>`
- `useRef` → `this.refs` / `React.createRef()`

**Props**:
- Passed from parent to child
- Read-only (immutable)
- Can be any type (primitives, objects, functions, components)

```typescript
<Button color="blue" onClick={handleClick}>
  Click me
</Button>

function Button({ color, onClick, children }) {
  return (
    <button style={{ color }} onClick={onClick}>
      {children}
    </button>
  )
}
```

**Children** - Special prop:
```jsx
<Card>
  <h1>Title</h1>
  <p>Content</p>
</Card>

function Card({ children }) {
  return <div className="card">{children}</div>
}
```

**Component composition patterns**:
- Container/Presentational
- Higher-Order Components (HOCs) - legacy
- Render props - legacy
- Custom hooks (modern) - share logic without UI

### Performance Optimizations

**1. React.memo** - Prevent re-render if props unchanged:
```typescript
const ExpensiveComponent = memo(function ExpensiveComponent({ data }) {
  return <div>{expensiveCalculation(data)}</div>
})

// With custom comparison
const Component = memo(MyComponent, (prevProps, nextProps) => {
  return prevProps.id === nextProps.id
})
```

**2. useMemo** - Memoize expensive calculations:
```typescript
const sortedItems = useMemo(() => {
  return items.slice().sort((a, b) => a.value - b.value)
}, [items])
```

**3. useCallback** - Memoize functions:
```typescript
const handleClick = useCallback(() => {
  setCount(count + 1)
}, [count])

// Prevents child re-render if child is memo'd
<MemoizedChild onClick={handleClick} />
```

**4. Keys** - Help reconciliation:
```jsx
{items.map(item => <Item key={item.id} item={item} />)}
```

**5. Code splitting** - Load components on demand:
```typescript
import { lazy, Suspense } from 'react'

const Dashboard = lazy(() => import('./Dashboard'))

<Suspense fallback={<Loading />}>
  <Dashboard />
</Suspense>
```

**6. Virtualization** - Render only visible items:
```typescript
import { FixedSizeList } from 'react-window'

<FixedSizeList
  height={500}
  itemCount={1000}
  itemSize={35}
>
  {({ index, style }) => (
    <div style={style}>Row {index}</div>
  )}
</FixedSizeList>
```

**7. React 19 Compiler**:
- Automatically applies memo, useMemo, useCallback
- Analyzes component dependencies
- No manual optimization needed
- Opt-in at build time

**When NOT to optimize**:
- React recommends "measure first, optimize later"
- `useMemo` has cost - only use for expensive calculations
- `memo` has cost - only use for expensive components
- Most components don't need optimization

### Developer Experience

**Learning curve: Medium**
- JSX is intuitive for those familiar with HTML
- Declarative model easier than imperative DOM
- Hook rules require understanding
- Performance optimization has steep learning curve

**DevTools: Excellent**
- React DevTools browser extension
- Component tree visualization
- Props/state inspection
- Profiler shows render timing
- Highlights components that re-rendered
- "Why did this render?" feature
- Memory profiling

**Hot reload: Excellent**
- Fast Refresh preserves component state
- Instant feedback on code changes
- Error overlay with source location
- Works with TypeScript

### AI-Friendly Assessment

**What makes React rendering AI-friendly:**

✅ **JSX is highly readable**
- HTML-like syntax is intuitive
- Clear component boundaries
- Easy to generate valid JSX

✅ **Declarative model**
- `UI = f(state)` is predictable
- No hidden DOM manipulation
- What you see is what renders

✅ **Component composition is explicit**
- Parent-child relationships clear
- Props flow visible
- Easy to understand component tree

✅ **Vast ecosystem knowledge**
- AI trained on millions of React examples
- Patterns are well-established
- Common solutions documented

**What creates friction:**

⚠️ **Re-render optimization complexity**
- When to use memo/useMemo/useCallback is subtle
- AI might over-optimize or under-optimize
- Performance debugging requires profiling

⚠️ **Key prop requirements**
- Easy to forget keys in lists
- Incorrect key usage causes bugs
- Not obvious from code alone

⚠️ **Reconciliation edge cases**
- Element type changes cause remounts
- Conditional rendering affects reconciliation
- Component identity matters

⚠️️ **Build tooling required**
- JSX needs compilation
- Many setup choices (Vite, CRA, Next.js)
- Configuration complexity

**Overall Rendering AI-Friendliness: 8/10**

React's rendering model is AI-friendly due to declarative JSX and explicit composition. Main challenges are optimization decisions and build tooling complexity.

## Event Handling

### Philosophy & Approach

React's event handling philosophy: **Synthetic events with declarative binding**

**Core concepts**:
- **Synthetic events**: React wraps native DOM events in cross-browser compatible wrapper
- **Event delegation**: React attaches single listener at root, not on every element
- **Declarative**: Bind handlers in JSX, not with `addEventListener`
- **Camel case**: Use `onClick`, not `onclick`

**Mental model**:
- DOM way: `element.addEventListener('click', handler)`
- React way: `<button onClick={handler}>Click</button>`

**Design choice**: React normalizes events across browsers, handling quirks for you.

### Event Binding

**Inline function reference** (recommended):
```jsx
function Button() {
  function handleClick() {
    alert('Clicked!')
  }

  return <button onClick={handleClick}>Click</button>
}
```

**Critical: Pass function, not function call**:
```jsx
// ✅ Correct - passes function reference
<button onClick={handleClick}>

// ❌ Wrong - calls function immediately during render
<button onClick={handleClick()}>

// ✅ Correct if you need to pass arguments
<button onClick={() => handleClick(arg)}>
<button onClick={(e) => handleClick(e, arg)}>
```

**Inline arrow function**:
```jsx
<button onClick={() => alert('Clicked!')}>Click</button>

<button onClick={(e) => {
  e.preventDefault()
  handleSubmit()
}}>
  Submit
</button>
```

**Passing handlers as props**:
```jsx
function Button({ onClick, children }) {
  return <button onClick={onClick}>{children}</button>
}

function App() {
  return <Button onClick={() => alert('Clicked')}>Click</Button>
}
```

**Naming convention**:
- DOM events: `onClick`, `onChange`, `onSubmit` (lowercase "on")
- Custom component props: `onSmash`, `onPlayMovie` (uppercase after "on")

```jsx
// Custom component
function VideoPlayer({ onPlay, onPause }) {
  return <video onPlay={onPlay} onPause={onPause} />
}
```

### Event Flow

**Bubbling** - Events propagate upward through DOM tree:

```jsx
<div onClick={() => alert('Div clicked')}>
  <button onClick={() => alert('Button clicked')}>
    Click me
  </button>
</div>

// Click button: "Button clicked" then "Div clicked"
```

**Stopping propagation**:
```jsx
<button onClick={(e) => {
  e.stopPropagation()
  alert('Only this handler runs')
}}>
  Click
</button>
```

**Capture phase** (rare):
```jsx
<div onClickCapture={() => alert('Captured during capture phase')}>
  <button onClick={() => alert('Normal bubbling')}>
    Click
  </button>
</div>

// Capture handlers run before bubbling handlers
```

**Event ordering**:
1. Capture phase (top to bottom): `onClickCapture`
2. Target phase: Element's own handler
3. Bubbling phase (bottom to top): `onClick`

### Event Object

**Synthetic Event** - React's cross-browser wrapper:

```typescript
function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
  e.preventDefault()        // Prevent default behavior
  e.stopPropagation()       // Stop bubbling
  e.currentTarget           // Element handler attached to
  e.target                  // Element that triggered event
  e.nativeEvent            // Underlying browser event

  // Mouse-specific
  e.clientX, e.clientY     // Mouse position
  e.altKey, e.ctrlKey      // Modifier keys
}
```

**Event types** (TypeScript):
- `React.MouseEvent<T>` - Mouse events
- `React.KeyboardEvent<T>` - Keyboard events
- `React.FormEvent<T>` - Form events
- `React.ChangeEvent<T>` - Input change events
- `React.FocusEvent<T>` - Focus events

**SyntheticEvent properties**:
- Normalized across browsers
- Pooled (reused) - don't access asynchronously!
- Use `e.persist()` if needed (rarely)

**Accessing native event**:
```jsx
function handleClick(e) {
  const nativeEvent = e.nativeEvent
  // Access browser-specific properties
}
```

### Common Patterns

**1. Passing data to handlers**:

```jsx
// ❌ Creates new function every render
<button onClick={() => handleClick(id)}>

// ✅ Use data attributes (simple)
<button data-id={id} onClick={handleClick}>

function handleClick(e) {
  const id = e.currentTarget.dataset.id
}

// ✅ useCallback for stable reference
const handleClick = useCallback(() => {
  doSomething(id)
}, [id])
```

**2. Form handling**:

```jsx
function Form() {
  const [value, setValue] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()  // Don't reload page
    submit(value)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue(e.target.value)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={value} onChange={handleChange} />
      <button type="submit">Submit</button>
    </form>
  )
}
```

**3. Accessing component state in handlers**:

```jsx
function Counter() {
  const [count, setCount] = useState(0)

  // ✅ Closure captures current count
  function handleClick() {
    console.log(count)  // Current value
    setCount(count + 1)
  }

  // ⚠️ Stale closure problem
  useEffect(() => {
    const timer = setInterval(() => {
      console.log(count)  // Always logs initial value!
      setCount(count + 1) // Always sets to 1!
    }, 1000)
    return () => clearInterval(timer)
  }, [])  // Empty deps = stale closure

  // ✅ Fix with functional update
  setCount(prev => prev + 1)
}
```

**4. Preventing default**:

```jsx
// Prevent form submission reload
<form onSubmit={(e) => {
  e.preventDefault()
  handleSubmit()
}}>

// Prevent link navigation
<a href="/page" onClick={(e) => {
  e.preventDefault()
  customNavigate()
}}>
```

**5. Event delegation pattern** (manual):
```jsx
<ul onClick={(e) => {
  if (e.target.tagName === 'LI') {
    handleItemClick(e.target.dataset.id)
  }
}}>
  <li data-id="1">Item 1</li>
  <li data-id="2">Item 2</li>
  <li data-id="3">Item 3</li>
</ul>
```

### Performance Considerations

**React uses event delegation automatically**:
- Single event listener at root
- Events bubble to root, React dispatches to handlers
- Efficient for large lists

**Handler performance**:

```jsx
// ❌ Creates new function every render
<button onClick={() => handleClick(id)}>

// ✅ Stable reference with useCallback
const handleClick = useCallback(() => {
  doSomething(id)
}, [id])

<button onClick={handleClick}>
```

**When it matters**:
- Parent component re-renders frequently
- Child is expensive and memo'd
- Without stable reference, memo is defeated

**Handler cleanup**:
- React handles cleanup automatically
- No `removeEventListener` needed
- Handlers cleaned up when component unmounts

**Memory leak concerns**:
- Generally not an issue with React's event system
- Watch for manual `addEventListener` (clean up in useEffect)
- Watch for closures capturing large objects

### Developer Experience

**Debugging: Good**
- DevTools shows event handlers
- Can inspect event object
- Error boundaries catch handler errors
- Console logs work normally

**Type safety: Good (with TypeScript)**
```typescript
// Event type inference
function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
  e.currentTarget  // TypeScript knows it's HTMLButtonElement
}

// Generic for any element
function handleClick<T extends HTMLElement>(
  e: React.MouseEvent<T>
) {
  e.currentTarget  // T type
}
```

**Common gotchas**:
- Passing `onClick={handleClick()}` instead of `onClick={handleClick}`
- Stale closures in event handlers
- Forgetting `e.preventDefault()` for forms
- Synthetic event pooling (mostly solved in React 17+)

### AI-Friendly Assessment

**What makes React events AI-friendly:**

✅ **Declarative binding**
- Event handlers visible in JSX
- Clear which element has which handler
- Easy to find all handlers for an element

✅ **Consistent naming**
- Camel case convention: `onClick`, `onChange`
- Predictable event names
- Standard across all React code

✅ **Explicit event flow**
- `stopPropagation()` is explicit
- `preventDefault()` is explicit
- No hidden behavior

✅ **Type safety**
- TypeScript event types are comprehensive
- Catches common mistakes
- Auto-completion for event properties

**What creates friction:**

⚠️ **Function reference confusion**
- Easy mistake: `onClick={fn()}` vs `onClick={fn}`
- AI might generate incorrect version
- Not obvious from syntax alone

⚠️ **Stale closure issues**
- Handler can capture old state
- Requires understanding closures
- `useCallback` dependencies are subtle

⚠️ **Synthetic event pooling**
- Can't access event asynchronously (React <17)
- Need `e.persist()` workaround
- Confusing for those expecting native events

⚠️ **preventDefault vs stopPropagation**
- Easy to confuse these
- Both needed in different scenarios
- Not always obvious which to use

**Overall Event Handling AI-Friendliness: 8/10**

React's event system is AI-friendly due to declarative syntax and consistent patterns. Main challenges are function reference mistakes and closure subtleties.

### Component Reusability Assessment

**Quality: Excellent (9/10)**

**Strengths**: Function components are highly reusable - just export and import. Props interface makes contracts explicit. Hooks enable logic reuse without component hierarchy. Composition via children and render props. Component libraries (MUI, Chakra, shadcn/ui) prove ecosystem reusability. TypeScript makes component APIs type-safe. React ecosystem is npm-first - packaging trivial.

**Weaknesses**: Context values create hidden dependencies - components using context less portable. Hooks like useEffect can couple to specific environments. Ref forwarding requires forwardRef wrapper. Some patterns (HOCs) create wrapper hell. Framework-specific - components only work in React.

**Cross-Project Reuse**: Excellent within React ecosystem. Components package as npm modules. Design systems work across teams. Hooks libraries (react-use, ahooks) demonstrate pattern reusability. Cannot use in Vue/Svelte/etc without ports.

**Design System Support**: Best-in-class. Major design systems (Material UI, Ant Design, Chakra, shadcn/ui) built for React. Radix primitives provide unstyled base. CSS-in-JS, Tailwind, CSS Modules all supported. Component composition model ideal for design systems.

## Maintainability

**Quality: Good (7.5/10)**

**Strengths**: TypeScript support excellent. React DevTools for component inspection. Function components simpler than classes. Hooks reduce code duplication. Large ecosystem means solutions exist. Testing libraries mature (React Testing Library, Jest). Fast Refresh for quick iteration. Error boundaries contain failures. StrictMode catches issues early.

**Weaknesses**: useEffect dependencies easy to get wrong - stale closures, infinite loops. Closure scope rules tricky - not always obvious what's captured. Re-render performance requires manual optimization (memo, useMemo, useCallback). Virtual DOM abstraction hides performance issues until too late. Ecosystem churn - best practices change frequently. No official state management - every project picks own (Redux, Zustand, Jotai, Context).

**Code Organization**: No enforced structure - component folders vary by team. Hooks in separate files for reuse. Context providers at app root. Custom hooks for shared logic. Feature-based or layer-based organization both common.

**Testing**: React Testing Library encourages user-centric tests. Jest for unit tests. Component testing straightforward - render and assert. Hooks harder to test - need component wrapper or @testing-library/react-hooks. E2E with Playwright/Cypress.

**Debugging**: React DevTools show component tree, props, state, hooks. Profiler for performance. StrictMode double-renders to catch side effects. Console errors often helpful. useEffect issues hardest to debug - linters help (eslint-plugin-react-hooks).

**Scalability**: Excellent for large apps. Component model scales well. Code-splitting with lazy/Suspense. Virtualization libraries for long lists. State management libraries handle complex state. Large teams can work in parallel.

**Breaking Changes**: React 18 introduced concurrent features (gradual adoption). Hooks (16.8) changed patterns but classes still supported. Future: React Compiler will optimize automatically. Ecosystem changes faster than core (Router v6, state management churn).

## AI-Assisted Development Considerations

### What Works Well with AI

**Massive training corpus**
- React is THE most popular UI framework
- AI has seen countless examples
- Patterns are deeply ingrained in training data
- Stack Overflow, GitHub, tutorials all favor React

**Declarative patterns are predictable**
- `UI = f(state)` is simple mental model
- Same inputs always produce same outputs
- Easy to reason about and generate

**Component boundaries are clear**
- Each component is self-contained function
- Props define interface
- Easy to understand and modify individual components

**Explicit data flow**
- Props flow down, events flow up
- No hidden dependencies
- Can trace data by reading code

**Rich ecosystem**
- Well-documented patterns for common problems
- AI can reference established solutions
- Less need to invent novel approaches

### What Creates Friction

**Performance optimization complexity**
- When to use memo/useMemo/useCallback is subtle
- Requires profiling to know if needed
- AI might over-optimize (unnecessary memoization) or under-optimize (performance issues)
- React 19 Compiler helps but adds another layer

**useEffect footguns**
- Dependency arrays are error-prone
- Cleanup functions often forgotten
- Infinite loops easy to create
- Stale closures confusing
- One of React's most difficult features

**Immutable update patterns**
- Nested object/array updates are verbose
- Easy to accidentally mutate
- AI might generate mutation instead of immutable update
- Requires careful attention to spread operators

**Re-render cascade understanding**
- Knowing what triggers re-renders requires deep knowledge
- Parent re-render causes child re-render (even with same props)
- Context changes affect all consumers
- Not obvious from code alone

**Hook ordering rules**
- Can't call hooks conditionally
- Must call in same order every render
- Violations cause cryptic errors
- AI needs to understand these constraints

### Opportunities for Improvement

**More AI-friendly patterns:**

1. **Explicit re-render triggers**
   - Instead of implicit parent-child cascades, explicit subscriptions
   - Clearer what causes re-renders
   - More like Jotai's atom subscriptions

2. **Built-in immutability helpers**
   - Immer-like mutable API with immutable results
   - Less verbose nested updates
   - Harder to make mistakes

3. **Declarative effects**
   - Instead of imperative useEffect with dependency arrays
   - Declarative dependencies like `<Effect on={[dep1, dep2]}>`
   - Less footgun potential

4. **Automatic memoization**
   - React 19 Compiler is a step in this direction
   - Should be default, not opt-in
   - Eliminate need to understand when to optimize

5. **Better TypeScript integration**
   - Native TypeScript support (not @types package)
   - Better event type inference
   - Fewer `any` types in edge cases

6. **Explicit state derivation**
   - Built-in primitives for derived state (like Jotai atoms)
   - Clear dependency tracking
   - No manual useMemo

**What human-era constraints could be removed:**

- **Virtual DOM overhead**: Necessary for incremental adoption in 2013, but fine-grained reactivity (Solid) is more efficient
- **Component-level granularity**: Leads to unnecessary re-renders, atom/signal level is better
- **Manual memoization**: Should be automatic (Compiler helps)
- **Imperative useEffect**: Declarative subscriptions would be clearer
- **Hook rules**: Necessary due to call-order-based identity, could use different mechanism

**Overall:**

React is **very AI-friendly** for common patterns due to massive training data and declarative model. Friction comes from **performance optimization, useEffect complexity, and immutable updates**.

For next-gen frameworks: Keep declarative JSX-like syntax and component composition, but use fine-grained reactivity (no Virtual DOM), automatic memoization, and simpler effect system.

**Final AI-Friendliness: 7.5/10**
- State Management: 7/10 (good patterns, but optimization complexity)
- Rendering: 8/10 (JSX is great, but re-render cascade tricky)
- Event Handling: 8/10 (declarative and consistent)

React's biggest advantage is **ubiquity** - AI knows it better than any other framework. Biggest disadvantages are **performance complexity** and **useEffect footguns**.
