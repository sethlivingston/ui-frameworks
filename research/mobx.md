---
name: "MobX"
category: "state-library"
github_url: "https://github.com/mobxjs/mobx"
docs_url: "https://mobx.js.org"
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

# MobX

## Philosophy & Mental Model

MobX is **"simple, scalable state management"** through **transparent functional reactive programming (TFRP)**. It's the philosophical opposite of Redux: instead of immutable updates and explicit actions, MobX embraces **mutable state with automatic tracking**.

The tagline is: **"Anything that can be derived from application state should be, automatically."** MobX makes state observable, then automatically tracks which computations depend on that state. When state changes, MobX knows exactly what to update—no manual dependency arrays, no memoization hooks, no reducers.

**Mental model**: Think of MobX as **"spreadsheet reactivity for JavaScript."** In a spreadsheet, when cell A1 changes, formulas referencing A1 automatically recalculate. MobX brings this to your application:

```typescript
// State (like A1, B1)
const store = observable({
  price: 10,
  quantity: 2,
});

// Derived (like "=A1*B1")
const total = computed(() => store.price * store.quantity);

// Side effect (like conditional formatting)
autorun(() => console.log('Total:', total.get()));
```

Change `store.price = 15`, and everything updates automatically.

**Core principles:**

1. **Mutable State**: Update state directly (`user.name = 'Alice'`), not via immutable patterns
2. **Automatic Tracking**: MobX tracks what you read during execution, subscribes automatically
3. **Minimal Boilerplate**: No actions (optional), no reducers, no providers—just observables
4. **Fine-Grained Reactivity**: Only components using changed data re-render
5. **Synchronous Updates**: State changes propagate immediately, predictably

MobX is for developers who find Redux's immutability and boilerplate tedious but want more structure than React's useState.

## State Management

### Core Primitives

**makeAutoObservable** (modern, recommended):

```typescript
import { makeAutoObservable } from 'mobx';

class TodoStore {
  todos: Todo[] = [];
  filter: 'all' | 'active' | 'completed' = 'all';

  constructor() {
    makeAutoObservable(this); // Automatically makes everything observable/action
  }

  addTodo(title: string) {
    this.todos.push({ id: Date.now(), title, completed: false });
  }

  toggleTodo(id: number) {
    const todo = this.todos.find((t) => t.id === id);
    if (todo) todo.completed = !todo.completed;
  }

  get activeTodos() {
    return this.todos.filter((t) => !t.completed);
  }

  get completedTodos() {
    return this.todos.filter((t) => t.completed);
  }

  get filteredTodos() {
    switch (this.filter) {
      case 'active':
        return this.activeTodos;
      case 'completed':
        return this.completedTodos;
      default:
        return this.todos;
    }
  }
}

const todoStore = new TodoStore();
export default todoStore;
```

**makeObservable** (explicit annotations):

```typescript
import { makeObservable, observable, action, computed } from 'mobx';

class CounterStore {
  count = 0;

  constructor() {
    makeObservable(this, {
      count: observable,
      increment: action,
      decrement: action,
      doubled: computed,
    });
  }

  increment() {
    this.count++;
  }

  decrement() {
    this.count--;
  }

  get doubled() {
    return this.count * 2;
  }
}
```

**Decorators** (optional, requires TypeScript configuration):

```typescript
import { observable, action, computed } from 'mobx';

class TimerStore {
  @observable accessor secondsPassed = 0;

  @action
  increase() {
    this.secondsPassed++;
  }

  @computed
  get minutes() {
    return Math.floor(this.secondsPassed / 60);
  }
}
```

### Update Mechanism

**Direct mutation** (MobX tracks changes automatically):

```typescript
// Simple assignment
store.count = 10;

// Array mutation
store.todos.push(newTodo);
store.todos[0].completed = true;

// Object mutation
store.user.name = 'Alice';
store.user.age++;
```

**Actions** (optional but recommended for batching):

```typescript
class Store {
  count = 0;
  name = '';

  constructor() {
    makeAutoObservable(this);
  }

  // Action batches multiple mutations
  reset() {
    this.count = 0;
    this.name = '';
    // Only triggers one re-render, not two
  }
}
```

Actions batch updates—multiple mutations inside an action trigger only one reaction.

**runInAction** for inline actions:

```typescript
import { runInAction } from 'mobx';

async function fetchUsers() {
  const response = await fetch('/api/users');
  const users = await response.json();

  runInAction(() => {
    store.users = users;
    store.loading = false;
  });
}
```

### Read Pattern

**In React components** (with observer):

```typescript
import { observer } from 'mobx-react-lite';

const TodoList = observer(() => {
  return (
    <ul>
      {todoStore.filteredTodos.map((todo) => (
        <li key={todo.id}>
          {todo.title}
          <button onClick={() => todoStore.toggleTodo(todo.id)}>Toggle</button>
        </li>
      ))}
    </ul>
  );
});
```

