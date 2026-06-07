---
name: "Phoenix LiveView"
category: "full-framework"
github_url: "https://github.com/phoenixframework/phoenix_live_view"
docs_url: "https://hexdocs.pm/phoenix_live_view/"
implementation_language: "Elixir"
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

# Phoenix LiveView

## Philosophy & Mental Model

Phoenix LiveView embodies a fundamentally different approach from client-side frameworks: **server-rendered interactivity**. Instead of shipping application logic to the browser, LiveView keeps all state and rendering logic on the server, communicating only HTML diffs over WebSocket.

The mental model is remarkably simple:
- Events are regular messages that update server-side state
- State changes trigger automatic re-rendering
- Only changed HTML fragments are sent to the client
- No client-side state synchronization required

LiveView leverages Elixir's immutable data structures and functional programming model. State is just Elixir data—no special classes, observables, or reactive primitives needed. This "state as regular data" philosophy makes reasoning about application behavior straightforward.

The architecture has two phases:
1. **Initial HTTP request**: Regular server-rendered HTML (works without JavaScript, great for SEO)
2. **WebSocket upgrade**: Persistent connection for real-time bidirectional communication

This approach eliminates the frontend/backend split entirely—you write one language (Elixir) and one codebase.

## State Management

### Core Primitives

State lives in **socket assigns**, which are key-value pairs stored in the server-side `Phoenix.LiveView.Socket` structure:

```elixir
def mount(_params, _session, socket) do
  {:ok, assign(socket, :counter, 0)}
end
```

Helper functions:
- `assign(socket, key, value)` - Set single value
- `assign(socket, key1: val1, key2: val2)` - Set multiple values
- `update(socket, key, fn)` - Transform existing value
- `assign_new(socket, key, fn)` - Set only if not already assigned

### Update Mechanism

State updates are **immutable and functional**. You never mutate socket assigns directly—you return a new socket with updated assigns:

```elixir
def handle_event("increment", _params, socket) do
  {:noreply, update(socket, :counter, &(&1 + 1))}
end

def handle_event("reset", _params, socket) do
  {:noreply, assign(socket, :counter, 0)}
end
```

All state changes flow through callback returns:
- `handle_event/3` - User interactions
- `handle_info/2` - Messages from other processes (timers, PubSub, etc.)
- `handle_params/3` - URL parameter changes

### Read Pattern

Access assigns in templates via the `@` sigil:

```elixir
def render(assigns) do
  ~H"""
  <div>Counter: {@counter}</div>
  """
end
```

The `assigns` map is passed to every render function automatically.

### Reactivity & Granularity

Reactivity is **automatic and comprehensive**: any socket assign change triggers re-rendering. However, thanks to change tracking, only the specific HTML nodes that changed are diffed and sent over the wire.

LiveView performs fine-grained change detection at the HTML level, not at the Elixir expression level. This means:
- You write simple functional updates
- LiveView diffs the resulting HTML templates
- Clients receive minimal binary patches (5-10x faster than full HTML replacement)

The granularity is **per-LiveView process** by default, but you can nest LiveComponents or LiveViews for finer-grained isolation.

### Async Handling

LiveView excels at async operations through Elixir's process model:

```elixir
def handle_event("fetch_data", _params, socket) do
  # Start async work
  pid = self()
  Task.start(fn ->
    data = fetch_from_api()
    send(pid, {:data_loaded, data})
  end)

  {:noreply, assign(socket, :loading, true)}
end

def handle_info({:data_loaded, data}, socket) do
  {:noreply, assign(socket, loading: false, data: data)}
end
```

The `assign_async/3` helper provides built-in loading states:

```elixir
def mount(_params, _session, socket) do
  {:ok, assign_async(socket, :users, fn -> {:ok, %{users: fetch_users()}} end)}
end
```

This automatically manages `:loading` and `:ok` states without boilerplate.

### Derived State

Derived state is simply Elixir functions—no special primitives:

```elixir
def render(assigns) do
  ~H"""
  <div>
    Count: {@counter}
    Double: {double(@counter)}
    <p :if={is_even(@counter)}>Even number!</p>
  </div>
  """
end

defp double(n), do: n * 2
defp is_even(n), do: rem(n, 2) == 0
```

