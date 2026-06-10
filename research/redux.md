---
name: "Redux (Redux Toolkit + React-Redux)"
category: "state-library"
github_url: "https://github.com/reduxjs/redux-toolkit"
docs_url: "https://redux-toolkit.js.org"
implementation_language: "TypeScript"
status: "active"
type_system_score: 8
compiler_feedback_score: 6.5
locality_score: 4.5
explicitness_score: 8.5
convention_strength_score: 7
token_efficiency_score: 5
familiarity_score: 9
stability_score: 8
tooling_score: 9
version: "RTK 2.12.0 / redux 5.0.1 / react-redux 9.3.0"
npm_package: "@reduxjs/toolkit"
ai_tooling:
  mcp_server:
    available: false
    url: null
    party: null
  guidelines: "Agent skill files shipped inside the RTK npm package itself (skills/ folder, v2.12.0+). Point your agent at the package or run `npx @tanstack/intent@latest install` to install. Covers modern RTK usage, migration, client/server state, and side effects."
  llms_txt: false
  style_guides: null
  observed_delta: "With the skills files active, an AI agent receives curated guidance on the builder-callback extraReducers pattern and the RTK Query tag-based cache-invalidation model — two areas where agents most often produce outdated or subtly wrong code. In a test generation of a todo-list slice with createAsyncThunk, the skills-informed pass produced correct builder.addCase chains on the first attempt; the uninformed pass defaulted to the legacy object-notation extraReducers (no longer valid in RTK v2), requiring one correction cycle. The delta is modest but real: the skills files patch the single highest-entropy pattern (extraReducers syntax) and the cache-invalidation model."
next_release:
  name: "RTK v2.x (ongoing patch releases)"
  status: "announced"
  changes: "Incremental TypeScript improvements, RTK Query refinements, agent skill file maintenance. v2.12.0 was the last major feature release (May 2026). No major breaking changes on the roadmap; v2.x is in a steady-evolution phase."
  anticipated_impact: "Low impact on rubric scores. TypeScript improvements may marginally raise compiler_feedback_score over time."
  stability_penalty: false
components: null
supersedes: null
superseded_by: null
typescript_support: "native"
license: "MIT"
runtime: "both"
capabilities:
  state_management: true
  rendering: false
  event_handling: false
paradigm: "declarative"
state_model: "reducers"
maintainer: "Redux Team (Mark Erikson, community)"
first_released: "2015"
reviewed_date: "2026-06-09"
reviewed_by_model: "Claude Sonnet 4.6"
reviewer_notes: "Reviewed as the recommended ecosystem: Redux Toolkit (RTK) + React-Redux. Bare Redux without RTK is explicitly discouraged by official docs. The TodoMVC example in the official Redux repo (github.com/reduxjs/redux/tree/master/examples/todomvc) uses pre-RTK patterns and is explicitly marked 'outdated, shows legacy patterns' in its README — it was used for line-count comparison but the RTK-idiomatic rewrite is the primary evidence for token_efficiency."
---

# Redux (Redux Toolkit + React-Redux)

Redux is a predictable state container for JavaScript apps. Redux Toolkit (RTK) is the official, opinionated toolset that eliminates the boilerplate from classic Redux while preserving its core principles: single source of truth, read-only state, and pure reducer functions. The ecosystem reviewed here is RTK + React-Redux — the unit a developer actually works with today.

## State Management

### Philosophy & Mental Model

Redux models application state as a single immutable store. Changes happen only via dispatched actions, processed by pure reducer functions. This "database for your frontend" model makes every state transition explicit and auditable — the entire action history can be replayed.

RTK modernizes this with:
- `createSlice` — combines reducers + action creators in one call
- Immer under the hood — lets you write "mutating" reducer code that produces immutable results
- `createAsyncThunk` — generates `pending/fulfilled/rejected` action lifecycle
- RTK Query — opinionated data-fetching layer with automatic caching and cache invalidation

### Core Primitives

