---
name: XState
category: State Management Library
type: State Machine Library
docs_url: https://stately.ai/docs/xstate
github_url: https://github.com/statelyai/xstate
mcp_servers: null
implementation_language: TypeScript
reviewed_with_model: claude-sonnet-4-5-20250929
ai_friendliness_score: 7
---

# XState

## Philosophy & Mental Model

XState is **"actor-based state management & orchestration for complex app logic"** built on **finite state machines (FSMs)** and **statecharts**. Unlike Redux, Zustand, or MobX which manage "data state," XState manages **"behavior state"**—the states your application can be in and the transitions between them.

The philosophy is radical: **your application is a state machine**. At any moment, your app is in exactly one state (or combination of states), and events cause transitions between states. This eliminates impossible states and makes complex workflows explicit.

**Mental model**: Think of XState like a **flowchart that enforces itself**. Instead of:

```typescript
// Traditional: possible invalid states
const [loading, setLoading] = useState(false);
const [data, setData] = useState(null);
const [error, setError] = useState(null);

// Can be loading=true AND error set?
// Can have data AND loading simultaneously?
```

XState makes states **mutually exclusive**:

```typescript
// XState: impossible to be in two states
machine in 'idle' | 'loading' | 'success' | 'error'
// Never loading AND success at the same time
```

**Core principles:**

1. **Explicit States**: Define all possible states upfront (`'idle'`, `'loading'`, `'success'`, `'error'`)
2. **Deterministic Transitions**: Event X in State A always leads to State B
3. **Impossible States Eliminated**: Can't be `loading=true` and `data != null` simultaneously
4. **Visual Documentation**: State machines are graphical—use Stately Visualizer to see your logic
5. **Actor Model**: State machines are actors that communicate via events

XState is for applications with **complex workflows**: multi-step forms, authentication flows, game logic, async operations with retries, etc. If your state transitions are complex, XState makes them explicit and correct.

## State Management

### Core Primitives

**createMachine** defines states and transitions:

```typescript
import { createMachine, assign } from 'xstate';

const toggleMachine = createMachine({
  id: 'toggle',
  initial: 'inactive',
  states: {
    inactive: {
      on: {
        TOGGLE: 'active',
      },
    },
    active: {
      on: {
        TOGGLE: 'inactive',
      },
    },
  },
});
```

**States** are nodes in the graph. **Transitions** (via `on`) are edges triggered by events.

**Context** stores data:

```typescript
const counterMachine = createMachine({
  id: 'counter',
  initial: 'active',
  context: {
    count: 0,
  },
  states: {
    active: {
      on: {
        INCREMENT: {
          actions: assign({
            count: ({ context }) => context.count + 1,
          }),
        },
        DECREMENT: {
          actions: assign({
            count: ({ context }) => context.count - 1,
          }),
        },
      },
    },
  },
});
```

**setup** for TypeScript and reusable logic:

```typescript
import { setup, assign } from 'xstate';

const counterMachine = setup({
  types: {
    context: {} as { count: number },
    events: {} as { type: 'INCREMENT' } | { type: 'DECREMENT' },
  },
  actions: {
    increment: assign({
      count: ({ context }) => context.count + 1,
    }),
    decrement: assign({
      count: ({ context }) => context.count - 1,
    }),
  },
}).createMachine({
  id: 'counter',
  initial: 'active',
  context: { count: 0 },
  states: {
    active: {
      on: {
        INCREMENT: {
          actions: 'increment',
        },
        DECREMENT: {
          actions: 'decrement',
        },
      },
    },
  },
});
```

### Update Mechanism

**Events trigger transitions**:

```typescript
const machine = createMachine({
  initial: 'idle',
  states: {
    idle: {
      on: {
        FETCH: 'loading',
      },
    },
    loading: {
      on: {
        RESOLVE: 'success',
        REJECT: 'error',
      },
    },
    success: {},
    error: {
      on: {
        RETRY: 'loading',
      },
    },
  },
});

// Usage with actor
import { createActor } from 'xstate';

const actor = createActor(machine);
actor.start();

actor.send({ type: 'FETCH' }); // idle → loading
actor.send({ type: 'RESOLVE' }); // loading → success
```

**assign updates context**:

```typescript
const machine = createMachine({
  context: { count: 0, user: null },
  on: {
    INCREMENT: {
      actions: assign({
        count: ({ context }) => context.count + 1,
      }),
    },
    SET_USER: {
      actions: assign({
        user: ({ event }) => event.user,
      }),
    },
  },
});
```

