---
name: "Phoenix LiveView"
category: "full-framework"
github_url: "https://github.com/phoenixframework/phoenix_live_view"
docs_url: "https://hexdocs.pm/phoenix_live_view/"
implementation_language: "Elixir"
status: "active"
type_system_score: 5.5
compiler_feedback_score: 7.5
locality_score: 9
explicitness_score: 9.5
convention_strength_score: 7.5
token_efficiency_score: 8
familiarity_score: 5
stability_score: 8
tooling_score: 7.5
version: "1.1.31"
ai_tooling:
  mcp_server:
    available: true
    url: "https://github.com/tidewave-ai/tidewave_phoenix"
    party: "third-party"
  guidelines: "Phoenix 1.8.0+ auto-generates AGENTS.md in new projects with framework-specific rules that correct common LLM mistakes; compatible with usage_rules library (https://github.com/nicholasgasior/usage_rules)"
  llms_txt: false
  style_guides: null
  observed_delta: "No official llms.txt exists at hexdocs.pm/phoenix_live_view as of June 2026. Ran the canonical Todo exercise (add, toggle, filter, delete) without AGENTS.md and with AGENTS.md context loaded. Without AGENTS.md: model produced functional LiveView code but used the older `live_component/2` helper (removed in 1.0) and called `socket.assigns` directly in a guard clause rather than pattern-matching in the function head — both are pre-1.0 idioms. With AGENTS.md (from a Phoenix 1.8 project): both issues were avoided on first attempt; the model also used `assign_async/3` unprompted for the data-fetching variant rather than the manual Task pattern. Net delta: two idiomatic corrections from deprecated-helper→current-API and direct-assigns-access→pattern-matching, plus proactive use of the async helper. The correction category matches what the Phoenix team documented as 'night-and-day difference' — closing training-data gaps on post-1.0 API changes."
next_release:
  name: "1.2.0"
  status: "beta"
  changes: "Colocated CSS in component files (Phoenix.LiveView.ColocatedCSS behavior); JS Command JSON encoding allowing Phoenix.LiveView.JS structs to be sent via push_event rather than rendered in element attributes; debug annotation control via module attributes; enhanced test warning configuration with per-check severity; script/style tag formatting for third-party tools. One deprecation: :colocated_js config replaced by :colocated_assets."
  anticipated_impact: "Additive — colocated CSS and JS commands are new capabilities that don't break existing code. The :colocated_js deprecation is the only migration item. No evidence of API surface changes that would affect existing LiveViews."
  stability_penalty: false
components: null
supersedes: null
superseded_by: null
license: "MIT"
runtime: "server"
capabilities:
  state_management: true
  rendering: true
  event_handling: true
paradigm: "declarative"
state_model: "immutable"
rendering_strategy: "server-side"
maintainer: "Phoenix Framework / Plataformatec / Dashbit"
first_released: "2019"
reviewed_date: "2026-06-09"
reviewed_by_model: "Claude Sonnet 4.6"
reviewer_notes: "Full from-scratch rewrite under the 9-dimension flat rubric. Phoenix LiveView 1.0 shipped December 2024; 1.1 shipped July 2025 (colocated hooks, keyed comprehensions, portals, TypeScript client types). Current stable is 1.1.31; 1.2.0-rc.3 is the active pre-release. Phoenix (the parent framework) is 1.8.7. This is a server-side framework scored in a UI corpus — rubric adaptations noted inline in each Evidence section. Elixir is dynamically typed; type scoring reflects Dialyzer + attr/3 compile-time validation + Elixir 1.17 gradual set-theoretic types. No TodoMVC canonical reference targeting the current 1.0+ API exists — the most-cited GitHub repos (toranb/phoenix-live-view-todomvc, dwyl/phoenix-liveview-todo-list-tutorial) target 0.17-0.18 era APIs. Used the DEV Community series by amencarini as the basis for the token-efficiency reference implementation, supplemented with the official getting-started guide idioms to account for 1.0+ API differences. No documentation friction on core APIs; the hexdocs.pm/phoenix_live_view redirect to phoenix-live-view.hexdocs.pm was a minor structural surprise but all content resolved correctly."
---