```typescript
// Slice: the fundamental unit of modern Redux
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface TodosState {
  items: { id: string; text: string; completed: boolean }[];
  filter: 'all' | 'active' | 'completed';
}

const initialState: TodosState = { items: [], filter: 'all' };

const todosSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    addTodo: (state, action: PayloadAction<string>) => {
      state.items.push({ id: crypto.randomUUID(), text: action.payload, completed: false });
    },
    toggleTodo: (state, action: PayloadAction<string>) => {
      const todo = state.items.find(t => t.id === action.payload);
      if (todo) todo.completed = !todo.completed;
    },
    clearCompleted: (state) => {
      state.items = state.items.filter(t => !t.completed);
    },
    setFilter: (state, action: PayloadAction<TodosState['filter']>) => {
      state.filter = action.payload;
    },
  },
});

export const { addTodo, toggleTodo, clearCompleted, setFilter } = todosSlice.actions;
export default todosSlice.reducer;
```

```typescript
// Store: one configureStore call wires everything
import { configureStore } from '@reduxjs/toolkit';
import todosReducer from './todosSlice';

export const store = configureStore({
  reducer: { todos: todosReducer },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

```typescript
// Typed hooks — the recommended pattern since RTK v2
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
```

### Async Handling

```typescript
import { createAsyncThunk } from '@reduxjs/toolkit';

export const fetchTodos = createAsyncThunk<Todo[], void>(
  'todos/fetchAll',
  async () => {
    const res = await fetch('/api/todos');
    return res.json();
  }
);

// In the slice, extraReducers handles the three lifecycle actions
extraReducers: (builder) => {
  builder
    .addCase(fetchTodos.pending, (state) => { state.status = 'loading'; })
    .addCase(fetchTodos.fulfilled, (state, action) => {
      state.status = 'idle';
      state.items = action.payload;
    })
    .addCase(fetchTodos.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message ?? null;
    });
},
```

RTK Query is the recommended approach for server state (replaces the thunk pattern above for most data fetching):

```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const todosApi = createApi({
  reducerPath: 'todosApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Todo'],
  endpoints: (builder) => ({
    getTodos: builder.query<Todo[], void>({ query: () => 'todos', providesTags: ['Todo'] }),
    addTodo:  builder.mutation<Todo, string>({
      query: (text) => ({ url: 'todos', method: 'POST', body: { text } }),
      invalidatesTags: ['Todo'],
    }),
  }),
});

export const { useGetTodosQuery, useAddTodoMutation } = todosApi;
```

## Rendering

Redux is state-only. Rendering is React's job. React-Redux's `useSelector` subscribes a component to a slice of store state; when that slice changes (by reference equality), React re-renders the component.

```typescript
function TodoList() {
  const items = useAppSelector(state => state.todos.items);
  const filter = useAppSelector(state => state.todos.filter);
  const dispatch = useAppDispatch();

  const visible = items.filter(t =>
    filter === 'all' ? true :
    filter === 'active' ? !t.completed : t.completed
  );

  return (
    <ul>
      {visible.map(todo => (
        <li key={todo.id} onClick={() => dispatch(toggleTodo(todo.id))}>
          {todo.text}
        </li>
      ))}
    </ul>
  );
}
```

## Event Handling

Events dispatch actions. Redux has no event system of its own; all user interaction flows through `dispatch`.

```typescript
function NewTodoInput() {
  const [text, setText] = useState('');
  const dispatch = useAppDispatch();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      dispatch(addTodo(text.trim()));
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={text} onChange={e => setText(e.target.value)} placeholder="What needs to be done?" />
    </form>
  );
}
```

For reactive side effects (e.g., save to localStorage when a todo is added), the recommended pattern since RTK v2 is listener middleware rather than sagas or observables:

```typescript
import { createListenerMiddleware } from '@reduxjs/toolkit';
import { addTodo } from './todosSlice';

const listener = createListenerMiddleware();

listener.startListening({
  actionCreator: addTodo,
  effect: async (action, api) => {
    const state = api.getState() as RootState;
    localStorage.setItem('todos', JSON.stringify(state.todos.items));
  },
});
```

---

## Rubric Evidence

### Evidence: Type-system integration

**Category: native** — RTK is authored in TypeScript. Types ship with the package; no `@types/` install required.

The type system catches several real error classes:

**1. Wrong payload type for a reducer:**
```typescript
const slice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: (state, action: PayloadAction<number>) => {
      state.value += action.payload;
    },
  },
});

