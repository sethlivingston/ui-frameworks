---
name: "htmx"
category: "utility-library"
github_url: "https://github.com/bigskysoftware/htmx"
docs_url: "https://htmx.org/docs/"
implementation_language: "JavaScript"
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

# htmx

> **2026 update note (2026-06-07):** htmx 4.0 (beta, targeting summer 2026) replaces `XMLHttpRequest` with `fetch()` as its core AJAX layer, makes attribute inheritance **explicit** via an `:inherited` modifier (previously implicit), and changes back-button handling from DOM snapshotting to network requests. The `:inherited` change in particular *strengthens* the explicitness story this review praises — inheritance becomes something you can grep for rather than infer.

## Philosophy & Mental Model

htmx represents a **radical departure from modern frontend development**. Instead of building complex client-side applications with JavaScript frameworks, htmx asks: **"What if we just extended HTML?"**

The core philosophy is simple: HTML was designed for hypertext, but modern constraints limited it to `<a>` and `<form>` elements making requests, only on `click` and `submit` events, using only `GET` and `POST` methods. htmx removes these arbitrary limitations, letting **any element** make **any HTTP request** on **any event**, replacing **any part of the page**.

This enables **Hypermedia-Driven Applications (HDAs)**—a hybrid architecture that combines:
- The simplicity of Multi-Page Applications (server renders HTML)
- The UX of Single-Page Applications (no full page reloads)
- The REST-ful architecture of the web (hypermedia as state engine)

**Mental model shift**: Instead of "send JSON to the client, manage state in JavaScript, re-render UI," htmx says **"send HTML from the server, swap it into the DOM."** State lives on the server, not the client.

This is **HATEOAS** (Hypermedia as the Engine of Application State)—the server sends not just data, but the UI controls for interacting with that data. Every response contains both content and hypermedia controls (links, forms, buttons) that define what the user can do next.

**Key principles:**

1. **HTML over JSON**: Servers return HTML fragments, not JSON. The presentation logic stays server-side.

2. **Declarative over Imperative**: You declare what should happen with HTML attributes, not write JavaScript event handlers.

3. **Hypermedia Controls**: The server sends UI elements (`<button hx-post="/delete/5">Delete</button>`) that contain their own interaction logic.

4. **Progressive Enhancement**: htmx enhances standard HTML. If JavaScript fails, forms still work via standard submission.

5. **Locality of Behavior**: The behavior of an element is defined right on that element, not in separate JavaScript files.

## State Management

### Core Primitives

**There is no client-side state management.** This is not a bug—it's the design.

State lives on the **server** (in databases, sessions, caches). The client just displays whatever HTML the server sends. When the user interacts with the page, htmx makes a request to the server, which returns updated HTML.

```html
<!-- Server renders current state -->
<div id="counter">
  <p>Count: 5</p>
  <button hx-post="/increment" hx-target="#counter">+</button>
  <button hx-post="/decrement" hx-target="#counter">-</button>
</div>
```

When the user clicks "+", htmx:
1. POSTs to `/increment`
2. Server updates state (database, session, etc.)
3. Server renders new HTML: `<div id="counter"><p>Count: 6</p>...</div>`
4. htmx swaps the response into `#counter`

The client never "knows" the count is 6—it just displays the HTML the server sent.

### Update Mechanism

Updates happen through **HTTP requests**:

```html
<button hx-post="/toggle" hx-target="#status">Toggle</button>

<!-- Server response (HTML): -->
<div id="status" class="active">Status: Active</div>
```

All updates flow through the server. This makes state management trivial on the client but shifts complexity to the server.

### Read Pattern

You don't "read" state in htmx—you **display HTML**. The server embeds current state in the HTML it renders:

```html
<!-- Server renders with template engine (e.g., Jinja, ERB, Blade) -->
<div>
  <h1>Hello {{ user.name }}!</h1>
  <p>Cart items: {{ cart.count }}</p>
</div>
```

