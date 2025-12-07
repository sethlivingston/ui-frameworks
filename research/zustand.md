---
name: Zustand
category: State Management Library
type: React State Management
docs_url: https://zustand.docs.pmnd.rs
github_url: https://github.com/pmndrs/zustand
mcp_servers: null
implementation_language: TypeScript
reviewed_with_model: claude-sonnet-4-5-20250929
ai_friendliness_score: 8.5
---

# Zustand

## Philosophy & Mental Model

Zustand is **"a small, fast and scalable bearbones state-management solution using simplified flux principles. Has a comfy API based on hooks."** The name means "state" in German, reflecting its singular focus.

The philosophy is **radical simplicity**: Zustand eliminates the boilerplate of Redux while maintaining the benefits of centralized state management. No providers, no reducers, no actions—just a store and hooks.

**Mental model**: Think of Zustand as **"React state that lives outside components."** It's like `useState`, but shared across your entire app without prop drilling or Context providers.

**Core principles:**

1. **Minimal API Surface**: Just `create()` to make a store and `set()` to update state. That's 90% of Zustand.

2. **No Providers**: Unlike Redux or Context, you don't wrap your app in providers. The store is a module—import and use it anywhere.

3. **Hook-Based**: Consume state with hooks like any React state: `const bears = useBearStore(state => state.bears)`

4. **Immutable Updates**: State updates are immutable (like Redux), but without reducer ceremony.

5. **Selective Subscriptions**: Components only re-render when the specific state they subscribe to changes—no over-rendering.

6. **Flux Without Pain**: Zustand follows flux principles (unidirectional data flow) but removes the pain points (boilerplate, verbosity).

Zustand is for developers who want **Redux's architecture without Redux's complexity**. It's the answer to "I need global state but don't want to set up Redux."

## State Management

### Core Primitives

**Create a store** with `create()`:

```typescript
import { create } from 'zustand';

interface BearStore {
  bears: number;
  increase: (by: number) => void;
  removeAllBears: () => void;
}

const useBearStore = create<BearStore>((set) => ({
  bears: 0,
  increase: (by) => set((state) => ({ bears: state.bears + by })),
  removeAllBears: () => set({ bears: 0 }),
}));
```

The `create()` function returns a **hook** that components can use to access state.

**TypeScript support** is first-class—just pass the interface to `create<BearStore>()`.

### Update Mechanism

**Immutable updates** via `set()`:

```typescript
const useStore = create((set) => ({
  count: 0,
  // Merge update
  increment: () => set((state) => ({ count: state.count + 1 })),
  // Replace update
  reset: () => set({ count: 0 }),
}));
```

**Two forms of `set()`**:

1. **Object merge**: `set({ count: 0 })` - Shallow merges into existing state
2. **Updater function**: `set((state) => ({ count: state.count + 1 }))` - Compute new state from current

**Replace entire state**:

```typescript
set({ count: 0 }, true); // Second arg 'true' = replace, don't merge
```

**Access current state** with `get()`:

```typescript
const useStore = create((set, get) => ({
  count: 0,
  incrementByTen: () => set({ count: get().count + 10 }),
}));
```

### Read Pattern

**Use the hook** in components:

```typescript
function BearCounter() {
  const bears = useBearStore((state) => state.bears);
  return <h1>{bears} around here...</h1>;
}
```

**Selector function** `(state) => state.bears` extracts the specific data you need. Component only re-renders when that specific slice changes.

**Multiple values**:

```typescript
const bears = useBearStore((state) => state.bears);
const increase = useBearStore((state) => state.increase);
```

**Or destructure** (but this subscribes to entire store):

```typescript
// ⚠️ Re-renders on ANY state change
const { bears, increase } = useBearStore();

// ✅ Only re-renders when bears changes
const bears = useBearStore((state) => state.bears);
```

**Auto-generating selectors** (optional pattern):

```typescript
const createSelectors = <S extends UseBoundStore<StoreApi<object>>>(store: S) => {
  const selectors = {} as any;
  for (const k of Object.keys(store.getState())) {
    selectors[k] = () => store((s) => s[k]);
  }
  return selectors as { [K in keyof S]: () => S[K] };
};

const useBearStore = createSelectors(create(/* ... */));

// Usage
const bears = useBearStore.bears(); // Auto-generated selector
```

### Reactivity & Granularity

