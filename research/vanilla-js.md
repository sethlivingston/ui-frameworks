---
name: "Vanilla JavaScript"
category: "no-framework"
github_url: null
docs_url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript"
implementation_language: "JavaScript"
status: "active"
ai_friendliness_score: null
reusability_score: 7
maintainability_score: 6
version: "ES2024"
typescript_support: "native"
license: "N/A"
runtime: "browser"
capabilities:
  state_management: true
  rendering: true
  event_handling: true
paradigm: "imperative"
state_model: "mutable"
rendering_strategy: "direct-dom"
maintainer: "W3C/WHATWG/TC39"
first_released: "1995"
reviewed_date: "2025-12-06"
reviewed_by_model: "Claude Sonnet 4.5"
---

# Vanilla JavaScript

## State Management

### Philosophy & Mental Model

Vanilla JS state philosophy: **"There is no philosophy - you decide everything"**

**Core reality**: JavaScript has no built-in state management. You have variables and objects. That's it.

Key concepts (or lack thereof):
- **No framework opinions**: Structure state however you want
- **Direct mutation**: Change variables directly, manage updates manually
- **No reactivity**: Changing state doesn't automatically update UI
- **Full control**: You write every line of state logic
- **No magic**: What you write is what runs

**Mental model**:
- Framework: "Update state, UI automatically updates"
- Vanilla: "Update state, manually update every affected DOM element"

**The truth**: This is the **baseline**. Every framework exists because managing state + UI manually is tedious and error-prone.

### Core Primitives

**1. Variables** - The only primitive:

```javascript
// Module-scoped state
let count = 0
let user = { name: 'John', age: 30 }
let items = [1, 2, 3]

// Update directly
count++
user.age = 31
items.push(4)

// No automatic UI updates!
// Must manually update DOM
document.getElementById('count').textContent = count
```

**2. Objects for grouped state**:

```javascript
const state = {
  count: 0,
  user: { name: 'John', age: 30 },
  items: []
}

// Update
state.count++

// Still no UI updates!
```

**3. Classes for encapsulation**:

```javascript
class Counter {
  #count = 0  // Private field

  increment() {
    this.#count++
    this.render()  // Must manually trigger render
  }

  getValue() {
    return this.#count
  }

  render() {
    // Manual DOM update
    document.getElementById('count').textContent = this.#count
  }
}

const counter = new Counter()
```

**4. Proxy for reactivity** (DIY Vue):

```javascript
function reactive(obj, onChange) {
  return new Proxy(obj, {
    set(target, property, value) {
      target[property] = value
      onChange(property, value)  // Trigger update
      return true
    }
  })
}

const state = reactive({ count: 0 }, (prop, value) => {
  // Update DOM when state changes
  document.getElementById('count').textContent = value
})

state.count++  // Automatically updates DOM!
```

**5. EventTarget for pub/sub**:

```javascript
class Store extends EventTarget {
  #state = { count: 0 }

  getState() {
    return this.#state
  }

  setState(newState) {
    this.#state = { ...this.#state, ...newState }
    this.dispatchEvent(new CustomEvent('change', {
      detail: this.#state
    }))
  }
}

const store = new Store()
store.addEventListener('change', (e) => {
  // Update UI
  document.getElementById('count').textContent = e.detail.count
})

store.setState({ count: 1 })
```

**6. localStorage for persistence**:

```javascript
function saveState(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function loadState(key) {
  const stored = localStorage.getItem(key)
  return stored ? JSON.parse(stored) : null
}

let count = loadState('count') || 0
count++
saveState('count', count)
```

**The reality**: You build your own state system from scratch, or live with manual updates.

### Update Mechanism

**Direct mutation** - Change variables, manually update DOM:

```javascript
// Update state
count++

// Manually update UI
document.getElementById('count').textContent = count
```

**The manual update problem**:

```javascript
let count = 0

function increment() {
  count++

  // Must remember to update ALL places that show count
  document.getElementById('count-display').textContent = count
  document.getElementById('count-header').textContent = count
  document.querySelector('.count-badge').textContent = count

  // Forgot one? UI is out of sync!
}
```

**Common patterns to reduce pain**:

**1. Centralized update function**:

```javascript
const state = {
  count: 0
}

function updateState(changes) {
  Object.assign(state, changes)
  render()  // Re-render everything
}

function render() {
  // Update all UI
  document.getElementById('count').textContent = state.count
}

updateState({ count: 1 })
```

**2. Observer pattern**:

```javascript
class Observable {
  #value
  #listeners = []

  constructor(value) {
    this.#value = value
  }

  get() {
    return this.#value
  }

  set(value) {
    this.#value = value
    this.#listeners.forEach(fn => fn(value))
  }

  subscribe(fn) {
    this.#listeners.push(fn)
    return () => {
      this.#listeners = this.#listeners.filter(l => l !== fn)
    }
  }
}

const count = new Observable(0)

count.subscribe(value => {
  document.getElementById('count').textContent = value
})

count.set(1)  // Automatically updates UI
```

**3. MutationObserver** (watch DOM changes):

```javascript
const observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    console.log('DOM changed:', mutation)
  })
})

observer.observe(document.body, {
  childList: true,
  subtree: true
})
```

**The truth**: You're reinventing frameworks. That's why frameworks exist.

### Read Pattern

**Global variables** (simplest, most problematic):