The client displays this. No client-side state to read.

### Reactivity & Granularity

**No reactivity on the client**—htmx doesn't watch variables or track dependencies. Reactivity happens via **server-triggered DOM swaps**:

1. User triggers action (click, submit, keyup, etc.)
2. htmx makes HTTP request
3. Server responds with HTML fragment
4. htmx swaps it into the DOM

Granularity is **per-request**, not per-variable. You update whatever portion of the page the server returns.

**Out-of-Band (OOB) Swaps** let you update multiple areas at once:

```html
<!-- Server response -->
<div id="main-content">
  Updated content here
</div>

<!-- This gets swapped elsewhere via OOB -->
<div id="cart-count" hx-swap-oob="true">
  <span>3 items</span>
</div>
```

Both `#main-content` (the target) and `#cart-count` (OOB) update in one request.

### Async Handling

htmx is **inherently async**—every request is AJAX. You can:

**Show loading states**:

```html
<button hx-post="/save" hx-indicator="#spinner">
  Save
</button>
<img id="spinner" class="htmx-indicator" src="spinner.gif"/>
```

The `.htmx-indicator` class automatically shows/hides during requests.

**Poll for updates**:

```html
<div hx-get="/latest-updates" hx-trigger="every 2s">
  <!-- Updates every 2 seconds -->
</div>
```

**WebSockets** (via extension):

```html
<div hx-ws="connect:/chat">
  <div hx-ws="send">
    <form>
      <input name="message"/>
    </form>
  </div>
</div>
```

### Derived State

**No client-side derived state**. The server computes everything:

```python
# Server (Python/Flask example)
@app.route('/cart')
def cart():
    items = get_cart_items()
    subtotal = sum(item.price for item in items)
    tax = subtotal * 0.08
    total = subtotal + tax

    return render_template('cart.html',
        items=items,
        subtotal=subtotal,
        tax=tax,
        total=total
    )
```

```html
<!-- cart.html -->
<div id="cart">
  <div *ngFor="let item of items">{{ item.name }}: ${{ item.price }}</div>
  <p>Subtotal: ${{ subtotal }}</p>
  <p>Tax: ${{ tax }}</p>
  <p><strong>Total: ${{ total }}</strong></p>
</div>
```

All derivations happen server-side. The client just displays results.

## Rendering

### Core Primitives

htmx doesn't "render"—it **swaps HTML**. The server does the rendering.

**Key attributes**:

- `hx-get="/path"` - GET request
- `hx-post="/path"` - POST request
- `hx-put`, `hx-patch`, `hx-delete` - Other HTTP methods
- `hx-target="#id"` - Where to put the response (CSS selector)
- `hx-swap="innerHTML"` - How to swap it (innerHTML, outerHTML, beforebegin, etc.)

```html
<button hx-get="/message" hx-target="#display" hx-swap="innerHTML">
  Get Message
</button>
<div id="display"></div>

<!-- Server responds with: -->
<p>Hello from the server!</p>

<!-- Result: -->
<div id="display">
  <p>Hello from the server!</p>
</div>
```

### Update Mechanism

**Swap strategies** (`hx-swap`):

- `innerHTML` (default) - Replace content inside element
- `outerHTML` - Replace entire element
- `beforebegin` - Insert before element
- `afterbegin` - Insert as first child
- `beforeend` - Insert as last child
- `afterend` - Insert after element
- `delete` - Remove target element
- `none` - Don't swap (useful for side effects only)

```html
<ul id="list">
  <li>Item 1</li>
</ul>

<button hx-post="/add-item" hx-target="#list" hx-swap="beforeend">
  Add Item
</button>

<!-- Server response: -->
<li>Item 2</li>

<!-- Result: -->
<ul id="list">
  <li>Item 1</li>
  <li>Item 2</li>
</ul>
```

### Conditional Rendering

**Server-side only**. Use your template engine's conditionals:

```html
<!-- Jinja2 (Python) -->
{% if user.is_admin %}
  <button hx-delete="/user/{{ user.id }}">Delete User</button>
{% else %}
  <p>Insufficient permissions</p>
{% endif %}

<!-- ERB (Ruby) -->
<% if @user.admin? %>
  <button hx-delete="/user/<%= @user.id %>">Delete User</button>
<% else %>
  <p>Insufficient permissions</p>
<% end %>
```

htmx just swaps whatever HTML the server decides to send.

### List Rendering

Again, **server-side** with template engines:

```html
<!-- Django template -->
<ul id="users">
  {% for user in users %}
    <li id="user-{{ user.id }}">
      {{ user.name }}
      <button hx-delete="/users/{{ user.id }}" hx-target="#user-{{ user.id }}">
        Delete
      </button>
    </li>
  {% endfor %}
</ul>
```

No special htmx directives needed—just standard HTML generated by the server.

### Component Model

htmx doesn't have "components" in the React/Vue sense. Instead, you compose pages from **HTML fragments** (server-side partials):

```html
<!-- index.html -->
<body>
  {% include 'header.html' %}
  <main>
    <div hx-get="/dashboard" hx-trigger="load">
      Loading...
    </div>
  </main>
  {% include 'footer.html' %}
</body>

<!-- dashboard.html (loaded via htmx) -->
<div>
  <h1>Dashboard</h1>
  {% include 'widgets/stats.html' %}
  {% include 'widgets/chart.html' %}
</div>
```

Reuse happens through server-side template includes, not client-side components.

## Event Handling

### Core Primitives

The `hx-trigger` attribute controls when requests fire:

```html
<!-- Click (default for buttons) -->
<button hx-get="/data">Click me</button>

<!-- Explicit trigger -->
<div hx-get="/refresh" hx-trigger="click">Click to refresh</div>

<!-- Form submit (default for forms) -->
<form hx-post="/save">
  <input name="title"/>
  <button type="submit">Save</button>
</form>

<!-- Input events -->
<input hx-get="/search" hx-trigger="keyup" hx-target="#results"/>

<!-- Mouse events -->
<div hx-get="/details" hx-trigger="mouseenter">Hover me</div>
```

### Event Modifiers

htmx has powerful trigger modifiers:

**Debounce/Delay**:

```html
<!-- Wait 500ms after user stops typing -->
<input hx-get="/search"
       hx-trigger="keyup changed delay:500ms"
       hx-target="#results"/>
```

**Throttle**:

```html
<!-- At most once per second -->
<div hx-get="/scroll-data" hx-trigger="scroll throttle:1s"></div>
```

**Changed** (only trigger if value changed):

```html
<input hx-get="/validate" hx-trigger="blur changed"/>
```

**Once** (trigger only once):

```html
<div hx-get="/initial-data" hx-trigger="load once"></div>
```

**Multiple triggers**:

```html
<!-- Submit on blur OR when save button clicked elsewhere -->
<input hx-get="/save-draft"
       hx-trigger="blur, saveAll from:body"/>
```

**Polling**:

```html
<!-- Poll every 2 seconds -->
<div hx-get="/status" hx-trigger="every 2s">
  Checking status...
</div>
```

**Load** (trigger on element load):

```html
<div hx-get="/content" hx-trigger="load">
  Loading...
</div>
```

### Event Handlers

There are **no client-side event handlers** in the traditional sense. The server handles events:

```html
<!-- Client HTML -->
<button hx-post="/like/123" hx-target="#like-count">Like</button>
<span id="like-count">42 likes</span>
```

```python
# Server handler (Python/Flask)
@app.route('/like/<post_id>', methods=['POST'])
def like_post(post_id):
    post = get_post(post_id)
    post.likes += 1
    post.save()

    return f'<span id="like-count">{post.likes} likes</span>'
```

The server receives the request, updates state, renders HTML, and returns it. htmx swaps it into the DOM.

