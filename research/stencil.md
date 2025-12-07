---
name: "Stencil"
category: "web-components-compiler"
github_url: "https://github.com/ionic/stencil"
docs_url: "https://stenciljs.com"
implementation_language: "TypeScript"
status: "active"
ai_friendliness_score: 7.5
reusability_score: 9.5
maintainability_score: 8.5
capabilities:
  state_management: false
  rendering: false
  event_handling: false
---

# Stencil

## Philosophy & Mental Model

Stencil is **"a compiler that generates Web Components"**—specifically, standards-compliant Custom Elements. Created by the Ionic Framework team to build performant, reusable component libraries.

**Mental model**: **Compiler, not framework**. Stencil takes TypeScript + JSX and compiles to vanilla Web Components with a tiny runtime. It's a build-time tool that outputs framework-agnostic components.

**Core principles:**

1. **Compiler-First** - Components compile to optimized Web Components
2. **Standards-Based** - Outputs standard Custom Elements, Shadow DOM, slots
3. **Framework-Agnostic** - Works with React, Vue, Angular, or vanilla JS
4. **TypeScript + JSX** - Familiar syntax from React/Angular ecosystems
5. **Performance-Focused** - Virtual DOM, lazy loading, async rendering

**Key insight**: Stencil is **not** a runtime framework like React or Vue. It's a compiler that transforms decorated TypeScript classes into Web Components. The output has minimal runtime overhead.

Stencil components are **just Web Components**, so they work anywhere—no framework lock-in.

## State Management

### Props (@Prop)

**Public properties** exposed as attributes:

```typescript
import { Component, Prop, h } from '@stencil/core';

@Component({
  tag: 'user-card',
  styleUrl: 'user-card.css',
  shadow: true
})
export class UserCard {
  @Prop() firstName: string;
  @Prop() lastName: string;

  render() {
    return <div>Hello, {this.firstName} {this.lastName}!</div>;
  }
}

// Usage
<user-card firstName="John" lastName="Doe"></user-card>
```

Props are **immutable** from the component's perspective. Parent controls values.

### State (@State)

**Internal reactive state**:

```typescript
import { Component, State, h } from '@stencil/core';

@Component({
  tag: 'my-counter'
})
export class Counter {
  @State() count: number = 0;

  increment() {
    this.count++;
  }

  render() {
    return (
      <div>
        <p>Count: {this.count}</p>
        <button onClick={() => this.increment()}>+</button>
      </div>
    );
  }
}
```

**Critical rule**: Must **reassign** state to trigger re-render:

```typescript
// ✅ Triggers re-render
this.count = 5;
this.count++;

// ✅ Triggers re-render (new array reference)
this.items = [...this.items, newItem];

// ❌ Does NOT trigger re-render (mutation without reassignment)
this.items.push(newItem);

// ✅ Fix: Reassign after mutation
this.items.push(newItem);
this.items = [...this.items];
```

Stencil uses **reference equality** to detect changes. Direct mutation doesn't trigger updates.

### Read Pattern

Access props and state directly:

```typescript
render() {
  return (
    <div>
      <p>Prop: {this.firstName}</p>
      <p>State: {this.count}</p>
    </div>
  );
}
```

### Update Pattern

**Props**: Parent component updates, Stencil re-renders child automatically.

**State**: Reassign to trigger update:

```typescript
@State() user: User;

updateUser() {
  // Must create new object
  this.user = { ...this.user, name: 'Alice' };
}
```

### Watch (@Watch)

React to prop/state changes:

```typescript
@Prop() value: string;

@Watch('value')
valueChanged(newValue: string, oldValue: string) {
  console.log(`Value changed from ${oldValue} to ${newValue}`);
}
```

### Async Handling

**componentWillLoad** for async initialization:

```typescript
@State() user: User;

async componentWillLoad() {
  const response = await fetch('/api/user');
  this.user = await response.json();
}

render() {
  if (!this.user) return <p>Loading...</p>;
  return <p>Hello, {this.user.name}!</p>;
}
```

**Async rendering** - `render()` can return Promise:

```typescript
async render() {
  const data = await fetchData();
  return <div>{data.value}</div>;
}
```

### Derived State

Use getters or methods:

```typescript
@State() items: CartItem[] = [];

get subtotal() {
  return this.items.reduce((sum, item) => sum + item.price * item.qty, 0);
}

get tax() {
  return this.subtotal * 0.08;
}

get total() {
  return this.subtotal + this.tax;
}

render() {
  return (
    <div>
      <p>Subtotal: ${this.subtotal.toFixed(2)}</p>
      <p>Tax: ${this.tax.toFixed(2)}</p>
      <p>Total: ${this.total.toFixed(2)}</p>
    </div>
  );
}
```

## Rendering

### Component Decorator

```typescript
import { Component, h } from '@stencil/core';

@Component({
  tag: 'my-component',        // Custom element name
  styleUrl: 'my-component.css', // Styles
  shadow: true,               // Enable Shadow DOM
  scoped: false               // Or scoped CSS (without Shadow DOM)
})
export class MyComponent {
  render() {
    return <div>Hello World</div>;
  }
}
```

### JSX Templating

**Standard JSX**:

```typescript
render() {
  return (
    <div class="container">
      <h1>Title</h1>
      <p>Content</p>
      <button onClick={() => this.handleClick()}>Click</button>
    </div>
  );
}
```

**Expressions**:

```typescript
render() {
  const name = 'Alice';
  const count = 42;

  return (
    <div>
      <p>{name}</p>
      <p>{count * 2}</p>
      <p>{this.computeValue()}</p>
    </div>
  );
}
```

### Conditional Rendering

**Ternary**:

```typescript
render() {
  return (
    <div>
      {this.isLoggedIn ? (
        <p>Welcome back!</p>
      ) : (
        <button onClick={() => this.login()}>Login</button>
      )}
    </div>
  );
}
```

**Inline if**:

```typescript
render() {
  return (
    <div>
      {this.error && <p class="error">{this.error}</p>}
    </div>
  );
}
```

### List Rendering

```typescript
@State() items: Item[] = [
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' }
];

render() {
  return (
    <ul>
      {this.items.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

### Slots

**Default slot**:

```typescript
// Card component
@Component({ tag: 'my-card' })
export class Card {
  render() {
    return (
      <div class="card">
        <slot />
      </div>
    );
  }
}

// Usage
<my-card>
  <p>This content goes in the slot</p>
</my-card>
```

**Named slots**:

```typescript
@Component({ tag: 'my-layout' })
export class Layout {
  render() {
    return (
      <div>
        <header>
          <slot name="header" />
        </header>
        <main>
          <slot />
        </main>
        <footer>
          <slot name="footer" />
        </footer>
      </div>
    );
  }
}

// Usage
<my-layout>
  <h1 slot="header">Title</h1>
  <p>Body content</p>
  <p slot="footer">Footer text</p>