```javascript
// file1.js
window.count = 0

// file2.js
console.log(window.count)  // 0
window.count++
```

**Problems**: Global pollution, naming conflicts, no encapsulation.

**Module-scoped state** (better):

```javascript
// state.js
let count = 0

export function getCount() {
  return count
}

export function setCount(value) {
  count = value
}

// app.js
import { getCount, setCount } from './state.js'

console.log(getCount())  // 0
setCount(1)
```

**Singleton pattern**:

```javascript
// store.js
class Store {
  #state = { count: 0 }

  getState() {
    return this.#state
  }

  setState(updates) {
    this.#state = { ...this.#state, ...updates }
  }
}

export const store = new Store()

// app.js
import { store } from './store.js'

store.setState({ count: 1 })
console.log(store.getState().count)
```

**Custom element state**:

```javascript
class CounterElement extends HTMLElement {
  #count = 0

  increment() {
    this.#count++
    this.render()
  }

  render() {
    this.textContent = this.#count
  }
}

customElements.define('my-counter', CounterElement)
```

**The pattern**: You choose your own adventure. No standard way.

### Reactivity & Granularity

**No reactivity by default**:

```javascript
let count = 0

count++  // Nothing happens!
// Must manually update UI
document.getElementById('count').textContent = count
```

**Manual fine-grained updates** (most efficient):

```javascript
let count = 0

function updateCount(newValue) {
  count = newValue
  // Only update the one element that needs it
  document.getElementById('count').textContent = count
}

updateCount(1)
```

**Manual coarse-grained updates** (simplest):

```javascript
const state = { count: 0, name: 'John' }

function render() {
  // Re-render entire UI
  document.body.innerHTML = `
    <div>Count: ${state.count}</div>
    <div>Name: ${state.name}</div>
  `
}

state.count++
render()  // Everything re-renders, even name
```

**DIY fine-grained reactivity**:

```javascript
class Signal {
  #value
  #subscribers = new Set()

  constructor(value) {
    this.#value = value
  }

  get value() {
    return this.#value
  }

  set value(newValue) {
    if (this.#value !== newValue) {
      this.#value = newValue
      this.#subscribers.forEach(fn => fn(newValue))
    }
  }

  subscribe(fn) {
    this.#subscribers.add(fn)
    fn(this.#value)  // Initial call
    return () => this.#subscribers.delete(fn)
  }
}

const count = new Signal(0)

count.subscribe(value => {
  document.getElementById('count').textContent = value
})

count.value = 1  // Only updates subscribed elements
```

**Granularity**: As fine or coarse as you implement. You control everything.

**Performance characteristics**:
- **No framework overhead**: Fastest possible (when optimized)
- **No Virtual DOM diffing**: Direct DOM manipulation
- **But**: Easy to write slow code (innerHTML on every change, layout thrashing)

### Async Handling

**fetch API** (modern):

```javascript
let data = null
let loading = false
let error = null

async function fetchData() {
  loading = true
  updateUI()

  try {
    const response = await fetch('/api/data')
    data = await response.json()
    error = null
  } catch (e) {
    error = e
    data = null
  } finally {
    loading = false
    updateUI()
  }
}

function updateUI() {
  const container = document.getElementById('container')

  if (loading) {
    container.innerHTML = 'Loading...'
  } else if (error) {
    container.innerHTML = `Error: ${error.message}`
  } else {
    container.innerHTML = JSON.stringify(data)
  }
}

fetchData()
```

**Promises**:

```javascript
fetch('/api/data')
  .then(r => r.json())
  .then(data => {
    document.getElementById('data').textContent = JSON.stringify(data)
  })
  .catch(error => {
    document.getElementById('error').textContent = error.message
  })
```

**AbortController** (cancel requests):

```javascript
let controller = new AbortController()

async function fetchData() {
  try {
    const response = await fetch('/api/data', {
      signal: controller.signal
    })
    const data = await response.json()
    // Update UI
  } catch (e) {
    if (e.name === 'AbortError') {
      console.log('Fetch aborted')
    }
  }
}

// Cancel
controller.abort()
```

**No built-in patterns for**:
- Automatic retry
- Caching
- Deduplication
- Loading states
- Optimistic updates

**You build it all yourself** or use a library like TanStack Query.

### Derived State

**Manual computation**:

```javascript
const items = [
  { price: 10, quantity: 2 },
  { price: 5, quantity: 3 }
]

// Compute total
const total = items.reduce((sum, item) =>
  sum + (item.price * item.quantity), 0
)

// Update UI
document.getElementById('total').textContent = total
```

**Cached computation** (manual memoization):

```javascript
let cachedItems = null
let cachedTotal = null

function getTotal() {
  if (items !== cachedItems) {
    cachedTotal = items.reduce((sum, item) =>
      sum + (item.price * item.quantity), 0
    )
    cachedItems = items
  }
  return cachedTotal
}
```

**Getter functions**:

```javascript
const state = {
  items: [],

  get total() {
    return this.items.reduce((sum, item) =>
      sum + (item.price * item.quantity), 0
    )
  }
}

console.log(state.total)  // Computed on access
```

**No automatic dependency tracking**. You track dependencies manually or recompute every time.

### Reuse Patterns

**1. Functions** (basic reuse):

