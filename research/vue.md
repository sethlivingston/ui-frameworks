---
framework: "Vue"
version: "3.5.25"
category: "full-framework"

# Links & Resources
github_url: "https://github.com/vuejs/core"
docs_url: "https://vuejs.org"
npm_package: "vue"
mcp_server:
  available: false
  url: null
  party: null

# Technical metadata
implementation_language: "TypeScript"
typescript_support: "native"
license: "MIT"
runtime: "browser"

# Capabilities
capabilities:
  state_management: true
  rendering: true
  event_handling: true

# Classification (for searching)
paradigm: "reactive"
state_model: "mutable"
rendering_strategy: "virtual-dom"

# Maintenance
maintainer: "Evan You"
first_released: "2014"
status: "active"

# Review metadata
reviewed_date: "2025-12-06"
reviewed_by_model: "Claude Sonnet 4.5"
reviewer_notes: "Full framework review. Vue 3 uses Composition API, Proxy-based reactivity, and template-based rendering. Pinia is the official state management library."
---

# Vue

## State Management

### Philosophy & Mental Model

Vue's state philosophy: **"Mutable-looking reactive state"**

**Core insight**: State looks mutable but is deeply reactive under the hood via JavaScript Proxies.

Key concepts:
- **Reactive by default**: Any object/ref becomes automatically reactive
- **Mutable API**: Update state directly (`count.value++`), no immutable patterns required
- **Fine-grained reactivity**: Only components using specific reactive properties re-render
- **Progressive framework**: Start simple (local state), scale up (Pinia for global state)
- **Composition over inheritance**: Composition API favors composable functions over class inheritance

**Mental model shift from React**:
- React: Immutable updates (`setState({ ...state, count: state.count + 1 })`)
- Vue: Mutable-looking (`state.count++`) but reactivity underneath tracks changes

**Philosophy**: "The Progressive Framework" - use as little or as much as you need. Vue doesn't force architectural decisions.

### Core Primitives

**1. ref() - Reactive primitive wrapper** (recommended):

```typescript
import { ref } from 'vue'

const count = ref(0)

// Access with .value in JavaScript
count.value++
console.log(count.value) // 1

// Auto-unwrapped in templates (no .value needed)
<template>
  <button @click="count++">{{ count }}</button>
</template>
```

**Why ref**: Can hold any value type (primitives or objects), preserves reactivity when passed to functions, and unwraps nicely in templates.

**2. reactive() - Reactive object**:

```typescript
import { reactive } from 'vue'

const state = reactive({
  count: 0,
  message: 'Hello'
})

// Direct property access (no .value)
state.count++
```

**Limitations of reactive()**:
- Only works with objects/arrays/collections (not primitives)
- Can't replace entire object without losing reactivity
- Destructuring breaks reactivity: `let { count } = state` loses connection

**Recommendation**: Use `ref()` as primary API to avoid these pitfalls.

**3. computed() - Derived state**:

```typescript
import { computed } from 'vue'

const count = ref(0)
const doubled = computed(() => count.value * 2)

// Read-only by default
console.log(doubled.value) // 0

// Writable computed (advanced)
const fullName = computed({
  get() {
    return `${firstName.value} ${lastName.value}`
  },
  set(value) {
    [firstName.value, lastName.value] = value.split(' ')
  }
})
```

**4. watch/watchEffect() - Side effects**:

```typescript
// watch - explicit dependencies
watch(count, (newVal, oldVal) => {
  console.log(`Count changed from ${oldVal} to ${newVal}`)
})

// watchEffect - automatic dependency tracking
watchEffect(() => {
  console.log(`Count is ${count.value}`)
  // Automatically re-runs when count changes
})
```

**5. Pinia (official global state library)**:

```typescript
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', () => {
  // State
  const count = ref(0)

  // Getters (computed)
  const doubled = computed(() => count.value * 2)

  // Actions (methods)
  function increment() {
    count.value++
  }

  return { count, doubled, increment }
})

// Usage in component
import { useCounterStore } from '@/stores/counter'

const counter = useCounterStore()
counter.increment()
console.log(counter.doubled)
```

**Pinia features**:
- Composition API-style
- Lightweight (~1.5kb)
- Native TypeScript support
- DevTools integration
- Modular stores
- **Official replacement** for Vuex

### Update Mechanism

**Mutable updates** - Direct assignment triggers reactivity:

```typescript
// Primitives with ref
const count = ref(0)
count.value++  // Reactive update
count.value = 10  // Reactive update

// Objects with reactive
const state = reactive({
  user: { name: 'John', age: 30 },
  items: [1, 2, 3]
})

state.user.age++  // Reactive (deep reactivity)
state.items.push(4)  // Reactive (array mutations work!)
state.user = { name: 'Jane', age: 25 }  // Reactive (object replacement works!)
```

**Huge difference from React**: Direct mutations work! No spread operators needed.

**How it works under the hood** - JavaScript Proxies:

Conceptually, a ref works like:
```typescript
const myRef = {
  _value: 0,
  get value() {
    track()  // Vue tracks this dependency
    return this._value
  },
  set value(newValue) {
    this._value = newValue
    trigger()  // Vue triggers updates
  }
}
```

**Deep reactivity by default**:
```typescript
const obj = ref({
  nested: { deep: { count: 0 } }
})

obj.value.nested.deep.count++  // Automatically reactive!
```

**Shallow reactivity** (opt-in for performance):
```typescript
import { shallowRef, shallowReactive } from 'vue'

const state = shallowReactive({
  foo: 1,
  nested: { count: 0 }
})

state.foo++  // Reactive
state.nested.count++  // NOT reactive (shallow)
state.nested = { count: 1 }  // Reactive (root property change)
```

