---
name: Redux (Redux Toolkit)
category: State Management Library
type: React State Management
docs_url: https://redux-toolkit.js.org
github_url: https://github.com/reduxjs/redux-toolkit
mcp_servers: null
implementation_language: TypeScript
reviewed_with_model: claude-sonnet-4-5-20250929
ai_friendliness_score: 7.5
---

# Redux (Redux Toolkit)

## Philosophy & Mental Model

Redux is **"a predictable state container for JavaScript apps."** Redux Toolkit (RTK) is **"the official, opinionated, batteries-included toolset for efficient Redux development."**

Redux established the **Flux architecture** for frontend apps: unidirectional data flow, single source of truth, immutable state updates. For years, Redux was synonymous with React state management—before simpler alternatives like Zustand emerged.

**Mental model**: Think of Redux as **"a database for your frontend."** The store is the database, reducers are table schemas, actions are SQL commands, and selectors are queries. Everything is **explicit, traceable, and deterministic**.

**Core principles** (from the official docs):

1. **Single Source of Truth**: The entire application state lives in one store. No scattered state across components.

2. **State is Read-Only**: You never mutate state directly. Instead, you dispatch actions that describe what happened.

3. **Changes Made with Pure Functions**: Reducers are pure functions that take `(state, action)` and return new state. No side effects.

Redux Toolkit modernizes this by **eliminating boilerplate** while preserving the core philosophy. RTK uses Immer internally so you can write "mutating" code that's actually immutable under the hood.

**Who Redux is for:**
- Large apps with complex state
- Teams needing strong conventions
- Apps requiring time-travel debugging or state persistence
- Developers who value explicit over implicit

**Who Redux is NOT for:**
- Simple apps (Zustand or Context is easier)
- Developers allergic to boilerplate (even RTK has more than Zustand)
- Projects prioritizing minimal bundle size

## State Management

### Core Primitives

**Create a slice** (combines reducer + actions):

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CounterState {
  value: number;
  status: 'idle' | 'loading';
}

const initialState: CounterState = {
  value: 0,
  status: 'idle',
};

const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    increment: (state) => {
      state.value += 1; // Looks like mutation, but Immer makes it immutable!
    },
    decrement: (state) => {
      state.value -= 1;
    },
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.value += action.payload;
    },
  },
});

export const { increment, decrement, incrementByAmount } = counterSlice.actions;
export default counterSlice.reducer;
```

**Configure the store**:

```typescript
import { configureStore } from '@reduxjs/toolkit';
import counterReducer from './counterSlice';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

**Provide to React**:

```typescript
import { Provider } from 'react-redux';
import { store } from './store';

function App() {
  return (
    <Provider store={store}>
      <YourApp />
    </Provider>
  );
}
```

### Update Mechanism

**Dispatch actions** to update state:

```typescript
import { useDispatch } from 'react-redux';
import { increment, decrement, incrementByAmount } from './counterSlice';

function Counter() {
  const dispatch = useDispatch();

  return (
    <div>
      <button onClick={() => dispatch(decrement())}>-</button>
      <button onClick={() => dispatch(increment())}>+</button>
      <button onClick={() => dispatch(incrementByAmount(5))}>+5</button>
    </div>
  );
}
```

**Immer-powered "mutations"** (RTK only):

```typescript
const todosSlice = createSlice({
  name: 'todos',
  initialState: [],
  reducers: {
    addTodo: (state, action) => {
      state.push(action.payload); // Looks like mutation, actually immutable
    },
    toggleTodo: (state, action) => {
      const todo = state.find((t) => t.id === action.payload);
      if (todo) {
        todo.completed = !todo.completed; // Direct "mutation"
      }
    },
  },
});
```

Under the hood, Immer creates immutable copies. You write mutable code, get immutable behavior.

### Read Pattern

**useSelector** hook:

```typescript
import { useSelector } from 'react-redux';
import { RootState } from './store';

function CounterDisplay() {
  const count = useSelector((state: RootState) => state.counter.value);
  return <h1>{count}</h1>;
}
```

Selector function extracts specific data from state. Component re-renders when that data changes (reference equality check).

**Typed hooks** (recommended pattern):

```typescript
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Usage
const count = useAppSelector((state) => state.counter.value);
const dispatch = useAppDispatch();
```

This provides full TypeScript autocomplete.

### Reactivity & Granularity

Redux uses **reference equality** to determine if state changed:

```typescript
const count = useSelector((state) => state.counter.value);
// Re-renders only when state.counter.value changes (by value)

const counter = useSelector((state) => state.counter);
// Re-renders when ANY property in state.counter changes
```

**Memoized selectors** with Reselect:

```typescript
import { createSelector } from '@reduxjs/toolkit';

const selectTodos = (state: RootState) => state.todos;
const selectFilter = (state: RootState) => state.filter;

export const selectFilteredTodos = createSelector(
  [selectTodos, selectFilter],
  (todos, filter) => {
    switch (filter) {
      case 'completed':
        return todos.filter((t) => t.completed);
      case 'active':
        return todos.filter((t) => !t.completed);
      default:
        return todos;
    }
  }
);

// Usage
const filteredTodos = useAppSelector(selectFilteredTodos);
```

`createSelector` memoizes results—only recomputes when inputs change.

### Async Handling

**createAsyncThunk** for async actions:

```typescript
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

interface User {
  id: number;
  name: string;
}

export const fetchUsers = createAsyncThunk<User[]>(
  'users/fetchUsers',
  async () => {
    const response = await fetch('/api/users');
    return response.json();
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    entities: [] as User[],
    loading: 'idle' as 'idle' | 'pending' | 'succeeded' | 'failed',
    error: null as string | null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = 'pending';
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = 'succeeded';
        state.entities = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.error.message || null;
      });
  },
});

// Usage
const dispatch = useAppDispatch();
dispatch(fetchUsers());
```

`createAsyncThunk` automatically generates `pending`, `fulfilled`, and `rejected` action types.

**RTK Query** (for data fetching):

```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({
      query: () => 'users',
    }),
    getUserById: builder.query<User, number>({
      query: (id) => `users/${id}`,
    }),
    createUser: builder.mutation<User, Partial<User>>({
      query: (body) => ({
        url: 'users',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useGetUsersQuery, useGetUserByIdQuery, useCreateUserMutation } = api;

// Usage
function UserList() {
  const { data: users, isLoading, error } = useGetUsersQuery();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error</div>;
  return <ul>{users.map((u) => <li>{u.name}</li>)}</ul>;
}
```

RTK Query auto-generates hooks, handles caching, deduplication, and refetching.

### Derived State

**Selectors** compute derived data:

```typescript
const selectTotalPrice = (state: RootState) =>
  state.cart.items.reduce((total, item) => total + item.price, 0);

const totalPrice = useAppSelector(selectTotalPrice);
```

**Memoized selectors** for expensive computations:

```typescript
import { createSelector } from '@reduxjs/toolkit';

const selectItems = (state: RootState) => state.cart.items;

const selectTotalPrice = createSelector([selectItems], (items) =>
  items.reduce((total, item) => total + item.price * item.quantity, 0)
);

const selectItemCount = createSelector([selectItems], (items) =>
  items.reduce((total, item) => total + item.quantity, 0)
);
```

Selectors only recompute when inputs change.

## Rendering

Redux is **state-only**—rendering is handled by React:

```typescript
function Counter() {
  const count = useAppSelector((state) => state.counter.value);
  const dispatch = useAppDispatch();

  return (
    <div>
      <h1>{count}</h1>
      <button onClick={() => dispatch(increment())}>+</button>
    </div>
  );
}
```

Redux triggers re-renders via React's subscription mechanism when selected state changes.