### Client-Side JavaScript Integration

For cases where you need custom JavaScript, htmx provides **events and extensions**:

**Respond to htmx events**:

```javascript
document.body.addEventListener('htmx:afterSwap', function(evt) {
  if (evt.detail.target.id === 'results') {
    console.log('Search results loaded');
  }
});
```

**Custom validation before request**:

```javascript
document.body.addEventListener('htmx:configRequest', function(evt) {
  if (!confirm('Are you sure?')) {
    evt.preventDefault();
  }
});
```

**Extensions** for custom behavior:

```javascript
htmx.defineExtension('my-extension', {
  onEvent: function(name, evt) {
    if (name === 'htmx:beforeRequest') {
      // Custom logic
    }
  }
});
```

```html
<div hx-ext="my-extension" hx-get="/data"></div>
```

## Reuse Patterns

### Server-Side Partials

Break UI into reusable HTML fragments:

```html
<!-- _button.html (Django) -->
<button class="btn btn-{{ variant }}"
        hx-{{ method }}="{{ url }}"
        hx-target="{{ target }}">
  {{ label }}
</button>

<!-- Usage -->
{% include '_button.html' with variant='primary' method='post' url='/save' target='#result' label='Save' %}
```

### Template Inheritance

Use your framework's template inheritance:

```html
<!-- base.html -->
<!DOCTYPE html>
<html>
<body>
  {% block content %}{% endblock %}
</body>
</html>

<!-- page.html -->
{% extends 'base.html' %}
{% block content %}
  <div hx-get="/data">Content</div>
{% endblock %}
```

### Server-Side Components/Helpers

Define reusable helpers in your backend language:

```python
# Python
def htmx_button(label, url, method='get', target='#main'):
    return f'''
        <button hx-{method}="{url}" hx-target="{target}">
            {label}
        </button>
    '''
```

```ruby
# Ruby (Rails helper)
def htmx_link(text, path, target: '#main')
  content_tag :a, text,
    'hx-get': path,
    'hx-target': target
end
```

### CSS Transitions

htmx automatically applies CSS transitions during swaps:

```css
.htmx-swapping {
  opacity: 0;
  transition: opacity 200ms ease-out;
}
```

htmx adds/removes CSS classes during swap lifecycle, enabling smooth transitions without JavaScript.

## Developer Experience

### Learning Curve

**Very low** if you know HTML and HTTP. The entire htmx API is ~20 attributes:

- `hx-get`, `hx-post`, `hx-put`, `hx-patch`, `hx-delete`
- `hx-trigger`, `hx-target`, `hx-swap`
- `hx-select`, `hx-include`, `hx-vals`
- `hx-push-url`, `hx-swap-oob`, `hx-indicator`

Plus modifiers (`delay`, `throttle`, `changed`, etc.) and a few others.

If you've built server-rendered apps before (Rails, Django, Laravel, Express+EJS), adding htmx is trivial.

**Mental model shift**: The challenge isn't learning htmx syntax—it's unlearning client-side state management. Developers from React/Vue backgrounds must resist the urge to manage state in JavaScript.

### Tooling

**Minimal client-side tooling**:

- Include htmx via CDN: `<script src="https://unpkg.com/htmx.org@2.0.7"></script>`
- No build step, no bundler, no npm install (unless you want to)
- Browser DevTools show AJAX requests (standard Network tab)
- htmx Dev Tools extension for debugging

**Server-side tooling**: Use whatever your backend framework provides (Rails console, Django admin, etc.).

**Testing**:
- **Server tests**: Standard backend testing (pytest, RSpec, PHPUnit)
- **Integration tests**: Selenium, Playwright, Cypress (test the full request/response cycle)
- No special htmx testing framework needed

### Boilerplate

**Extremely minimal**. A complete interactive feature:

```html
<!-- Client (HTML) -->
<form hx-post="/todos" hx-target="#todo-list" hx-swap="beforeend">
  <input name="title" required/>
  <button type="submit">Add Todo</button>
</form>

<ul id="todo-list">
  <!-- Existing todos -->
</ul>
```

```python
# Server (Python/Flask)
@app.route('/todos', methods=['POST'])
def create_todo():
    title = request.form['title']
    todo = Todo.create(title=title)
    return f'<li>{todo.title}</li>'
```

That's it. ~10 lines of code for a working feature.

### Common Patterns

**Inline validation**:

```html
<input name="email"
       hx-post="/validate/email"
       hx-trigger="blur"
       hx-target="#email-error"/>
<div id="email-error"></div>
```

**Infinite scroll**:

```html
<div hx-get="/posts?page=2"
     hx-trigger="revealed"
     hx-swap="afterend">
  <p>Loading more...</p>
</div>
```

**Active search**:

```html
<input name="q"
       hx-get="/search"
       hx-trigger="keyup changed delay:500ms"
       hx-target="#results"/>
<div id="results"></div>
```

**Delete with confirmation**:

```html
<button hx-delete="/items/123"
        hx-confirm="Are you sure?"
        hx-target="closest tr"
        hx-swap="outerHTML swap:1s">
  Delete
</button>
```

**Optimistic UI**:

```html
<button hx-post="/like"
        hx-swap="outerHTML settle:100ms">
  ❤️ Like
</button>
```

htmx swaps in the response immediately, then "settles" after 100ms for smooth transitions.

### Documentation

**Excellent**. htmx.org has:
- Clear, concise API reference
- Many examples for common patterns
- Essays on philosophy and architecture
- Active Discord community
- Comprehensive docs on extensions

The documentation emphasizes **hypermedia thinking**, not just htmx syntax.

### Component Reusability Assessment

**Quality: Good (7/10)**

Htmx's reusability model is fundamentally different from JavaScript frameworks—it's about **reusing server-side templates and endpoints**, not client-side components.

**Reuse Mechanisms**:

1. **Server-side templates** - Shared partials/templates (Django includes, Laravel Blade components, Rails partials)
2. **htmx attributes** - Reusable behavior via `hx-*` attributes
3. **HTTP endpoints** - RESTful endpoints serve HTML fragments
4. **CSS classes** - Styling reused via class names
5. **Extensions** - Custom htmx behaviors via JavaScript extensions

**Strengths**:
- **Template includes** - Server-side template systems have mature composition
- **Endpoint reuse** - Same endpoints can serve different htmx requests
- **Progressive enhancement** - Non-htmx clients get standard HTML
- **Framework-agnostic** - Works with any backend (Django, Rails, Laravel, Express, Go, etc.)
- **No build step** - Templates render on server, no compilation needed

**Weaknesses**:
- **No client-side component model** - Can't package interactive widgets like React components
- **Server-dependent** - Every interaction requires server round-trip
- **No npm distribution** - Can't publish reusable UI components to npm
- **Backend-tied** - Htmx "components" are server templates in specific template languages
- **Limited state isolation** - No scoped state like React components

**Design System Support**: Moderate. Design systems work via:
- CSS frameworks (Tailwind, Bootstrap)
- Server-side template partials
- Shared htmx attribute patterns

Example server-side button component:
```django
{# Django template partial: components/button.html #}
<button
  class="btn btn-{{ variant }} btn-{{ size }}"
  {% if href %}hx-get="{{ href }}" hx-target="{{ target }}"{% endif %}>
  {{ text }}
</button>

{# Usage #}
{% include 'components/button.html' with variant='primary' size='md' text='Save' href='/save' target='#result' %}
```