```javascript
function createElement(tag, attrs, children) {
  const el = document.createElement(tag)
  Object.assign(el, attrs)
  children?.forEach(child => {
    el.appendChild(typeof child === 'string'
      ? document.createTextNode(child)
      : child
    )
  })
  return el
}

const button = createElement('button',
  { textContent: 'Click me', onclick: handleClick },
  []
)
```

**2. Factory functions** (component-like):

```javascript
function createCounter(initialValue = 0) {
  let count = initialValue

  const element = document.createElement('div')
  const display = document.createElement('span')
  const button = document.createElement('button')

  button.textContent = 'Increment'
  button.onclick = () => {
    count++
    render()
  }

  function render() {
    display.textContent = count
  }

  element.appendChild(display)
  element.appendChild(button)
  render()

  return element
}

// Reuse
document.body.appendChild(createCounter(0))
document.body.appendChild(createCounter(5))
```

**3. Classes** (encapsulated components):

```javascript
class Counter {
  #count
  #element

  constructor(initialValue = 0) {
    this.#count = initialValue
    this.#element = this.#createUI()
  }

  #createUI() {
    const container = document.createElement('div')
    const display = document.createElement('span')
    const button = document.createElement('button')

    button.textContent = 'Increment'
    button.onclick = () => this.increment()

    display.id = 'display'
    container.appendChild(display)
    container.appendChild(button)

    return container
  }

  increment() {
    this.#count++
    this.#render()
  }

  #render() {
    this.#element.querySelector('#display').textContent = this.#count
  }

  mount(parent) {
    parent.appendChild(this.#element)
    this.#render()
  }
}

// Reuse
new Counter(0).mount(document.body)
new Counter(5).mount(document.body)
```

**4. Web Components** (custom elements):

```javascript
class CounterElement extends HTMLElement {
  #count = 0

  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  connectedCallback() {
    this.#count = parseInt(this.getAttribute('initial') || '0')
    this.render()
    this.shadowRoot.querySelector('button').addEventListener('click', () => {
      this.#count++
      this.render()
    })
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        button { padding: 8px; }
      </style>
      <span>${this.#count}</span>
      <button>Increment</button>
    `
  }
}

customElements.define('my-counter', CounterElement)

// Reuse (like native HTML elements!)
<my-counter initial="0"></my-counter>
<my-counter initial="5"></my-counter>
```

**5. Template element** (HTML templates):

```javascript
const template = document.getElementById('counter-template')

function createCounter(initialValue) {
  const clone = template.content.cloneNode(true)
  const display = clone.querySelector('.count')
  const button = clone.querySelector('button')

  let count = initialValue
  display.textContent = count

  button.onclick = () => {
    count++
    display.textContent = count
  }

  return clone
}

<!-- HTML -->
<template id="counter-template">
  <div class="counter">
    <span class="count">0</span>
    <button>Increment</button>
  </div>
</template>
```

**6. ES6 Modules** (code organization):

```javascript
// counter.js
export function createCounter(initial) {
  // ...component logic
  return element
}

// app.js
import { createCounter } from './counter.js'

document.body.appendChild(createCounter(0))
```

**Reuse assessment**:
- **Most flexible**: Can use any pattern
- **Least standardized**: No conventions, every project different
- **Most manual**: No framework to handle lifecycle, props, state
- **Web Components come closest** to framework components but lack:
  - State management
  - Reactive updates
  - Developer tooling
  - Ecosystem

### Developer Experience

**Boilerplate: Variable** (none to extreme)
- Simple script: Zero boilerplate
- Organized app: Significant boilerplate (you build everything)
- No magic means more code

**DevTools: Browser DevTools only**
- Console for debugging
- Elements panel for DOM inspection
- Sources for breakpoints
- Performance profiler
- Network panel
- No framework-specific tools
- No component tree view
- No state inspection (just variables in debugger)

**Debugging: Manual**
- `console.log()` everywhere
- Debugger breakpoints
- No time-travel
- No reactive dependency visualization
- You trace through your own code

**Time travel: No**
- No built-in state history
- Would have to implement manually

**TypeScript support: Excellent**
- Native JavaScript, can use TypeScript compiler
- Full type safety
- But: DOM APIs are sometimes loosely typed

### AI-Friendly Assessment

**What makes vanilla JS easy for AI:**

✅ **No abstraction layers**
- What you write is what runs
- No compiler transforms
- No framework magic

✅ **Direct DOM manipulation**
- Explicit: `element.textContent = value`
- Clear cause and effect
- No hidden reactivity

✅ **Standard web APIs**
- Well-documented MDN resources
- Stable APIs (backward compatible)
- AI trained on massive vanilla JS corpus

✅ **No framework-specific knowledge**
- Just JavaScript + DOM APIs
- Fewer concepts to learn
- No framework version churn

✅ **Full control**
- No framework constraints
- Can do exactly what's needed
- No "fighting the framework"

**What creates friction:**

⚠️ **Manual everything**
- No automatic UI updates
- Easy to forget to update DOM
- State and UI can desync silently

⚠️ **No conventions**
- Every project structures code differently
- AI can't rely on patterns
- Hard to know "the right way"

⚠️ **Lots of boilerplate**
- Event listener management
- State synchronization
- Derived state tracking
- All manual

⚠️ **Easy to write buggy code**
- Memory leaks (forgotten event listeners)
- State sync bugs
- No warnings or guardrails

⚠️ **No built-in patterns for**
- Component lifecycle
- Props/state management
- Conditional rendering
- List rendering with keys
- Async state

⚠️ **Verbosity**
- `document.getElementById()` vs `ref()`
- Manual DOM creation vs JSX/templates
- More code to accomplish same result

**Overall AI-Friendliness: 6/10**

Vanilla JS is AI-friendly in simplicity (no magic) but unfriendly in verbosity and lack of patterns. AI must reinvent common solutions every time.

**The paradox**: Simplest conceptually, most complex in practice.

## Rendering

### Philosophy & Approach

Vanilla JS rendering philosophy: **"Imperative DOM manipulation - you control everything"**

**Core reality**:
- **No framework**: You call DOM APIs directly
- **Imperative**: Tell browser exactly what to do
- **Manual updates**: Change state → manually update DOM
- **No virtual DOM**: Direct mutations to actual DOM

**Mental model**:
- Framework: "Describe UI, framework updates DOM"
- Vanilla: "Call DOM methods to build/update UI"

**The baseline**: This is what browsers provide. All frameworks abstract over these APIs.

### Update Strategy

**Manual** - You decide when and how to update:

**1. innerHTML** (easiest, slowest, dangerous):

```javascript
function render() {
  document.getElementById('app').innerHTML = `
    <div>
      <h1>Count: ${count}</h1>
      <button onclick="increment()">Increment</button>
    </div>
  `
}