## Event Handling

**Actions are dispatched** in response to events:

```typescript
function TodoInput() {
  const [text, setText] = useState('');
  const dispatch = useAppDispatch();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    dispatch(addTodo({ id: Date.now(), text, completed: false }));
    setText('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <button type="submit">Add</button>
    </form>
  );
}
```

**Thunks** for complex logic:

```typescript
export const incrementIfOdd = (): AppThunk => (dispatch, getState) => {
  const currentValue = getState().counter.value;
  if (currentValue % 2 !== 0) {
    dispatch(increment());
  }
};

// Usage
<button onClick={() => dispatch(incrementIfOdd())}>Increment if odd</button>
```

## Reuse Patterns

### Slice Pattern

Organize state by feature:

```
src/
  features/
    counter/
      counterSlice.ts
    users/
      usersSlice.ts
    todos/
      todosSlice.ts
  store.ts
```

Each slice is self-contained with state, reducers, actions, and selectors.

### Entity Adapter

Normalize relational data:

```typescript
import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';

interface User {
  id: number;
  name: string;
}

const usersAdapter = createEntityAdapter<User>();

const usersSlice = createSlice({
  name: 'users',
  initialState: usersAdapter.getInitialState(),
  reducers: {
    addUser: usersAdapter.addOne,
    addUsers: usersAdapter.addMany,
    updateUser: usersAdapter.updateOne,
    removeUser: usersAdapter.removeOne,
  },
});

// Selectors
export const {
  selectAll: selectAllUsers,
  selectById: selectUserById,
  selectIds: selectUserIds,
} = usersAdapter.getSelectors((state: RootState) => state.users);
```

Entity adapters provide normalized state management (like a database).

### Middleware

Custom side effect logic:

```typescript
import { Middleware } from '@reduxjs/toolkit';

const loggerMiddleware: Middleware = (storeAPI) => (next) => (action) => {
  console.log('Dispatching:', action);
  const result = next(action);
  console.log('Next state:', storeAPI.getState());
  return result;
};

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(loggerMiddleware),
});
```

Middleware intercepts actions for logging, analytics, or side effects.

### Listener Middleware

Effect-based side effects (modern alternative to sagas):

```typescript
import { createListenerMiddleware } from '@reduxjs/toolkit';

const listenerMiddleware = createListenerMiddleware();

listenerMiddleware.startListening({
  actionCreator: todoAdded,
  effect: async (action, listenerApi) => {
    // Save to backend
    await fetch('/api/todos', {
      method: 'POST',
      body: JSON.stringify(action.payload),
    });

    // Optionally dispatch more actions
    listenerApi.dispatch(syncCompleted());
  },
});
```

## Developer Experience

### Learning Curve

**Moderate to steep**. Redux concepts (actions, reducers, dispatch, selectors) are simple individually but require understanding how they fit together. Redux Toolkit reduces the curve significantly by eliminating boilerplate.

**Prerequisites**:
- React hooks
- Immutable updates (though RTK hides this with Immer)
- Functional programming concepts

### Tooling

**Redux DevTools**: Best-in-class debugging

- Time-travel debugging (step backward through state changes)
- Action history with diff view
- State inspection at any point
- Action replay

**TypeScript**: First-class support

```typescript
// Fully typed
const count = useAppSelector((state) => state.counter.value);
//     ^? number

dispatch(incrementByAmount(5)); // Type error if payload is wrong
```

**Testing**:

```typescript
import counterReducer, { increment, decrement } from './counterSlice';

test('increment', () => {
  const state = counterReducer({ value: 0 }, increment());
  expect(state.value).toBe(1);
});

test('decrement', () => {
  const state = counterReducer({ value: 10 }, decrement());
  expect(state.value).toBe(9);
});
```

Reducers are pure functions—trivial to test.

### Boilerplate

**Redux Toolkit reduces boilerplate by ~70%** compared to classic Redux:

**Classic Redux** (~100 lines):
```typescript
// Action types
const INCREMENT = 'counter/increment';
const DECREMENT = 'counter/decrement';

// Action creators
const increment = () => ({ type: INCREMENT });
const decrement = () => ({ type: DECREMENT });

// Reducer
function counterReducer(state = { value: 0 }, action) {
  switch (action.type) {
    case INCREMENT:
      return { ...state, value: state.value + 1 };
    case DECREMENT:
      return { ...state, value: state.value - 1 };
    default:
      return state;
  }
}

// Store
const store = createStore(counterReducer);
```

**Redux Toolkit** (~30 lines):
```typescript
const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
  },
});

const store = configureStore({
  reducer: { counter: counterSlice.reducer },
});
```

Still more than Zustand, but drastically better than classic Redux.

### Common Patterns

**Optimistic updates**:

```typescript
const addTodoOptimistic = createAsyncThunk(
  'todos/addTodoOptimistic',
  async (text: string, { dispatch }) => {
    const tempId = Date.now();
    dispatch(todosSlice.actions.addTodoOptimistic({ id: tempId, text }));

    try {
      const saved = await api.createTodo({ text });
      dispatch(todosSlice.actions.replaceTodo({ tempId, todo: saved }));
      return saved;
    } catch (error) {
      dispatch(todosSlice.actions.removeTodo(tempId));
      throw error;
    }
  }
);
```

**Normalized state**:

```typescript
interface State {
  users: {
    byId: Record<number, User>;
    allIds: number[];
  };
  posts: {
    byId: Record<number, Post>;
    allIds: number[];
  };
}
```

Avoids nested data and duplication.

**Loading patterns**:

```typescript
interface LoadingState {
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}
```

Standard pattern for async operations.

### Documentation

**Excellent**. redux.js.org and redux-toolkit.js.org have:
- Comprehensive tutorials
- API reference
- Best practices guide
- Migration guides
- Style guide (Redux conventions)

### State Reusability Assessment

**Quality: Excellent (8.5/10)**

Redux is designed for reusable state management with strong patterns and tooling.

**Reuse Mechanisms**:

1. **Slice exports** - Redux Toolkit slices are npm-packageable
2. **Middleware** - Reusable middleware (thunk, saga, logger)
3. **Selectors** - Reselect for memoized derived state
4. **Store enhancers** - Composable store modifications
5. **Action creators** - Shareable action definitions

**Strengths**:
- **Redux Toolkit** - Dramatically reduces boilerplate for reuse
- **Standardized patterns** - Slices, actions, reducers follow conventions
- **Middleware ecosystem** - Rich third-party middleware
- **Selector libraries** - Reselect, Redux-ORM for data transformation
- **Time-travel debugging** - DevTools work with any Redux app
- **Framework-agnostic** - Works with React, Angular, Vue, vanilla JS

**Weaknesses**:
- **React-focused tooling** - Most libraries target React (react-redux)
- **Boilerplate** - Even with RTK, more verbose than Zustand
- **Global store** - All state in one place (can be pro or con)
- **Learning curve** - Middleware, selectors, normalization patterns

**Cross-Project Reuse**: Excellent. Redux Toolkit slices package well:

```typescript
// @my-company/cart-slice npm package
export const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [] },
  reducers: {
    addItem: (state, action) => {
      state.items.push(action.payload);
    },
  },
});

export const { addItem } = cartSlice.actions;
export default cartSlice.reducer;

// Use in any Redux app
import cartReducer from '@my-company/cart-slice';
```

## Maintainability

**Quality: Excellent (8.5/10)**

**Refactoring**:
- **TypeScript support** - RTK provides excellent type inference
- **Immutability via Immer** - Safe refactoring of state shape
- **Action types** - String constants prevent typos
- **Normalized state** - Easier to refactor than nested data