**DOM update timing** - Batched, asynchronous:

```typescript
import { nextTick } from 'vue'

count.value++
count.value++
count.value++
// Only ONE DOM update happens (batched)

// Wait for DOM update
await nextTick()
// DOM is now updated
```

**Reactivity limitations**:

```typescript
// ❌ This breaks reactivity with reactive()
let { count } = reactive({ count: 0 })
count++  // Doesn't update component!

// ✅ Use ref for primitives
const count = ref(0)
count.value++  // Works!

// ✅ Or toRefs for destructuring
const state = reactive({ count: 0 })
const { count } = toRefs(state)  // count is now a ref
count.value++  // Works!
```

### Read Pattern

**In templates** - Direct access (auto-unwrapping):

```vue
<script setup>
const count = ref(0)
const state = reactive({ message: 'Hello' })
</script>

<template>
  <!-- ref auto-unwraps, no .value needed -->
  <div>{{ count }}</div>

  <!-- reactive direct access -->
  <div>{{ state.message }}</div>
</template>
```

**In JavaScript** - Explicit `.value` for refs:

```typescript
<script setup>
const count = ref(0)

// Must use .value
console.log(count.value)
count.value++

// Computed also needs .value
const doubled = computed(() => count.value * 2)
console.log(doubled.value)
</script>
```

**Composition API vs Options API**:

```vue
<!-- Composition API (modern) -->
<script setup>
import { ref, computed } from 'vue'

const count = ref(0)
const doubled = computed(() => count.value * 2)

function increment() {
  count.value++
}
</script>

<!-- Options API (legacy) -->
<script>
export default {
  data() {
    return { count: 0 }
  },
  computed: {
    doubled() {
      return this.count * 2
    }
  },
  methods: {
    increment() {
      this.count++
    }
  }
}
</script>
```

**Composition API advantages**:
- Better TypeScript inference
- Better logic reusability (composables)
- More explicit dependencies
- Tree-shakable
- Less magic (`this` confusion)

**Accessing state outside components** - Pinia stores:

```typescript
import { useCounterStore } from '@/stores/counter'

// Can be called outside components
const counter = useCounterStore()
counter.increment()
```

### Reactivity & Granularity

**Fine-grained reactivity** - More granular than React, less than Solid:

**What triggers re-renders**:
- Only components that access specific reactive properties
- Not entire component tree like React
- But still component-level, not DOM-element-level like Solid

**Example**:
```vue
<script setup>
const user = reactive({
  name: 'John',
  age: 30,
  email: 'john@example.com'
})
</script>

<template>
  <!-- Only re-renders when name changes -->
  <div>{{ user.name }}</div>

  <!-- Only re-renders when age changes -->
  <div>{{ user.age }}</div>

  <!-- Only re-renders when email changes -->
  <div>{{ user.email }}</div>
</template>
```

**Compiler optimizations** (Vue 3.5+):
- Template compiler analyzes dependencies
- Generates optimized update code
- Minimizes unnecessary re-renders
- No manual memoization needed (unlike React)

**Comparison**:
- **React**: Parent re-renders → all children re-render (component-level, coarse)
- **Vue**: Parent re-renders → only children using changed data re-render (property-level, fine)
- **Solid**: State changes → only specific DOM nodes update (DOM-level, finest)

**No manual optimization needed** in most cases:

```vue
<!-- No memo, useMemo, useCallback needed -->
<script setup>
const list = ref([/* huge list */])
const filteredList = computed(() => {
  return list.value.filter(item => item.active)
})
// Computed automatically memoizes
// Only re-runs when list changes
</script>
```

**Performance characteristics**:
- **Better than React**: Fine-grained tracking, automatic optimization
- **Worse than Solid/Svelte**: Still uses Virtual DOM (diffing overhead)
- **Upcoming Vapor Mode**: Opt-in mode that eliminates Virtual DOM (in development)

### Async Handling

**No built-in async state primitives** (like TanStack Query):

**Common patterns**:

**1. Manual with ref + watch**:
```typescript
<script setup>
const data = ref(null)
const loading = ref(false)
const error = ref(null)

async function fetchData() {
  loading.value = true
  error.value = null
  try {
    const response = await fetch('/api/data')
    data.value = await response.json()
  } catch (e) {
    error.value = e
  } finally {
    loading.value = false
  }
}

// Fetch on mount
import { onMounted } from 'vue'
onMounted(fetchData)
</script>

<template>
  <div v-if="loading">Loading...</div>
  <div v-else-if="error">Error: {{ error.message }}</div>
  <div v-else>{{ data }}</div>
</template>
```

**2. Suspense** (experimental in Vue 3):
```vue
<script setup>
// Top-level await in <script setup> triggers Suspense
const data = await fetch('/api/data').then(r => r.json())
</script>

<template>
  <div>{{ data }}</div>
</template>

<!-- Parent component -->
<Suspense>
  <template #default>
    <AsyncComponent />
  </template>
  <template #fallback>
    <Loading />
  </template>
</Suspense>
```

**3. VueUse composables** (community library):
```typescript
import { useFetch } from '@vueuse/core'

const { data, error, isFetching } = useFetch('/api/data').json()
```

**4. External libraries** (recommended for complex async):
- TanStack Query (Vue Query)
- VueUse
- Custom composables

**Vue's philosophy**: Provide primitives (Suspense, watchEffect), let ecosystem build solutions.

