---
name: "Jotai"
category: "state-library"
github_url: "https://github.com/pmndrs/jotai"
docs_url: "https://jotai.org"
implementation_language: "TypeScript"
status: "active"
ai_friendliness_score: null
reusability_score: 9.5
maintainability_score: 9
version: "2.15.2"
npm_package: "jotai"
typescript_support: "native"
license: "MIT"
runtime: "browser"
capabilities:
  state_management: true
  rendering: false
  event_handling: false
paradigm: "reactive"
state_model: "atoms"
maintainer: "Poimandres"
first_released: "2020"
reviewed_date: "2025-12-06"
reviewed_by_model: "Claude Sonnet 4.5"
---

# Jotai

## State Management

### Philosophy & Mental Model

Jotai adopts an **atomic approach** to global React state management with the core philosophy: "Build state by combining atoms and renders are automatically optimized based on atom dependency."

Key mental model concepts:
- **Atoms as building blocks**: State is composed of independent atomic units rather than a monolithic store
- **Bottom-up composition**: Complex state emerges from combining simple atoms, not top-down structure
- **Automatic optimization**: The library handles re-render optimization automatically based on which atoms a component subscribes to
- **No string keys**: Unlike Recoil, atoms don't require string identifiers - they use referential identity
- **Scales from simple to complex**: Can replace `useState` for simple cases or handle enterprise TypeScript apps

This approach eliminates the unnecessary re-renders common with React Context while maintaining React's declarative programming model.

### Core Primitives

**Atoms** are the fundamental and only primitive. Created with the `atom()` function:

**Primitive atoms** - store any value type:
```javascript
const countAtom = atom(0)
const countryAtom = atom('Japan')
const citiesAtom = atom(['Tokyo', 'Kyoto', 'Osaka'])
const userAtom = atom({ name: 'John', age: 30 })
```

**Derived (read-only) atoms** - compute values from other atoms:
```javascript
const progressAtom = atom((get) => {
  const anime = get(animeAtom)
  return anime.filter((item) => item.watched).length / anime.length
})

const fullNameAtom = atom((get) => {
  const firstName = get(firstNameAtom)
  const lastName = get(lastNameAtom)
  return `${firstName} ${lastName}`
})
```

**Read-write atoms** - custom read and write logic:
```javascript
const readWriteAtom = atom(
  (get) => get(primitiveAtom), // read
  (get, set, newValue) => {     // write
    set(primitiveAtom, newValue)
  }
)
```

**Write-only atoms** - for actions/commands:
```javascript
const incrementAtom = atom(
  null, // no read
  (get, set) => {
    set(countAtom, get(countAtom) + 1)
  }
)
```

Each atom is an independent unit. Atoms don't need string keys - they use JavaScript referential identity.

### Update Mechanism

State changes through **setter functions** obtained from hooks:

**Direct updates** via `useAtom` or `useSetAtom`:
```javascript
function Counter() {
  const [count, setCount] = useAtom(countAtom)

  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  )
}
```

**Functional updates** (like React useState):
```javascript
const [count, setCount] = useAtom(countAtom)
setCount(prev => prev + 1)
```

**Write-only atoms** for actions:
```javascript
function Controls() {
  const increment = useSetAtom(incrementAtom)
  return <button onClick={increment}>Increment</button>
}
```

**Batch updates**: React 18's automatic batching applies to Jotai updates.

The update pattern is simple and direct - no actions, reducers, or dispatch functions required.

### Read Pattern

Three hooks provide granular control over reads and writes:

**`useAtom(atom)`** - Read and write (like `useState`):
```javascript
const [value, setValue] = useAtom(myAtom)
```

**`useAtomValue(atom)`** - Read-only, optimized to prevent unnecessary re-renders:
```javascript
const value = useAtomValue(myAtom)
// Component only re-renders when myAtom changes
```

**`useSetAtom(atom)`** - Write-only, component never re-renders:
```javascript
const setValue = useSetAtom(myAtom)
// Component doesn't re-render when myAtom changes
```