Zustand uses **fine-grained subscriptions**:

```typescript
function BearsComponent() {
  const bears = useBearStore((state) => state.bears);
  // Only re-renders when 'bears' changes
}

function FishComponent() {
  const fish = useBearStore((state) => state.fish);
  // Only re-renders when 'fish' changes
}
```

**Equality check** prevents unnecessary re-renders:

```typescript
import { shallow } from 'zustand/shallow';

// Custom equality
const { bears, fish } = useBearStore(
  (state) => ({ bears: state.bears, fish: state.fish }),
  shallow // Shallow comparison
);
```

Without `shallow`, destructuring creates a new object every time, causing re-renders even when values haven't changed.

### Async Handling

**Async actions** work naturally:

```typescript
interface UserStore {
  users: User[];
  loading: boolean;
  fetchUsers: () => Promise<void>;
}

const useUserStore = create<UserStore>((set) => ({
  users: [],
  loading: false,
  fetchUsers: async () => {
    set({ loading: true });
    const response = await fetch('/api/users');
    const users = await response.json();
    set({ users, loading: false });
  },
}));
```

```typescript
function UserList() {
  const { users, loading, fetchUsers } = useUserStore();

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) return <div>Loading...</div>;
  return <ul>{users.map(u => <li>{u.name}</li>)}</ul>;
}
```

No special async middleware required—just use async/await in your actions.

### Derived State

**Computed values** via selectors:

```typescript
const useStore = create((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
}));

function Component() {
  // Derived: total item count
  const itemCount = useStore((state) => state.items.length);

  // Derived: filtered items
  const activeItems = useStore((state) =>
    state.items.filter(item => item.active)
  );

  return <div>Active: {activeItems.length} / {itemCount}</div>;
}
```

Selectors re-compute whenever their dependencies change.

**Memoized selectors** (for expensive computations):

```typescript
import { useMemo } from 'react';

function Component() {
  const items = useStore((state) => state.items);

  const expensiveValue = useMemo(() => {
    return items.reduce(/* expensive operation */, 0);
  }, [items]);
}
```

Or use libraries like `reselect` with Zustand.

## Rendering

Zustand is **state-only**—it doesn't handle rendering. You use it with React's normal rendering:

```typescript
function App() {
  const count = useStore((state) => state.count);
  const increment = useStore((state) => state.increment);

  return (
    <div>
      <h1>{count}</h1>
      <button onClick={increment}>+</button>
    </div>
  );
}
```

Zustand triggers re-renders via React's standard mechanism when subscribed state changes.

## Event Handling

**Actions are just functions** in your store:

```typescript
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}));

function Counter() {
  const increment = useStore((state) => state.increment);
  const decrement = useStore((state) => state.decrement);
  const reset = useStore((state) => state.reset);

  return (
    <div>
      <button onClick={decrement}>-</button>
      <button onClick={increment}>+</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

Actions are **stable references**—they don't change between renders, so no `useCallback` needed.

## Reuse Patterns

### Slices Pattern

Break large stores into slices:

```typescript
const createUserSlice = (set) => ({
  user: null,
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
});

const createCartSlice = (set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  clearCart: () => set({ items: [] }),
});

const useStore = create((set) => ({
  ...createUserSlice(set),
  ...createCartSlice(set),
}));
```

### Middleware

**Persist** (localStorage/sessionStorage):

```typescript
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
    }),
    { name: 'counter-storage' }
  )
);
```

**Immer** (mutable syntax for nested updates):

```typescript
import { immer } from 'zustand/middleware/immer';

const useStore = create(
  immer((set) => ({
    todos: [],
    addTodo: (text) => set((state) => {
      state.todos.push({ text, done: false }); // Mutable style!
    }),
    toggleTodo: (index) => set((state) => {
      state.todos[index].done = !state.todos[index].done;
    }),
  }))
);
```

**DevTools** (Redux DevTools integration):

```typescript
import { devtools } from 'zustand/middleware';

const useStore = create(
  devtools((set) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 })),
  }))
);
```

**Combine middleware**:

```typescript
const useStore = create(
  devtools(
    persist(
      immer((set) => ({ /* state */ })),
      { name: 'my-store' }
    )
  )
);
```

### Non-React Usage

**Vanilla store** (for use outside React):

```typescript
import { createStore } from 'zustand/vanilla';