For expensive computations, you can memoize in assigns:

```elixir
def handle_event("update", params, socket) do
  socket = assign(socket, :raw_data, params["data"])
  socket = assign(socket, :processed_data, process_expensive(socket.assigns.raw_data))
  {:noreply, socket}
end
```

But often derivation during render is fast enough since templates are compiled to efficient Elixir code.

## Rendering

### Core Primitives

Rendering uses **HEEx** (HTML + EEx), a template language with embedded Elixir:

```elixir
def render(assigns) do
  ~H"""
  <div>
    <h1>{@title}</h1>
    <button phx-click="increment">Count: {@count}</button>
  </div>
  """
end
```

HEEx provides:
- HTML-aware parsing and validation
- Automatic XSS protection via `{...}` interpolation
- Special attributes for loops, conditionals, slots
- Component composition

Alternatively, templates can live in separate `.html.heex` files alongside the module.

### Update Mechanism

On initial load, LiveView renders the full HTML page. After WebSocket connection, it:
1. Detects which assigns changed
2. Re-runs the render function
3. Diffs the new HTML against the previous render
4. Sends only changed fragments as binary patches

This "diff over the wire" approach is extremely efficient—often just a few hundred bytes for typical updates.

### Conditional Rendering

Built-in special attributes:

```elixir
~H"""
<div :if={@show_content}>Visible when true</div>
<div :for={item <- @items}>{item.name}</div>
"""
```

### List Rendering

Lists use the `:for` attribute with pattern matching:

```elixir
~H"""
<ul>
  <li :for={user <- @users} id={"user-#{user.id}"}>
    {user.name}
  </li>
</ul>
"""
```

The `id` attribute helps LiveView optimize DOM updates by tracking element identity.

### Component Model

Three levels of reuse:

**Function Components** (stateless):
```elixir
def my_button(assigns) do
  ~H"""
  <button class="btn">{@label}</button>
  """
end

# Usage:
<.my_button label="Click me" />
```

**LiveComponents** (stateful):
```elixir
defmodule MyComponent do
  use Phoenix.LiveComponent

  def update(assigns, socket) do
    {:ok, assign(socket, assigns)}
  end

  def render(assigns) do
    ~H"""
    <div>{@count}</div>
    """
  end
end

# Usage:
<.live_component module={MyComponent} id="counter" count={@count} />
```

**Nested LiveViews** (isolated processes):
```elixir
# Usage in router:
live_session :app do
  live "/parent", ParentLive
end
```

## Event Handling

### Core Primitives

Events use `phx-*` bindings in templates:

```elixir
~H"""
<button phx-click="increment">+</button>
<form phx-submit="save">
  <input type="text" name="title" phx-blur="validate" />
</form>
"""
```

Bindings available:
- `phx-click` - Click events
- `phx-submit` - Form submission
- `phx-change` - Form/input changes
- `phx-blur`, `phx-focus` - Focus events
- `phx-keydown`, `phx-keyup` - Keyboard events
- `phx-window-*` - Window-level events

### Event Handlers

Events are handled server-side via `handle_event/3`:

```elixir
def handle_event("increment", _params, socket) do
  {:noreply, update(socket, :count, &(&1 + 1))}
end

def handle_event("save", %{"title" => title}, socket) do
  case save_item(title) do
    {:ok, item} ->
      {:noreply, assign(socket, :items, [item | socket.assigns.items])}
    {:error, _} ->
      {:noreply, put_flash(socket, :error, "Save failed")}
  end
end
```

The event name, params (unsigned), and current socket are provided. Return `{:noreply, socket}` with the updated state.

### Event Modifiers

LiveView supports DOM event modifiers for declarative behavior:

```elixir
~H"""
<form phx-change="validate" phx-submit="save" phx-trigger-action={@trigger_action}>
  <input name="email" phx-debounce="500" />
</form>
"""
```

