---
name: "TanStack Query"
category: "state-library"
github_url: "https://github.com/TanStack/query"
docs_url: "https://tanstack.com/query/latest"
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
version: "5.90.12"
npm_package: "@tanstack/react-query"
typescript_support: "native"
license: "MIT"
runtime: "browser"
capabilities:
  state_management: true
  rendering: false
  event_handling: false
paradigm: "declarative"
state_model: "queries"
maintainer: "TanStack"
first_released: "2019"
reviewed_date: "2025-12-06"
reviewed_by_model: "Claude Sonnet 4.5"
---

# TanStack Query

## State Management

### Philosophy & Mental Model

TanStack Query represents a **paradigm shift** from traditional state management to **declarative async state management**. The core philosophy:

**"Server state is fundamentally different from client state"**

Key mental model concepts:
- **Server state vs client state**: Data from servers has unique characteristics - it's remote, potentially stale, asynchronously updated, and potentially owned by others
- **Declarative data fetching**: "Tell TanStack Query where to get your data and how fresh you need it to be and the rest is automatic"
- **Stale-while-revalidate**: Show cached data immediately, fetch fresh data in background
- **Zero manual cache management**: No need to code caching logic, timers, retry mechanisms, or race condition handling
- **Simplicity**: If you understand promises/async-await, you can use TanStack Query

**Core insight**: Most "state management" problems in React apps are actually **async server state synchronization** problems, not local state problems. TanStack Query specializes in this.

**Mental model shift**:
- Traditional: Fetch data → store in Redux/Context → manually sync/refresh → handle loading/error states
- TanStack Query: Declare what data you need → library handles everything else

This is fundamentally different from Jotai/Redux - it's not about local state composition, it's about **treating the server as the source of truth** and keeping local cache in sync.

### Core Primitives

TanStack Query has three core primitives:

**1. Queries** - Read operations (GET requests):

```typescript
const { data, isPending, error, isError, isSuccess } = useQuery({
  queryKey: ['todos'],  // Unique cache key
  queryFn: () => fetch('/api/todos').then(r => r.json()),
  staleTime: 5 * 60 * 1000,  // 5 minutes
  gcTime: 10 * 60 * 1000,     // 10 minutes (formerly cacheTime)
})
```

**Query components**:
- `queryKey`: Unique identifier for cached data (array format for hierarchical keys)
- `queryFn`: Async function that fetches data or throws errors
- `staleTime`: How long data stays "fresh" (won't refetch)
- `gcTime`: How long unused data stays in cache before garbage collection

**Returns comprehensive state**:
- `data`: The fetched data
- `isPending`: True while first fetch in progress
- `isLoading`: True while fetching (no cached data)
- `isError`: True if query failed
- `error`: Error object if failed
- `isSuccess`: True if query succeeded
- `isFetching`: True during any fetch (including background refetch)

**2. Mutations** - Write operations (POST/PUT/DELETE):

```typescript
const { mutate, mutateAsync, isPending, isError, error } = useMutation({
  mutationFn: (newTodo) =>
    fetch('/api/todos', {
      method: 'POST',
      body: JSON.stringify(newTodo)
    }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
})

// Usage
mutate({ title: 'New Todo' })
```

**Mutation lifecycle hooks**:
- `onMutate`: Called before mutation (for optimistic updates)
- `onSuccess`: Called after successful mutation
- `onError`: Called if mutation fails
- `onSettled`: Called after success or error

**3. QueryClient** - Central orchestrator:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 3,
    },
  },
})

// Provide to app
<QueryClientProvider client={queryClient}>
  <App />
</QueryClientProvider>