const store = createStore((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

// Use anywhere
store.getState().increment();
console.log(store.getState().count); // 1

// Subscribe to changes
const unsubscribe = store.subscribe((state) => {
  console.log('State changed:', state);
});
```

## Developer Experience

### Learning Curve

**Extremely low**. If you know React hooks, you know Zustand:

1. `create()` to make a store
2. `set()` to update state
3. `useStore(selector)` to read state

That's it. You can be productive in 10 minutes.

### Tooling

**TypeScript**: First-class support with full type inference

```typescript
interface Store {
  count: number;
  increment: () => void;
}

const useStore = create<Store>()((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

// TypeScript knows the types
const count: number = useStore((state) => state.count);
```

**DevTools**: Works with Redux DevTools extension via middleware

**Testing**:

```typescript
import { renderHook, act } from '@testing-library/react';

test('increment', () => {
  const { result } = renderHook(() => useStore());

  act(() => {
    result.current.increment();
  });

  expect(result.current.count).toBe(1);
});
```

### Boilerplate

**Minimal**. Compare to Redux Toolkit:

**Zustand** (7 lines):

```typescript
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

const count = useStore((state) => state.count);
```

**Redux Toolkit** (38 lines):

```typescript
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { Provider, useSelector, useDispatch } from 'react-redux';

const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: (state) => { state.value += 1 },
  },
});

const store = configureStore({
  reducer: { counter: counterSlice.reducer },
});

// In App
<Provider store={store}>
  <Counter />
</Provider>

// In Component
const count = useSelector((state) => state.counter.value);
const dispatch = useDispatch();
dispatch(counterSlice.actions.increment());
```

**Zustand is 80% less code** for the same functionality.

### Common Patterns

**Fetch-on-mount**:

```typescript
const useUserStore = create((set) => ({
  user: null,
  loading: false,
  fetchUser: async (id) => {
    set({ loading: true });
    const user = await api.getUser(id);
    set({ user, loading: false });
  },
}));

function UserProfile({ userId }) {
  const { user, loading, fetchUser } = useUserStore();

  useEffect(() => {
    fetchUser(userId);
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  return <div>{user.name}</div>;
}
```

**Optimistic updates**:

```typescript
const useStore = create((set, get) => ({
  todos: [],
  addTodo: async (text) => {
    const tempId = Date.now();
    const tempTodo = { id: tempId, text, synced: false };

    // Optimistic update
    set((state) => ({ todos: [...state.todos, tempTodo] }));

    try {
      const saved = await api.createTodo(text);
      // Replace temp with real
      set((state) => ({
        todos: state.todos.map((t) => (t.id === tempId ? saved : t)),
      }));
    } catch (error) {
      // Rollback on error
      set((state) => ({
        todos: state.todos.filter((t) => t.id !== tempId),
      }));
    }
  },
}));
```

**Reset store**:

```typescript
const initialState = {
  count: 0,
  user: null,
};

const useStore = create((set) => ({
  ...initialState,
  increment: () => set((state) => ({ count: state.count + 1 })),
  reset: () => set(initialState),
}));
```

### Documentation

**Good**. zustand.docs.pmnd.rs has:
- Getting started guide
- API reference
- Middleware documentation
- TypeScript guide
- Comparison with Redux/Context
- Active GitHub discussions

### State Reusability Assessment

**Quality: Excellent (9/10)**

Zustand excels at reusable state management. Since it's **not a component framework**, reusability focuses on sharing state and logic across components.

**Reuse Mechanisms**:

1. **Store exports** - Export stores, import anywhere
2. **Slices pattern** - Compose multiple sub-stores
3. **Middleware** - Reusable store enhancers (persist, devtools, immer)
4. **Custom hooks** - Wrap selectors in custom hooks
5. **npm packages** - Distribute stores as packages

**Strengths**:
- **Framework-agnostic** - Works with React, Preact, React Native
- **Minimal boilerplate** - One `create()` call per store
- **Composable slices** - Combine stores easily
- **TypeScript-first** - Full type inference
- **Middleware ecosystem** - Persist, devtools, immer integrate seamlessly

**Weaknesses**:
- **React-specific** (primarily) - While theoretically framework-agnostic, heavily React-focused
- **No built-in async patterns** - Need to handle async manually (unlike Redux Toolkit Query)
- **Global by default** - Stores are singletons unless explicitly created per-component

**Design System Support**: Not applicable. Zustand is state management, not UI.

**Cross-Project Reuse**: Excellent. Example reusable authentication store:

```typescript
// @my-company/auth-store npm package
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  login: async (credentials) => {
    const user = await api.login(credentials);
    set({ user });
  },
  logout: () => set({ user: null }),
}));