// Destroys and recreates entire subtree!
// Event listeners lost!
// XSS vulnerable if using user input!
```

**2. Direct property assignment** (surgical, safe):

```javascript
function updateCount() {
  document.getElementById('count').textContent = count
}

// Only updates specific element
// Fast and safe
```

**3. createElement** (verbose, safe, flexible):

```javascript
function createUI() {
  const container = document.createElement('div')
  const heading = document.createElement('h1')
  const button = document.createElement('button')

  heading.textContent = `Count: ${count}`
  button.textContent = 'Increment'
  button.onclick = increment

  container.appendChild(heading)
  container.appendChild(button)

  return container
}

document.body.appendChild(createUI())
```

**4. Template literals with sanitization**:

```javascript
function render() {
  const template = document.createElement('template')
  template.innerHTML = `
    <div>
      <h1>Count: ${count}</h1>
      <button>Increment</button>
    </div>
  `

  const node = template.content.cloneNode(true)
  node.querySelector('button').onclick = increment

  document.getElementById('app').replaceChildren(node)
}
```

**5. Differential updates** (manual reconciliation):

```javascript
function updateList(newItems) {
  const list = document.getElementById('list')
  const currentItems = Array.from(list.children)

  // Add new items
  newItems.forEach((item, i) => {
    if (currentItems[i]) {
      // Update existing
      currentItems[i].textContent = item.name
    } else {
      // Add new
      const li = document.createElement('li')
      li.textContent = item.name
      list.appendChild(li)
    }
  })

  // Remove extras
  while (list.children.length > newItems.length) {
    list.lastChild.remove()
  }
}
```

**The reality**: You're building your own rendering engine, or living with full re-renders.

### Reconciliation

**No reconciliation** - You do it manually:

**Problem**: How do you efficiently update UI when state changes?

**Naive approach** - Full re-render:
```javascript
function render() {
  app.innerHTML = ''  // Destroy everything
  app.appendChild(createUI())  // Rebuild everything
}

// Problems:
// - Loses form input state
// - Loses scroll position
// - Loses focus
// - Destroys and recreates DOM (slow)
// - Event listeners lost
```

**Manual reconciliation** - Track elements:

```javascript
const elementCache = new Map()

function updateItem(item) {
  let element = elementCache.get(item.id)

  if (!element) {
    // Create new
    element = document.createElement('li')
    elementCache.set(item.id, element)
    list.appendChild(element)
  }

  // Update existing
  element.textContent = item.name

  // Position might be wrong, need to handle ordering too!
}
```

**You're reinventing React's reconciliation** - that's why React exists!

**Keys** - Manual tracking:

```javascript
const itemElements = {}

function renderList(items) {
  const list = document.getElementById('list')

  // Create/update items
  items.forEach(item => {
    if (!itemElements[item.id]) {
      const li = document.createElement('li')
      li.dataset.key = item.id
      itemElements[item.id] = li
      list.appendChild(li)
    }
    itemElements[item.id].textContent = item.name
  })

  // Remove deleted items
  Object.keys(itemElements).forEach(key => {
    if (!items.find(item => item.id == key)) {
      itemElements[key].remove()
      delete itemElements[key]
    }
  })
}
```

**The truth**: Frameworks handle this complexity for you.

### Templating & Syntax

**No templating** - Multiple approaches:

**1. Template literals** (modern, convenient):

```javascript
const html = `
  <div class="card">
    <h2>${title}</h2>
    <p>${content}</p>
  </div>
`

element.innerHTML = html
```

**Problems**:
- No syntax highlighting/validation
- XSS vulnerable
- No type checking
- Event handlers must be attached after

**2. Template element** (HTML templates):

```html
<template id="card-template">
  <div class="card">
    <h2 class="title"></h2>
    <p class="content"></p>
  </div>
</template>