This separation enables precise re-render optimization. Components only update when their specific atoms change, and only if they're reading the value.

**Store API** - Access atoms outside React components:
```javascript
import { createStore } from 'jotai'

const store = createStore()
const count = store.get(countAtom)
store.set(countAtom, 5)
```

### Reactivity & Granularity

**Atom-level granularity** - the most fine-grained reactivity model:

- Only components that `useAtom` or `useAtomValue` a specific atom re-render when that atom changes
- Components using `useSetAtom` never re-render when the atom changes
- No selector equality checks needed (unlike Redux) - automatic dependency tracking
- No manual memoization required - derived atoms automatically recompute only when dependencies change

**Example of granular updates**:
```javascript
// Only re-renders when firstNameAtom changes, NOT when lastNameAtom changes
function FirstNameDisplay() {
  const firstName = useAtomValue(firstNameAtom)
  return <div>{firstName}</div>
}

// Only re-renders when lastNameAtom changes
function LastNameDisplay() {
  const lastName = useAtomValue(lastNameAtom)
  return <div>{lastName}</div>
}

// Re-renders when EITHER atom changes (automatic dependency detection)
function FullNameDisplay() {
  const fullName = useAtomValue(fullNameAtom) // derived from both atoms
  return <div>{fullName}</div>
}
```

**Optimization is automatic** - no `useMemo`, `useCallback`, or selector memoization needed. The library tracks dependencies and optimizes re-renders without developer intervention.

### Async Handling

**Native async support** - async atoms are first-class primitives:

**Async read atoms**:
```javascript
const userAtom = atom(async (get) => {
  const userId = get(userIdAtom)
  const response = await fetch(`/api/users/${userId}`)
  return response.json()
})

function UserProfile() {
  const user = useAtomValue(userAtom) // Suspends until data loads
  return <div>{user.name}</div>
}
```

**Async write atoms**:
```javascript
const saveUserAtom = atom(
  null,
  async (get, set, newUser) => {
    await fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(newUser)
    })
    set(userAtom, newUser)
  }
)
```

**Built-in Suspense support** - async atoms integrate with React Suspense automatically:
```javascript
<Suspense fallback={<Loading />}>
  <UserProfile /> {/* Suspends while userAtom loads */}
</Suspense>
```

**Error boundaries** - errors in async atoms are caught by Error Boundaries:
```javascript
<ErrorBoundary fallback={<Error />}>
  <Suspense fallback={<Loading />}>
    <UserProfile />
  </Suspense>
</ErrorBoundary>
```

**No middleware, thunks, or sagas needed** - async is built into the atom model. This is significantly simpler than Redux async patterns.

### Derived State

**Derived atoms** compute values from other atoms with automatic dependency tracking:

**Simple derivation**:
```javascript
const doubleCountAtom = atom((get) => get(countAtom) * 2)
```

**Multi-atom derivation**:
```javascript
const totalPriceAtom = atom((get) => {
  const cart = get(cartAtom)
  const taxRate = get(taxRateAtom)
  const subtotal = cart.reduce((sum, item) => sum + item.price, 0)
  return subtotal * (1 + taxRate)
})
```

**Async derivation**:
```javascript
const weatherAtom = atom(async (get) => {
  const city = get(cityAtom)
  const response = await fetch(`/api/weather?city=${city}`)
  return response.json()
})
```

**Benefits over manual memoization**:
- No `useMemo` needed - derived atoms automatically memoize
- Automatic dependency tracking - no dependency arrays to maintain
- Can be composed - derived atoms can depend on other derived atoms
- Reusable across components - define once, use anywhere

**Utils package** provides additional derivation patterns:
- `atomWithStorage` - syncs atom with localStorage
- `atomWithHash` - syncs atom with URL hash
- `atomWithReducer` - Redux-style reducer pattern
- `atomFamily` - parameterized atoms (like React Query)
- `splitAtom` - split array atoms into individual atoms

### Developer Experience

**Boilerplate: Low**
- Minimal setup: just `import { atom } from 'jotai'` and start creating atoms
- No providers required for basic usage (though Provider available for scoping)
- No action types, action creators, or reducers
- Simple hook API mirrors React's `useState`