### Derived State

**computed() - Primary pattern**:

```typescript
const items = ref([
  { name: 'Apple', price: 1.5 },
  { name: 'Banana', price: 0.8 }
])

// Simple derivation
const total = computed(() => {
  return items.value.reduce((sum, item) => sum + item.price, 0)
})

// Multi-source derivation
const tax = ref(0.1)
const totalWithTax = computed(() => {
  return total.value * (1 + tax.value)
})

// Chaining computeds
const formatted = computed(() => {
  return `$${totalWithTax.value.toFixed(2)}`
})
```

**Computed features**:
- Automatic memoization (only recomputes when dependencies change)
- Automatic dependency tracking (no dependency arrays!)
- Lazy evaluation (only computes when accessed)
- Can chain computeds

**Comparison to React**:
```typescript
// React - manual dependency arrays
const total = useMemo(() => {
  return items.reduce((sum, item) => sum + item.price, 0)
}, [items])  // Easy to forget dependencies!

// Vue - automatic
const total = computed(() => {
  return items.value.reduce((sum, item) => sum + item.price, 0)
})  // Tracks items.value automatically
```

**Comparison to Jotai**:
- Jotai: `const totalAtom = atom((get) => get(itemsAtom).reduce(...))`
- Vue: `const total = computed(() => items.value.reduce(...))`
- Very similar! Both have automatic dependency tracking

**Getters in Pinia**:
```typescript
export const useStore = defineStore('main', () => {
  const items = ref([...])

  // Getter (computed)
  const total = computed(() => {
    return items.value.reduce((sum, item) => sum + item.price, 0)
  })

  return { items, total }
})
```

### Developer Experience

**Boilerplate: Low**
- Simple cases: Very low (`ref(0)` is minimal)
- No immutable update verbosity (unlike React)
- Pinia stores are clean and composable
- `<script setup>` reduces boilerplate significantly

**Comparison**:
```vue
<!-- Vue - concise -->
<script setup>
const count = ref(0)
</script>

<template>
  <button @click="count++">{{ count }}</button>
</template>

<!-- React - similar but slightly more verbose -->
<script>
const [count, setCount] = useState(0)

return <button onClick={() => setCount(count + 1)}>{count}</button>
</script>
```

**DevTools: Excellent**
- Vue DevTools v7 (latest)
- Component tree inspection
- Props/state/computed inspection
- **Time-travel debugging** - explore state at different moments
- **Live editing** - modify state in real-time
- **Performance profiling** - Timeline tab shows render times
- Split screen and separate window modes
- Vite Inspect tab (file sizes and eval times)
- Command palette (Ctrl+K/Cmd+K)
- Pinia integration (inspect stores)

**Debugging: Excellent**
- Clear component hierarchy
- Reactive dependency tracking visible
- Warning messages are helpful
- Can inspect ref/reactive values directly
- Source maps work well

**Time travel: Yes (via DevTools)**
- Built into Vue DevTools
- Can explore state at different times
- Rewind and replay state changes

**TypeScript support: Excellent (Native)**
- Vue 3 written in TypeScript (96.6%)
- Strong type inference for refs/reactive
- Generic components supported
- Template type checking with Volar
- Better than React's @types package

```typescript
// Type inference works great
const count = ref(0)  // Ref<number>
const user = ref<User>({ name: 'John', age: 30 })

// Computed inference
const doubled = computed(() => count.value * 2)  // ComputedRef<number>

// Props with TypeScript
defineProps<{
  title: string
  count?: number
}>()
```

### AI-Friendly Assessment

**What makes Vue state management AI-friendly:**

✅ **Mutable API is intuitive**
- `count.value++` is simple and direct
- No spread operator confusion
- Mirrors how humans think about state changes

✅ **Automatic dependency tracking**
- No dependency arrays to maintain (unlike React useEffect)
- `computed()` just works - tracks what it uses
- Hard to make mistakes with dependencies

✅ **Explicit reactivity wrappers**
- `ref()` and `reactive()` make it clear what's reactive
- Can see reactive state at a glance
- No hidden magic

✅ **Composition API is composable**
- Functions that return refs/computed are reusable
- Clear composition patterns
- Easy to extract and share logic

✅ **Great TypeScript inference**
- Types flow naturally
- Fewer manual type annotations needed
- Catches errors at compile time

**What creates friction:**

⚠️ **ref .value confusion**
- Must use `.value` in JavaScript, not in templates
- Easy to forget `.value` in script
- Inconsistent between script and template

⚠️ **reactive() limitations**
- Destructuring breaks reactivity
- Can't replace entire object
- Not obvious when it fails

⚠️ **Unwrapping rules complexity**
- Top-level props unwrap in templates
- Nested props don't unwrap
- Arrays/Maps don't unwrap
- Confusing edge cases

⚠️ **Proxy vs original object**
- `reactive()` returns Proxy, not equal to original
- Must use proxy, not original
- Can cause bugs if not understood

⚠️ **Two APIs** (Composition vs Options)
- Need to know both (legacy code uses Options API)
- Different mental models
- Context switching

**Overall AI-Friendliness: 8/10**

Vue's state management is very AI-friendly due to intuitive mutable API, automatic dependency tracking, and excellent TypeScript support. Main challenges are `.value` inconsistency and reactive() edge cases.

**Compared to React**: More AI-friendly (no immutable verbosity, automatic dependencies)
**Compared to Jotai**: Similar friendliness (both have automatic tracking)

## Rendering

### Philosophy & Approach