# Phoenix LiveView

## State Management

### Philosophy & Mental Model

Phoenix LiveView keeps all application state on the server in Elixir process memory. There is no client-side state, no synchronization problem, and no separate state management library. State is Elixir data — maps, lists, structs — stored in **socket assigns**, which are key-value pairs on the `Phoenix.LiveView.Socket` struct.

The mental model: a LiveView is an Elixir process (a BEAM lightweight thread). Events arrive as messages, update the socket, and a new render diff is pushed to the browser. The browser is a thin rendering terminal.

```elixir
def mount(_params, _session, socket) do
  {:ok, assign(socket, count: 0, items: [])}
end
```

### Core Primitives

- `assign(socket, key, value)` — set a single assign
- `assign(socket, keyword_list)` — set multiple assigns
- `update(socket, key, fn)` — transform an existing value
- `assign_new(socket, key, fn)` — set only if absent
- `stream(socket, name, items)` — efficient large-collection management (1.0+)
- `assign_async(socket, keys, fn)` — async data with built-in loading states (1.0+)

### Update Mechanism

State updates are functional and return a new socket. Mutation never happens in place:

```elixir
def handle_event("increment", _params, socket) do
  {:noreply, update(socket, :count, &(&1 + 1))}
end
```

All state flows through three callback shapes:
- `handle_event/3` — user interactions from the browser
- `handle_info/2` — messages from Elixir processes (timers, PubSub)
- `handle_params/3` — URL parameter changes

### Async Handling

`assign_async/3` wraps async work with built-in `AsyncResult` loading states:

```elixir
def mount(_params, _session, socket) do
  {:ok, assign_async(socket, :users, fn -> {:ok, %{users: fetch_users()}} end)}
end

# Template:
# <div :if={@users.loading}>Loading...</div>
# <div :if={@users.ok?}>
#   <div :for={u <- @users.result}>{u.name}</div>
# </div>
```

The manual `Task.start` + `handle_info` pattern also works and remains idiomatic for custom control.

---

## Rendering

### Philosophy & Approach

Rendering is **server-side HTML over WebSocket**. On initial request, a full HTML page is rendered. After WebSocket connection, LiveView re-runs the HEEx template on each state change, diffs the output against the previous render, and sends only the changed fragments to the browser as binary patches. The client-side JavaScript runtime applies those patches to the DOM.

This is fundamentally different from virtual-DOM or signals-based approaches: there is no client-side component tree, no reconciler running in the browser, and no JavaScript component lifecycle.

### Templating — HEEx

HEEx (HTML + EEx) is an HTML-aware template language with embedded Elixir:

```elixir
def render(assigns) do
  ~H"""
  <div>
    <h1>{@title}</h1>
    <ul>
      <li :for={item <- @items} id={"item-#{item.id}"}>
        <span class={if item.done, do: "done"}>{item.text}</span>
        <button phx-click="delete" phx-value-id={item.id}>x</button>
      </li>
    </ul>
    <form phx-submit="add">
      <input type="text" name="text" />
      <button type="submit">Add</button>
    </form>
  </div>
  """
end
```

HEEx provides:
- HTML-aware parsing (unclosed tags are compile errors)
- Automatic XSS escaping via `{...}` interpolation
- `:if`, `:for` special attributes for conditionals and loops
- `:let` for slot content binding

Templates can be colocated in the module (via `~H` sigil) or in a separate `.html.heex` file alongside the module. This is a user choice, not a framework requirement.

### Component Model

Three tiers:

**Function components** (stateless, zero overhead):
```elixir
attr :label, :string, required: true
attr :variant, :atom, values: [:primary, :secondary], default: :primary

def button(assigns) do
  ~H"""
  <button class={["btn", "btn-#{@variant}"]}>{@label}</button>
  """
end
```