Example comparison:
```javascript
// Redux boilerplate
const INCREMENT = 'INCREMENT'
const increment = () => ({ type: INCREMENT })
const reducer = (state = 0, action) => {
  switch (action.type) {
    case INCREMENT: return state + 1
    default: return state
  }
}

// Jotai - just this
const countAtom = atom(0)
```

**DevTools: Excellent**
- `jotai-devtools` package provides comprehensive UI component
- Visual atom inspection - monitor all atom values in real-time
- **Time-travel debugging** - step through snapshots of application state
- Customizable interface - position, themes, filter private atoms
- Redux DevTools integration via `useAtomDevtools` hook
- React DevTools integration via `useAtomsDebugValue` hook
- Tree-shakable for production builds

**Debugging: Very Clear**
- `useAtomsDebugValue` - displays all atom values in React DevTools
- `useAtomDevtools` - per-atom Redux DevTools integration with custom naming
- `useAtomsSnapshot` - capture current state as a Map for inspection
- `useGotoAtomsSnapshot` - restore previous state snapshots
- Babel/SWC plugins for automatic debug labels
- Hot reload support

**Time travel: Yes (via devtools)**
- `useGotoAtomsSnapshot` enables state restoration
- Full snapshot and restore capabilities
- Integrated with jotai-devtools UI

### AI-Friendly Assessment

**What makes Jotai easy for AI to work with:**

✅ **Extreme explicitness**
- Every atom is explicitly defined - no magic strings or hidden state
- Dependencies are explicit in code via `get()` calls
- Component subscriptions are explicit via hooks

✅ **Excellent locality of behavior**
- Atom definition shows exactly what state it holds and how it's computed
- Reading an atom hook tells you exactly which state the component depends on
- No action-at-a-distance - if `get(userAtom)` is called, you know it depends on `userAtom`

✅ **Highly predictable**
- Simple mental model: atoms hold values, `get()` reads them, `set()` writes them
- No middleware, no interceptors, no hidden transforms
- Derived atoms are pure functions - same inputs always produce same outputs

✅ **Minimal boilerplate**
- Less code to read and understand
- Less ceremony between intent and implementation
- Easy to see the full picture of state in one file

✅ **Composable and traceable**
- Can trace dependencies by following `get()` calls
- Easy to understand data flow: atom A gets atom B, component uses atom C
- No string-based lookups - use IDE "find references" to track atom usage

**What could be challenging:**

⚠️ **Referential identity**
- Atoms use JavaScript object identity, not string keys
- AI needs to track atom references across files
- Can't search for "userAtom" string like Redux action types

⚠️ **Implicit Provider scope**
- Default Provider is implicit (works without wrapping)
- Multiple Providers for scoping can create parallel state trees
- May need to understand Provider tree to know which state instance is active

⚠️ **Async complexity**
- While cleaner than Redux, async atoms with Suspense boundaries require understanding React Suspense model
- Error handling via Error Boundaries adds another layer

**Overall AI-Friendliness: 9/10**

Jotai is exceptionally AI-friendly. The atomic model with explicit dependencies, minimal boilerplate, and pure functional derivations make it easy to reason about and modify. The main challenge is tracking atom references, but this is minor compared to the benefits of explicitness and locality.

### State Reusability Assessment

**Quality: Excellent (9.5/10)**

**Strengths**: Atoms are pure - no framework coupling beyond React hooks. Export atoms as npm packages trivially. Derived atoms compose infinitely. Atom family pattern creates reusable parameterized state. Utils package (jotai/utils) demonstrates patterns. TypeScript makes atom types explicit. Atoms work across React 18 features (Suspense, transitions). Provider-less by default - global atoms just work.

**Weaknesses**: React-specific - atoms only work with React (or Preact). Some patterns (atomWithStorage, atomWithObservable) tie to specific environments. Provider pattern adds complexity when needed.