Vue's rendering philosophy: **"Template-based declarative rendering with compiler optimization"**

**Core concepts**:
- **HTML-based templates**: Write UI in enhanced HTML, not JSX
- **Compiler-first**: Templates compile to optimized JavaScript
- **Virtual DOM**: Efficient DOM updates via diffing (like React)
- **Declarative**: Describe UI with directives, Vue handles updates
- **Progressive**: Can use Vue in part of a page or entire SPA

**Mental model**:
- **Templates** → Compiler → Optimized render functions → Virtual DOM → Actual DOM
- Unlike React: Templates are **separate** from JavaScript (can use render functions if needed)

**Philosophy**: "The Progressive Framework" - works with your existing HTML, enhances it progressively.

### Update Strategy

**Reactive re-rendering** - Automatic when reactive state changes:

**Trigger sources**:
- Reactive data changes (ref/reactive)
- Props changes from parent
- Computed values update
- Store state changes (Pinia)

**Rendering process**:
1. **Track** - Component uses reactive data (e.g., `{{ count }}`)
2. **Change** - Reactive data updates (`count.value++`)
3. **Trigger** - Vue schedules component re-render
4. **Batch** - Multiple updates batched into single render
5. **Virtual DOM diff** - New vs old virtual DOM comparison
6. **Patch** - Minimal DOM changes applied

**Batching** (automatic):
```typescript
count.value++
message.value = 'Hello'
items.value.push(newItem)
// All three updates batched into ONE re-render

await nextTick()
// DOM is now updated
```

**Fine-grained updates** - Only components using changed data re-render:

```vue
<template>
  <Parent>
    <Child1 />  <!-- Doesn't use count, won't re-render -->
    <Child2 :count="count" />  <!-- Uses count, will re-render -->
  </Parent>
</template>
```

**Compiler optimizations** (Vue 3):
- **Static hoisting**: Static content hoisted out of render function
- **Patch flags**: Marks dynamic content for efficient diffing
- **Cache handlers**: Event handlers automatically cached

```vue
<template>
  <div>
    <!-- Static - hoisted, never re-renders -->
    <h1>Static Title</h1>

    <!-- Dynamic - marked for efficient update -->
    <p>{{ message }}</p>
  </div>
</template>
```

### Reconciliation

**Virtual DOM diffing** - Similar to React:

**Algorithm**:
1. Compare new virtual DOM with previous
2. Find minimal set of changes
3. Apply patches to actual DOM

**Key optimizations**:
- **Keys in lists**: Stable identity for elements
- **Component type stability**: Same component type → update, different → replace
- **Static content optimization**: Static parts never diff'd

**Keys** (critical for lists):
```vue
<!-- ❌ Without keys - inefficient -->
<div v-for="item in items">{{ item.name }}</div>

<!-- ✅ With keys - efficient -->
<div v-for="item in items" :key="item.id">{{ item.name }}</div>
```

**Vue 3 compiler optimizations make diffing faster**:
- Patch flags tell differ exactly what changed
- Static content skipped entirely
- Block trees reduce tree traversal

**Upcoming: Vapor Mode** (in development):
- No Virtual DOM at all
- Direct DOM manipulation (like Solid/Svelte)
- Opt-in mode for maximum performance
- Must use Composition API

### Templating & Syntax

**HTML-based templates** with Vue directives:

**Text interpolation**:
```vue
<template>
  <p>Message: {{ message }}</p>
  <p>Computed: {{ computedValue }}</p>
  <p>Expression: {{ count * 2 + 1 }}</p>
</template>
```

**Directives** - Special attributes with `v-` prefix:

**v-bind** (`:` shorthand) - Bind attributes:
```vue
<img :src="imageSrc" :alt="imageAlt" />
<div :class="{ active: isActive }" />
<div :style="{ color: textColor }" />

<!-- Dynamic attribute names -->
<button :[attributeName]="value" />
```

**v-if/v-else-if/v-else** - Conditional rendering:
```vue
<div v-if="type === 'A'">Type A</div>
<div v-else-if="type === 'B'">Type B</div>
<div v-else>Other</div>

<!-- v-show - toggles CSS display -->
<div v-show="visible">Toggle with CSS</div>
```

**v-for** - List rendering:
```vue
<li v-for="item in items" :key="item.id">
  {{ item.name }}
</li>

<!-- With index -->
<li v-for="(item, index) in items" :key="item.id">
  {{ index }}: {{ item.name }}
</li>

<!-- Object iteration -->
<div v-for="(value, key) in object" :key="key">
  {{ key }}: {{ value }}
</div>
```

**v-model** - Two-way binding:
```vue
<!-- Input -->
<input v-model="text" />

<!-- Checkbox -->
<input type="checkbox" v-model="checked" />

<!-- Select -->
<select v-model="selected">
  <option value="a">A</option>
  <option value="b">B</option>
</select>

<!-- Custom component -->
<CustomInput v-model="value" />
```

**v-html** - Raw HTML (dangerous):
```vue
<div v-html="rawHtml"></div>
<!-- WARNING: XSS vulnerability if rawHtml is user input -->
```

**Templates vs JSX**:
- **Templates**: Easier for designers, more constraints, better optimizations
- **JSX**: Full JavaScript power, less optimizable, requires build step
- Vue supports both (can use render functions with JSX)

### Component Model

**Single File Components (SFC)** - `.vue` files:

```vue
<script setup>
import { ref } from 'vue'
import ChildComponent from './ChildComponent.vue'

const count = ref(0)

defineProps<{
  title: string
}>()

defineEmits<{
  submit: [value: string]
}>()
</script>

<template>
  <div>
    <h1>{{ title }}</h1>
    <button @click="count++">{{ count }}</button>
    <ChildComponent />
  </div>
</template>

<style scoped>
button {
  color: blue;
}
</style>
```

**Props** - Pass data from parent to child:
```vue
<!-- Parent -->
<ChildComponent :title="pageTitle" :count="5" />

<!-- Child -->
<script setup>
defineProps<{
  title: string
  count?: number
}>()
</script>
```

**Emits** - Send events from child to parent:
```vue
<!-- Child -->
<script setup>
const emit = defineEmits<{
  update: [value: number]
}>()

function handleClick() {
  emit('update', 42)
}
</script>

<!-- Parent -->
<ChildComponent @update="handleUpdate" />
```

**Slots** - Content projection:
```vue
<!-- Parent -->
<Card>
  <h1>Title</h1>
  <p>Content</p>
</Card>

<!-- Card.vue -->
<template>
  <div class="card">
    <slot></slot>  <!-- Content goes here -->
  </div>
</template>

<!-- Named slots -->
<Card>
  <template #header>Header</template>
  <template #default>Content</template>
  <template #footer>Footer</template>
</Card>
```

**Composables** - Reusable logic (like React custom hooks):
```typescript
// useCounter.ts
export function useCounter(initial = 0) {
  const count = ref(initial)

  function increment() {
    count.value++
  }

  return { count, increment }
}

// Usage in component
<script setup>
import { useCounter } from './useCounter'

const { count, increment } = useCounter(5)
</script>
```

### Performance Optimizations

**1. v-once** - Render once, never update:
```vue
<div v-once>{{ expensiveComputation }}</div>
```

**2. v-memo** - Memoize sub-tree:
```vue
<div v-memo="[count, message]">
  <!-- Only re-renders when count or message change -->
  <ExpensiveComponent />
</div>
```

**3. Lazy component loading**:
```typescript
import { defineAsyncComponent } from 'vue'

const AsyncComponent = defineAsyncComponent(() =>
  import('./HeavyComponent.vue')
)
```

**4. KeepAlive** - Cache component instances:
```vue
<KeepAlive>
  <component :is="currentView" />
</KeepAlive>
```

**5. Virtual scrolling** (external library):
```vue
<RecycleScroller :items="10000" :item-size="50">
  <template #default="{ item }">
    <div>{{ item.name }}</div>
  </template>
</RecycleScroller>
```

**6. Compiler optimizations** (automatic):
- Static hoisting
- Patch flags
- Block trees
- No manual optimization needed!

**When NOT to optimize**:
- Vue automatically optimizes most cases
- Template compiler does heavy lifting
- Only optimize if profiling shows bottleneck

### Developer Experience

**Learning curve: Medium**
- Templates easier than JSX for HTML-first developers
- Directives (`v-if`, `v-for`) intuitive
- Composition API requires understanding reactivity
- Options API easier for beginners

**DevTools: Excellent**
- Vue DevTools v7
- Component hierarchy
- Props/state/computed inspection
- Performance profiling with Timeline
- Time-travel debugging
- Live editing
- Split screen mode

**Hot reload: Excellent**
- Fast refresh preserves state
- Instant feedback
- Works with SFCs
- Vite integration is blazingly fast

### AI-Friendly Assessment

**What makes Vue rendering AI-friendly:**

✅ **Template syntax is HTML-like**
- Familiar to anyone who knows HTML
- Easy to read and generate
- Clear structure

✅ **Directives are explicit**
- `v-if`, `v-for`, `v-bind` clearly show intent
- Less ambiguity than JSX
- Easy to parse and understand

✅ **SFCs are well-structured**
- Template, script, style in one file
- Clear separation of concerns
- Easy to analyze

✅ **Compiler optimizations are automatic**
- No manual memoization needed
- AI doesn't need to know when to optimize
- Just write declarative templates

✅ **Slots are explicit**
- Content projection is visible
- Named slots are self-documenting
- Clear parent-child relationships

**What creates friction:**

⚠️ **Template syntax is not JavaScript**
- AI needs to understand Vue-specific syntax
- Can't use full JavaScript in templates
- Template expressions have limitations

⚠️ **Directives have many options**
- `v-bind` has many syntaxes (`:`, `v-bind:`, dynamic attributes)
- `v-model` modifiers (`.lazy`, `.number`, `.trim`)
- Need to know all directive features

⚠️ **SFC requires build tooling**
- Can't run `.vue` files directly
- Need Vite/Webpack configuration
- More complexity than plain JS

⚠️ **Two templating approaches** (Template vs JSX)
- Need to know both
- Different optimization characteristics
- Context switching

⚠️ **Scoped styles complexity**
- CSS scoping rules not obvious
- Deep selectors (`:deep()`) confusing
- Global vs scoped interaction

**Overall Rendering AI-Friendliness: 8/10**

Vue's template-based rendering is AI-friendly due to HTML familiarity and explicit directives. Main challenges are template expression limitations and build tooling requirements.

## Event Handling

### Philosophy & Approach

Vue's event handling philosophy: **"Directive-based declarative events with modifiers"**

**Core concepts**:
- **v-on directive** (`@` shorthand): Bind event handlers declaratively
- **Event modifiers**: Declarative event behavior (`.prevent`, `.stop`, etc.)
- **Native events**: Uses browser's native events (not synthetic like React)
- **Method handlers**: Reference methods directly (no binding issues)

**Mental model**:
- DOM: `element.addEventListener('click', handler)`
- Vue: `<button @click="handler">Click</button>`