### Read Pattern

**In React with useActor/useMachine**:

```typescript
import { useMachine } from '@xstate/react';

function Counter() {
  const [state, send] = useMachine(counterMachine);

  return (
    <div>
      <p>Count: {state.context.count}</p>
      <button onClick={() => send({ type: 'INCREMENT' })}>+</button>
      <button onClick={() => send({ type: 'DECREMENT' })}>-</button>
    </div>
  );
}
```

**Check current state**:

```typescript
const [state, send] = useMachine(machine);

console.log(state.value); // 'loading' | 'success' | 'error'
console.log(state.context); // { count: 5, user: {...} }

if (state.matches('loading')) {
  return <Spinner />;
}

if (state.matches('error')) {
  return <Error message={state.context.error} />;
}
```

### Reactivity & Granularity

State machines are **deterministic**—same state + same event = same next state. This makes behavior 100% predictable.

**Hierarchical states** for composition:

```typescript
const machine = createMachine({
  initial: 'loggedOut',
  states: {
    loggedOut: {
      on: {
        LOGIN: 'loggedIn',
      },
    },
    loggedIn: {
      initial: 'idle',
      states: {
        idle: {
          on: {
            FETCH_PROFILE: 'loading',
          },
        },
        loading: {
          on: {
            RESOLVE: 'success',
            REJECT: 'error',
          },
        },
        success: {},
        error: {},
      },
      on: {
        LOGOUT: 'loggedOut',
      },
    },
  },
});
```

`loggedIn` has nested states. `LOGOUT` transitions from ANY nested state to `loggedOut`.

**Parallel states** for concurrent state:

```typescript
const machine = createMachine({
  type: 'parallel',
  states: {
    audio: {
      initial: 'playing',
      states: {
        playing: {
          on: { PAUSE_AUDIO: 'paused' },
        },
        paused: {
          on: { PLAY_AUDIO: 'playing' },
        },
      },
    },
    video: {
      initial: 'playing',
      states: {
        playing: {
          on: { PAUSE_VIDEO: 'paused' },
        },
        paused: {
          on: { PLAY_VIDEO: 'playing' },
        },
      },
    },
  },
});
```

Audio and video states are independent—both can be playing, both paused, or mixed.

### Async Handling

**invoke for async operations**:

```typescript
const machine = createMachine({
  initial: 'idle',
  states: {
    idle: {
      on: {
        FETCH: 'loading',
      },
    },
    loading: {
      invoke: {
        src: 'fetchUser',
        onDone: {
          target: 'success',
          actions: assign({
            user: ({ event }) => event.output,
          }),
        },
        onError: {
          target: 'error',
          actions: assign({
            error: ({ event }) => event.error,
          }),
        },
      },
    },
    success: {},
    error: {
      on: {
        RETRY: 'loading',
      },
    },
  },
});

const actor = createActor(machine, {
  actors: {
    fetchUser: fromPromise(async () => {
      const res = await fetch('/api/user');
      return res.json();
    }),
  },
});
```

`invoke` starts an async operation when entering a state. `onDone`/`onError` handle results.

**Actors for long-running processes**:

```typescript
import { fromPromise, createActor } from 'xstate';

const fetchMachine = fromPromise(async ({ input }) => {
  const response = await fetch(`/api/${input.id}`);
  return response.json();
});

const parentMachine = createMachine({
  initial: 'fetching',
  states: {
    fetching: {
      invoke: {
        src: fetchMachine,
        input: { id: 123 },
        onDone: {
          target: 'success',
          actions: assign({ data: ({ event }) => event.output }),
        },
      },
    },
    success: {},
  },
});
```

### Derived State

**Computed via context and state**:

```typescript
const [state, send] = useMachine(machine);

// Derived from context
const total = state.context.items.reduce((sum, item) => sum + item.price, 0);

// Derived from state value
const isLoading = state.matches('loading');
const hasError = state.matches('error');
const canRetry = state.can({ type: 'RETRY' });
```

**Guards for conditional transitions**:

```typescript
const machine = createMachine({
  initial: 'form',
  context: { attempts: 0 },
  states: {
    form: {
      on: {
        SUBMIT: [
          {
            guard: ({ context }) => context.attempts < 3,
            target: 'submitting',
          },
          {
            target: 'blocked',
          },
        ],
      },
    },
    submitting: {},
    blocked: {},
  },
});
```