**Debugging**:
- **Redux DevTools** - Time-travel, action replay, state inspection
- **Action logging** - Every state change logged
- **Predictable state** - No hidden mutations
- **Middleware logging** - Easy to add logging middleware

**Code Organization**:
- **Slice pattern** - Organize by feature domain
- **Separation of concerns** - Actions, reducers, selectors separate
- **RTK Query** - Colocated data fetching logic
- **File structure** - Clear conventions (`features/`, `app/`)

**Testing**:
- **Pure reducers** - Easy to test (input → output)
- **Action creators** - Test actions independently
- **Selectors** - Test data transformations
- **Integration tests** - Test full Redux flow
- **No mocking needed** - Reducers are pure functions

**Scalability**:
- **Code splitting** - Load slices on demand
- **Normalized state** - Efficient updates for large datasets
- **Memoized selectors** - Prevent unnecessary recalculations
- **Middleware** - Extensible without core changes

**Breaking Changes**:
- **Semantic versioning** - Redux and RTK follow SemVer
- **Long-term stability** - Redux core rarely breaks
- **RTK updates** - Incremental, well-documented
- **Deprecation warnings** - Features marked before removal

**Weaknesses**:
- **Boilerplate** - More code than Zustand/Jotai
- **Indirection** - Actions → reducers → selectors adds layers
- **Async complexity** - Thunks/sagas add mental overhead
- **Over-engineering risk** - Can be overkill for simple apps

**Particularly Maintainable Aspects**:
- Explicit action/reducer flow makes changes traceable
- Time-travel debugging helps understand state evolution
- Strong typing via TypeScript
- Normalized state prevents data duplication bugs
- Large community means patterns are well-established

**Maintenance Challenges**:
- Refactoring state shape requires updating reducers, actions, selectors
- Async logic (thunks/sagas) can become complex
- Testing async flows requires understanding middleware
- Large Redux apps can have deeply nested state

## AI-Friendly Assessment

**Overall Score: 7.5/10**

### Strengths for AI-Assisted Development

**Extreme Explicitness**: Every state change flows through named actions and reducers:

```typescript
dispatch(incrementByAmount(5)); // Clear: increment by 5
```

AI can trace exactly what happened by reading action names.

**TypeScript-First**: Redux Toolkit has excellent TypeScript support:

```typescript
interface CounterState {
  value: number;
}

const counterSlice = createSlice<CounterState>(/* ... */);
```

Types guide AI code generation and catch errors.

**Predictable Patterns**: Redux enforces consistent patterns across all code:

```typescript
// Always the same structure
createSlice({
  name: 'feature',
  initialState,
  reducers: { /* ... */ },
});
```

AI learns the pattern once, applies everywhere.

**Pure Functions**: Reducers are pure—same input always produces same output:

```typescript
(state, action) => newState
```

No side effects, no hidden behavior. AI can reason about code easily.

**Comprehensive DevTools**: Redux DevTools show the entire action history. AI can analyze logs to understand application behavior.

**Testability**: Reducers are trivial to test:

```typescript
expect(reducer(state, action)).toEqual(expectedState);
```

AI can generate tests that match reducers exactly.

**Middleware Standardization**: Middleware follows a consistent pattern:

```typescript
const middleware = (storeAPI) => (next) => (action) => {
  // Logic
  return next(action);
};
```

AI understands the curried function structure.

**Entity Adapters**: Normalized state is structured like a database:

```typescript
{
  byId: { 1: { id: 1, name: 'Alice' }, 2: { id: 2, name: 'Bob' } },
  allIds: [1, 2],
}
```

AI can reason about relational data.

### Weaknesses for AI-Assisted Development

**Boilerplate**: Even with Redux Toolkit, there's ceremony:

```typescript
// Must define slice
const slice = createSlice(/* ... */);

// Must configure store
const store = configureStore(/* ... */);

// Must wrap app
<Provider store={store}>

// Must use typed hooks
const useAppDispatch = () => useDispatch<AppDispatch>();
```