// Use in any React project
import { useAuthStore } from '@my-company/auth-store';
```

**Slices Pattern** for composition:

```typescript
const createUserSlice = (set) => ({
  user: null,
  setUser: (user) => set({ user }),
});

const createCartSlice = (set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
});

// Combine slices
const useStore = create((set, get) => ({
  ...createUserSlice(set, get),
  ...createCartSlice(set, get),
}));
```

## Maintainability

**Quality: Excellent (9/10)**

**Refactoring**:
- **TypeScript types** - Catch errors when changing state shape
- **Immutable updates** - Immer middleware makes refactoring safer
- **Selector pattern** - Change store structure without breaking consumers
- **Simple API** - Minimal concepts to refactor

**Debugging**:
- **Redux DevTools** - Time-travel debugging with devtools middleware
- **Simple state inspection** - `useStore.getState()` returns current state
- **No magic** - Direct function calls, easy to trace
- **Logging middleware** - Add logging to any store easily

**Code Organization**:
- **Colocated actions** - State and actions in one place
- **Slices** - Organize by feature domain
- **Separation** - UI components separate from stores
- **Flat structure** - No deeply nested reducers/actions

**Testing**:
- **Easy to test** - Stores are just functions
- **No mocking needed** - Access store state directly
- **Isolated tests** - Each store testable independently
- **React Testing Library** - Test components using stores

```typescript
// Test store independently
const store = create((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
}));

expect(store.getState().count).toBe(0);
store.getState().increment();
expect(store.getState().count).toBe(1);
```

**Scalability**:
- **Minimal overhead** - ~1KB, no performance concerns
- **Selective subscriptions** - Only re-render when selected state changes
- **Shallow comparison** - Efficient by default
- **Multiple stores** - Create focused stores per feature

**Breaking Changes**:
- **Semantic versioning** - Zustand follows SemVer
- **Stable API** - v3 → v4 had minimal breaking changes
- **Small surface area** - Fewer APIs to break
- **Middleware versioning** - Middleware packages version independently

**Weaknesses**:
- **Global state** - Easy to create god objects (all state in one store)
- **No enforced patterns** - Freedom can lead to inconsistency
- **Async boilerplate** - Must write own async patterns (unlike RTK Query)
- **TypeScript complexity** - Advanced types (slices) can be tricky

**Particularly Maintainable Aspects**:
- Stores are just functions (no classes, no decorators)
- TypeScript inference reduces manual type annotations
- Immer middleware makes immutable updates simple
- DevTools integration provides visibility
- Small API means less to learn/maintain

**Maintenance Challenges**:
- Need discipline to avoid god objects
- Async patterns not standardized
- Testing async actions requires manual setup
- Large stores can become unwieldy without slicing

## AI-Friendly Assessment

**Overall Score: 8.5/10**

### Strengths for AI-Assisted Development

**Extreme Simplicity**: The entire API is ~5 functions. AI learns Zustand in seconds:

```typescript
create() // Make store
set()    // Update state
get()    // Read current state
subscribe() // Watch changes
destroy()   // Clean up
```

**TypeScript-First**: Full type inference makes AI's job easy:

```typescript
interface Store {
  count: number;
  increment: () => void;
}