// Programmatic access
queryClient.invalidateQueries({ queryKey: ['todos'] })
queryClient.setQueryData(['todos'], newData)
queryClient.getQueryData(['todos'])
```

The QueryClient manages:
- All query/mutation state
- Cache storage and garbage collection
- Global defaults and configuration
- Programmatic cache manipulation

### Update Mechanism

TanStack Query uses a **multi-layered update strategy**:

**1. Automatic background refetching**:
```typescript
useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  refetchOnWindowFocus: true,    // Refetch when user returns to tab
  refetchOnReconnect: true,       // Refetch when network reconnects
  refetchInterval: 30000,         // Poll every 30 seconds
})
```

**2. Mutation-triggered invalidation**:
```typescript
const mutation = useMutation({
  mutationFn: createTodo,
  onSuccess: () => {
    // Mark todos query as stale, trigger refetch
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
})
```

**3. Optimistic updates** (update cache immediately, rollback on error):

**UI-based** (simple):
```typescript
const { isPending, variables, mutate } = useMutation({
  mutationFn: addTodo,
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
})

// Show pending item in UI
{isPending && <li style={{ opacity: 0.5 }}>{variables}</li>}
```

**Cache-based** (advanced):
```typescript
useMutation({
  mutationFn: updateTodo,
  onMutate: async (newTodo) => {
    // Cancel ongoing queries
    await queryClient.cancelQueries({ queryKey: ['todos'] })

    // Save previous state for rollback
    const previousTodos = queryClient.getQueryData(['todos'])

    // Optimistically update cache
    queryClient.setQueryData(['todos'], (old) => [...old, newTodo])

    return { previousTodos }
  },
  onError: (err, newTodo, context) => {
    // Rollback on error
    queryClient.setQueryData(['todos'], context.previousTodos)
  },
  onSettled: () => {
    // Refetch to ensure server sync
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
})
```

**4. Manual updates**:
```typescript
// Direct cache update
queryClient.setQueryData(['todos'], newTodos)

// Partial update
queryClient.setQueryData(['todos'], (old) =>
  old.map(todo => todo.id === 5 ? updated : todo)
)
```

**Update flow**: Mutation → onMutate (optimistic) → server request → onSuccess/onError → invalidate queries → automatic refetch → UI updates

### Read Pattern

**Primary read hook: `useQuery`**

```typescript
const result = useQuery({
  queryKey: ['todos', filters],  // Dependency array-like key
  queryFn: () => fetchTodos(filters),
})

const {
  data,          // The actual data
  isPending,     // First load
  isFetching,    // Any fetch (including background)
  isError,       // Error state
  error,         // Error object
  isSuccess,     // Success state
  refetch,       // Manual refetch function
} = result
```

**Conditional queries** (enabled option):
```typescript
const { data: user } = useQuery({
  queryKey: ['user', email],
  queryFn: () => fetchUser(email),
})

// Only fetch projects after user is loaded
const { data: projects } = useQuery({
  queryKey: ['projects', user?.id],
  queryFn: () => fetchProjects(user.id),
  enabled: !!user?.id,  // Wait for user.id
})
```

**Multiple queries** (parallel):
```typescript
const queries = useQueries({
  queries: [
    { queryKey: ['todos'], queryFn: fetchTodos },
    { queryKey: ['users'], queryFn: fetchUsers },
    { queryKey: ['posts'], queryFn: fetchPosts },
  ],
})

// Access results
const [todosQuery, usersQuery, postsQuery] = queries
```

**Infinite queries** (pagination/load more):
```typescript
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfiniteQuery({
  queryKey: ['todos'],
  queryFn: ({ pageParam = 0 }) => fetchTodos(pageParam),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
  initialPageParam: 0,
})

// data.pages contains all pages
// data.pages.flatMap(page => page.items) gets all items
```

**Data access patterns**:
- Hook-based (in components): `useQuery`
- Outside components: `queryClient.getQueryData(['todos'])`
- Suspense mode: `useSuspenseQuery` (throws promise for Suspense boundaries)

### Reactivity & Granularity

**Query-level granularity** with automatic smart refetching:

**What triggers refetches**:
- Component mount (if data is stale)
- Window focus (if `refetchOnWindowFocus: true`)
- Network reconnect (if `refetchOnReconnect: true`)
- Interval polling (if `refetchInterval` set)
- Query invalidation (via `invalidateQueries`)
- Manual refetch (via `refetch()`)

**Staleness determines refetch behavior**:
```typescript
useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  staleTime: 5 * 60 * 1000,  // Fresh for 5 minutes
})