First matching guard wins. If `attempts < 3`, go to `submitting`, else `blocked`.

## Rendering

XState is **state-only**—rendering is handled by React (or other frameworks):

```typescript
import { useMachine } from '@xstate/react';

function TrafficLight() {
  const [state, send] = useMachine(trafficLightMachine);

  return (
    <div>
      <div
        style={{
          backgroundColor:
            state.matches('green') ? 'green' :
            state.matches('yellow') ? 'yellow' :
            'red',
        }}
      />
      <button onClick={() => send({ type: 'TIMER' })}>Next</button>
    </div>
  );
}
```

## Event Handling

**Send events** to trigger transitions:

```typescript
const [state, send] = useMachine(machine);

<button onClick={() => send({ type: 'INCREMENT' })}>+</button>
<button onClick={() => send({ type: 'DECREMENT' })}>-</button>

// With payload
<button onClick={() => send({ type: 'SET_COUNT', value: 10 })}>Set to 10</button>
```

**Delayed transitions**:

```typescript
const machine = createMachine({
  initial: 'idle',
  states: {
    idle: {
      on: {
        SUBMIT: 'submitting',
      },
    },
    submitting: {
      after: {
        3000: 'timeout', // Auto-transition after 3 seconds
      },
      on: {
        SUCCESS: 'success',
      },
    },
    timeout: {},
    success: {},
  },
});
```

**Event wildcards**:

```typescript
on: {
  '*': 'error', // Catch-all for unhandled events
}
```

## Reuse Patterns

### setup for Reusable Machines

```typescript
import { setup } from 'xstate';

const fetchMachine = setup({
  types: {
    context: {} as { url: string; data: any },
    input: {} as { url: string },
  },
  actors: {
    fetchData: fromPromise(async ({ input }) => {
      const res = await fetch(input.url);
      return res.json();
    }),
  },
}).createMachine({
  initial: 'idle',
  context: ({ input }) => ({
    url: input.url,
    data: null,
  }),
  states: {
    idle: {
      on: { FETCH: 'loading' },
    },
    loading: {
      invoke: {
        src: 'fetchData',
        input: ({ context }) => ({ url: context.url }),
        onDone: {
          target: 'success',
          actions: assign({ data: ({ event }) => event.output }),
        },
      },
    },
    success: {},
  },
});

// Reuse with different URLs
const usersMachine = fetchMachine.provide({ input: { url: '/api/users' } });
const postsMachine = fetchMachine.provide({ input: { url: '/api/posts' } });
```

### Actor Model for Communication

```typescript
const parentMachine = createMachine({
  initial: 'active',
  states: {
    active: {
      invoke: {
        id: 'child',
        src: childMachine,
      },
      on: {
        NOTIFY_CHILD: {
          actions: sendTo('child', { type: 'CHILD_EVENT' }),
        },
      },
    },
  },
});
```

Parent sends events to child actor via `sendTo`.

### Visualizer & Stately Studio

XState machines are **visual**—use the Stately Visualizer (stately.ai/viz) to see state graphs:

```typescript
// Define machine
const machine = createMachine({
  initial: 'green',
  states: {
    green: {
      on: { TIMER: 'yellow' },
    },
    yellow: {
      on: { TIMER: 'red' },
    },
    red: {
      on: { TIMER: 'green' },
    },
  },
});

// Paste into visualizer → see state diagram
```

Visual representation documents your logic better than code comments.

## Developer Experience

### Learning Curve

**Steep**. XState requires understanding:
- Finite state machines
- Statecharts (hierarchical/parallel states)
- Actor model
- Event-driven architecture

Concepts are unfamiliar to developers used to imperative state management.

### Tooling

**Stately Studio**: Visual editor for state machines (stately.ai/editor)

**VS Code Extension**: XState VSCode extension provides autocomplete and visualization

**TypeScript**: First-class support with full type inference

```typescript
const machine = setup({
  types: {
    context: {} as { count: number },
    events: {} as { type: 'INC' } | { type: 'DEC' },
  },
}).createMachine({
  context: { count: 0 },
  // TypeScript knows context and events
});
```

**Testing**:

```typescript
import { createActor } from 'xstate';

test('counter increments', () => {
  const actor = createActor(counterMachine);
  actor.start();

  actor.send({ type: 'INCREMENT' });
  expect(actor.getSnapshot().context.count).toBe(1);
});
```