**LiveComponents** (stateful, same process as parent):
```elixir
defmodule MyAppWeb.CounterComponent do
  use Phoenix.LiveComponent

  def render(assigns) do
    ~H"""
    <div>
      <button phx-click="dec" phx-target={@myself}>-</button>
      {@count}
      <button phx-click="inc" phx-target={@myself}>+</button>
    </div>
    """
  end

  def handle_event("inc", _, socket), do: {:noreply, update(socket, :count, &(&1 + 1))}
  def handle_event("dec", _, socket), do: {:noreply, update(socket, :count, &(&1 - 1))}
end
```

**Nested LiveViews** — separate BEAM processes with full isolation.

---

## Event Handling

### Core Pattern

Events are declared in the template with `phx-*` bindings, handled on the server in `handle_event/3`:

```elixir
# Template
~H"""
<button phx-click="save">Save</button>
<form phx-submit="create" phx-change="validate">
  <input type="text" name="title" phx-debounce="300" />
</form>
"""

# Handler
def handle_event("save", _params, socket) do
  {:noreply, socket}
end

def handle_event("create", %{"title" => title}, socket) do
  case Repo.insert(%Item{title: title}) do
    {:ok, item} -> {:noreply, update(socket, :items, &[item | &1])}
    {:error, cs} -> {:noreply, assign(socket, changeset: cs)}
  end
end
```

Available bindings: `phx-click`, `phx-submit`, `phx-change`, `phx-blur`, `phx-focus`, `phx-keydown`, `phx-keyup`, `phx-window-keydown`, `phx-window-keyup`, `phx-viewport-top`, `phx-viewport-bottom`.

### Client-Side JavaScript Hooks

For JavaScript interop (charts, date pickers, etc.), the hook system provides lifecycle callbacks and bidirectional messaging:

```javascript
// assets/js/app.js
let Hooks = {
  DatePicker: {
    mounted() {
      this.el.addEventListener("change", e => {
        this.pushEvent("date-selected", {date: e.target.value})
      })
    }
  }
}
let liveSocket = new LiveSocket("/live", Socket, {hooks: Hooks})
```

```elixir
# Template
<input type="date" id="picker" phx-hook="DatePicker" />

# Handler
def handle_event("date-selected", %{"date" => date}, socket) do
  {:noreply, assign(socket, :selected_date, date)}
end
```

As of LiveView 1.1, hooks can be colocated directly in HEEx component files via `<script :type={Phoenix.LiveView.ColocatedHook}>` tags, eliminating the separate assets file for simple cases.

---

## Rubric Evidence

### Evidence: Type-system integration

**Category: community/optional** — Elixir is a dynamically typed language. Three layers of typing are available in the Phoenix LiveView ecosystem:

1. **Dialyzer + typespecs** — optional static analysis via the `dialyxir` Hex package. Typespecs are documentation-grade annotations that Dialyzer uses for flow analysis. Not enforced at compile time; produces warnings at `mix dialyzer` time.

2. **`attr/3` and `slot/3` compile-time validation** — Phoenix.Component's macros provide the closest thing to type-checked component interfaces in the framework. Missing required attributes, unknown attributes, and literal type mismatches produce compile-time warnings:

```
warning: missing required attribute "name" for component
  MyAppWeb.MyComponent.greet/1
  lib/app_web/my_component.ex:15
```

Demonstrating a type violation — passing an integer to a `:string` attr:
```elixir
attr :label, :string, required: true

def my_button(assigns), do: ~H"<button>{@label}</button>"

# Caller:
<.my_button label={42} />
# Produces at compile time:
# warning: attribute "label" in component MyAppWeb.Helpers.my_button/1
# must be a :string, got integer literal 42
```

3. **Elixir 1.17+ gradual set-theoretic types** — the Elixir compiler (1.17+) infers types from pattern matches and emits warnings for typos in struct field access, incompatible type comparisons, and unreachable clauses. This catches `user.adress` (typo) and `if integer >= string` in any Elixir code including LiveView modules.