// First component mount: fetches
// Second mount within 5 min: uses cache, no fetch
// After 5 min: cache marked stale
// Next mount: shows stale cache immediately, fetches in background
```

**Re-render optimization**:
- Components only re-render when their specific query's state changes
- Multiple components using same `queryKey` share cache (one fetch, multiple consumers)
- Structural sharing prevents re-renders when data deeply equals previous data

**Example**:
```typescript
// Component A
const { data } = useQuery({ queryKey: ['todos'], queryFn: fetchTodos })

// Component B (elsewhere in tree)
const { data } = useQuery({ queryKey: ['todos'], queryFn: fetchTodos })

// Only ONE network request happens
// Both components share the same cached data
// Both update together when data changes
```

**Selective re-renders with `select`**:
```typescript
const { data } = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  select: (data) => data.filter(todo => todo.completed),
})

// Only re-renders when completed todos change, not all todos
```

**Granularity: Coarser than Jotai (query-level vs atom-level), but automatic smart refetching compensates**

### Async Handling

**This is TanStack Query's core strength** - async complexity is built into every primitive:

**1. Automatic retry with backoff**:
```typescript
useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  retry: 3,                    // Retry failed requests 3 times
  retryDelay: attemptIndex =>
    Math.min(1000 * 2 ** attemptIndex, 30000),  // Exponential backoff
})
```

**2. Request cancellation** (prevents race conditions):
```typescript
queryFn: async ({ signal }) => {
  const response = await fetch('/api/todos', { signal })
  return response.json()
}

// If query key changes or component unmounts, request is cancelled
```

**3. Dependent queries** (sequential async):
```typescript
// Step 1: Get user
const { data: user } = useQuery({
  queryKey: ['user', email],
  queryFn: () => fetchUser(email),
})

// Step 2: Get user's projects (waits for user)
const { data: projects } = useQuery({
  queryKey: ['projects', user?.id],
  queryFn: () => fetchProjects(user.id),
  enabled: !!user?.id,  // Only runs when user exists
})
```

**4. Parallel queries** (concurrent async):
```typescript
const results = useQueries({
  queries: ids.map(id => ({
    queryKey: ['item', id],
    queryFn: () => fetchItem(id),
  })),
})

// All fetch in parallel
```

**5. Infinite/paginated queries**:
```typescript
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['posts'],
  queryFn: ({ pageParam = 0 }) => fetchPosts(pageParam),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
  initialPageParam: 0,
})
```

**6. Suspense integration**:
```typescript
const { data } = useSuspenseQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
})

// Suspends component while loading
<Suspense fallback={<Loading />}>
  <TodoList />
</Suspense>
```

**7. Prefetching** (load before needed):
```typescript
// Prefetch on hover
onMouseEnter={() => {
  queryClient.prefetchQuery({
    queryKey: ['todo', id],
    queryFn: () => fetchTodo(id),
  })
}}
```

**8. Polling**:
```typescript
useQuery({
  queryKey: ['notifications'],
  queryFn: fetchNotifications,
  refetchInterval: 5000,  // Poll every 5 seconds
})
```

**Async patterns TanStack Query handles automatically**:
- Race conditions (via request cancellation)
- Duplicate requests (via shared cache)
- Stale data (via background refetching)
- Loading states (via isPending/isFetching flags)
- Error handling (via isError/error)
- Retry logic (via retry config)
- Request waterfalls (via dependent queries)

**No other state library comes close to this async sophistication.**

### Derived State

**Two patterns for derived/computed data**:

**1. Query selectors** (transform query data):
```typescript
const { data: completedTodos } = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  select: (todos) => todos.filter(todo => todo.completed),
})