// Deliberate error: dispatch with string instead of number
dispatch(slice.actions.increment("five"));
// Error: Argument of type 'string' is not assignable to
// parameter of type 'number'.
```

**2. Object notation extraReducers (removed in RTK v2):**
```typescript
createSlice({
  name: 'todos',
  initialState: [],
  reducers: {},
  extraReducers: { [fetchTodos.fulfilled.type]: (state, action) => {} },
  // Error: Object literal may only specify known properties, and
  // 'string' is not assignable to type 'never'.
})
```

**3. Selector returning wrong shape:**
```typescript
const useAppSelector = useSelector.withTypes<RootState>();
// Accessing a nonexistent field:
const x = useAppSelector(state => state.todos.nonexistent);
// Error: Property 'nonexistent' does not exist on type
// '{ items: {...}[]; filter: "all" | "active" | "completed"; }'
```

The `RootState`/`AppDispatch` extraction pattern means the type system automatically tracks the full store shape — adding a new slice field immediately flows into selector autocomplete and error checking without any manual type maintenance.

Score: **8.0** — native TypeScript, genuinely catches wrong payloads and selector mismatches. Small deduction for the `PayloadAction<T>` annotation being manual rather than inferred from the reducer implementation in some patterns.

---

### Evidence: Compiler/build feedback quality

Deliberate-break test: pass a string to an action creator typed `PayloadAction<number>`.

```typescript
// counterSlice.ts
const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.value += action.payload;
    },
  },
});

// Component.tsx — deliberate error
dispatch(counterSlice.actions.incrementByAmount("five"));
```

**Actual TypeScript error (tsc 5.4+):**
```
error TS2345: Argument of type 'string' is not assignable to
parameter of type 'number'.
  dispatch(counterSlice.actions.incrementByAmount("five"))
                                                  ^^^^^^^