<script>
function createCard(title, content) {
  const template = document.getElementById('card-template')
  const clone = template.content.cloneNode(true)

  clone.querySelector('.title').textContent = title
  clone.querySelector('.content').textContent = content

  return clone
}
</script>
```

**3. createElement** (imperative, verbose):

```javascript
function createCard(title, content) {
  const card = document.createElement('div')
  card.className = 'card'

  const heading = document.createElement('h2')
  heading.textContent = title

  const paragraph = document.createElement('p')
  paragraph.textContent = content

  card.appendChild(heading)
  card.appendChild(paragraph)

  return card
}
```

**4. Tagged template literals** (custom):

```javascript
function html(strings, ...values) {
  // Custom template processing
  // Could sanitize, create elements, etc.
  return strings.reduce((result, str, i) =>
    result + str + (values[i] || ''), ''
  )
}

const card = html`
  <div class="card">
    <h2>${title}</h2>
    <p>${content}</p>
  </div>
`
```

**5. lit-html / uhtml** (libraries, not vanilla):

Vanilla JS has no official templating. You choose your own approach.

### Component Model

**No component model** - You build your own:

**1. Factory functions**:

```javascript
function Button({ text, onClick }) {
  const button = document.createElement('button')
  button.textContent = text
  button.onclick = onClick
  return button
}

document.body.appendChild(Button({
  text: 'Click me',
  onClick: () => alert('Clicked!')
}))
```

**2. Classes**:

```javascript
class Button {
  constructor(text, onClick) {
    this.element = document.createElement('button')
    this.element.textContent = text
    this.element.onclick = onClick
  }

  mount(parent) {
    parent.appendChild(this.element)
  }

  destroy() {
    this.element.remove()
  }
}

const btn = new Button('Click me', () => alert('Clicked!'))
btn.mount(document.body)
```

**3. Web Components** (custom elements):

```javascript
class MyButton extends HTMLElement {
  connectedCallback() {
    const text = this.getAttribute('text')
    this.innerHTML = `<button>${text}</button>`

    this.querySelector('button').addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('clicked'))
    })
  }
}

customElements.define('my-button', MyButton)

// Usage (like real HTML!)
<my-button text="Click me"></my-button>

// JavaScript
document.querySelector('my-button')
  .addEventListener('clicked', () => alert('Clicked!'))
```

**4. Revealing module pattern**:

```javascript
const Counter = (function() {
  let count = 0
  let element

  function init(container) {
    element = document.createElement('div')
    element.innerHTML = `
      <span class="count">0</span>
      <button>Increment</button>
    `
    element.querySelector('button').onclick = increment
    container.appendChild(element)
  }

  function increment() {
    count++
    render()
  }

  function render() {
    element.querySelector('.count').textContent = count
  }

  return { init }
})()

Counter.init(document.body)
```

**No standard**:
- No props system
- No lifecycle hooks (except Web Components)
- No child composition (except slots in Web Components)
- You invent your own patterns

### Performance Optimizations

**1. DocumentFragment** (batch DOM changes):

```javascript
const fragment = document.createDocumentFragment()

items.forEach(item => {
  const li = document.createElement('li')
  li.textContent = item.name
  fragment.appendChild(li)
})

// Single reflow instead of N reflows
list.appendChild(fragment)
```

**2. requestAnimationFrame** (smooth animations):

```javascript
function animate() {
  element.style.left = position + 'px'
  position++

  if (position < 500) {
    requestAnimationFrame(animate)
  }
}

requestAnimationFrame(animate)
```

**3. Debouncing/Throttling** (reduce event frequency):

```javascript
function debounce(fn, delay) {
  let timeout
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), delay)
  }
}

input.addEventListener('input', debounce(handleInput, 300))
```

**4. Virtual scrolling** (render only visible items):

```javascript
// Manually calculate which items are visible
// Only create DOM elements for those items
// This is HARD to get right!
```

**5. Avoid layout thrashing**:

```javascript
// ❌ Bad - multiple reflows
elements.forEach(el => {
  el.style.width = el.offsetWidth + 10 + 'px'  // Read + write
})

// ✅ Good - batch reads and writes
const widths = elements.map(el => el.offsetWidth)
elements.forEach((el, i) => {
  el.style.width = widths[i] + 10 + 'px'
})
```

**6. Event delegation**:

```javascript
// ❌ Bad - listener per item
items.forEach(item => {
  item.addEventListener('click', handleClick)
})