The combination is meaningful but not comprehensive: there is no end-to-end type system that spans socket assigns, template expressions, and event handler params the way TypeScript spans a React component tree. Score: **5.5** — more than "none" (three real mechanisms), less than a native type system (all optional, annotation-grade, not constraint-enforced end to end).

### Evidence: Compiler/build feedback quality

The HEEx template compiler runs at `mix compile` time and catches structural errors before the application starts. Demonstrating with a deliberately broken example:

**Test 1 — unclosed HTML tag:**
```elixir
def render(assigns) do
  ~H"""
  <div>
    <p>Hello
  </div>
  """
end
```
Produces:
```
** (Phoenix.LiveView.HTMLTokenizerError) expected closing tag for <p>
  nofile:4: (file)
```
Actionable — file, line, and the specific unclosed tag are named.

**Test 2 — invalid `phx-*` attribute syntax (extra quote):**
```elixir
~H"""
<button phx-click="save"">Save</button>
"""
```
Produces:
```
** (Phoenix.LiveView.HTMLTokenizerError) expected attribute name
  nofile:2: (file)
```
Points to the line; slightly less precise about the exact character, but narrows to the offending element.

**Test 3 — missing required component attr:**
```elixir
attr :name, :string, required: true
def greet(assigns), do: ~H"<p>Hello {@name}</p>"

# Caller with no :name:
<.greet />
```
Produces (compile-time warning, not error):
```
warning: missing required attribute "name" for component
  MyAppWeb.Helpers.greet/1
  lib/app_web/some_view.ex:22
```
This is a warning rather than an error by design (attr enforcement is documentation-grade). The location is precise.

**Summary:** HEEx's compiler feedback is genuinely useful for HTML structure errors (hard errors with file+line), less comprehensive for runtime-category errors like wrong-shaped assigns (which only surface at runtime or via Dialyzer). Compared to TypeScript's tsc or Elm's compiler it's weaker in semantic coverage; compared to JSX in plain JavaScript it's meaningfully stronger. Score: **7.5**.

### Evidence: Locality of behavior

Tracing a representative feature: **"delete a todo item"** in a standard LiveView todo app.

Touchpoints required to understand and change this feature end-to-end:

1. **`lib/my_app_web/live/todo_live.ex`** — the LiveView module containing `handle_event("delete", %{"id" => id}, socket)` (state update logic) and the `render/1` function with the delete button binding
2. *(Optionally)* **`lib/my_app_web/live/todo_live.html.heex`** — if using a colocated template file instead of the `~H` sigil; this is a file-split choice but not a conceptual split — both live in the same module's namespace

That is **1 mandatory touchpoint** (the LiveView module) and **1 optional touchpoint** (the template file, only if the developer chose to separate it). All of state management, event handling, and rendering for a feature live in the same module.

By contrast, a typical React app with Redux would touch: action creator, reducer, selector, component, and possibly a saga or thunk — 4-5 touchpoints. Even a React hook component with `useState` touches the component file and any associated hooks file.

The functional decomposition within the single module is also clear: `mount` (initial state), `handle_event` (mutations), `render` (output). An AI agent reading any one of these functions knows exactly which other callbacks to look at.

Score: **9.0** — exceptional locality; the only realistic cost is the optional template-file split and the convention that LiveComponents are separate modules when isolated state is needed.

### Evidence: Explicitness / data-flow traceability

Tracing a single state change end-to-end: **user clicks "Add" on a todo form**.

```
[User clicks submit]
  → browser dispatches native submit event
  → LiveView JS client intercepts (phx-submit="add")  [implicit: framework hook]
  → WebSocket message sent to server: {"event":"add","value":{"text":"Buy milk"}}  [explicit protocol]
  → LiveView process receives message
  → handle_event("add", %{"text" => "Buy milk"}, socket) called  [explicit: pattern match]
  → assign(socket, :items, [new_item | socket.assigns.items]) returns new socket  [explicit: function call]
  → LiveView framework diffs render output  [implicit: framework re-renders]
  → binary patch sent to browser over WebSocket  [implicit: framework transport]
  → browser patches DOM  [implicit: LiveView JS client]
```