### Boilerplate

**Moderate to high**. A simple toggle:

```typescript
const toggleMachine = createMachine({
  id: 'toggle',
  initial: 'inactive',
  states: {
    inactive: {
      on: { TOGGLE: 'active' },
    },
    active: {
      on: { TOGGLE: 'inactive' },
    },
  },
});
```

More verbose than `const [active, setActive] = useState(false)`, but eliminates bugs.

### Common Patterns

**Login flow**:

```typescript
const authMachine = createMachine({
  initial: 'loggedOut',
  states: {
    loggedOut: {
      on: {
        LOGIN: 'loggingIn',
      },
    },
    loggingIn: {
      invoke: {
        src: 'authenticate',
        onDone: 'loggedIn',
        onError: 'loginError',
      },
    },
    loginError: {
      on: {
        RETRY: 'loggingIn',
        CANCEL: 'loggedOut',
      },
    },
    loggedIn: {
      on: {
        LOGOUT: 'loggedOut',
      },
    },
  },
});
```

**Form wizard**:

```typescript
const wizardMachine = createMachine({
  initial: 'step1',
  context: { formData: {} },
  states: {
    step1: {
      on: {
        NEXT: {
          target: 'step2',
          actions: assign({
            formData: ({ context, event }) => ({
              ...context.formData,
              ...event.data,
            }),
          }),
        },
      },
    },
    step2: {
      on: {
        NEXT: 'step3',
        BACK: 'step1',
      },
    },
    step3: {
      on: {
        SUBMIT: 'submitting',
        BACK: 'step2',
      },
    },
    submitting: {
      invoke: {
        src: 'submitForm',
        onDone: 'success',
        onError: 'error',
      },
    },
    success: {},
    error: {},
  },
});
```

### Documentation

**Excellent**. stately.ai/docs has:
- Conceptual guides on FSMs and statecharts
- API reference
- Framework integration guides (React, Vue, Svelte)
- Examples and patterns
- Video tutorials

### State Reusability Assessment

**Quality: Excellent (9/10)**

**Strengths**: State machines are pure logic - completely framework-agnostic. Can export machines as npm packages and use in React, Vue, Svelte, or Node.js. Actors can be composed and spawned. Visual editor generates shareable machine definitions. JSON format for machines enables cross-language portability.

**Weaknesses**: Framework integration code (hooks, context) not reusable across frameworks. Spawned actors require careful lifecycle management. Large machines can become difficult to split without losing coherence.

**Cross-Project Reuse**: Excellent. Machines defined once work everywhere. Common patterns (authentication, forms, wizards) highly reusable. Actor model enables microservices-style composition.

**Design System Support**: Logic layer only - pairs well with any UI component library. Machines describe behavior that UI implements.

## Maintainability

**Quality: Excellent (9/10)**

**Strengths**: Visualizer shows all states and transitions at a glance. Impossible states become impossible. Type-safe events and context with TypeScript. Refactoring means moving boxes in visual editor. State changes are explicit and traceable. Testing is straightforward - send events, assert state.

**Weaknesses**: Learning curve for statecharts concepts. Large machines can become cluttered (mitigated by spawning actors). Migration between XState versions can require significant refactoring. Not all developers familiar with FSM/statechart paradigm.

**Code Organization**: Machines in separate files, imported where needed. Actor model encourages logical decomposition. Guards and actions can be extracted and tested independently.

**Testing**: Excellent. Machines are deterministic - same events produce same state transitions. Can test all paths through machine. `@xstate/test` generates test cases from machine definition.

**Debugging**: Visual inspector shows current state and event history. DevTools integration. Logging service for production debugging.

**Scalability**: Actor model scales well - spawn machines as needed. Parallel states for concurrent behavior. Hierarchical states prevent combinatorial explosion.

**Breaking Changes**: Major versions (v4 → v5) introduce significant API changes. Migration guides provided but refactoring required.

## AI-Friendly Assessment

**Overall Score: 7/10**

### Strengths for AI-Assisted Development

**Extreme Explicitness**: Every possible state and transition is defined:

```typescript
states: {
  idle: { on: { FETCH: 'loading' } },
  loading: { on: { RESOLVE: 'success', REJECT: 'error' } },
  success: {},
  error: { on: { RETRY: 'loading' } },
}
```

AI can see all paths through the application.