// ✅ Good - single listener
list.addEventListener('click', (e) => {
  if (e.target.matches('li')) {
    handleClick(e)
  }
})
```

**You must know and apply all optimizations manually**. No framework doing it for you.

### Developer Experience

**Learning curve: Low to High**
- Basics: Very easy (just JavaScript!)
- Building apps: High (you solve every problem yourself)

**DevTools: Browser DevTools**
- Elements panel: Inspect DOM
- Console: Log and debug
- Performance: Profile rendering
- No framework-specific tools
- No component hierarchy view

**Hot reload: Manual**
- No built-in hot reload
- Need to set up build tools (Vite, etc.)
- Refresh page to see changes
- Lose application state on refresh

### AI-Friendly Assessment

**What makes vanilla rendering AI-friendly:**

✅ **Direct and explicit**
- `element.textContent = value` is clear
- No hidden updates
- Obvious what code does

✅ **Standard APIs**
- DOM APIs are well-documented
- Stable and backward compatible
- AI has seen countless examples

✅ **No magic**
- What you write is what executes
- No compiler transforms
- Predictable behavior

**What creates friction:**

⚠️ **Extreme verbosity**
- Many lines to accomplish simple tasks
- `document.createElement` dance for every element
- Lots of boilerplate

⚠️ **Manual synchronization**
- Easy to forget to update DOM
- State and UI desync silently
- No warnings when out of sync

⚠️ **No patterns**
- Every project reinvents solutions
- AI can't rely on conventions
- Hard to know "correct" approach

⚠️ **Error-prone**
- Easy to create memory leaks
- Easy to lose event listeners
- Easy to write slow code (layout thrashing)

⚠️ **Reconciliation is hard**
- Efficiently updating lists is complex
- Preserving state during updates is tricky
- You're building a framework

**Overall Rendering AI-Friendliness: 5/10**

Vanilla rendering is explicit but extremely verbose and error-prone. AI must write lots of boilerplate and handle many edge cases manually.

## Event Handling

### Philosophy & Approach

Vanilla JS event philosophy: **"Standard DOM events with addEventListener"**

**Core concepts**:
- **Native events**: Browser's built-in event system
- **addEventListener**: Standard API for event handling
- **Event delegation**: Manual pattern for efficiency
- **No framework abstractions**: Direct access to Event objects

**This is the foundation** - all frameworks build on these APIs.

### Event Binding

**addEventListener** - Standard approach:

```javascript
const button = document.getElementById('button')

button.addEventListener('click', function(event) {
  console.log('Clicked!', event)
})

// With arrow function
button.addEventListener('click', (event) => {
  console.log('Clicked!', event)
})

// Named function
function handleClick(event) {
  console.log('Clicked!', event)
}

button.addEventListener('click', handleClick)
```

**Inline handlers** (old school, avoid):

```html
<!-- HTML onclick attribute -->
<button onclick="alert('Clicked!')">Click</button>

<!-- Property assignment -->
<script>
button.onclick = function() {
  alert('Clicked!')
}
</script>
```

**Problems with inline/property**:
- Only one handler per event type
- Global scope pollution
- Hard to remove
- Modern code uses addEventListener

**Options** (capture, once, passive):

```javascript
element.addEventListener('click', handler, {
  capture: true,   // Use capture phase
  once: true,      // Remove after first fire
  passive: true    // Won't call preventDefault()
})

// Shorthand for capture
element.addEventListener('click', handler, true)
```

### Event Flow

**Three phases**:
1. **Capture**: Top to bottom (window → target)
2. **Target**: Event reaches target element
3. **Bubble**: Bottom to top (target → window)

```javascript
// Capture phase
parent.addEventListener('click', handleParent, true)
child.addEventListener('click', handleChild, true)

// Bubble phase (default)
parent.addEventListener('click', handleParent)
child.addEventListener('click', handleChild)

// Click child: handleParent (capture) → handleChild (both) → handleParent (bubble)
```

**stopPropagation** - Stop bubbling:

```javascript
child.addEventListener('click', (e) => {
  e.stopPropagation()  // Parent handlers won't fire
  console.log('Child clicked')
})
```

**stopImmediatePropagation** - Stop all handlers:

```javascript
child.addEventListener('click', (e) => {
  e.stopImmediatePropagation()
  // Other handlers on same element won't fire
})

child.addEventListener('click', () => {
  console.log('Never runs!')
})
```

**preventDefault** - Prevent default behavior:

```javascript
form.addEventListener('submit', (e) => {
  e.preventDefault()  // Don't reload page
  handleSubmit()
})

link.addEventListener('click', (e) => {
  e.preventDefault()  // Don't navigate
  handleCustomNavigation()
})
```

### Event Object

**Native Event** - Standard DOM event:

```javascript
element.addEventListener('click', (event) => {
  // Common properties
  event.type         // 'click'
  event.target       // Element that triggered event
  event.currentTarget  // Element listener is attached to
  event.timeStamp    // When event occurred

  // Methods
  event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation()

  // Phase
  event.eventPhase   // 1=capture, 2=target, 3=bubble
  event.bubbles      // true if event bubbles
  event.cancelable   // true if can preventDefault()
})
```

**MouseEvent**:

```javascript
element.addEventListener('click', (e) => {
  e.clientX, e.clientY   // Viewport coordinates
  e.pageX, e.pageY       // Document coordinates
  e.screenX, e.screenY   // Screen coordinates
  e.button               // Which mouse button (0=left, 1=middle, 2=right)
  e.buttons              // Bitmask of pressed buttons
  e.altKey, e.ctrlKey, e.shiftKey, e.metaKey  // Modifier keys
})
```

**KeyboardEvent**:

```javascript
input.addEventListener('keydown', (e) => {
  e.key      // 'Enter', 'a', 'ArrowUp'
  e.code     // 'Enter', 'KeyA', 'ArrowUp'
  e.keyCode  // Deprecated
  e.altKey, e.ctrlKey, e.shiftKey, e.metaKey

  if (e.key === 'Enter') {
    handleSubmit()
  }
})
```

**InputEvent** / **Event** (for inputs):

```javascript
input.addEventListener('input', (e) => {
  e.target.value  // Current input value
  e.inputType     // 'insertText', 'deleteContentBackward'
})

input.addEventListener('change', (e) => {
  e.target.value  // Value when input loses focus or selection changes
})
```

### Common Patterns

**1. Event delegation** (critical pattern):

```javascript
// ❌ Bad - listener per item (doesn't scale)
document.querySelectorAll('.item').forEach(item => {
  item.addEventListener('click', handleItemClick)
})

