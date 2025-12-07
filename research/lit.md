---
name: "Lit"
category: "web-components-library"
github_url: "https://github.com/lit/lit"
docs_url: "https://lit.dev"
implementation_language: "TypeScript"
status: "active"
ai_friendliness_score: 7.5
reusability_score: 9.5
maintainability_score: 9
capabilities:
  state_management: false
  rendering: false
  event_handling: false
---

# Lit

## Philosophy & Mental Model

Lit is **"a simple library for building fast, lightweight web components."** It's built on **Web Components standards** (Custom Elements, Shadow DOM, HTML Templates), adding just enough sugar to make them productive while staying close to the platform.

The philosophy is **minimal abstraction**: Rather than inventing a new component model (React, Vue), Lit extends the browser's native component model. Lit components are real Custom Elements that work anywhere HTML works—no framework lock-in.

**Mental model**: Think of Lit as **"jQuery for Web Components."** It doesn't replace the platform; it makes the platform nicer to use. Shadow DOM, Custom Elements, and HTML Templates are the foundation—Lit adds reactive properties, declarative templates, and lifecycle helpers.

**Core principles:**

1. **Standards-Based**: Build on Web Components, not around them
2. **Framework-Agnostic**: Lit components work with React, Vue, Angular, or vanilla HTML
3. **Minimal Bundle**: ~5KB compressed—lighter than React or Vue
4. **No Virtual DOM**: Direct DOM updates for performance
5. **Scoped Styles**: Shadow DOM provides true style encapsulation

Lit is for **design systems, shared component libraries, and apps that prioritize standards over framework lock-in**.

## State Management

### Core Primitives

**@property** (public reactive properties):

```typescript
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('my-counter')
class MyCounter extends LitElement {
  @property({ type: Number }) count = 0;

  render() {
    return html`
      <p>Count: ${this.count}</p>
      <button @click=${() => this.count++}>+</button>
    `;
  }
}
```

**@state** (private reactive state):

```typescript
@customElement('my-component')
class MyComponent extends LitElement {
  @state() private _active = false;

  render() {
    return html`
      <button @click=${() => this._active = !this._active}>
        ${this._active ? 'Active' : 'Inactive'}
      </button>
    `;
  }
}
```

`@property` is exposed as an attribute (`<my-counter count="5">`). `@state` is internal only.

**Without decorators** (standard approach):

```typescript
class MyCounter extends LitElement {
  static properties = {
    count: { type: Number },
  };

  constructor() {
    super();
    this.count = 0;
  }

  render() {
    return html`<p>Count: ${this.count}</p>`;
  }
}
```

### Update Mechanism

**Direct mutation** (reactive properties auto-trigger updates):

```typescript
@customElement('todo-item')
class TodoItem extends LitElement {
  @property() todo!: Todo;

  toggle() {
    this.todo = { ...this.todo, completed: !this.todo.completed };
    // Triggers re-render
  }
}
```

Lit watches reactive properties—when they change, the component re-renders.

**requestUpdate()** for manual updates:

```typescript
class MyComponent extends LitElement {
  data = []; // Non-reactive

  add(item) {
    this.data.push(item);
    this.requestUpdate(); // Force update
  }
}
```

### Read Pattern

Access properties directly:

```typescript
render() {
  return html`
    <p>Count: ${this.count}</p>
    <p>Name: ${this.name}</p>
    <p>Active: ${this._active ? 'Yes' : 'No'}</p>
  `;
}
```

### Reactivity & Granularity

Lit uses **fine-grained updates**—only the dynamic parts of templates re-render:

```typescript
render() {
  return html`
    <h1>Static title</h1>
    <p>Count: ${this.count}</p> <!-- Only this updates when count changes -->
    <footer>Static footer</footer>
  `;
}
```

Lit parses templates once, then updates only changed expressions.

### Async Handling

Use standard async/await:

```typescript
@customElement('user-profile')
class UserProfile extends LitElement {
  @state() private _user: User | null = null;
  @state() private _loading = false;

  async connectedCallback() {
    super.connectedCallback();
    await this.fetchUser();
  }

  async fetchUser() {
    this._loading = true;
    const response = await fetch('/api/user');
    this._user = await response.json();
    this._loading = false;
  }

  render() {
    if (this._loading) return html`<p>Loading...</p>`;
    if (!this._user) return html`<p>No user</p>`;
    return html`<p>Hello, ${this._user.name}!</p>`;
  }
}
```

**Async directives** for promises in templates:

```typescript
import { until } from 'lit/directives/until.js';

render() {
  return html`
    ${until(
      fetch('/api/data').then(r => r.json()).then(data => html`<p>${data}</p>`),
      html`<p>Loading...</p>`
    )}
  `;
}
```

### Derived State

Use getters:

```typescript
@customElement('cart-total')
class CartTotal extends LitElement {
  @property() items: CartItem[] = [];

  get subtotal() {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  get tax() {
    return this.subtotal * 0.08;
  }

  get total() {
    return this.subtotal + this.tax;
  }

  render() {
    return html`
      <p>Subtotal: $${this.subtotal.toFixed(2)}</p>
      <p>Tax: $${this.tax.toFixed(2)}</p>
      <p>Total: $${this.total.toFixed(2)}</p>
    `;
  }
}
```

## Rendering

### Core Primitives

**html tagged template**:

```typescript
import { html } from 'lit';

render() {
  return html`
    <h1>Title</h1>
    <p>Count: ${this.count}</p>
    <button @click=${this.increment}>+</button>
  `;
}
```

**Expressions** (${...}):

```typescript
render() {
  return html`
    <p>${this.message}</p> <!-- Text -->
    <input .value=${this.text}> <!-- Property -->
    <div class=${this.className}> <!-- Attribute -->
    <button @click=${this.handler}> <!-- Event -->
    <div ?hidden=${!this.visible}> <!-- Boolean attribute -->
  `;
}
```

**Scoped styles** via Shadow DOM:

```typescript
import { css } from 'lit';

static styles = css`
  :host {
    display: block;
    padding: 16px;
  }

  button {
    background: blue;
    color: white;
  }
`;
```

Styles are scoped to the component—no global pollution.

### Update Mechanism

1. Property changes
2. Lit schedules update (batched via microtask)
3. `render()` called
4. Lit diffs new template against old
5. Only changed parts of DOM updated

**No virtual DOM**—Lit tracks template positions and updates them directly.

### Conditional Rendering

**Ternary**:

```typescript
render() {
  return html`
    ${this.loggedIn
      ? html`<p>Welcome back!</p>`
      : html`<button @click=${this.login}>Login</button>`
    }
  `;
}
```

**Conditional directive**:

```typescript
import { when } from 'lit/directives/when.js';

render() {
  return html`
    ${when(
      this.user,
      () => html`<p>Hello, ${this.user.name}</p>`,
      () => html`<p>Please log in</p>`
    )}
  `;
}
```

### List Rendering

**map**:

```typescript
render() {
  return html`
    <ul>
      ${this.items.map((item) => html`
        <li>${item.name}</li>
      `)}
    </ul>
  `;
}
```

**repeat directive** (keyed):

```typescript
import { repeat } from 'lit/directives/repeat.js';

render() {
  return html`
    <ul>
      ${repeat(
        this.users,
        (user) => user.id, // Key
        (user) => html`<li>${user.name}</li>`
      )}
    </ul>
  `;
}
```

### Component Model

**Custom elements**:

```typescript
@customElement('user-card')
class UserCard extends LitElement {
  @property() user!: User;

  render() {
    return html`
      <div>
        <h3>${this.user.name}</h3>
        <p>${this.user.email}</p>
      </div>
    `;
  }
}

// Usage
html`<user-card .user=${this.user}></user-card>`;
```

**Slots** for composition:

```typescript
@customElement('card-container')
class CardContainer extends LitElement {
  render() {
    return html`
      <div class="card">
        <div class="header">
          <slot name="header"></slot>
        </div>
        <div class="body">
          <slot></slot>
        </div>
      </div>
    `;
  }
}

// Usage
html`
  <card-container>
    <span slot="header">Title</span>
    <p>Body content</p>
  </card-container>
`;
```

## Event Handling

**@event** binding:

```typescript
render() {
  return html`
    <button @click=${this.handleClick}>Click</button>
    <input @input=${this.handleInput}>
    <form @submit=${this.handleSubmit}>
  `;
}

handleClick(e: Event) {
  console.log('Clicked!', e.target);
}
```

**Custom events**:

```typescript
class MyButton extends LitElement {
  render() {
    return html`
      <button @click=${this._onClick}>Click me</button>
    `;
  }

  _onClick() {
    this.dispatchEvent(new CustomEvent('my-click', {
      detail: { time: Date.now() },
      bubbles: true,
      composed: true, // Cross shadow DOM boundary
    }));
  }
}

// Usage
html`<my-button @my-click=${this.handleCustomClick}></my-button>`;
```

## Reuse Patterns

### Component Libraries

Lit components are portable Web Components:

```typescript
// Define once
@customElement('design-button')
class DesignButton extends LitElement {
  @property() variant: 'primary' | 'secondary' = 'primary';

  render() {
    return html`<button class=${this.variant}><slot></slot></button>`;
  }
}

// Use anywhere (React, Vue, Angular, vanilla)
<design-button variant="primary">Save</design-button>
```

### Mixins

```typescript
type Constructor<T = {}> = new (...args: any[]) => T;

export const FormAssociatedMixin = <T extends Constructor<LitElement>>(
  Base: T
) => {
  class FormAssociated extends Base {
    @property() name = '';
    @property() value = '';

    // Shared form logic
  }
  return FormAssociated as Constructor<FormAssociatedInterface> & T;
};

@customElement('my-input')
class MyInput extends FormAssociatedMixin(LitElement) {
  // Inherits form behavior
}
```

### Directives

Custom template logic:

```typescript
import { directive, Directive } from 'lit/directive.js';

const formatCurrency = directive(class extends Directive {
  render(value: number) {
    return `$${value.toFixed(2)}`;
  }
});

// Usage
html`<p>Total: ${formatCurrency(19.99)}</p>`;
```

## Developer Experience

### Learning Curve

**Moderate**. Requires understanding:
- Web Components (Custom Elements, Shadow DOM)
- Lit's template syntax
- Property decorators

Easier than React/Vue if you know vanilla JS/DOM. Harder if you don't.

### Tooling

**TypeScript**: First-class support

**Lit DevTools**: Browser extension for inspecting components

**Testing**:

```typescript
import { fixture, html } from '@open-wc/testing';

it('increments counter', async () => {
  const el = await fixture<MyCounter>(html`<my-counter></my-counter>`);

  el.shadowRoot!.querySelector('button')!.click();
  await el.updateComplete;

  expect(el.count).to.equal(1);
});
```

### Boilerplate

**Minimal**:

```typescript
@customElement('my-element')
class MyElement extends LitElement {
  @property() message = 'Hello';

  render() {
    return html`<p>${this.message}</p>`;
  }
}
```

~10 lines for a complete component.

### Documentation

**Excellent**. lit.dev has comprehensive guides, API reference, and examples.

### Component Reusability Assessment

**Quality: Excellent (9.5/10)**

**Strengths**: Web Components are the ultimate reusability - work in any framework (React, Vue, Angular, Vanilla). Publish once, use everywhere. No framework lock-in. Slot-based composition matches HTML. Shadow DOM provides true encapsulation. TypeScript decorators make properties explicit and documented.

**Weaknesses**: Shadow DOM can complicate styling from outside. Framework integration sometimes requires wrappers for reactivity. SSR requires additional tooling (Lit SSR package).

**Cross-Project Reuse**: Best-in-class. npm packages work in any project. Design systems built with Lit work across entire organization regardless of framework choice. Future-proof against framework churn.

**Design System Support**: Ideal for design systems. Tokens via CSS custom properties pierce shadow DOM. Shoelace, Carbon, Spectrum all use web components. Storybook support excellent.

## Maintainability

**Quality: Excellent (9/10)**

**Strengths**: Standard web platform - no framework churn. TypeScript support excellent. Decorators make API explicit. Reactive properties prevent manual DOM updates. Scoped styles in Shadow DOM prevent conflicts. DevTools show element state. Lit is tiny (~5KB) so minimal dependency risk.

**Weaknesses**: Shadow DOM debugging can be tricky. Crossing shadow boundary for styles/events requires understanding encapsulation. Some developers unfamiliar with web components. Testing requires understanding custom element lifecycle.

**Code Organization**: Each component is a class - clear structure. Controllers for reusable behavior. Directives for reusable rendering logic.

**Testing**: Standard web testing tools (Web Test Runner, Playwright). Components are real DOM elements. Can test in isolation or composed. Snapshot testing works well.

**Debugging**: Browser DevTools work natively. Can inspect element properties and shadow DOM. Lit DevTools extension available.

**Scalability**: Excellent. Components are isolated by design. No global state conflicts. Lazy load components as needed. Works in micro-frontends.

**Breaking Changes**: Lit 2 → 3 was mostly non-breaking. Framework stability high due to web standards foundation.

## AI-Friendly Assessment

**Overall Score: 7.5/10**

### Strengths for AI-Assisted Development

**Standards-Based**: Web Components are W3C standards. AI trained on web standards understands Lit naturally.

**TypeScript-First**: Full type safety with decorators:

```typescript
@property({ type: Number }) count = 0;
```

**Explicit Decorators**: `@property`, `@state`, `@customElement` make intent obvious.

**Template Literals**: Standard JavaScript, not custom DSL:

```typescript
html`<p>Count: ${this.count}</p>`
```

**Framework-Agnostic**: Components work everywhere—React, Vue, vanilla. AI doesn't need framework-specific knowledge.

**Minimal API**: Small surface area—decorators, html tag, css tag, lifecycle methods.

### Weaknesses for AI-Assisted Development

**Shadow DOM Complexity**: Shadow roots, slots, and style encapsulation are complex. AI must understand Shadow DOM boundaries.

**Decorator Config**: Requires specific TypeScript setup (experimentalDecorators). AI must know config requirements.

**Web Components Less Common**: Most training data is React/Vue. Fewer examples of Lit patterns.

**Custom Events Verbose**: Dispatching events requires boilerplate:

```typescript
this.dispatchEvent(new CustomEvent('my-event', { detail: {...}, bubbles: true, composed: true }));
```

### Why 7.5/10?

Lit scores well for standards-based approach and TypeScript support, but Shadow DOM complexity and less common usage pattern lower the score slightly.

---

**Key Insight**: Lit demonstrates that **standards-based frameworks** have long-term value. Web Components will outlive any JavaScript framework. For design systems, Lit is ideal—components work everywhere without framework lock-in.