// Only re-renders when completed todos change
// Selector runs on every data update
```

**2. Computed queries** (derive from other queries):
```typescript
const { data: todos } = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
})

const { data: users } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
})

// Compute in component (re-runs on every render)
const todosWithUsers = useMemo(() =>
  todos?.map(todo => ({
    ...todo,
    user: users?.find(u => u.id === todo.userId)
  })),
  [todos, users]
)
```

**3. Dependent queries** (one query uses another's data):
```typescript
const { data: userId } = useQuery({
  queryKey: ['currentUser'],
  queryFn: getCurrentUser,
  select: (user) => user.id,  // Extract just ID
})

const { data: userPosts } = useQuery({
  queryKey: ['posts', userId],
  queryFn: () => fetchPosts(userId),
  enabled: !!userId,
})
```

**Unlike Jotai's derived atoms**, TanStack Query's derived state is mostly **selector-based** rather than primitive-based. This is because queries represent async data sources, not local atoms.

**Trade-off**: Less elegant composition than Jotai, but better suited for async/server data patterns.

### Developer Experience

**Boilerplate: Low to Medium**
- Minimal setup: QueryClientProvider at root
- Individual queries are concise (just queryKey + queryFn)
- More verbose than Jotai for simple cases, but drastically simpler than manual async management
- Mutations require more ceremony (onSuccess/onError handlers)

**Setup comparison**:
```typescript
// Manual async (Redux/useState)
const [todos, setTodos] = useState([])
const [loading, setLoading] = useState(false)
const [error, setError] = useState(null)

useEffect(() => {
  setLoading(true)
  fetchTodos()
    .then(setTodos)
    .catch(setError)
    .finally(() => setLoading(false))
}, [])