// ✅ Good - single listener on parent
list.addEventListener('click', (e) => {
  const item = e.target.closest('.item')
  if (item) {
    handleItemClick(item)
  }
})
```

**2. Form handling**:

```javascript
form.addEventListener('submit', (e) => {
  e.preventDefault()

  const formData = new FormData(e.target)
  const data = Object.fromEntries(formData)

  console.log(data)  // { name: '...', email: '...' }
})
```

**3. Passing data to handlers**:

```javascript
// ❌ Creates new function per item
items.forEach(item => {
  const button = createButton()
  button.addEventListener('click', () => handleClick(item))
})

// ✅ Use data attributes
button.dataset.id = item.id
list.addEventListener('click', (e) => {
  const id = e.target.dataset.id
  handleClick(id)
})
```

**4. Removing listeners**:

```javascript
// Must use same function reference!
function handleClick() {
  console.log('Clicked')
}

button.addEventListener('click', handleClick)
button.removeEventListener('click', handleClick)

// ❌ This won't work - different function
button.addEventListener('click', () => console.log('Click'))
button.removeEventListener('click', () => console.log('Click'))

// AbortController (modern)
const controller = new AbortController()

button.addEventListener('click', handleClick, {
  signal: controller.signal
})

// Remove all listeners added with this signal
controller.abort()
```

**5. Debouncing/Throttling**:

```javascript
function debounce(fn, delay) {
  let timeout
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), delay)
  }
}

input.addEventListener('input', debounce((e) => {
  console.log('Search:', e.target.value)
}, 300))
```

**6. Custom events**:

```javascript
// Dispatch custom event
element.dispatchEvent(new CustomEvent('myevent', {
  detail: { data: 'some data' },
  bubbles: true
}))

// Listen for custom event
element.addEventListener('myevent', (e) => {
  console.log(e.detail.data)
})
```

### Performance Considerations

**Event delegation** - Essential for performance:

```javascript
// For 1000 items:
// ❌ Bad: 1000 event listeners
items.forEach(item => {
  item.addEventListener('click', handleClick)
})

// ✅ Good: 1 event listener
list.addEventListener('click', (e) => {
  // Handle all items
})
```

**Passive listeners** - Improve scroll performance:

```javascript
// Tells browser handler won't call preventDefault()
element.addEventListener('scroll', handleScroll, {
  passive: true  // Browser can optimize
})
```

**Memory leaks** - Must remove listeners:

```javascript
function mountComponent(element) {
  function handleClick() {
    console.log('Clicked')
  }

  element.addEventListener('click', handleClick)

  // Must return cleanup function!
  return () => {
    element.removeEventListener('click', handleClick)
  }
}

const cleanup = mountComponent(button)

// Later...
cleanup()  // Remove listener
```

**Common leak**: Listeners on removed elements:

```javascript
button.addEventListener('click', handleClick)
button.remove()  // Element removed from DOM
// But listener still in memory! (though browser may GC eventually)
```

**AbortController** helps manage cleanup:

```javascript
const controller = new AbortController()

// Add multiple listeners with same signal
button.addEventListener('click', handler1, { signal: controller.signal })
input.addEventListener('input', handler2, { signal: controller.signal })
form.addEventListener('submit', handler3, { signal: controller.signal })