**Design choice**: Modifiers make common patterns declarative instead of imperative.

### Event Binding

**v-on directive** (`:` shorthand for binding, `@` for events):

```vue
<script setup>
function handleClick(event) {
  console.log('Clicked!', event)
}

function greet(name) {
  console.log(`Hello, ${name}!`)
}
</script>

<template>
  <!-- Method reference -->
  <button @click="handleClick">Click</button>

  <!-- Inline expression -->
  <button @click="count++">Increment</button>

  <!-- Inline handler with event -->
  <button @click="(e) => handleClick(e)">Click</button>

  <!-- With arguments -->
  <button @click="greet('Vue')">Greet</button>

  <!-- Access event in inline handler -->
  <button @click="(event) => console.log(event.target)">Log</button>
</template>
```

**Multiple handlers**:
```vue
<button @click="handler1(), handler2()">Multi</button>
```

**Custom events on components**:
```vue
<!-- Child component -->
<script setup>
const emit = defineEmits<{
  customEvent: [data: string]
}>()

function trigger() {
  emit('customEvent', 'some data')
}
</script>

<!-- Parent -->
<ChildComponent @customEvent="handleCustomEvent" />
```

**Dynamic events**:
```vue
<button @[eventName]="handler">Dynamic event</button>
```

### Event Flow

**Bubbling** - Events bubble up DOM tree (standard):

```vue
<div @click="parentHandler">
  <button @click="childHandler">Click</button>
</div>
<!-- Click button: childHandler, then parentHandler -->
```

**Event modifiers** - Declarative event control:

**`.stop`** - Stop propagation:
```vue
<button @click.stop="handler">
  <!-- e.stopPropagation() automatically called -->
</button>
```

**`.prevent`** - Prevent default:
```vue
<form @submit.prevent="handleSubmit">
  <!-- e.preventDefault() automatically called -->
</form>
```

**`.capture`** - Use capture mode:
```vue
<div @click.capture="handler">
  <!-- Captures during capture phase -->
</div>
```

**`.self`** - Only trigger if event.target is the element itself:
```vue
<div @click.self="handler">
  <!-- Only triggers if clicking div, not children -->
</div>
```

**`.once`** - Trigger at most once:
```vue
<button @click.once="handler">
  <!-- Only fires first click -->
</button>
```

**`.passive`** - Improves scroll performance:
```vue
<div @scroll.passive="handler">
  <!-- Tells browser handler won't preventDefault() -->
</div>
```

**Chaining modifiers**:
```vue
<button @click.stop.prevent="handler">
  <!-- Both stopPropagation and preventDefault -->
</button>
```

**Order matters**:
```vue
<!-- Prevents all clicks -->
@click.prevent.self

<!-- Only prevents click on element itself -->
@click.self.prevent
```

### Event Object

**Native Event** - Vue passes native browser events (not synthetic):

```vue
<script setup>
function handleClick(event: MouseEvent) {
  event.preventDefault()
  event.stopPropagation()
  event.currentTarget  // Element handler attached to
  event.target  // Element that triggered event

  // Mouse-specific
  console.log(event.clientX, event.clientY)
  console.log(event.altKey, event.ctrlKey)
}
</script>

<template>
  <button @click="handleClick">Click</button>
</template>
```

**Accessing event in inline handlers**:
```vue
<!-- Special $event variable -->
<button @click="handleClick($event, 'extra data')">
  Click
</button>

<!-- Or arrow function -->
<button @click="(e) => handleClick(e, 'data')">
  Click
</button>
```

**Event types** (TypeScript):
- Native DOM events: `MouseEvent`, `KeyboardEvent`, `InputEvent`, etc.
- No synthetic event wrappers (unlike React)
- Direct access to native event properties

### Common Patterns

**1. Form handling**:

```vue
<script setup>
const form = reactive({
  name: '',
  email: ''
})

function handleSubmit() {
  console.log('Submitted:', form)
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="form.name" />
    <input v-model="form.email" type="email" />
    <button type="submit">Submit</button>
  </form>
</template>
```

**2. Key modifiers** - Keyboard events:

```vue
<!-- Specific keys -->
<input @keyup.enter="submit" />
<input @keyup.esc="cancel" />
<input @keyup.space="toggle" />
<input @keyup.delete="remove" />

<!-- Arrow keys -->
<input @keyup.up="moveUp" />
<input @keyup.down="moveDown" />

<!-- Any key (kebab-case) -->
<input @keyup.page-down="nextPage" />

<!-- Multiple keys -->
<input @keyup.ctrl.enter="save" />
```

**Common key modifiers**:
- `.enter`, `.tab`, `.esc`, `.space`
- `.up`, `.down`, `.left`, `.right`
- `.delete` (catches Delete and Backspace)

**3. System modifiers** - Modifier keys:

```vue
<!-- Ctrl + Click -->
<button @click.ctrl="handler">Ctrl+Click</button>

<!-- Alt + Click -->
<button @click.alt="handler">Alt+Click</button>

<!-- Shift + Click -->
<button @click.shift="handler">Shift+Click</button>

<!-- Meta (Cmd on Mac, Win on Windows) -->
<button @click.meta="handler">Meta+Click</button>

<!-- Exact combination -->
<button @click.ctrl.exact="handler">
  <!-- Only Ctrl, no other modifiers -->
</button>
```

**4. Mouse button modifiers**:

```vue
<button @click.left="leftClick">Left click</button>
<button @click.right.prevent="rightClick">Right click</button>
<button @click.middle="middleClick">Middle click</button>
```