const useStore = create<Store>()((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

// AI knows:
// - state.count is a number
// - increment() returns void
// - set() takes Partial<Store>
```

**No Magic**: Zustand is just functions and objects. No decorators, no classes, no special syntax. AI reads it like any TypeScript code.

**Predictable Patterns**: Every store follows the same structure:

```typescript
const useStore = create<Interface>((set, get) => ({
  // state
  count: 0,
  // actions
  increment: () => set(/* update */),
}));
```

AI generates consistent code every time.

**Explicit State Flow**: State updates are explicit via `set()`:

```typescript
increment: () => set((state) => ({ count: state.count + 1 }))
```

AI can trace exactly what changes and when.

**No Providers**: No boilerplate wrappers to manage. AI doesn't need to track Context providers, render trees, or component hierarchies.

**Immutable Updates**: Like Redux, state is immutable:

```typescript
// ✅ Good
set((state) => ({ items: [...state.items, newItem] }))

// ❌ Bad
set((state) => {
  state.items.push(newItem); // Mutation!
  return state;
})
```

AI learns the immutability pattern once and applies it everywhere.

**Testable**: Stores are just functions—trivial to test:

```typescript
const { result } = renderHook(() => useStore());
act(() => result.current.increment());
expect(result.current.count).toBe(1);
```

AI can generate tests that match implementation.

**Middleware Composition**: Middleware stacks predictably:

```typescript
create(
  middleware1(
    middleware2(
      (set) => ({ /* store */ })
    )
  )
)
```

AI understands nested function composition.

**Minimal Boilerplate**: 80% less code than Redux means 80% less for AI to generate and maintain.

### Weaknesses for AI-Assisted Development

**React-Specific**: Zustand is tightly coupled to React. AI must understand React hooks to use Zustand effectively. (Though vanilla store exists, it's rarely used.)

**Selector Footguns**: Easy to create performance issues:

```typescript
// ⚠️ Re-renders on ANY state change
const { bears, fish } = useStore();

// ✅ Optimized
const bears = useStore((state) => state.bears);
```

AI might miss this optimization without specific training.

**Shallow Merge Confusion**: `set()` does shallow merge by default:

```typescript
set({ user: { name: 'Alice' } }); // Replaces entire 'user' object

// Need to manually merge nested:
set((state) => ({
  user: { ...state.user, name: 'Alice' },
}));
```

AI must remember to spread nested objects.

**Immer Middleware Not Default**: For nested updates, Immer middleware helps but isn't included by default:

```typescript
// Without Immer
set((state) => ({
  deeply: {
    ...state.deeply,
    nested: {
      ...state.deeply.nested,
      value: 42,
    },
  },
}));

// With Immer
set((state) => {
  state.deeply.nested.value = 42;
});
```

AI must know to suggest Immer for complex state.

**No Built-In Async Helpers**: Unlike TanStack Query, Zustand doesn't provide loading/error state helpers. AI must manually track:

```typescript
const useStore = create((set) => ({
  data: null,
  loading: false,
  error: null,
  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const data = await api.get();
      set({ data, loading: false });
    } catch (error) {
      set({ error, loading: false });
    }
  },
}));
```

**No Schema Validation**: Unlike Zod or TypeBox, Zustand doesn't validate state shape at runtime. AI-generated code could violate type contracts without runtime errors.

**Equality Checking Complexity**: Advanced equality checks require understanding `shallow`:

```typescript
import { shallow } from 'zustand/shallow';

const { a, b } = useStore(
  (state) => ({ a: state.a, b: state.b }),
  shallow
);
```

AI must know when to use `shallow` vs. default reference equality.

### Why 8.5/10?

Zustand scores exceptionally high because:
- **Minimal API** - Easiest state management library to learn
- **TypeScript-first** - Full type safety and inference
- **Explicit patterns** - Consistent, predictable code structure
- **Zero boilerplate** - 80% less code than Redux
- **No magic** - Plain functions and objects
- **Testable** - Simple to write tests for

The 1.5-point deduction is for:
- **React coupling** - Requires React knowledge
- **Selector footguns** - Easy to create performance issues
- **Shallow merge confusion** - Nested updates aren't obvious
- **No built-in async helpers** - Manual loading/error state

For **React state management**, Zustand is one of the most AI-friendly options available—simpler than Redux, more explicit than Context, and more lightweight than MobX.

---

**Key Insight for Next-Gen Framework Design**: Zustand demonstrates that **removing abstraction layers** improves AI-friendliness. No providers, no reducers, no action types—just stores and functions. The "less is more" philosophy works exceptionally well.

The **hook-based consumption** pattern (`useStore(selector)`) is more explicit than Context's `useContext()` because the selector makes dependencies visible:

```typescript
const bears = useStore((state) => state.bears); // Clear: depends on 'bears'
```

Future frameworks should embrace **minimal APIs with maximal power**. Zustand proves you don't need complex abstractions to manage state effectively.

The **TypeScript-first design** (not TypeScript-as-afterthought) is crucial. Types guide AI code generation and catch errors before runtime.

For next-gen state management: **combine Zustand's simplicity with Jotai's atoms** to get both global stores (Zustand) and fine-grained reactivity (Jotai). The best of both worlds.