// Clean up all at once
controller.abort()
```

### Developer Experience

**Debugging: Browser DevTools**
- Console: Log event objects
- Sources: Set breakpoints in handlers
- Event listener breakpoints: Break on all events of a type
- No framework-specific tools

**Common mistakes**:
- Forgetting to remove listeners (memory leaks)
- Using arrow functions and unable to remove
- Calling handler instead of passing reference: `addEventListener('click', handleClick())`
- Not using event delegation for dynamic content

**No type safety without TypeScript**:

```typescript
element.addEventListener('click', (e: MouseEvent) => {
  e.clientX  // TypeScript knows about MouseEvent properties
})
```

### AI-Friendly Assessment

**What makes vanilla events AI-friendly:**

✅ **Standard web APIs**
- Well-documented on MDN
- Stable and backward compatible
- AI has seen endless examples

✅ **Explicit**
- `addEventListener` is clear
- Event object has all needed info
- No magic, no indirection

✅ **Full Event object access**
- All native properties available
- No framework wrappers
- Direct browser APIs

**What creates friction:**

⚠️ **Memory leak potential**
- Must manually remove listeners
- Easy to forget
- No warnings when leaking

⚠️ **Verbose**
- `addEventListener` is long to type
- Remove requires same function reference
- Lots of boilerplate

⚠️ **Event delegation is manual**
- Must implement pattern yourself
- Easy to get wrong
- No built-in support

⚠️ **No declarative modifiers**
- Must call `preventDefault()` manually
- Must call `stopPropagation()` manually
- More imperative code

⚠️ **Cleanup complexity**
- Must track all listeners to remove
- AbortController helps but adds complexity
- Easy to leak

**Overall Event Handling AI-Friendliness: 7/10**

Vanilla events are explicit and standard, but verbose and error-prone. Manual memory management is the biggest friction.

### Component Reusability Assessment

**Quality: Good (7/10)**

**Strengths**: Web Components are standards-based - work everywhere. No build tools required. No framework lock-in. Custom elements register once, use anywhere. Template literals enable composition. Modules (ESM) for code splitting. CSS custom properties for theming. Shadow DOM provides encapsulation.

**Weaknesses**: Boilerplate-heavy - lots of manual DOM manipulation. No reactivity - must manually update DOM. Lifecycle callbacks verbose. Props require setAttribute/getAttribute. No type safety without TypeScript setup. Testing requires DOM environment. State management manual.

**Cross-Project Reuse**: Excellent for web components - true framework independence. Functions and classes reusable via ES modules. Cannot leverage framework ecosystems. Design systems require manual work.

**Design System Support**: Possible but manual. Web components ideal but require implementation work. Shoelace (web components) proves viability. CSS custom properties for tokens. Shadow DOM for encapsulation. More effort than framework component libraries.

## Maintainability

**Quality: Fair (6/10)**

**Strengths**: No framework churn - JavaScript is stable. No build tools means simple setup. Browser DevTools work perfectly. No magic - what you write is what runs. Standards-based means longevity. TypeScript can add type safety. Code splits with ES modules.

**Weaknesses**: Manual DOM updates error-prone. No reactivity means forgetting to update UI. Memory leaks from event listeners. querySelector fragile (typos, structure changes break code). No DevTools for component state. Verbose compared to frameworks. Testing requires DOM setup (jsdom). No hot reload without tooling. Performance optimization manual.

**Code Organization**: No enforced structure - every project different. Common patterns: modules by feature, separate DOM/logic/styles. Web components enforce some structure. Utils libraries for helpers.

**Testing**: Jest + jsdom for unit tests. Playwright/Cypress for E2E. Must mock DOM methods. Component testing harder without framework. querySelector makes tests brittle. Snapshot testing possible but manual.

**Debugging**: Browser DevTools excellent. Can set breakpoints, inspect DOM, profile performance. No component tree view like React DevTools. Console.log everywhere. Network tab for fetch. No time-travel debugging.

**Scalability**: Fair. Large vanilla apps require discipline. No automatic code-splitting - manual with import(). No component boundaries - must design yourself. State management requires library or custom implementation. Performance requires manual optimization (virtualization, etc.). Large apps benefit from micro-framework approach.

**Breaking Changes**: JavaScript evolves slowly. Web standards stable. No framework updates to track. Polyfills for old browsers. Most maintenance is dependency updates (bundlers, TypeScript, etc.).

## AI-Assisted Development Considerations

### What Works Well with AI

**No framework to learn**
- Just JavaScript + DOM APIs
- Fewer concepts to understand
- Standard web platform

**Explicit and predictable**
- What you write is what runs
- No compiler magic
- No hidden behavior

**Maximum flexibility**
- Can do anything browsers support
- No framework constraints
- Full control

**Direct debugging**
- Set breakpoints in your code
- No framework internals to trace
- Console.log just works

### What Creates Friction

**Reinventing everything**
- No state management
- No component model
- No reactivity
- Must build from scratch

**Extreme verbosity**
- Lots of boilerplate
- Manual DOM manipulation
- Verbose API names

**Easy to write buggy code**
- Memory leaks (forgotten listeners)
- State/UI desync
- Performance issues (layout thrashing)
- XSS vulnerabilities (innerHTML with user input)

**No patterns or conventions**
- Every project different
- AI can't rely on structure
- Hard to know "right" way

**Manual optimization**
- Must know and apply all best practices
- Easy to write slow code
- No framework optimizations

**Lots of edge cases**
- Event listener cleanup
- List reconciliation
- Form state
- All manual

### Opportunities for Improvement

**What vanilla JS teaches us for next-gen frameworks:**

1. **Explicitness is good**
   - Direct DOM manipulation is clear
   - No magic makes debugging easier
   - Frameworks should minimize magic

2. **But automation is necessary**
   - Manual state/UI sync is error-prone
   - Automatic reactivity is huge win
   - Frameworks exist for a reason

3. **Standard APIs are powerful**
   - Web Components show native can work
   - Template element is useful
   - Proxy enables reactivity

4. **Verbosity hurts**
   - `document.createElement` is tedious
   - Framework terseness (JSX, templates) helps
   - But don't hide too much

5. **Memory management matters**
   - Easy to leak with manual listeners
   - Frameworks should handle cleanup
   - Automatic lifecycle management is valuable

6. **Event delegation pattern is powerful**
   - Should be framework default
   - Frameworks can automate this
   - Huge performance win

**For next-gen frameworks:**
- Keep explicitness of vanilla (what you write is clear)
- Add automatic reactivity (state → UI)
- Provide component model (but stay close to web standards)
- Handle memory management automatically
- Minimize magic, maximize clarity

**Final AI-Friendliness: 6/10**
- State Management: 6/10 (total freedom, total responsibility)
- Rendering: 5/10 (explicit but extremely verbose)
- Event Handling: 7/10 (standard APIs, but manual cleanup)

**The truth**: Vanilla JS is the simplest in concept but most complex in practice. Frameworks exist because managing state, rendering, and events manually at scale is untenable.

**For AI**: Vanilla JS forces AI to write more code and handle more edge cases. Frameworks with good patterns help AI by providing conventions and safety rails.

**The baseline value**: Understanding vanilla JS shows *why* frameworks exist and what problems they solve. Every framework is built on these foundations.