**5. Passing data to handlers**:

```vue
<script setup>
const items = ref([...])

function handleClick(item, event) {
  console.log('Clicked item:', item)
  console.log('Event:', event)
}
</script>

<template>
  <button
    v-for="item in items"
    :key="item.id"
    @click="(e) => handleClick(item, e)"
  >
    {{ item.name }}
  </button>
</template>
```

**6. Event delegation** (manual):
```vue
<ul @click="handleItemClick">
  <li v-for="item in items" :key="item.id" :data-id="item.id">
    {{ item.name }}
  </li>
</ul>

<script setup>
function handleItemClick(event) {
  const li = event.target.closest('li')
  if (li) {
    const id = li.dataset.id
    console.log('Clicked item:', id)
  }
}
</script>
```

### Performance Considerations

**Event handler caching** - Automatic:

```vue
<!-- Handler is automatically cached -->
<button @click="handleClick">Click</button>

<!-- Inline expressions re-create function, but minimal cost -->
<button @click="() => doSomething()">Click</button>
```

**No manual useCallback needed** (unlike React):
```vue
<!-- This is fine - Vue handles efficiently -->
<button @click="() => handleClick(item.id)">
  {{ item.name }}
</button>
```

**Passive listeners** - Improve scroll performance:
```vue
<div @scroll.passive="onScroll">
  <!-- Browser knows handler won't call preventDefault() -->
</div>
```

**Event cleanup** - Automatic:
- Vue removes event listeners when component unmounts
- No manual `removeEventListener` needed
- No memory leaks from event handlers

**Memory leak concerns**:
- Generally not an issue with Vue's event system
- Watch for manual `addEventListener` (clean up in `onBeforeUnmount`)
- Watch for closures capturing large objects

### Developer Experience

**Debugging: Excellent**
- DevTools shows event handlers
- Can inspect event objects
- Native events are familiar
- Console logs work normally

**Type safety: Excellent (with TypeScript)**:
```typescript
function handleClick(e: MouseEvent<HTMLButtonElement>) {
  e.currentTarget  // TypeScript knows it's HTMLButtonElement
}

function handleInput(e: Event) {
  const target = e.target as HTMLInputElement
  console.log(target.value)
}
```

**Event modifiers make code cleaner**:
```vue
<!-- Vue - declarative -->
<form @submit.prevent="handleSubmit">

<!-- React - imperative -->
<form onSubmit={(e) => {
  e.preventDefault()
  handleSubmit()
}}>
```

### AI-Friendly Assessment

**What makes Vue events AI-friendly:**

✅ **Declarative modifiers**
- `.prevent`, `.stop`, `.once` are self-documenting
- Intent is clear without reading handler code
- Standard patterns easy to recognize

✅ **Consistent syntax**
- Always `@event="handler"`
- No confusion about reference vs call
- Clear in templates

✅ **Native events**
- Standard browser events (not synthetic)
- Familiar to anyone who knows web development
- No Vue-specific event object to learn

✅ **Key/system modifiers**
- `@keyup.enter` is more readable than checking `event.key === 'Enter'`
- Declarative keyboard handling
- Self-documenting code

✅ **No binding issues**
- No need to bind `this` (unlike React class components)
- Methods just work
- Less confusion

**What creates friction:**

⚠️ **Modifier order matters**
- `@click.prevent.self` ≠ `@click.self.prevent`
- Not obvious from syntax
- Easy to get wrong

⚠️ **Many modifiers to remember**
- Lots of options (`.prevent`, `.stop`, `.capture`, `.self`, `.once`, `.passive`)
- Key modifiers (`.enter`, `.esc`, `.ctrl`, etc.)
- Mouse modifiers (`.left`, `.right`, `.middle`)
- Need to know them all

⚠️ **Template expression limitations**
- Can't use complex logic in `@click="..."`
- Must extract to methods for complex handlers
- Not full JavaScript

⚠️ **$event magic variable**
- Special variable not obvious
- Only works in templates
- Inconsistent with regular JavaScript

**Overall Event Handling AI-Friendliness: 9/10**

Vue's event handling is extremely AI-friendly due to declarative modifiers, consistent syntax, and native events. Modifiers make intent clear and code self-documenting.

**Compared to React**: More AI-friendly (declarative modifiers, no binding confusion)
**Compared to other frameworks**: Among the best event systems

### Component Reusability Assessment

**Quality: Excellent (8.5/10)**

**Strengths**: Single File Components (.vue) bundle template, script, styles - self-contained and portable. Props, emits, and slots create clear component APIs. Composition API enables logic reuse across components. Composables (like React hooks) extract and share behavior. Vue ecosystem npm-first. TypeScript support with <script setup lang="ts">. Scoped styles prevent conflicts.

**Weaknesses**: .vue files require build tooling - cannot use without Vue. Template syntax not portable to other frameworks. Some magic (auto-unwrapping refs in templates) creates learning curve. Options API vs Composition API creates two styles. Global registration can hide dependencies.

**Cross-Project Reuse**: Excellent within Vue ecosystem. Component libraries (Element Plus, Vuetify, Naive UI) prove reusability. Composables work across projects. Cannot directly use in React/Svelte. Web components possible but uncommon.

**Design System Support**: Excellent. Element Plus, Ant Design Vue, Vuetify, Naive UI are mature. Headless UI Vue for unstyled primitives. Scoped styles ideal for design systems. CSS modules, preprocessors (Sass/Less), UnoCSS/Tailwind all supported.

## Maintainability