</my-layout>
```

### Virtual DOM

Stencil uses a **virtual DOM** (like React) for efficient rendering:

1. `render()` returns JSX
2. Stencil creates virtual DOM tree
3. Diff against previous tree
4. Apply minimal DOM updates

No manual DOM manipulation needed.

## Event Handling

### Standard Events

```typescript
render() {
  return (
    <div>
      <button onClick={(e) => this.handleClick(e)}>Click</button>
      <input onInput={(e) => this.handleInput(e)} />
      <form onSubmit={(e) => this.handleSubmit(e)}>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

handleClick(event: MouseEvent) {
  console.log('Clicked!', event);
}

handleInput(event: Event) {
  const target = event.target as HTMLInputElement;
  console.log('Input value:', target.value);
}

handleSubmit(event: Event) {
  event.preventDefault();
  console.log('Form submitted');
}
```

### Custom Events (@Event)

**Emit events**:

```typescript
import { Component, Event, EventEmitter, h } from '@stencil/core';

@Component({ tag: 'todo-item' })
export class TodoItem {
  @Prop() todo: Todo;

  @Event() todoCompleted: EventEmitter<Todo>;

  completeTodo() {
    this.todoCompleted.emit(this.todo);
  }

  render() {
    return (
      <div>
        <span>{this.todo.text}</span>
        <button onClick={() => this.completeTodo()}>Complete</button>
      </div>
    );
  }
}
```

**Event options**:

```typescript
@Event({
  eventName: 'todoCompleted',
  composed: true,  // Cross Shadow DOM boundary
  cancelable: true, // Can be prevented
  bubbles: true     // Bubbles up DOM tree
})
todoCompleted: EventEmitter<Todo>;
```

### Listen to Events (@Listen)

**Listen to custom events**:

```typescript
@Component({ tag: 'todo-list' })
export class TodoList {
  @Listen('todoCompleted')
  handleTodoCompleted(event: CustomEvent<Todo>) {
    console.log('Todo completed:', event.detail);
  }

  render() {
    return (
      <div>
        <todo-item todo={...} />
        <todo-item todo={...} />
      </div>
    );
  }
}
```

**Listen to global events**:

```typescript
@Listen('scroll', { target: 'window' })
handleScroll(event: Event) {
  console.log('Window scrolled');
}

@Listen('click', { target: 'document', capture: true })
handleDocumentClick(event: MouseEvent) {
  console.log('Document clicked');
}
```

**Listen options**:
- `target`: `'body'`, `'document'`, `'window'`, or host element (default)
- `capture`: Capture phase vs bubble phase
- `passive`: Passive event listener (performance)

## Reuse Patterns

### Component Libraries

**Design system**:

```typescript
// button.tsx
@Component({
  tag: 'ds-button',
  styleUrl: 'button.css',
  shadow: true
})
export class Button {
  @Prop() variant: 'primary' | 'secondary' = 'primary';

  render() {
    return (
      <button class={this.variant}>
        <slot />
      </button>
    );
  }
}

// Use in React, Vue, Angular, or vanilla
<ds-button variant="primary">Save</ds-button>
```

Stencil components are **just Web Components**—work anywhere.

### Methods (@Method)

**Public API** for components:

```typescript
import { Method } from '@stencil/core';

@Component({ tag: 'my-dialog' })
export class Dialog {
  @Method()
  async open() {
    // Open dialog logic
  }

  @Method()
  async close() {
    // Close dialog logic
  }
}

// Usage
const dialog = document.querySelector('my-dialog');
await dialog.open();
```

### Lifecycle Methods

**Full lifecycle**:

```typescript
export class MyComponent {
  // Fires when connected to DOM (every time)
  connectedCallback() {
    console.log('Connected');
  }

  // Fires once before first render
  componentWillLoad() {
    console.log('Will load');
  }

  // Fires before every render
  componentWillRender() {
    console.log('Will render');
  }

  // Fires after first render (once)
  componentDidLoad() {
    console.log('Did load');
  }

  // Fires after every render
  componentDidRender() {
    console.log('Did render');
  }

  // Determines if component should update
  componentShouldUpdate(newVal, oldVal, propName): boolean {
    return newVal !== oldVal;
  }

  // Fires before update (not on initial render)
  componentWillUpdate() {
    console.log('Will update');
  }

  // Fires after update (not on initial render)
  componentDidUpdate() {
    console.log('Did update');
  }

  // Fires when disconnected from DOM
  disconnectedCallback() {
    console.log('Disconnected');
  }
}
```

**Order**: Child lifecycle completes before parent.

## Developer Experience

### Learning Curve

**Moderate**. Requires understanding:
- TypeScript decorators
- Web Components (Custom Elements, Shadow DOM)
- JSX templating
- Stencil-specific decorators

**Easier if you know**:
- React (JSX, virtual DOM)
- Angular (decorators, TypeScript)
- Web Components basics

### TypeScript

**First-class support**. All examples use TypeScript:

```typescript
interface User {
  name: string;
  age: number;
}

@Component({ tag: 'user-card' })
export class UserCard {
  @Prop() user: User;

  render() {
    return <div>{this.user.name}, {this.user.age}</div>;
  }
}
```

Compiler generates type definitions for components automatically.

### Tooling

**Stencil CLI**: `npm init stencil`

**Dev server**: Hot reload, instant feedback

**Testing**: Built-in unit testing with Jest, E2E with Puppeteer

**Documentation**: Auto-generated from JSDoc comments

**Code generation**: `stencil generate my-component` scaffolds new components

### Output Targets

**Flexible output**:

- **dist**: Standard Web Components
- **dist-custom-elements**: Tree-shakable custom elements
- **www**: Static website
- **docs**: Auto-generated documentation
- **react**, **vue**, **angular**: Framework wrappers

### Boilerplate

**Minimal**:

```typescript
import { Component, h } from '@stencil/core';

@Component({
  tag: 'my-component',
  shadow: true
})
export class MyComponent {
  render() {
    return <div>Hello World</div>;
  }
}
```

~10 lines for a complete component.

### Documentation

**Good**. https://stenciljs.com has comprehensive guides, API reference, and examples. Community is smaller than React/Vue but active.

### Component Reusability Assessment

**Quality: Excellent (9.5/10)**

**Strengths**: Compiles to web components - ultimate portability. Work in any framework or vanilla JS. Published to npm, used anywhere. TypeScript decorators make API explicit. Prerendering for SSR. Lazy loading automatic. Ionic uses Stencil - production-proven at scale.

**Weaknesses**: Requires build step (compiler). Some web component gotchas (form association, SSR). Smaller ecosystem than React/Vue. JSX is Stencil-flavored, not React JSX.

**Cross-Project Reuse**: Best-in-class. Compile once, use everywhere. Design systems built with Stencil work across entire org. Framework-agnostic. Future-proof against framework churn.

**Design System Support**: Ideal. Ionic design system built with Stencil. Component tokens via CSS variables. Shadow DOM provides encapsulation. Themeable. Storybook integration.

## Maintainability

**Quality: Excellent (8.5/10)**

**Strengths**: TypeScript-first. Compiler catches errors. Web standards base means no framework churn. Decorators make API explicit. Lazy loading built-in. Small runtime (~6KB). Testing tools provided. Output is optimized automatically.

**Weaknesses**: Compiler errors can be cryptic. Web component lifecycle different from React/Vue. SSR requires prerendering setup. Debugging across shadow DOM boundary tricky. Smaller community.

**Code Organization**: Each component is a class in its own file. Clear decorator-based API. E2E tests alongside components. Strict conventions enforced by compiler.

**Testing**: Stencil Test Runner (Jest-based) for unit tests. E2E testing with Puppeteer built-in. Components can be tested as real DOM elements. Snapshot testing supported.

**Debugging**: Browser DevTools work natively. Can inspect custom elements and shadow DOM. TypeScript helps catch issues early. Compiler provides helpful error messages.

**Scalability**: Excellent. Lazy loading keeps bundles small. Tree-shaking removes unused components. Works in micro-frontends. Ionic proves it scales to massive apps.

**Breaking Changes**: Stencil is stable (v4.x). Updates rare and well-communicated. Web standards foundation reduces breaking changes. Ionic team maintains it for production use.

## AI-Friendly Assessment

**Overall Score: 7.5/10**

### Strengths for AI-Assisted Development

**Explicit Decorators**: Component API is decorator-based—intent is obvious:

```typescript
@Prop()   // Input from parent
@State()  // Internal reactive state
@Event()  // Output to parent
@Listen() // Listen to events
@Watch()  // React to changes
@Method() // Public API
```

AI can easily identify component boundaries and data flow.

**TypeScript-First**:

```typescript
@Prop() user: User;
@State() count: number = 0;
@Event() todoCompleted: EventEmitter<Todo>;
```

Full type safety, auto-generated type definitions.

**JSX Templating**: Standard JSX—AI trained on React patterns applies:

```typescript
render() {
  return <div>{this.count}</div>;
}
```

**Web Components Output**: Compiles to standard Web Components. AI doesn't need to understand Stencil-specific runtime—just Web Components APIs.

**Compiler-First**: No runtime framework complexity. Stencil is a build tool that outputs vanilla Web Components.

**Virtual DOM**: Similar to React. AI familiar with virtual DOM concepts understands Stencil rendering.

### Weaknesses for AI-Assisted Development

**Decorator Configuration**: Requires understanding TypeScript experimental decorators and `experimentalDecorators` tsconfig option.

**Immutability Requirement**: `@State` requires reassignment, not mutation:

```typescript
// ❌ Doesn't work
this.items.push(newItem);

// ✅ Works
this.items = [...this.items, newItem];
```

AI must understand this constraint—easy to generate incorrect code.

**Complex Lifecycle**: 10+ lifecycle methods with specific execution order. AI must track:
- `connectedCallback` vs `componentWillLoad`
- `componentDidLoad` vs `componentDidRender`
- When each fires (initial vs update)

**EventEmitter Boilerplate**: Custom events require verbose setup:

```typescript
@Event({
  eventName: 'todoCompleted',
  composed: true,
  cancelable: true,
  bubbles: true,
})
todoCompleted: EventEmitter<Todo>;

completeTodo() {
  this.todoCompleted.emit(this.todo);
}
```

More verbose than simple callbacks.

**Shadow DOM Complexity**: Requires understanding Shadow DOM encapsulation, slots, CSS scoping. Not immediately obvious from code.

**Less Common Than React/Vue**: Smaller community, less training data. AI may have fewer examples to draw from.

### Why 7.5/10?

Stencil scores well for:
- **Explicit decorators** (clear intent)
- **TypeScript-first** (full type safety)
- **JSX templating** (familiar)
- **Web Components output** (standard)
- **Compiler-first** (no runtime complexity)

Loses points for:
- Immutability requirement for `@State` (easy to get wrong)
- Complex lifecycle methods (many to remember)
- EventEmitter verbosity
- Shadow DOM complexity
- Less common framework (less training data)

**Key Insight**: Stencil demonstrates that **decorator-based APIs** are highly AI-friendly when well-designed. Each decorator clearly communicates purpose:

- `@Prop()` = input
- `@State()` = internal state
- `@Event()` = output
- `@Listen()` = event handler
- `@Watch()` = change watcher

This explicitness helps AI generate correct code.

However, the **immutability constraint** for `@State` is a significant weakness. AI trained on mutable patterns (MobX, Vue) will naturally generate `this.items.push()`, which silently fails in Stencil. This is a footgun.

**Web Components as compilation target** is powerful—components work everywhere without framework lock-in. But Shadow DOM adds complexity that AI must understand (slot projection, style encapsulation, event composition).

Stencil is ideal for **design systems and component libraries** where framework-agnostic output is critical. For AI assistance, the decorator API is clear, but the immutability requirement and lifecycle complexity reduce the score.

---

Sources:
- [Stencil Introduction](https://stenciljs.com/docs/introduction)
- [Stencil @State Decorator](https://stenciljs.com/docs/state)
- [Stencil Events](https://stenciljs.com/docs/events)
- [Stencil Component Lifecycle](https://stenciljs.com/docs/component-lifecycle)
- [Creating Web Components with Stencil](https://auth0.com/blog/creating-web-components-with-stencil/)