Modifiers:
- `phx-debounce` - Debounce input events (milliseconds or "blur")
- `phx-throttle` - Throttle events
- `phx-update` - Control DOM patching strategy ("append", "prepend", "replace")
- `phx-trigger-action` - Native form submission (for redirects)

### Client-Side JavaScript Integration

For JavaScript interop, use **hooks**:

```javascript
let Hooks = {}
Hooks.DatePicker = {
  mounted() {
    this.el.addEventListener("change", e => {
      this.pushEvent("date-selected", {date: e.target.value})
    })
  }
}

let liveSocket = new LiveSocket("/live", Socket, {hooks: Hooks})
```

```elixir
~H"""
<input type="date" id="picker" phx-hook="DatePicker" />
"""
```

Hooks provide lifecycle methods (`mounted`, `updated`, `destroyed`) and `pushEvent` for JavaScript → LiveView communication.

## Reuse Patterns

### Function Components

Stateless UI fragments, defined as simple functions:

```elixir
def user_card(assigns) do
  ~H"""
  <div class="card">
    <h3>{@user.name}</h3>
    <p>{@user.email}</p>
  </div>
  """
end

# Usage with slot support:
def card(assigns) do
  ~H"""
  <div class="card">
    <div class="header">{render_slot(@header)}</div>
    <div class="body">{render_slot(@inner_block)}</div>
  </div>
  """
end

# Caller:
<.card>
  <:header>Title</:header>
  Body content here
</.card>
```

### LiveComponents

For components with isolated state and event handling:

```elixir
defmodule ToggleComponent do
  use Phoenix.LiveComponent

  def update(assigns, socket) do
    {:ok, assign(socket, :enabled, assigns[:enabled] || false)}
  end

  def handle_event("toggle", _, socket) do
    {:noreply, update(socket, :enabled, &(!&1))}
  end

  def render(assigns) do
    ~H"""
    <button phx-click="toggle" phx-target={@myself}>
      {if @enabled, do: "ON", else: "OFF"}
    </button>
    """
  end
end
```

The `phx-target={@myself}` ensures events go to the component, not the parent LiveView.

### Nested LiveViews

For complete isolation with separate processes:

```elixir
# In router:
live "/dashboard", DashboardLive do
  live "/settings", SettingsLive
end
```