**Cross-Project Reuse**:
- **Within same backend framework**: Good (Django templates, Blade components, etc.)
- **Cross-backend**: Poor (Django templates don't work in Rails)
- **Cross-language**: Impossible (templates are backend-specific)

The reusability story is **server-side first**, which is actually a strength for teams that standardize on one backend framework.

## Maintainability

**Quality: Excellent (8.5/10)**

**Refactoring**:
- **Locality of Behavior** - HTML attributes co-located with elements make refactoring easy
- **Grep-friendly** - Search for `hx-get="/endpoint"` finds all usages
- **No build step** - Change HTML, refresh browser, see results
- **Server-side types** - Backend type systems (TypeScript, Python types, Ruby Sorbet) provide safety
- **Template refactoring** - Use server-side template tools

**Debugging**:
- **Browser DevTools** - Network tab shows all htmx requests clearly
- **Simple mental model** - HTML in, HTML out
- **Server logs** - All logic on server, easily logged
- **No source maps needed** - No transpilation, debug actual code
- **htmx debug extension** - Logs all htmx events and requests

**Code Organization**:
- **Templates** - Organized by server-side framework conventions
- **Endpoints** - REST/RPC conventions apply
- **Separation of concerns** - HTML (structure), CSS (style), htmx (behavior), server (logic)
- **Flat architecture** - No complex component trees to track

**Testing**:
- **Integration tests** - Test server endpoints returning HTML
- **Playwright/Cypress** - E2E testing works normally
- **Server-side tests** - Test template rendering independently
- **No mocking complexity** - Server responses are real HTML strings
- **Snapshot testing** - Compare rendered HTML output

**Scalability**:
- **Server scalability** - Standard horizontal scaling (load balancers, CDNs)
- **Caching** - HTTP caching works naturally (304 Not Modified, ETags)
- **Stateless** - No client-side state to synchronize
- **Lazy loading** - Load content on-demand via htmx triggers
- **Compression** - HTML compresses well (gzip, brotli)

**Breaking Changes**:
- **Semantic versioning** - htmx follows SemVer strictly
- **Stable API** - Minimal breaking changes between versions
- **Polyfills** - Browser compatibility managed via standard polyfills
- **Backend independence** - htmx updates don't affect server code

**Weaknesses**:
- **Server-side complexity** - All logic on server can create bottlenecks
- **Network dependency** - Every interaction requires server round-trip
- **Template language lock-in** - Django templates vs Blade vs ERB
- **Limited offline support** - Can't work offline like SPAs with service workers

**Particularly Maintainable Aspects**:
- Locality of Behavior makes code easy to understand
- No build pipeline means no build tool maintenance
- Standard HTTP makes debugging straightforward
- Server-side rendering provides clear separation of concerns
- No JavaScript framework churn to track

**Maintenance Challenges**:
- Server must handle all interactions (higher server load)
- Template syntax varies by backend (Django vs Rails vs Laravel)
- Coordinating frontend/backend changes requires discipline
- Network latency affects UX (needs thoughtful caching)

## AI-Friendly Assessment

**Overall Score: 8.5/10**

### Strengths for AI-Assisted Development

**Ultimate Locality of Behavior**: Every interactive element declares its own behavior right in the HTML:

```html
<button hx-post="/save" hx-target="#result">Save</button>
```

AI can understand the entire interaction by reading this one line. No need to trace imports, event handlers, or state management.

**Declarative and Scannable**: htmx attributes are highly scannable. AI can grep for `hx-post="/save"` and immediately find all save buttons. No callbacks, no indirection.

**No Client-Side State Management**: This is both a strength and weakness. Strength: AI doesn't need to track client-side state, manage immutability, or reason about state synchronization. The mental model is trivial.

**Standard HTML**: htmx is just HTML with extra attributes. AI trained on HTML already understands 90% of htmx code.

**Explicit HTTP**: Every interaction is an HTTP request with a clear URL, method, and target. AI can reason about REST endpoints easily:

```html
<button hx-delete="/users/123" hx-confirm="Delete user?">Delete</button>
```

AI knows this DELETEs `/users/123` and can infer backend behavior.

**Minimal API Surface**: ~20 attributes vs. hundreds of React hooks, Angular decorators, or Vue directives. AI learns htmx syntax quickly.

**Server-Side Rendering**: htmx responses are HTML, which AI understands natively. No need to reason about Virtual DOM diffing, reconciliation, or component lifecycles.

**No Build Step**: No webpack configs, no babel transforms, no JSX compilation. AI generates pure HTML that runs immediately.

**Progressive Enhancement**: htmx gracefully degrades. If AI forgets an htmx attribute, the form still works via standard submission.

### Weaknesses for AI-Assisted Development

**Server-Side Complexity Hidden**: htmx reviews only show the client side. AI must separately understand the server-side routing, template rendering, and state management. The full picture requires two codebases (client HTML + server backend).

**Backend Framework Diversity**: htmx works with any backend (Rails, Django, Laravel, Express, Go, etc.). AI must know multiple template syntaxes:

```html
<!-- Django -->
{% for item in items %}
  <li>{{ item.name }}</li>
{% endfor %}

<!-- ERB (Rails) -->
<% @items.each do |item| %>
  <li><%= item.name %></li>
<% end %>

<!-- Blade (Laravel) -->
@foreach($items as $item)
  <li>{{ $item->name }}</li>
@endforeach
```

**State Management Implicit**: While simplicity is a strength, the lack of client-side state means AI can't "see" the application state by reading client code. State lives in databases, sessions, and server memory—requiring AI to infer state from server-side code.

**No Type Safety**: htmx is untyped HTML attributes. Typos in `hx-target` selectors or URLs fail silently:

```html
<!-- Typo: #rezults instead of #results -->
<input hx-get="/search" hx-target="#rezults"/>
```

AI can't catch this without running the code.

**Limited Client-Side Logic**: For complex client-side interactions (drag-and-drop, rich text editing, animations), htmx requires custom JavaScript or extensions. AI must switch between declarative htmx and imperative JavaScript.

**Request/Response Coupling**: Every interaction requires a server round-trip. AI must reason about network latency, loading states, and race conditions:

```html
<!-- What if user clicks twice quickly? -->
<button hx-post="/purchase">Buy Now</button>
```

Requires `hx-disabled-elt` or server-side request deduplication.

**Testing Requires Server**: Unlike client-side frameworks where AI can test components in isolation, htmx requires a running server to test interactions. Integration tests are more complex than unit tests.

### Why 8.5/10?

htmx scores highly because:
- **Extreme simplicity** - Minimal API surface
- **Locality of behavior** - Everything declared where it's used
- **Standard HTML** - AI already trained on it
- **Explicit HTTP** - Clear request/response flow
- **No client-side state** - No state synchronization bugs

The 1.5-point deduction is for:
- **Server-side complexity hidden** - Half the picture missing
- **Backend diversity** - Multiple template languages to learn
- **No type safety** - Typos fail silently
- **Testing complexity** - Requires full stack

For **AI generating full-stack applications** (client + server), htmx is excellent. For **AI working only on frontend code**, the server dependency is limiting.

---

**Key Insight for Next-Gen Framework Design**: htmx proves that **zero client-side state management** is viable for many applications. The "HTML over the wire" approach eliminates state synchronization bugs, reduces client-side complexity, and maintains progressive enhancement. However, this requires **tight coupling between frontend and backend**—you can't have a frontend-only AI tool.

The **locality of behavior** principle is powerful: `<button hx-post="/save" hx-target="#result">` is more AI-friendly than separating markup (`<button id="save">`) from behavior (`document.querySelector('#save').addEventListener('click', ...)`).

For next-gen frameworks, consider: **Can we get htmx's simplicity while maintaining client-side state for offline capability?** Hybrid approaches like Phoenix LiveView (WebSocket + server state) or Hotwire (Turbo + Stimulus) might hit the sweet spot.

htmx demonstrates that **the complexity of modern frontend frameworks isn't always necessary**—sometimes the web's original model (server renders HTML, client displays it) is the right choice.