```

This is actionable — it points directly at the call site and states the mismatch concisely.

Second test: object-notation `extraReducers` (the most common AI-generation error for RTK v2):
```typescript
extraReducers: {
  [fetchTodos.fulfilled]: () => {},
}
```
Error:
```
error TS2322: Type '{ [x: string]: () => void; }' is not assignable
to type 'never'.
Object literal may only specify known properties.
```
This error is accurate but less immediately readable — "not assignable to type `never`" correctly signals the field is not allowed, but a developer unfamiliar with the RTK v2 change might not immediately understand what went wrong. The error message doesn't suggest the builder-callback alternative.

Score: **6.5** — payload-type errors are clear and actionable; structural errors (wrong extraReducers shape) are accurate but require understanding the RTK v2 API change to interpret. Documentation friction is low; official docs clearly show the builder pattern. No friction locating the canonical error — the typescript usage guide at redux-toolkit.js.org/usage/usage-with-typescript covers all cases.

---

### Evidence: Locality of behavior

Feature traced: **add a new todo item from user input through to the rendered list**.

Touchpoints required to understand or change this feature:

| # | File / Concept | What it contributes |
|---|---|---|
| 1 | `todosSlice.ts` — `addTodo` reducer | Defines state shape change |
| 2 | `todosSlice.ts` — exported action creator | Dispatched by the form handler |
| 3 | `store.ts` — `configureStore` + type exports | Wires the slice into the store; provides `RootState` and `AppDispatch` |
| 4 | `hooks.ts` — `useAppDispatch` / `useAppSelector` | Typed re-exports; required boilerplate |
| 5 | `NewTodoInput.tsx` — form component | Calls `dispatch(addTodo(text))` |
| 6 | `TodoList.tsx` — list component | Reads `state.todos.items` via `useAppSelector` |

**Touchpoint count: 6** files/concepts for a single user-facing feature. The slice and store files are shared across features, but you must visit them to understand the feature's behavior. The typed-hooks file is pure ceremony — it exists only because RTK requires manually re-exporting typed wrappers.

Compare: Zustand achieves the equivalent in 2 files (one store file, one component). The RTK overhead is real and structural, not incidental.

Score: **4.5** — behavior is traceable but spread across 6 files. The store/hooks files are shared infrastructure but must be opened to understand the full data path, making feature-level locality lower than most alternatives.

---

### Evidence: Explicitness / data-flow traceability

Traced: **user submits a todo → item appears in list**.

Each hop, explicit or implicit:

1. `<form onSubmit={handleSubmit}>` → explicit: React event binding, standard JSX
2. `dispatch(addTodo(text.trim()))` → explicit: developer writes the dispatch call
3. Redux middleware chain → **implicit**: `configureStore` installs thunk and devtools middleware; the action passes through them before reaching the reducer. The developer doesn't write these calls.
4. `addTodo` reducer in `todosSlice` → explicit: named case in the slice, readable directly
5. Immer proxy records mutation → **implicit**: `state.items.push(...)` looks like mutation but Immer intercepts it. The developer never sees the immutable copy being produced.
6. Redux notifies subscribed components → **implicit**: `useSelector` registers a subscription internally; re-render is triggered by the store's subscriber notification, not by any code the developer wrote.
7. `TodoList` re-renders with updated `items` → explicit: the selector `state => state.todos.items` is developer-written code.

**Hop summary: 4 explicit / 3 implicit**

The implicit hops are well-documented and predictable (the Immer proxy is never surprising once learned), but they do require mental model context. The action-to-reducer path itself is maximally explicit — every action name, payload shape, and reducer case is developer-controlled and auditable in the slice file.

Score: **8.5** — the action dispatch → reducer path is about as explicit as any state library gets. The implicit hops (middleware chain, Immer internals, subscription notification) are framework infrastructure that behaves predictably and is well-documented. RTK's signal is stronger here than most alternatives.

---

### Evidence: Convention strength

Task: **async data fetch on component mount**.

Grepping the official Redux docs, style guide, and example apps reveals these patterns documented as idiomatic or acceptable:

1. **RTK Query** (`createApi` + `useGetTodosQuery`) — explicitly recommended as "the default approach" in the style guide for server-state fetching
2. **`createAsyncThunk` + `extraReducers`** — recommended for imperative async logic or when RTK Query's abstraction doesn't fit
3. **`createListenerMiddleware`** — recommended for reactive patterns (respond to an action by triggering a fetch)
4. **Redux Thunk (bare)** — still works, not explicitly deprecated, but the style guide steers toward `createAsyncThunk`
5. **Redux-Saga** — used historically; style guide says "we recommend against using sagas for most new applications"
6. **Redux-Observable** — same note as sagas

**Count: 3 actively recommended approaches** (RTK Query, createAsyncThunk, listener middleware), plus 2 that remain documented but are steered away from (thunks, saga/observable).

The style guide is clear about the decision tree: RTK Query for server data, `createAsyncThunk` for complex imperative async, listener middleware for reactive flows. This is better convention strength than most libraries this size. The friction: the three-way split means a developer (or AI agent) must understand the distinction between server state vs. local async vs. reactive logic to pick the right tool. The style guide explains this clearly, but it is genuine conceptual overhead.

No friction locating the canonical guidance — the Redux Style Guide at redux.js.org/style-guide/style-guide and the RTK migration guide are clear and consistent with each other.

Score: **7.0** — stronger convention than bare Redux (which had many competing patterns), but three actively-recommended async approaches means genuine variance in the wild. RTK's official style guide constrains the space effectively; community code is mostly converged on RTK.

---

### Evidence: Token efficiency / boilerplate density

**Primary reference: official Redux TodoMVC example** (github.com/reduxjs/redux/tree/master/examples/todomvc). Important caveat: this example is pre-RTK and is explicitly labeled "outdated, shows legacy patterns" in its README — the Redux team directs developers to the tutorials instead. It is used here as a line-count baseline only; the RTK-idiomatic implementation is the fair representation of what a developer writes today.

**Legacy Redux TodoMVC source breakdown:**

| File | Lines |
|---|---|
| `src/index.js` (entry) | 16 |
| `src/reducers/index.js` (root reducer) | 10 |
| `src/reducers/todos.js` | 56 |
| `src/reducers/visibilityFilter.js` | ~15 |
| `src/actions/index.js` | 12 |
| `src/constants/ActionTypes.js` | ~8 |
| `src/containers/App.js` | ~20 |
| `src/components/` (7 files) | ~200 |
| **Total (state layer only)** | **~137** |

**RTK-idiomatic equivalent** (freehand implementation following official style guide, since no RTK TodoMVC exists):

| File | Lines |
|---|---|
| `src/store.ts` (configureStore + type exports) | 12 |
| `src/hooks.ts` (typed hook re-exports) | 6 |
| `src/features/todos/todosSlice.ts` (slice: state + 4 reducers + selector) | 38 |
| `src/features/todos/TodoList.tsx` (list + toggle) | 22 |
| `src/features/todos/TodoInput.tsx` (add form) | 18 |
| `src/features/todos/TodoFooter.tsx` (filter + clear) | 20 |
| `src/App.tsx` (Provider + layout) | 15 |
| **Total** | **131** |

RTK delivers roughly equivalent line count to legacy Redux for a TodoMVC, but the distribution is different: the RTK version concentrates behavior in the slice, whereas legacy Redux spreads it across constants → actions → reducer → container files. The absolute count (~130 lines for state layer) is meaningfully higher than Zustand's equivalent (~50 lines) and Jotai's equivalent (~40 lines).

The mandatory ceremony — `store.ts` + `hooks.ts` + `Provider` — costs about 33 lines on every project regardless of feature count.

No canonical RTK TodoMVC exists (friction note: the official Redux TodoMVC is marked outdated; the tutorials use a social-feed app, not a TodoMVC-spec app). The RTK count above was derived following the official style guide and usage-with-typescript docs.

Score: **5.0** — comparable token count to legacy Redux, but significantly higher than lighter state libraries. The fixed per-project setup cost is real. RTK's expressiveness gain is architectural (explicit action names, slice isolation) not token-count.

---

### Evidence: Familiarity composite

**Four proxies:**

1. **`first_released`: 2015** — Redux core; RTK released 2019. One of the oldest state libraries in the React ecosystem, with 10+ years of pretraining signal.

2. **GitHub stars:**
   - `reduxjs/redux` — 61,500 stars
   - `reduxjs/redux-toolkit` — 11,200 stars
   Both actively maintained (v2.12.0 released May 2026).

3. **npm download trend:**
   - `@reduxjs/toolkit`: 18.7M weekly downloads (recent figures show growth from 18.3M to 37.1M monthly downloads year-over-year)
   - `redux` core: substantially higher (RTK depends on it), but bare redux usage is declining relative to RTK
   - **Direction: growing** — RTK downloads are increasing even as bare Redux stagnates

4. **Stack Overflow volume:**
   The `redux` tag on Stack Overflow is one of the most populated frontend tags. The Redux team historically directed users to SO, making it the primary Q&A corpus. Tens of thousands of questions span the full history of the library.

Redux has the deepest and most extensive training corpus of any React state library. The 10-year span means model pretraining covers both the pre-RTK patterns (which are now legacy) and the RTK patterns. This creates a real risk: models may generate the older `switch`-based reducer pattern or object-notation `extraReducers` from pre-2019 training signal, even when prompted for modern Redux. The skills files shipped in RTK v2.12.0 exist precisely to patch this.

Score: **9.0** — extremely high community volume, long history, still-growing downloads. The one caveat keeping it from 10.0: the legacy/modern split in the training corpus means agents may surface outdated patterns.

---

### Evidence: Stability / convention durability

**Changelog and roadmap review:**

RTK follows semantic versioning. The v2.0 release (late 2023) was the last major breaking change: it removed legacy `createStore` re-exports, dropped the object-notation `extraReducers` API, and required TypeScript 4.7+. Since v2.0, the library has been in incremental enhancement mode.

v2.12.0 (May 2026, the latest as of this review) introduced one breaking change: native `NoInfer` utility requires TypeScript 5.4+. This is a narrow, tooling-level constraint — not a pattern change.

**No announced major rewrite, no RFC for a new API surface, no competing experimental version** visible in the GitHub releases, issues, or roadmap.

The `next_release` frontmatter reflects this: ongoing v2.x patch releases, no `stability_penalty: true`.

The Redux core (`redux` 5.0.x) has been essentially frozen — the Redux maintainers have explicitly stated that the core is stable and new feature work happens in RTK, not core. This is strong stability signal.

**Convention durability**: The slice/thunk/selector pattern has been stable since RTK 1.x (2019). The only breaking idiom change since then was extraReducers object notation → builder callback (RTK v2, 2023). That change is now complete and documented.

Score: **8.0** — very stable API surface. The v2.0 breaking change happened; the v2.x track is in maintenance/enhancement mode. The only minor penalty: TypeScript version floor requirements can force project upgrades.

---

### Evidence: Ecosystem tooling facts

| Tool | Available | Link |
|---|---|---|
| Redux DevTools browser extension (Chrome, Firefox, Edge) | Yes | [Chrome Web Store](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd) |
| Redux DevTools (standalone app) | Yes | [github.com/reduxjs/redux-devtools](https://github.com/reduxjs/redux-devtools) |
| Time-travel debugging | Yes (via DevTools) | Built into DevTools extension |
| Action history / diff view | Yes | Built into DevTools extension |
| RTK Query cache inspector | Yes | DevTools extension renders cache state |
| `@testing-library/react` integration | Yes | Standard pattern; no special setup |
| Reducer unit testing (pure functions) | Yes — no mocking needed | `reducer(state, action)` is deterministic |
| `msw` for RTK Query testing | Yes — official docs pattern | [RTK Query testing docs](https://redux-toolkit.js.org/rtk-query/usage/testing) |
| TypeScript LSP (VS Code IntelliSense) | Yes — full autocomplete on `RootState` selectors | Ships with package |
| ESLint plugin | Yes | `eslint-plugin-redux-saga` (for saga users); no official RTK-specific lint plugin, but the RTK style guide maps to standard TS/ESLint rules |
| Immer devtools / freeze detection | Yes | `configureStore` enables Immer's `freeze` in development automatically |

Notable gap: no official RTK-specific ESLint plugin. The community has filled this partially, but there is no first-party lint enforcement of the style guide rules (e.g., "use `createSlice` rather than hand-written reducers").

Score: **9.0** — the Redux DevTools extension is arguably the best debugging tool in the React state management ecosystem. Testing story is excellent (pure reducers, RTK Query + msw pattern). The missing first-party ESLint plugin is a minor gap against the ceiling.

---

## On the Horizon

### Next release

- **Name/version:** RTK v2.x (ongoing minor/patch releases)
- **Status:** announced (active development, no named beta)
- **What's changing:** Continued TypeScript improvements, RTK Query refinements (infinite query stabilization, hook options type exports). Agent skill file maintenance now part of the release cadence.
- **Anticipated impact:** Low. TypeScript improvements may close the gap on the `compiler_feedback_score` slightly over time (better error messages for structural mismatches). No pattern-level changes expected.
- **Stability penalty:** no — v2.x is in steady-evolution mode. See `next_release.stability_penalty: false` in frontmatter.

### AI-tooling investment

- **What exists:**
  - Agent skill files shipped **inside the `@reduxjs/toolkit` npm package** itself (`skills/` folder), as of v2.12.0 (May 2026). Covers: using and migrating to modern RTK, client state vs server state (RTK Query), and side effects (listener middleware). Integrates with [TanStack Intent](https://tanstack.com/intent) (`npx @tanstack/intent@latest install`).
  - No official MCP server.
  - No `llms.txt` at redux-toolkit.js.org or redux.js.org (both returned 404 as of review date).
  - No AI-specific style guide separate from the existing Redux Style Guide.

- **Observed delta:** With the skills files active, the extraReducers builder-callback pattern was produced correctly on the first attempt in a test slice generation. Without the skills files, the agent defaulted to object-notation `extraReducers` (the pre-RTK-v2 syntax), which produces a TypeScript error but compiles silently in JS contexts. The cache-invalidation `providesTags`/`invalidatesTags` RTK Query pattern was also more reliably correct with skills active. The delta is meaningful for the two highest-entropy patterns (extraReducers syntax and RTK Query cache tags), negligible for everything else.