**Explicit hops:** 3 (WebSocket message, `handle_event/3` dispatch, `assign/3` call)
**Implicit hops:** 3 (browser event interception, render diff, DOM patch)

The implicit hops are all in the framework's plumbing — not in application code. The application code path is entirely explicit: you can read `handle_event` and see every state change that happens, with no hidden reactive subscriptions, no middleware chain, no reducer composition. Pattern matching in the function head makes the contract self-documenting:

```elixir
def handle_event("add", %{"text" => ""}, socket), do: {:noreply, socket}  # guard: empty string
def handle_event("add", %{"text" => text}, socket) do
  {:noreply, update(socket, :items, &[%{id: id(), text: text, done: false} | &1])}
end
```

This is among the most explicit data flows in this corpus. There is no magic: every state change is an explicit function call returning a new socket. Score: **9.5**.

### Evidence: Convention strength

Task: **"fetch data when a LiveView mounts."**

Approaches found in the official documentation and community:

1. **`mount/3` with synchronous call** — call a context/repo function directly in mount, assign the result. The simplest and most common approach for fast queries.

2. **`assign_async/3`** (official, 1.0+) — wrap the data fetch in the async helper for automatic AsyncResult loading states. Recommended for slower operations.

3. **`handle_params/3` with data loading** — a 2024 community recommendation: keep mount minimal, delegate actual data loading to `handle_params/3` which fires after mount. Useful when the data depends on URL parameters.

4. **`Task.start` + `handle_info/2`** — manually spawn an async task and receive its result as an Elixir message. Predates `assign_async`; still valid and more flexible for complex coordination.

5. **`start_async/3` + `handle_async/3`** (1.0+) — lower-level async primitive than `assign_async`, giving explicit control over task naming and cancellation.

**Count: 5 approaches**, with a clear hierarchy. The official docs designate (1) and (2) as the primary idioms and acknowledge (3-5) as valid alternatives for specific situations. The doc structure is clear about the trade-offs. This is moderate-to-strong convention with documented alternatives rather than a free-for-all.

No documentation friction on this specific question — the "async" section of the official docs covers approaches (2), (4), and (5) in the same page with explicit guidance on when to prefer each. The `handle_params` approach required reading a 2024 community blog post; the official docs allude to it but don't call it out as a named pattern.

Score: **7.5** — not quite as strong as a framework with one canonical way, but the alternatives have documented trade-offs rather than being arbitrary style choices.

### Evidence: Token efficiency / boilerplate density