The `observer` HOC makes components reactive—they automatically re-render when observed state changes.

**Outside React** (with autorun/reaction):

```typescript
import { autorun, reaction } from 'mobx';

// Runs immediately and whenever dependencies change
autorun(() => {
  console.log('Active todos:', todoStore.activeTodos.length);
});

// Runs only when specific data changes
reaction(
  () => todoStore.todos.length, // Tracked function
  (length) => {
    console.log('Todo count changed:', length);
  }
);
```

### Reactivity & Granularity

MobX provides **automatic, fine-grained reactivity**:

```typescript
const TodoItem = observer(({ todo }) => {
  console.log('Rendering:', todo.title);

  return (
    <li>
      {todo.title}
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => (todo.completed = !todo.completed)}
      />
    </li>
  );
});
```

When `todo.completed` changes, **only that specific TodoItem re-renders**, not the entire list. MobX tracks at the property level.

**Computed values** are automatically memoized:

```typescript
class Store {
  todos = [];

  constructor() {
    makeAutoObservable(this);
  }

  get completedCount() {
    console.log('Computing completed count...');
    return this.todos.filter((t) => t.completed).length;
  }
}
```

`completedCount` only recomputes when `todos` or `completed` values change, never unnecessarily.

### Async Handling

**Async actions** with runInAction:

```typescript
class UserStore {
  users = [];
  loading = false;
  error = null;

  constructor() {
    makeAutoObservable(this);
  }

  async fetchUsers() {
    this.loading = true;
    this.error = null;

    try {
      const response = await fetch('/api/users');
      const users = await response.json();

      runInAction(() => {
        this.users = users;
        this.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error.message;
        this.loading = false;
      });
    }
  }
}
```

**flow** (async action helper):

```typescript
import { flow } from 'mobx';

class UserStore {
  users = [];

  constructor() {
    makeAutoObservable(this, {
      fetchUsers: flow,
    });
  }

  *fetchUsers() {
    this.loading = true;
    try {
      const response = yield fetch('/api/users');
      this.users = yield response.json();
      this.loading = false;
    } catch (error) {
      this.error = error;
      this.loading = false;
    }
  }
}
```

`flow` uses generators to handle async code without `runInAction`.

### Derived State

**Computed values** (automatic memoization):

```typescript
class CartStore {
  items = [];

  constructor() {
    makeAutoObservable(this);
  }

  get subtotal() {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  get tax() {
    return this.subtotal * 0.08;
  }

  get total() {
    return this.subtotal + this.tax;
  }
}
```

Computed values form a **dependency graph**—`total` depends on `tax` and `subtotal`, which depend on `items`. MobX automatically tracks these relationships.

**Computed with arguments** (functions):

```typescript
class Store {
  users = [];

  constructor() {
    makeAutoObservable(this);
  }

  getUserById(id) {
    return this.users.find((u) => u.id === id);
  }
}
```

For parameterized queries, use regular functions (not computed).

## Rendering

MobX is **state-only**—rendering is handled by React (or other frameworks):

```typescript
import { observer } from 'mobx-react-lite';

const Counter = observer(() => {
  return (
    <div>
      <h1>{counterStore.count}</h1>
      <button onClick={() => counterStore.increment()}>+</button>
      <button onClick={() => counterStore.decrement()}>-</button>
    </div>
  );
});
```

The `observer` wrapper makes components reactive to observable state changes.

## Event Handling

**Direct method calls**:

```typescript
const TodoInput = observer(() => {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    todoStore.addTodo(text); // Direct method call
    setText('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <button type="submit">Add</button>
    </form>
  );
});
```

**Inline mutations**:

```typescript
<button onClick={() => (store.count += 1)}>Increment</button>
<input onChange={(e) => (store.query = e.target.value)} />
```

Direct mutations work because MobX tracks changes automatically.

## Reuse Patterns

### Multiple Stores

```typescript
// userStore.ts
class UserStore {
  users = [];
  constructor() {
    makeAutoObservable(this);
  }
}
export const userStore = new UserStore();

// todoStore.ts
class TodoStore {
  todos = [];
  constructor() {
    makeAutoObservable(this);
  }
}
export const todoStore = new TodoStore();

// Usage
import { userStore } from './userStore';
import { todoStore } from './todoStore';

const Dashboard = observer(() => (
  <div>
    <p>Users: {userStore.users.length}</p>
    <p>Todos: {todoStore.todos.length}</p>
  </div>
));
```

### Root Store Pattern

Combine stores:

```typescript
class RootStore {
  userStore: UserStore;
  todoStore: TodoStore;

  constructor() {
    this.userStore = new UserStore(this);
    this.todoStore = new TodoStore(this);
  }
}

const rootStore = new RootStore();
export default rootStore;

// Usage
import rootStore from './rootStore';

const App = observer(() => (
  <div>
    <p>{rootStore.userStore.users.length} users</p>
    <p>{rootStore.todoStore.todos.length} todos</p>
  </div>
));
```

### React Context (for DI)

```typescript
import { createContext, useContext } from 'react';

const StoreContext = createContext(null);

export const StoreProvider = ({ children }) => {
  const store = new RootStore();
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
};

export const useStore = () => {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used within StoreProvider');
  return store;
};

// Usage
const TodoList = observer(() => {
  const { todoStore } = useStore();
  return <ul>{todoStore.todos.map(/* ... */)}</ul>;
});
```

### mobx-state-tree (MST)

Opinionated MobX library with runtime type checking:

```typescript
import { types } from 'mobx-state-tree';

const Todo = types.model({
  id: types.identifier,
  title: types.string,
  completed: types.boolean,
}).actions((self) => ({
  toggle() {
    self.completed = !self.completed;
  },
}));

const TodoStore = types.model({
  todos: types.array(Todo),
}).actions((self) => ({
  addTodo(title) {
    self.todos.push({ id: Date.now().toString(), title, completed: false });
  },
}));
```

MST adds structure and validation to MobX.

## Developer Experience

### Learning Curve

**Low to moderate**. Core concepts are intuitive:
- Make state observable
- Use `observer` wrapper
- Mutate state directly

More complex features (reactions, flows, computed) require deeper understanding.

### Tooling

**MobX DevTools**: Browser extension for inspecting observable state and tracking dependencies

**TypeScript**: Full support with excellent type inference

```typescript
class Store {
  count = 0; // TypeScript infers number

  constructor() {
    makeAutoObservable(this);
  }

  increment() {
    this.count++; // Type-safe
  }
}
```

**Testing**:

```typescript
import { when } from 'mobx';

test('async loading', async () => {
  const store = new UserStore();
  store.fetchUsers();

  // Wait for loading to finish
  await when(() => !store.loading);

  expect(store.users.length).toBeGreaterThan(0);
});
```

### Boilerplate

**Minimal**. A complete store:

```typescript
class CounterStore {
  count = 0;

  constructor() {
    makeAutoObservable(this);
  }

  increment() {
    this.count++;
  }
}

const store = new CounterStore();
```

Compared to Redux (~40 lines), MobX is ~10 lines.

### Common Patterns

**Loading states**:

```typescript
class Store {
  data = null;
  state = 'pending'; // 'pending' | 'done' | 'error'

  constructor() {
    makeAutoObservable(this);
  }

  async fetch() {
    this.state = 'pending';
    try {
      this.data = await fetchData();
      this.state = 'done';
    } catch {
      this.state = 'error';
    }
  }
}
```

**Optimistic updates**:

```typescript
async addTodo(title) {
  const tempId = Date.now();
  const tempTodo = { id: tempId, title, synced: false };

  this.todos.push(tempTodo);

  try {
    const saved = await api.create(title);
    const index = this.todos.findIndex((t) => t.id === tempId);
    this.todos[index] = saved;
  } catch {
    this.todos = this.todos.filter((t) => t.id !== tempId);
  }
}
```

**Undo/redo** (with mobx-state-tree):

```typescript
import { TimeTraveller } from 'mst-middlewares';

const timetraveller = TimeTraveller.create({}, { targetStore: store });

timetraveller.undo();
timetraveller.redo();
```

### Documentation

**Good**. mobx.js.org has:
- Conceptual guides
- API reference
- React integration docs
- Best practices
- Migration guides

### State Reusability Assessment

**Quality: Good (7.5/10)**

**Strengths**: Stores are classes, easily packageable. Observables work across React/Vue/Angular. Automatic reactivity makes composed stores simple.

**Weaknesses**: Class-based approach less common in modern JS. Decorators require build config. Implicit reactivity harder to trace than explicit subscriptions.

**Cross-Project Reuse**: Good via npm packages. MobX stores work in any framework with MobX adapters.

## Maintainability

**Quality: Good (7.5/10)**

**Strengths**: Mutable code easier to read. DevTools for inspection. TypeScript support. Automatic dependency tracking prevents stale subscriptions.

**Weaknesses**: Magic reactions hard to debug. `makeObservable` vs `makeAutoObservable` confusion. Memory leaks if reactions not disposed. Class patterns less familiar to newer developers.

**Testing**: Easy to test - stores are classes with methods. Reactions can be tested independently.

## AI-Friendly Assessment

**Overall Score: 7.5/10**

### Strengths for AI-Assisted Development

**Mutable Simplicity**: Direct mutations are easier to read and write:

```typescript
store.count++; // vs. set(state => ({ count: state.count + 1 }))
user.name = 'Alice'; // vs. setUser({ ...user, name: 'Alice' })
```

AI can generate straightforward imperative code.

**Automatic Tracking**: No manual dependency arrays:

```typescript
// MobX: automatic
const total = computed(() => price * quantity);

// React: manual dependencies
const total = useMemo(() => price * quantity, [price, quantity]);
```

AI doesn't need to track what depends on what—MobX handles it.

**TypeScript Integration**: Full type safety with inference:

```typescript
class Store {
  count = 0; // Inferred as number

  constructor() {
    makeAutoObservable(this);
  }

  increment() {
    this.count++; // Type-safe
  }
}
```

AI gets autocomplete and type checking.

**Class-Based Structure**: Familiar OOP patterns:

```typescript
class UserStore {
  users = [];

  addUser(user) {
    this.users.push(user);
  }
}
```

AI trained on OOP can generate MobX stores easily.

**Fine-Grained Reactivity**: Components only re-render when observed data changes. AI doesn't need to optimize manually.

**Minimal Boilerplate**: ~10 lines for a store vs. ~40 for Redux. Less for AI to generate.

**Explicit Actions** (when used):

```typescript
addTodo(title) {
  this.todos.push({ title });
}
```

Action names document intent, like Redux.

### Weaknesses for AI-Assisted Development

**Implicit Reactivity**: The automatic tracking is "magic":

```typescript
autorun(() => {
  console.log(store.count); // Implicitly subscribes to count
});
```

AI can't easily trace _why_ this reruns—it's implicit, not explicit.

**Mutable State Debugging**: Mutations can happen anywhere:

```typescript
user.name = 'Alice'; // Who called this? When? Why?
```

Harder to trace than explicit Redux actions with timestamps.

**Observer Wrapper Required**: Easy to forget:

```typescript
// ❌ Won't update
const Counter = () => <h1>{store.count}</h1>;

// ✅ Updates
const Counter = observer(() => <h1>{store.count}</h1>);
```

AI must remember to wrap components, or they won't be reactive.

**Decorator Confusion**: Decorators require specific TypeScript config:

```typescript
@observable accessor count = 0;
```

AI must understand decorator syntax and config requirements.

**makeObservable vs makeAutoObservable**: Two similar APIs with subtle differences:

```typescript
makeObservable(this, { count: observable }); // Explicit
makeAutoObservable(this); // Automatic
```

AI must choose correctly for each use case.

**No Centralized State**: Multiple stores mean no single source of truth:

```typescript
import { userStore } from './userStore';
import { todoStore } from './todoStore';
```

AI can't inspect "the store"—must track multiple imports.

**Computed vs Functions**: Computed for reactive, functions for non-reactive:

```typescript
get total() { /* reactive */ }
calculateTotal() { /* not reactive */ }
```

AI must understand when to use which.

**flow Syntax**: Generator-based async is unusual:

```typescript
*fetchUsers() {
  const data = yield fetch('/api/users');
  this.users = yield data.json();
}
```

Generators are less common than async/await.

### Why 7.5/10?

MobX scores well because:
- **Mutable simplicity** - Easy imperative code
- **Automatic tracking** - No manual dependencies
- **TypeScript support** - Full type safety
- **Minimal boilerplate** - Less code than Redux
- **Class-based** - Familiar OOP patterns

The 2.5-point deduction is for:
- **Implicit reactivity** - Hard to trace what triggers updates
- **Observer requirement** - Easy to forget
- **Multiple stores** - No centralized state
- **Decorator complexity** - Config overhead
- **Mutable debugging** - Mutations less traceable than actions

For **medium-sized apps with complex UIs**, MobX is highly AI-friendly. The mutable API and automatic tracking reduce cognitive load. For **large apps needing strict conventions**, Redux's explicitness is more AI-friendly. For **small apps**, Zustand is simpler.

---

**Key Insight for Next-Gen Framework Design**: MobX demonstrates that **mutable state with automatic tracking** can be simpler than immutable updates with manual dependencies. The "spreadsheet model" is intuitive: change a cell, dependent formulas update automatically.

However, MobX also shows the **danger of implicit behavior**. When AI (or humans) can't easily trace why something updated, debugging becomes harder. Future frameworks should balance **automatic tracking** (good for DX) with **explicit traceability** (good for debugging).

The **class-based approach** works well for organizing state into logical units. But it feels dated compared to functional approaches. Future frameworks might use **functional reactive programming** without classes.

**Fine-grained reactivity** (only update components using changed data) should be standard. MobX's performance benefits come from this, and it should be a core feature of any state management solution.

For next-gen frameworks: **combine MobX's automatic tracking with Zustand's functional API**. No classes, no decorators, just reactive primitives that auto-track dependencies. The simplicity of Zustand with the power of MobX.