**Deterministic Behavior**: Same state + same event = same result. No hidden side effects or race conditions.

**Visual Documentation**: State machines are graphs. AI can generate machines that humans can visualize at stately.ai/viz.

**TypeScript-First**: Full type safety:

```typescript
setup({
  types: {
    context: {} as { count: number },
    events: {} as { type: 'INC' } | { type: 'DEC' },
  },
});
```

AI knows exactly what events and context are allowed.

**Testability**: States and transitions are pure—easy to test:

```typescript
expect(machine.transition('idle', { type: 'FETCH' }).value).toBe('loading');
```

**Impossible States Eliminated**: Can't have contradictory states:

```typescript
// Can NEVER be both loading and success
state.value === 'loading' | 'success' | 'error'
```

AI doesn't need to worry about invalid combinations.

**Actor Model Clarity**: Each machine is an independent actor. Clear boundaries between concerns.

### Weaknesses for AI-Assisted Development

**Complex Paradigm**: State machines are conceptually different from imperative programming. AI must understand FSMs, statecharts, and actor model—high cognitive load.

**Verbose Configuration**: Even simple logic requires substantial boilerplate:

```typescript
// XState: 15 lines
const machine = createMachine({
  initial: 'off',
  states: {
    off: {
      on: { TOGGLE: 'on' },
    },
    on: {
      on: { TOGGLE: 'off' },
    },
  },
});

// Zustand: 3 lines
const useStore = create((set) => ({
  on: false,
  toggle: () => set((state) => ({ on: !state.on })),
}));
```

AI must generate more code for equivalent functionality.

**Nested Object Complexity**: Machine definitions are deeply nested objects:

```typescript
{
  states: {
    loggedIn: {
      initial: 'idle',
      states: {
        idle: {
          on: {
            FETCH: {
              target: 'loading',
              actions: assign({...}),
            },
          },
        },
      },
    },
  },
}
```

AI must maintain correct nesting and structure.

**Setup vs CreateMachine**: Two APIs with different purposes:

```typescript
setup({...}).createMachine({...}) // vs.
createMachine({...})
```

AI must know when to use which.

**String-Based Event Types**: Events are string types, not type-safe functions:

```typescript
send({ type: 'INCREMETN' }); // Typo won't error without TS types
```

Less type-safe than function calls.

**Invoke Complexity**: Async handling with invoke/actors is complex:

```typescript
invoke: {
  src: 'fetchUser',
  input: ({ context }) => ({ id: context.userId }),
  onDone: { target: 'success', actions: assign({...}) },
  onError: { target: 'error' },
}
```

More complex than simple async/await.

**Learning Curve for Domain**: AI must understand when to use XState vs. simpler solutions. Not every app needs state machines.

### Why 7/10?

XState scores moderately because:
- **Explicit state modeling** - All states and transitions visible
- **Deterministic** - Predictable behavior
- **Type-safe** - Full TypeScript support
- **Visual** - State diagrams document logic
- **Testable** - Pure functions easy to test

The 3-point deduction is for:
- **Complexity** - FSM paradigm requires understanding
- **Verbosity** - More code than imperative alternatives
- **Nested objects** - Deep configuration structures
- **Async complexity** - Invoke/actors are non-trivial
- **Use case specificity** - Overkill for simple state

For **complex workflows** (multi-step forms, authentication, game logic), XState is highly AI-friendly due to its explicitness. For **simple state**, it's overkill—Zustand or useState is more AI-friendly.

---

**Key Insight for Next-Gen Framework Design**: XState demonstrates that **explicit state modeling** can eliminate entire classes of bugs. Impossible states become impossible, not just unlikely. This is powerful for correctness.

However, XState also shows that **formalism has costs**. The FSM paradigm requires upfront design and verbose configuration. Most apps don't need this level of rigor.

**Future frameworks should offer state machine primitives as opt-in tools**, not core requirements. For 90% of state, use simple reactive stores (Zustand). For complex workflows, upgrade to state machines (XState). Don't force FSMs on everyone.

The **visual representation** is brilliant—state machines are naturally graphical. Future frameworks should embrace **visual tooling** for understanding and designing complex logic.

**Actor model** (independent machines communicating via events) is underutilized in frontend. It solves composition and isolation problems elegantly. Future frameworks should explore actors more.

For next-gen frameworks: **provide state machine utilities** (like React's useReducer but more powerful) for complex state, while keeping simple state simple. XState as a library, not a requirement.