**Path taken:** No official TodoMVC implementation targeting LiveView 1.0+ API exists. The most-cited implementations (toranb/phoenix-live-view-todomvc, dwyl/phoenix-liveview-todo-list-tutorial) target the 0.17-0.18 API (pre-1.0). The DEV Community series by amencarini (https://dev.to/amencarini/liveview-todomvc-4jin) is the closest canonical reference but also targets older APIs. A fresh implementation following the official 1.0+ style guide (https://hexdocs.pm/phoenix_live_view/) was produced for this evidence.

**Core LiveView module — TodoMVC feature set (add, toggle, delete, filter):**

```elixir
defmodule TodoMVCWeb.TodoLive do
  use TodoMVCWeb, :live_view

  def mount(_params, _session, socket) do
    {:ok, assign(socket, items: [], filter: :all, new_title: "")}
  end

  def handle_event("add", %{"title" => ""}, socket), do: {:noreply, socket}
  def handle_event("add", %{"title" => title}, socket) do
    item = %{id: System.unique_integer([:positive]), title: title, done: false}
    {:noreply, update(socket, :items, &[item | &1])}
  end

  def handle_event("toggle", %{"id" => id}, socket) do
    id = String.to_integer(id)
    {:noreply, update(socket, :items, fn items ->
      Enum.map(items, fn
        %{id: ^id} = item -> %{item | done: !item.done}
        item -> item
      end)
    end)}
  end

  def handle_event("delete", %{"id" => id}, socket) do
    id = String.to_integer(id)
    {:noreply, update(socket, :items, &Enum.reject(&1, fn i -> i.id == id end))}
  end

  def handle_event("filter", %{"type" => type}, socket) do
    {:noreply, assign(socket, :filter, String.to_existing_atom(type))}
  end

  defp visible_items(items, :all), do: items
  defp visible_items(items, :active), do: Enum.reject(items, & &1.done)
  defp visible_items(items, :completed), do: Enum.filter(items, & &1.done)

  def render(assigns) do
    ~H"""
    <section>
      <form phx-submit="add">
        <input type="text" name="title" placeholder="What needs to be done?" autofocus />
      </form>
      <ul>
        <li :for={item <- visible_items(@items, @filter)} id={"item-#{item.id}"}>
          <input type="checkbox" checked={item.done}
                 phx-click="toggle" phx-value-id={item.id} />
          <span class={if item.done, do: "completed"}>{item.title}</span>
          <button phx-click="delete" phx-value-id={item.id}>×</button>
        </li>
      </ul>
      <footer :if={@items != []}>
        <span>{Enum.count(@items, & !&1.done)} items left</span>
        <div>
          <button phx-click="filter" phx-value-type="all"
                  class={if @filter == :all, do: "selected"}>All</button>
          <button phx-click="filter" phx-value-type="active"
                  class={if @filter == :active, do: "selected"}>Active</button>
          <button phx-click="filter" phx-value-type="completed"
                  class={if @filter == :completed, do: "selected"}>Completed</button>
        </div>
      </footer>
    </section>
    """
  end
end
```

**Line count:** ~58 lines (the module above). This is the **entire feature** — state, event handling, filtering logic, and template. No separate store file, no action creators, no reducer, no selector, no effect. The router entry (`live "/", TodoLive`) adds 1 line.

Comparable reference points from this corpus:
- React (TodoMVC canonical): ~180 lines across component + state files
- SolidJS (canonical): ~120 lines
- Svelte (canonical): ~80 lines

LiveView's line count is competitive despite being a full-stack solution (server + client in one module). The low count reflects both the functional style (pattern-matched event handlers are dense) and the absence of client-side plumbing. The trade-off is that the template is HEEx, not HTML/JSX, which adds a small learning-curve cost.

Score: **8.0** — impressively concise for a full-stack feature; the Elixir functional style adds expressiveness not available in JavaScript-land.

### Evidence: Familiarity composite

Four proxies:

**1. GitHub activity:** phoenixframework/phoenix_live_view — 6.8k stars, 4,811 commits, 1k forks, active maintenance (last commit within days of this review). The parent framework (phoenixframework/phoenix) has ~22k stars. These are solid numbers but well below React (220k+), Vue (47k), or Svelte (80k).

**2. Stack Overflow / community volume:** The [phoenix-liveview] tag exists on Stack Overflow; precise count unavailable (SO blocks automated access), but community triangulation suggests ~3,000–5,000 questions — well below JavaScript frameworks but meaningful for a server-side Elixir tool. The Elixir Forum (elixirforum.com) has an active `phoenix-liveview` tag with thousands of threads. The Thinking Elixir Podcast covers LiveView regularly, including the 2025 SO survey results.

**3. Ecosystem registry trend:** hex.pm/packages/phoenix_live_view — 41.3M total downloads, ~215k downloads/week (June 2026). Consistent upward trend. Note: Elixir uses hex.pm, not npm; these numbers are not directly comparable to npm stats but represent the entire Elixir/Phoenix production user base.

**4. Age and survey data:** First released 2019. As of the 2025 Stack Overflow Developer Survey, **Phoenix is the most admired web framework for the third consecutive year** (79% of users would choose it again). Elixir ranks 3rd most admired language. High satisfaction, smaller absolute user base.

**Age-weighting:** 7 years old — enough for substantial training-data coverage, but Elixir's smaller overall community means proportionally less coverage than JS frameworks of the same age.

**Structural note:** Hex.pm download stats reflect the entire Elixir ecosystem for this package; there is no CDN/unpkg delivery split to worry about here. The satisfaction scores are a genuine signal about community loyalty rather than breadth.

Score: **5.0** — high quality community, strong survey recognition, but a fraction of JavaScript framework community size. An AI model trained on GitHub and SO data will have seen Phoenix/LiveView but with substantially less representation than React, Vue, or even Svelte.

### Evidence: Stability / convention durability

**LiveView 1.0 → 1.1 → 1.2 changelog analysis:**

LiveView 1.0 shipped December 3, 2024. Key breaking changes from the pre-1.0 era:
- `live_component/2` and `live_component/3` helpers removed (replaced by `<.live_component>` function component syntax)
- `phx-feedback-for` attribute removed (replaced by `used_input?/1`; a shim was provided)
- Various render callback signature changes that were deprecated through the 0.x era

**1.0 → 1.1 (July 2025):** Entirely additive — colocated hooks, keyed comprehensions, portals, TypeScript client types. No breaking changes.

**1.1 → 1.2.0-rc (active as of June 2026):** One deprecation (`:colocated_js` → `:colocated_assets`); otherwise additive (colocated CSS, JS command encoding). The `next_release` frontmatter captures this: `stability_penalty: false`.

**Phoenix (parent) 1.7 → 1.8:** The `config` variable is no longer injected into `Phoenix.Endpoint` (use `Application.compile_env/3`). Otherwise additive; AGENTS.md generation added. No breaking changes to LiveView conventions.

**Trajectory assessment:** The 1.0 release stabilized the API surface. The 1.x series has been additive. The RFC/roadmap does not show any pending API rewrites of the magnitude that would affect existing code. The `attr/3` component API, `phx-*` event bindings, and socket assign model have been stable since late 2022 (well before 1.0).

**Comparison baseline:** SolidJS 2.0 is a broad API rewrite (stability_penalty: true). Phoenix LiveView's trajectory is the opposite — the 1.0 milestone was a stabilization event, not a disruption one.

Score: **8.0** — stable conventions, small deprecation surface, clear versioning. Modest deduction for the Elixir ecosystem's periodic minor breaking changes across OTP versions and for the fact that the pre-1.0 era had real API churn that AI training data may reflect.

### Evidence: Ecosystem tooling facts

**Devtools / runtime inspection:**
- [LiveDebugger](https://github.com/software-mansion/live_debugger) — third-party LiveView debugging tool; provides Active LiveViews dashboard, component tree, assigns inspection, and callback execution tracing. Available as a Hex dependency.
- `IO.inspect/2` with labels — standard Elixir technique for socket assign inspection during development
- IEx `REPL` — interactive Elixir shell with full access to application internals
- Phoenix Pulse VS Code extension — IDE companion for LiveView development

**Test utilities:**
- `Phoenix.LiveViewTest` — **official, built into the library**. Provides `live/2` (mount a LiveView), `render_click/2`, `render_submit/3`, `render_change/3`, `render_keydown/2`, `render_hook/3`, `element/3` (DOM selector scoping), `assert_redirect/3`, `assert_patch/3`, `render_upload/2`. Tests run headless — no browser required.

```elixir
test "increments counter on click", %{conn: conn} do
  {:ok, view, _html} = live(conn, "/counter")
  view |> element("button", "+") |> render_click()
  assert render(view) =~ "Count: 1"
end
```

**IDE/LSP support:**
- [ElixirLS](https://marketplace.visualstudio.com/items?itemName=JakeBecker.elixir-ls) — VS Code extension with Elixir/Phoenix support, autocomplete, inline Dialyzer warnings, `.heex` template syntax highlighting
- Phoenix LiveView HEEx formatter — `Phoenix.LiveView.HTMLFormatter` plugin for `mix format`
- Zed editor has first-class Elixir support

**AI tooling (see On the Horizon for observed delta):**
- Phoenix 1.8+ auto-generates `AGENTS.md` in new projects — yes (first-party, included by default since 1.8.0)
- Tidewave MCP server — yes (third-party, Apache 2.0; provides SQL query execution, doc lookup, log reading, module discovery, code evaluation within the app runtime)
- Petal Components MCP — yes (community; exposes the Shadcn-style LiveView component library to AI coding assistants)

**Checklist summary:**

| Tool | Available | Link |
|---|---|---|
| Devtools (LiveDebugger) | yes | https://github.com/software-mansion/live_debugger |
| Test utilities (LiveViewTest) | yes (official) | https://hexdocs.pm/phoenix_live_view/Phoenix.LiveViewTest.html |
| IDE/LSP (ElixirLS) | yes | https://marketplace.visualstudio.com/items?itemName=JakeBecker.elixir-ls |
| HEEx formatter | yes (official) | built into phoenix_live_view |
| AGENTS.md generation | yes (first-party) | Phoenix 1.8+ `mix phx.new` |
| MCP server (Tidewave) | yes (third-party) | https://github.com/tidewave-ai/tidewave_phoenix |

Score: **7.5** — strong test utilities and official AGENTS.md support pull the score up; missing a browser-based component inspector comparable to React DevTools, and Dialyzer integration requires extra setup compared to a native type system.

---

## On the Horizon

### Next release

- **Name/version:** 1.2.0
- **Status:** beta (rc.3 as of June 2026)
- **What's changing:** Colocated CSS in component files via `Phoenix.LiveView.ColocatedCSS`; JS Command JSON encoding (allows `Phoenix.LiveView.JS` structs in `push_event` payloads rather than rendered attributes); debug annotation control per-module; enhanced test warning configuration; script/style tag formatting support. Deprecates `:colocated_js` in favor of `:colocated_assets`.
- **Anticipated impact:** All additive. Colocated CSS and JS command encoding expand capabilities without changing existing patterns. The one deprecation has a clear migration path. No evidence this release changes rubric evidence for any dimension.
- **Stability penalty:** no — see `next_release.stability_penalty: false` in frontmatter and the Stability evidence above.

### AI-tooling investment

**What exists:**
- **AGENTS.md (first-party):** Phoenix 1.8.0+ auto-generates an `AGENTS.md` file in all new projects via `mix phx.new`. The file contains ~45 lines of Phoenix-specific guidance correcting common LLM mistakes (deprecated API usage, incorrect event handler patterns, form validation idioms). Compatible with the `usage_rules` library for aggregating dependency-specific guidelines. The Phoenix team described this as providing a "night-and-day difference to the LLM assisted dev experience." Source: https://hexdocs.pm/phoenix/changelog.html (Phoenix 1.8.0 entry) and https://hashrocket.com/blog/posts/supercharging-ai-assisted-development-in-phoenix-applications
- **Tidewave MCP server (third-party, Dashbit):** Provides AI coding assistants with real-time access to the running application — SQL query execution, documentation lookup, log reading, module discovery, source location retrieval, code evaluation within the app runtime. Works as a standalone MCP server. Source: https://github.com/tidewave-ai/tidewave_phoenix
- **Petal Components MCP (community):** Exposes the Shadcn-style Phoenix LiveView component library to AI coding assistants. Source: https://glama.ai/mcp/servers/petalframework/petal-components-mcp
- **No llms.txt:** The hexdocs.pm site does not publish a `llms.txt` for phoenix_live_view as of June 2026.

**Observed delta:** Described in `ai_tooling.observed_delta` frontmatter above. Summary: with AGENTS.md loaded, two pre-1.0 API habits were avoided on first attempt and `assign_async/3` was used proactively. The delta is real and focused on post-1.0 API migration knowledge gaps — exactly the category AGENTS.md was designed to address. The framework's intrinsic explicitness (all state flows through `handle_event`, no implicit subscriptions) means that without AGENTS.md, models still produce *correct* LiveView code — the delta is about API version currency, not about understanding the mental model.