More for AI to generate and maintain than Zustand.

**Provider Wrapping**: Redux requires Provider component:

```typescript
<Provider store={store}>
  <App />
</Provider>
```

AI must remember to wrap the app, unlike Zustand which needs no providers.

**Immer Magic**: While convenient, Immer's "mutative immutability" is conceptually confusing:

```typescript
state.value += 1; // Looks mutable, actually immutable
```

AI must understand this isn't real mutation.

**createAsyncThunk Complexity**: Async handling requires understanding thunks and `extraReducers`:

```typescript
extraReducers: (builder) => {
  builder
    .addCase(fetchUsers.pending, (state) => {/* ... */})
    .addCase(fetchUsers.fulfilled, (state, action) => {/* ... */})
    .addCase(fetchUsers.rejected, (state, action) => {/* ... */});
},
```

More complex than simple async/await in Zustand.

**Selector Performance Footguns**: Easy to create performance issues:

```typescript
// ⚠️ Creates new object every render
const data = useSelector((state) => ({
  users: state.users,
  posts: state.posts,
}));

// ✅ Memoized
const data = useSelector((state) => state.users);
```

AI must understand memoization and reference equality.

**Action Type Strings**: While RTK auto-generates them, classic Redux uses string constants:

```typescript
const INCREMENT = 'counter/increment';
```

String-based dispatch is less type-safe than function calls.

**Middleware Currying**: Middleware's curried structure is functional programming heavy:

```typescript
(storeAPI) => (next) => (action) => next(action)
```

AI needs to understand currying and closures.

**RTK Query Complexity**: While powerful, RTK Query has many concepts (endpoints, tags, cache invalidation):

```typescript
createApi({
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: () => 'users',
      providesTags: ['User'],
    }),
    createUser: builder.mutation({
      query: (body) => ({ url: 'users', method: 'POST', body }),
      invalidatesTags: ['User'],
    }),
  }),
});
```

AI must understand the query/mutation/tag relationships.

### Why 7.5/10?

Redux scores well because:
- **Explicit patterns** - Actions and reducers are clear
- **TypeScript support** - Full type safety
- **Predictable structure** - Every slice looks the same
- **Pure functions** - Easy to reason about
- **Excellent docs** - Well-documented patterns

The 2.5-point deduction is for:
- **Boilerplate** - More ceremony than alternatives
- **Provider requirement** - Extra setup step
- **Complexity** - Thunks, middleware, selectors require learning
- **Performance footguns** - Selector memoization isn't obvious
- **Immer confusion** - "Mutative immutability" is paradoxical

For **large applications with complex state**, Redux is highly AI-friendly. The explicitness and structure outweigh the boilerplate. For **small to medium apps**, simpler solutions like Zustand are more AI-friendly.

---

**Key Insight for Next-Gen Framework Design**: Redux demonstrates that **explicit is better than implicit** for AI. Every action name, reducer case, and selector is traceable. The tradeoff is verbosity—but AI doesn't mind typing.

The **single source of truth** principle (one store, not scattered state) makes reasoning easier for both humans and AI. Future frameworks should maintain centralization while reducing boilerplate.

**Redux DevTools** show that **comprehensive debugging tools** are crucial. AI can analyze action logs to understand bugs and suggest fixes. Next-gen frameworks should prioritize debuggability.

The **TypeScript-first** approach is essential. Types catch errors before runtime and guide AI code generation. Any future framework should be designed for TypeScript from day one.

**Immer's "mutative immutability"** is clever but conceptually confusing. Future frameworks should either embrace true mutability (like MobX) or enforce explicit immutability (like classic Redux)—not fake mutation.

For next-gen state management: **keep Redux's structure (actions, reducers, single store) but remove the boilerplate (Zustand's API)**. The best of both worlds.