Each LiveView runs in its own process with independent state. Useful for:
- Error isolation (crashes don't affect parent)
- Independent real-time subscriptions
- Complex multi-page applications

### Data Sharing Patterns

**PubSub** for cross-LiveView communication:

```elixir
def mount(_params, _session, socket) do
  Phoenix.PubSub.subscribe(MyApp.PubSub, "updates")
  {:ok, socket}
end

def handle_info({:new_message, msg}, socket) do
  {:noreply, update(socket, :messages, &[msg | &1])}
end

# Elsewhere:
Phoenix.PubSub.broadcast(MyApp.PubSub, "updates", {:new_message, "Hello"})
```

**Streams** for efficient large lists:

```elixir
def mount(_params, _session, socket) do
  {:ok, stream(socket, :users, fetch_users())}
end

# Template:
<div id="users" phx-update="stream">
  <div :for={{dom_id, user} <- @streams.users} id={dom_id}>
    {user.name}
  </div>
</div>
```

Streams automatically handle insertions/deletions/updates with minimal DOM changes.

### Component Reusability Assessment

**Quality: Excellent (9/10)**

Phoenix LiveView offers **three tiers of reusability** with clear use cases:

1. **Function Components** - Perfect for stateless UI. Dead simple: just a function returning HEEx. Can be extracted to separate modules and shared across projects via Hex packages.

2. **LiveComponents** - Excellent for stateful, reusable widgets. Each component has isolated state and event handling. The `@myself` target mechanism prevents event collisions.

3. **Nested LiveViews** - Best for fully isolated features with separate process boundaries.

**Strengths**:
- **Slots** provide excellent composition (header, footer, actions slots)
- **Attr validation** with `attr/3` provides type safety and documentation
- **No prop drilling** - components communicate via messages or PubSub
- **Cross-project reuse** - Package components in Hex, use in any Phoenix app
- **Framework-agnostic output** - LiveView components ultimately render HTML

**Weaknesses**:
- LiveComponents require more boilerplate than function components
- No visual component library ecosystem like React/Vue (smaller community)
- Server-side rendering limits some advanced UI patterns (complex animations)

**Design System Support**: Strong. Function components with `attr/3` validation make it easy to build consistent design systems. Example:

```elixir
attr :variant, :atom, values: [:primary, :secondary], default: :primary
attr :size, :atom, values: [:sm, :md, :lg], default: :md

def button(assigns) do
  ~H"""
  <button class={["btn", "btn-#{@variant}", "btn-#{@size}"]}>
    {render_slot(@inner_block)}
  </button>
  """
end
```

## Maintainability

**Quality: Excellent (9/10)**

**Refactoring**:
- **Pattern matching** makes refactoring safe - change function signatures, compiler catches all call sites
- **Immutable data** eliminates mutation bugs
- **Single language** (Elixir) means no JS/backend synchronization issues
- **Compiler feedback** is immediate and helpful

**Debugging**:
- **IEx REPL** for interactive debugging
- **IO.inspect/2** with labels for inspecting socket assigns
- **Phoenix.LiveView.Test** enables headless integration testing
- **Process isolation** - crashes don't affect other LiveViews
- **Server-side logs** capture all state transitions

**Code Organization**:
- **Colocation** - state, events, and rendering in one module
- **Clear separation** - mount, handle_event, handle_info, render
- **Contexts** (Phoenix pattern) for domain logic separation
- **Minimal files** - one LiveView module = one feature

**Testing**:
- **Excellent test helpers** - `live/2`, `render_click/1`, `render_submit/2`
- **No browser needed** - tests run fast in headless mode
- **Property testing** with StreamData for Elixir data structures
- **Deterministic** - no flaky tests from async client-side state

**Scalability**:
- **Process-per-connection** scales horizontally via BEAM
- **PubSub** for real-time communication across nodes
- **Presence** for distributed user tracking
- **Streams** handle large datasets efficiently

**Breaking Changes**:
- **Semantic versioning** enforced
- **Deprecation warnings** before removals
- **Migration guides** for major versions
- **Pattern matching** catches incompatible changes at compile time

**Weaknesses**:
- **Elixir expertise required** - smaller talent pool than JavaScript
- **Server-side crashes** require OTP supervision knowledge
- **Memory per connection** - server resources scale with connected users

## Developer Experience

### Learning Curve

**Initial**: Medium. Requires learning Elixir if coming from JavaScript, but the LiveView API itself is small and consistent.

**Mental Model Shift**: The server-centric approach is a paradigm shift from SPAs. However, many developers find it simpler once they internalize "state lives on the server."

### Tooling

- **Testing**: `Phoenix.LiveViewTest` provides comprehensive test helpers that simulate client interactions without a browser
- **Debugging**: Standard Elixir debugging (IEx, IO.inspect, debugger)
- **Live Reload**: Development automatically reloads on file changes
- **Error Messages**: Elixir provides excellent compile-time and runtime error messages

### Boilerplate

Minimal. A basic LiveView:

```elixir
defmodule MyAppWeb.CounterLive do
  use MyAppWeb, :live_view

  def mount(_params, _session, socket) do
    {:ok, assign(socket, :count, 0)}
  end

  def handle_event("inc", _, socket) do
    {:noreply, update(socket, :count, &(&1 + 1))}
  end

  def render(assigns) do
    ~H"""
    <button phx-click="inc">{@count}</button>
    """
  end
end
```

That's 15 lines for a complete interactive component.

### Common Patterns

**Form handling** with changesets:

```elixir
def handle_event("validate", %{"user" => params}, socket) do
  changeset = User.changeset(%User{}, params)
  {:noreply, assign(socket, :changeset, changeset)}
end

# Template:
<.form for={@changeset} phx-change="validate" phx-submit="save">
  <.input field={@changeset[:email]} label="Email" />
</.form>
```

**Real-time updates** via PubSub:

```elixir
Phoenix.PubSub.subscribe(MyApp.PubSub, "room:#{room_id}")

def handle_info({:new_message, msg}, socket) do
  {:noreply, stream_insert(socket, :messages, msg)}
end
```

**File uploads**:

```elixir
def mount(_params, _session, socket) do
  {:ok, allow_upload(socket, :avatar, accept: ~w(.jpg .png), max_entries: 1)}
end

# Template:
<form phx-submit="save" phx-change="validate">
  <.live_file_input upload={@uploads.avatar} />
</form>
```

### Documentation

Excellent. Comprehensive guides at hexdocs.pm with:
- Getting started tutorials
- In-depth guides on all features
- API reference with examples
- Community resources and books

## AI-Friendly Assessment

**Overall Score: 9.5/10**

### Strengths for AI-Assisted Development

**Exceptional Explicitness**: Every state change flows through explicit callbacks (`handle_event`, `handle_info`). No hidden reactivity—the data flow is completely traceable. When AI reads `handle_event("save", params, socket)`, it knows exactly what triggers this code.

**Functional Immutability**: State updates are pure functions returning new sockets. No mutation, no side effects within state updates. This makes reasoning about state changes trivial for AI:
```elixir
# Before: socket.assigns.count = 5
# After:  socket.assigns.count = 6
```

**Pattern Matching Clarity**: Elixir's pattern matching makes event handlers self-documenting:
```elixir
def handle_event("save", %{"user" => %{"email" => email}}, socket)
```
AI can instantly understand the expected shape of params.

**Single Language**: No context switching between JavaScript client and [other language] server. Everything is Elixir. AI maintains consistent syntax and patterns throughout.

**Declarative Event Bindings**: `phx-click="save"` is more scannable than `onClick={handleSave}`. AI can grep for event names and immediately find handlers.

**Minimal Abstraction Layers**: No reducers, actions, middleware, observables, or complex state machines. Just functions and data structures.

**Type Safety Potential**: With Elixir typespecs, AI can verify function signatures:
```elixir
@spec handle_event(String.t(), map(), Socket.t()) :: {:noreply, Socket.t()}
```

**Isolated Concerns**: Each LiveView is a complete module with all its state, events, and rendering. AI doesn't need to track state across multiple files.

**Testability**: `Phoenix.LiveViewTest` allows AI to write comprehensive tests without browser automation:
```elixir
{:ok, view, _html} = live(conn, "/counter")
assert view |> element("button") |> render_click() =~ "Count: 1"
```

### Weaknesses for AI-Assisted Development

**Elixir Learning Curve**: AI trained primarily on JavaScript codebases must adapt to Elixir syntax, OTP patterns, and functional idioms.

**Server-Side Limitations**: Some interactions (drag-and-drop, complex animations) still require JavaScript hooks, creating a dual-context scenario.

**Process Mental Model**: Understanding LiveView processes, supervision trees, and message passing requires functional programming knowledge that's less common than imperative patterns.

**Async Complexity**: While `assign_async` helps, coordinating multiple async operations with loading states, errors, and cancellations can get complex.

### Why 9.5/10?

LiveView achieves near-perfect AI-friendliness within its domain:
- Completely explicit data flow
- Functional purity for state updates
- Zero client-side state synchronization
- Minimal API surface area
- Exceptional locality of behavior

The 0.5 deduction is solely for the Elixir/BEAM learning curve. For developers already familiar with Elixir, or AI agents with strong Elixir training data, this is effectively a **10/10**.

Phoenix LiveView represents the **server-rendered renaissance**—proving that interactivity doesn't require shipping application logic to clients. For AI generating code, this is ideal: single language, functional patterns, explicit data flow, and zero impedance mismatch between backend and frontend.

---

**Key Insight for Next-Gen Framework Design**: LiveView demonstrates that **server-driven UI with diff-based updates** is a viable alternative to client-side frameworks. The mental model is simpler (events → state → render), the security is better (logic stays server-side), and the AI-friendliness is exceptional (functional purity, explicit flows). Future frameworks should consider hybrid approaches that combine LiveView's simplicity with client-side performance for specific interactions.