// TanStack Query
const { data: todos, isPending, error } = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
})
```

**DevTools: Excellent**
- Dedicated React Query DevTools package (`@tanstack/react-query-devtools`)
- Real-time query state inspection
- Mutation tracking
- Cache timing visualization
- Manual cache manipulation
- Query refetch triggers
- Network waterfall visualization
- Tree-shakable for production

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

**Debugging: Very Good**
- Clear query states (pending/error/success)
- Query keys are visible in DevTools
- Network request tracking
- Cache inspection
- Error boundaries work naturally
- Logging options available

**Time travel: No**
- Not designed for time-travel debugging
- Focus is on **current server state**, not historical client state
- Can inspect query cache at any moment, but no built-in replay

**TypeScript support: Excellent**
- 96.2% TypeScript codebase
- Strong type inference from `queryFn` return type
- Generic types for custom configurations
- Type-safe query keys with `as const`

```typescript
const { data } = useQuery({
  queryKey: ['todo', 5] as const,
  queryFn: () => fetchTodo(5),
})
// data is automatically typed based on fetchTodo return type
```

### AI-Friendly Assessment

**What makes TanStack Query easy for AI to work with:**

✅ **Explicit query keys**
- Every query has a visible, searchable key: `queryKey: ['todos']`
- Easy to find all places a specific data is fetched
- Key naming conventions are transparent

✅ **Declarative async patterns**
- Query declaration is co-located: key + function in one place
- No hidden state machines or complex middleware
- What you see is what happens

✅ **Predictable state shape**
- Every query returns same shape: `{ data, isPending, error, isError, isSuccess }`
- Consistent patterns across all queries
- Easy to predict component behavior

✅ **Explicit dependencies**
- `enabled: !!userId` makes dependencies visible
- `queryKey` arrays show hierarchical relationships
- Invalidation calls show which queries depend on mutations

✅ **Single responsibility**
- TanStack Query ONLY handles server state
- Doesn't try to be general state management
- Clear boundaries of what it does/doesn't do

✅ **Excellent documentation patterns**
- Official docs are comprehensive and example-rich
- Common patterns are well-documented
- Easy for AI to reference

**What could be challenging:**

⚠️ **Cache invalidation complexity**
- Invalidation patterns can get complex in large apps
- Partial matching: `queryClient.invalidateQueries({ queryKey: ['todos'] })` invalidates ALL todos queries
- Need to understand query key hierarchies

⚠️ **Mutation orchestration**
- Complex mutation flows (optimistic updates, rollbacks) require understanding lifecycle
- Multiple lifecycle hooks (onMutate/onSuccess/onError/onSettled) can be confusing
- Error recovery patterns require careful thought

⚠️ **Implicit refetching**
- Automatic refetch on window focus can be surprising
- Stale-while-revalidate behavior requires understanding freshness model
- Background refetching is "magic" - happens without explicit code

⚠️ **Query key design**
- Query key structure impacts cache behavior
- Hierarchical keys (`['todos', 'list', { status: 'active' }]`) require design decisions
- No enforced conventions - teams must establish patterns

⚠️ **Mental model shift**
- Requires thinking about "server state" vs "client state" differently
- Cache-first thinking vs fetch-first thinking
- Not intuitive for devs familiar with Redux/Context

**Overall AI-Friendliness: 8/10**

TanStack Query is very AI-friendly due to explicit query keys, declarative patterns, and predictable state shapes. The main challenges are understanding cache invalidation strategies and the stale-while-revalidate mental model.

**Compared to Jotai**: Slightly less AI-friendly due to more implicit behaviors (automatic refetching) and cache complexity, but the explicit query keys and declarative patterns are excellent.

**For AI-assisted development**: The library shines when AI needs to add/modify server data fetching. The explicit query keys make it easy to find all related code. The main friction is designing optimal query key hierarchies and invalidation strategies.

### State Reusability Assessment

**Quality: Excellent (9/10)**

**Strengths**: Framework-agnostic core - adapters for React, Vue, Svelte, Solid. Query patterns reusable via custom hooks. Infinite query, pagination, optimistic updates all packageable. TypeScript generics make data types explicit. Query keys enable finding all related queries. Plugins/middleware extensible. DevTools work across frameworks.

**Weaknesses**: Each framework needs separate adapter. Cache config can couple queries. Some patterns (React Suspense) framework-specific. Query factories require setup.

**Cross-Project Reuse**: Excellent. Query patterns export as utilities. API client wrappers reusable. Cache strategies portable. Works across React/Vue/Svelte/Solid - same patterns, different adapters. Community libraries (react-query-kit) prove reusability.

## Maintainability

**Quality: Excellent (8.5/10)**

**Strengths**: Query keys make cache inspectable. DevTools show all queries, cache state, mutations. TypeScript prevents type mismatches. Automatic refetching reduces stale data bugs. Retries built-in. Background updates seamless. Query invalidation declarative. Error handling via error state. Cache persisting for offline. Optimistic updates for instant UI.

**Weaknesses**: Cache behavior can surprise - staleTime, cacheTime, refetchOnWindowFocus all interact. Query key design critical - poor keys create bugs. Infinite query pagination complex. Cancellation requires AbortController understanding. Too much magic for some (automatic refetching). Debugging cache state requires DevTools.

**Code Organization**: Queries in custom hooks. Mutations separate. Query keys in constants file. API client abstracted. Feature-based organization works well.

**Testing**: Queries are functions - test by mocking fetch. React Query wrapper for tests. Can test cache behavior. Mock query client for component tests. Optimistic updates harder to test.

**Debugging**: TanStack Query DevTools excellent - show all queries, state, timestamps. Network tab shows requests. Cache state inspectable. Query lifecycle logs. TypeScript catches key mismatches.

**Scalability**: Excellent. Hundreds of queries perform well. Cache prevents duplicate requests. Background refetching keeps data fresh. Lazy queries load on demand. Large apps (Vercel, Toss) prove scale.

**Breaking Changes**: v3 → v4 → v5 each had breaking changes but migration guides clear. Framework adapters evolve with frameworks. Query key structure stable.

## AI-Assisted Development Considerations

### What Works Well with AI

**Explicit query identification**
- `queryKey: ['todos', filters]` makes it trivial to find all queries for a data type
- Can grep/search for query keys across codebase
- Easy to understand what data a component depends on

**Declarative patterns**
- Query declarations are self-documenting: "This component needs todos data"
- No imperative fetch logic to trace through
- Mutation effects are explicit in lifecycle hooks

**Consistent API surface**
- Every query follows same pattern: queryKey + queryFn
- Every mutation follows same pattern: mutationFn + lifecycle hooks
- Predictable structure makes it easy to generate new queries

**Co-located data requirements**
- Component declares its data needs right in the render function
- No need to trace through Redux actions/reducers/selectors
- Locality of behavior is excellent

**Type safety**
- Strong TypeScript inference means AI can understand data shapes
- Type errors guide correct usage
- Less runtime debugging needed

### What Creates Friction

**Cache invalidation strategies**
- Requires understanding data relationships to invalidate correctly
- Partial key matching can be too broad or too narrow
- Optimistic update rollback logic is complex

**Query key design decisions**
- No single "right" way to structure query keys
- Hierarchical key design impacts cache granularity
- AI needs to make architectural decisions

**Implicit behavior understanding**
- Automatic refetching on window focus can cause confusion
- Stale-while-revalidate model requires explaining to users
- Background refetch timing is not explicit in code

**Complex mutation flows**
- Optimistic updates with rollback require understanding whole lifecycle
- Coordinating multiple mutations and invalidations gets complex
- Race condition handling requires careful design

**Server vs client state boundary**
- Need to decide what goes in TanStack Query vs local state (useState/Jotai)
- Mixing state management approaches in one app
- No clear guidelines for edge cases

### Opportunities for Improvement

**More AI-friendly patterns:**

1. **Explicit refetch triggers**
   - Instead of implicit window focus refetching, explicit trigger declarations
   - `refetchOn: ['windowFocus', 'interval:5000']` is clearer than separate boolean options

2. **Query dependency graph**
   - Built-in visualization of which queries depend on which
   - Automated invalidation suggestions based on mutation type
   - "This mutation should probably invalidate these queries"

3. **Standardized query key conventions**
   - Official guidance on query key structure
   - TypeScript utilities for type-safe query keys
   - Automated query key generation from API schema

4. **Declarative cache invalidation**
   - Instead of imperative `invalidateQueries()` calls, declarative relationships
   ```typescript
   useMutation({
     mutationFn: createTodo,
     invalidates: [['todos']],  // Declarative
   })
   ```

5. **Optimistic update helpers**
   - Higher-level abstractions for common optimistic patterns
   - Less boilerplate for basic add/update/delete optimistic updates
   - Automated rollback logic

6. **Query composition primitives**
   - Better patterns for combining multiple queries
   - Built-in helpers for common derivations (joins, filters, aggregations)
   - More like Jotai's composable atoms

**What human-era constraints could be removed:**

- **Stale-while-revalidate complexity**: With AI assistance, could be more explicit about when refetching happens
- **Imperative cache manipulation**: Could be more declarative/reactive
- **Separate loading states**: The split between `isPending` and `isFetching` optimizes for human UX, could be simplified
- **Manual query key design**: Could be auto-generated from TypeScript API types

**Overall:**

TanStack Query is already well-designed for its domain (async server state). Its main friction points for AI are architectural decisions (query key design, invalidation strategies) rather than code-level complexity.

The library would benefit from more **declarative** patterns and **automated** cache invalidation strategies. The current model requires humans to carefully think about cache relationships - AI could potentially automate much of this with the right abstractions.

**For next-gen frameworks**: Consider making cache invalidation and data dependencies **even more explicit and declarative**, perhaps with auto-generation from API schemas or GraphQL types.