**Cross-Project Reuse**: Excellent within React ecosystem. Atoms package as libraries. Auth atoms, form atoms, async patterns all reusable. Cannot use in Vue/Svelte. Patterns transferable conceptually to other atomic state libraries.

## Maintainability

**Quality: Excellent (9/10)**

**Strengths**: Explicit dependencies - every `get(atom)` visible. TypeScript support excellent. Minimal boilerplate. Pure functions easy to test. DevTools integration shows atom graph. No stale closures - atoms always current. Suspense/ErrorBoundary handle loading/errors declaratively. Scope pattern isolates state. Async atoms prevent race conditions.

**Weaknesses**: Atom references must be tracked - easy to lose what depends on what. Provider scoping adds complexity. Suspense model requires understanding. DevTools not as mature as Redux DevTools. Debugging async atom chains tricky.

**Code Organization**: Atoms in separate files, imported where needed. Derived atoms near base atoms. Utils for atom factories. Feature-based organization common.

**Testing**: Atoms are functions - trivial to test. No React needed for atom logic tests. Component integration uses React Testing Library. Derived atoms test by calling with mock get.

**Debugging**: Jotai DevTools show atom values and graph. React DevTools work. Console.log in atoms for debugging. TypeScript catches type errors. Async errors caught by Error Boundaries.

**Scalability**: Excellent. Atomic model scales to hundreds of atoms. No performance penalty for many atoms. Lazy evaluation. Can scope atoms per feature. Large apps (Excalidraw) prove scale.

**Breaking Changes**: Jotai 2.x stable. API changes rare. Utils package evolves faster. Migration guides provided. Smaller surface area than Redux means less churn.

## AI-Assisted Development Considerations

### What Works Well with AI

**Explicit dependency tracking**
- Every `get(someAtom)` call is visible and traceable
- AI can identify all dependencies of a derived atom by scanning `get()` calls
- No hidden dependencies or magic subscriptions

**Simple, predictable patterns**
- `atom(value)` creates state
- `atom(get => ...)` creates derived state
- `useAtom(atom)` reads/writes state
- These three patterns cover 90% of use cases

**Excellent locality**
- Can understand an atom by reading its definition
- Can understand a component's state needs by reading its hooks
- No need to trace through multiple files to understand state flow

**Minimal framework-specific knowledge**
- Mirrors React's `useState` API
- Pure functions for derived state
- Standard async/await patterns

**Easy to test**
- Atoms are just functions - can be called directly
- No complex mocking needed
- Store API allows testing outside React

### What Creates Friction

**Atom reference tracking**
- Need to track imports and references across files
- Can't search by string like "userSlice" in Redux
- Refactoring requires updating imports

**Provider scoping edge cases**
- Multiple Providers create separate state trees
- Default global Provider is implicit
- May need to understand component tree to know which Provider scope applies

**Async mental model**
- Requires understanding React Suspense and Error Boundaries
- Interaction between async atoms and boundaries can be complex
- Loading and error states are handled outside the atom

### Opportunities for Improvement

**Even more AI-friendly patterns:**

1. **String identifiers as optional**
   - Add optional string IDs to atoms for debugging and search
   - Best of both worlds: referential identity + string lookup

2. **Explicit Provider requirements**
   - Make Provider wrapping more explicit/required
   - Clearer scoping model

3. **Built-in loading/error state**
   - Instead of Suspense boundaries, built-in `{ data, loading, error }` pattern
   - More explicit error handling within the atom model

4. **Atom visualization**
   - Built-in atom dependency graph generation
   - Auto-generate documentation of atom relationships

**What human-era constraints could be removed:**

- Suspense boundaries were designed for human understanding of loading states
- With AI assistance, explicit `{ loading, data, error }` in the atom value itself might be clearer
- Multiple Provider scoping is powerful for advanced users but adds complexity
- Could have a single global store by default with opt-in scoping

**Overall:**

Jotai is already extremely well-designed for AI assistance. Its atomic model, explicit dependencies, and minimal boilerplate make it one of the most AI-friendly state management solutions available. The opportunities for improvement are minor compared to its strengths.