**Quality: Excellent (8.5/10)**

**Strengths**: Vue DevTools excellent (component tree, state, events, performance). TypeScript support strong. Single File Components keep related code together. Composition API reduces code duplication. Reactive refs prevent stale state. Template compiler catches errors. Scoped styles prevent CSS conflicts. Error handling via errorHandler and onErrorCaptured. Good balance of magic and explicitness.

**Weaknesses**: .value syntax for refs verbose and easy to forget. Options API vs Composition API creates inconsistency across codebases. Template syntax means no TypeScript checking in expressions (unless using vue-tsc). Reactivity caveats (unwrapping behavior, ref vs reactive). Smaller ecosystem than React - fewer third-party solutions.

**Code Organization**: SFCs enforce structure (template, script, style in one file). Composables in separate files. Stores (Pinia) for global state. Feature-based folders common. Layouts and pages clear in Vue Router projects.

**Testing**: Vitest for unit tests. Vue Test Utils for component testing. Composables easy to test in isolation. Template testing requires mounting. E2E with Playwright/Cypress. Vue Testing Library for user-centric tests.

**Debugging**: Vue DevTools show component hierarchy, props, data, computed, events. Timeline for tracking state changes. Performance profiler. Template compilation errors clear. Reactivity tracking in DevTools. Console warnings helpful.

**Scalability**: Excellent. Component model scales well. Vue Router for routing. Pinia for state (modular stores). Lazy loading components. Large codebases remain maintainable. Enterprise projects (Alibaba, GitLab) prove scale.

**Breaking Changes**: Vue 2 → 3 was significant (Composition API, breaking changes). Migration guides provided. Vue 3.4+ stable. Reactivity model changed (Proxy-based). Options API still supported for backward compatibility.

## AI-Assisted Development Considerations

### What Works Well with AI

**Mutable reactive API**
- `count.value++` is more intuitive than `setCount(c => c + 1)`
- Mirrors how developers naturally think
- Less cognitive overhead

**Automatic dependency tracking**
- No dependency arrays to maintain
- `computed()` and `watchEffect()` just work
- Hard to make dependency mistakes

**Declarative templates**
- HTML-like syntax is familiar
- Directives are self-documenting
- Intent is clear from template

**Event modifiers**
- `.prevent`, `.stop`, `.once` make intent explicit
- Less imperative code in handlers
- Patterns are standard and recognizable

**Excellent TypeScript support**
- Native TypeScript (not @types package)
- Strong inference
- Catches errors early

**Composables pattern**
- Reusable logic is clean
- Similar to React hooks but simpler
- Easy to extract and share

### What Creates Friction

**ref .value inconsistency**
- Must use `.value` in script, not in templates
- Frequent source of bugs
- AI might forget `.value` in JavaScript

**reactive() limitations**
- Destructuring breaks reactivity
- Not obvious when it fails
- AI might generate broken code

**Template expression limitations**
- Can't use full JavaScript
- Must know which expressions are allowed
- AI might generate invalid template syntax

**Two API styles** (Composition vs Options)
- Need to understand both for legacy code
- Different patterns and mental models
- Context switching between projects

**Unwrapping edge cases**
- Top-level unwraps, nested doesn't
- Arrays don't unwrap
- Confusing rules

**Build tooling required**
- SFCs need Vite/Webpack
- Can't run `.vue` files directly
- Configuration complexity

### Opportunities for Improvement

**More AI-friendly patterns:**

1. **Eliminate .value inconsistency**
   - Auto-unwrap refs everywhere (like Svelte's $store)
   - Or require .value everywhere (consistent)
   - Current inconsistency is confusing

2. **Simplify reactive() or deprecate it**
   - `ref()` is already recommended
   - `reactive()` has too many gotchas
   - Just promote `ref()` for everything

3. **Better template type checking**
   - Volar helps but not perfect
   - Catch more errors at compile time
   - Better IDE integration

4. **Explicit re-render boundaries**
   - Like React.memo but automatic
   - Clearer performance characteristics
   - Less "magic"

5. **Standardize on Composition API**
   - Options API for legacy only
   - Reduces cognitive load
   - One way to do things

**What human-era constraints could be removed:**

- **Virtual DOM**: Vapor Mode will remove this (in development)
- **Template limitations**: Could allow more JavaScript in templates
- **Build step**: Could support runtime template compilation better
- **ref .value**: Could auto-unwrap everywhere

**Overall:**

Vue is **highly AI-friendly** due to mutable API, automatic dependencies, and declarative templates. Main friction is `.value` inconsistency and `reactive()` gotchas.

For next-gen frameworks: Keep mutable reactive API, eliminate `.value` inconsistency, use fine-grained reactivity (no Virtual DOM), and standardize on one API style.

**Final AI-Friendliness: 8.5/10**
- State Management: 8/10 (mutable API great, but .value confusion)
- Rendering: 8/10 (templates clear, but expression limitations)
- Event Handling: 9/10 (modifiers excellent, very declarative)

Vue's biggest advantages for AI:
1. **Mutable reactive API** (more intuitive than immutable)
2. **Automatic dependency tracking** (no manual arrays)
3. **Declarative event modifiers** (self-documenting)
4. **Native TypeScript** (excellent inference)

Biggest disadvantages:
1. **ref .value inconsistency** (script vs template)
2. **reactive() gotchas** (destructuring, replacement)
3. **Two API styles** (Composition vs Options)
4. **Template limitations** (not full JavaScript)

Vue strikes an excellent balance between simplicity and power, with fewer footguns than React.
