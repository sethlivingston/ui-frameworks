---
name: "Laravel Livewire"
category: "full-framework"
github_url: "https://github.com/livewire/livewire"
docs_url: "https://livewire.laravel.com/docs/"
implementation_language: "PHP"
status: "active"
type_system_score: 5.5
compiler_feedback_score: 6
locality_score: 8
explicitness_score: 8.5
convention_strength_score: 7.5
token_efficiency_score: 7.5
familiarity_score: 6.5
stability_score: 6.5
tooling_score: 7.5
version: "4.3.1"
ai_tooling:
  mcp_server:
    available: false
    url: null
    party: null
  guidelines: "Laravel Boost (https://github.com/laravel/boost) ships a `livewire-development` skill and Livewire-specific guidelines loaded automatically when `livewire/livewire` is detected in composer.json. Part of the official Laravel AI toolchain."
  llms_txt: false
  style_guides: null
  observed_delta: "Laravel Boost's `livewire-development` skill loaded against the canonical counter + todo exercise. Without Boost the model produced correct functional code but used v3-era `getListeners()` return array syntax for event listeners, and used the `#[Computed]` attribute inline without the `persist` vs. none distinction. With Boost loaded: model used v4 `#[On]` attribute syntax, correctly noted `.deep` modifier needed for wire:model on child-wrapped inputs, and unprompted added `wire:key` to list items. Net delta: two idiom corrections (v3-era listener syntax → v4 attribute syntax; missing wire:key) plus one correct modifier use. A real but bounded delta — the main value is closing the v3→v4 migration gap in training data."
next_release:
  name: null
  status: null
  changes: "v4 shipped January 15, 2026 as the current stable. The v4.x point-release track (latest: 4.3.1, June 2, 2026) is in active maintenance: Islands feature, Blaze compiler, PHP 8.4 property hooks support, single-file components, slots and refs. No v5 roadmap or breaking-change RFCs announced as of this review."
  anticipated_impact: "No major breaking changes anticipated in the near term. v4 itself introduced several breaking changes from v3 (wire:model event semantics, routing, wire:transition API) — those are already in stable and documented in the upgrade guide. The active 4.x track is additive."
  stability_penalty: false
components: null
supersedes: null
superseded_by: null
license: "MIT"
runtime: "both"
capabilities:
  state_management: true
  rendering: true
  event_handling: true
paradigm: "declarative"
state_model: "mutable"
rendering_strategy: "server-side"
maintainer: "Caleb Porzio / Community"
first_released: "2019"
reviewed_date: "2026-06-09"
reviewed_by_model: "Claude Sonnet 4.6"
reviewer_notes: "Full from-scratch rewrite under the 9-dimension flat rubric. Version verified from Packagist (4.3.1, June 2, 2026). No TodoMVC listing on todomvc.com for Livewire — used a community TodoMVC-style implementation (YannickYayo/livewire-todolist) plus official v4 docs examples as the token-efficiency reference, following the fallback path from the research brief. The package is PHP/Composer, not npm — npm_package set to null; typescript_support set to null (not applicable). runtime: both — PHP server-side logic plus Livewire's Alpine.js-based browser JS."
---

# Laravel Livewire

## State Management

### Philosophy & Mental Model

Laravel Livewire's state model is **server-authoritative, mutable, and property-driven**. State lives on the PHP server as public class properties. Every interaction triggers an AJAX round-trip: the browser sends the current property snapshot plus the event name, PHP updates properties directly, and the re-rendered HTML diff returns to the browser. There is no client-side state store — the browser is a thin rendering terminal that forwards events and receives HTML patches.

Mental model:
- Public PHP properties on a `Component` class are the state
- Blade templates directly read those properties by name — no explicit binding step
- `wire:*` directives connect DOM events to PHP methods
- After a method completes, Livewire re-renders the component and sends only the changed HTML fragments (via Alpine Morph / morphdom)

This is the "stay in PHP" philosophy: instead of splitting a feature between a PHP API and a JavaScript view layer, the entire feature lives in one PHP class plus one Blade template.

### Core Primitives

- **Public properties** — scalar types (string, int, float, bool, null), arrays, `Eloquent\Collection`, `Eloquent\Model`, `Carbon`, `Stringable`, `BackedEnum`. Custom types need a `Wireable` interface or Synthesizer.
- **`#[Computed]` methods** — memoized derived state, cached per-request by default, optionally persisted for the component lifetime or application-wide.
- **`Form` objects** — `Livewire\Form` subclasses encapsulate validation rules and multiple fields as a reusable unit.
- **`#[Locked]` attribute** — marks a property as server-only, preventing client-side tampering.
- **`#[Reactive]` attribute** — opts a child component's property into automatic re-hydration when a parent re-renders.

### Update Mechanism

Direct mutation — methods modify `$this->property` in-place:

```php
// app/Livewire/Counter.php
<?php

namespace App\Livewire;

use Livewire\Component;

class Counter extends Component
{
    public int $count = 0;

    public function increment(): void
    {
        $this->count++;
    }

    public function render()
    {
        return view('livewire.counter');
    }
}
```

Helper shortcuts:
- `$this->fill(['title' => 'New', 'body' => 'Text'])` — bulk assign from array
- `$this->reset('title')` — reset one property to its default
- `$this->reset()` — reset all properties
- `$this->pull('property')` — read and reset in one call

### Read Pattern

Properties are available in Blade templates directly by name (no `$this->` prefix). Computed properties require `$this->`:

```blade
{{-- resources/views/livewire/counter.blade.php --}}
<div>
    <h1>{{ $count }}</h1>                   {{-- public property --}}
    <p>{{ $this->total }}</p>               {{-- computed property --}}
    <button wire:click="increment">+</button>
</div>
```

The asymmetry between plain properties (`$count`) and computed properties (`$this->total`) in templates is a documented gotcha and a recurring point of confusion.

### Reactivity & Granularity

Reactivity is **component-scoped**: when any public property changes, the entire component Blade template re-renders server-side and an HTML diff is pushed to the browser. Livewire uses Alpine Morph (morphdom) to patch only changed DOM nodes, preserving focus states, scroll positions, and third-party widget state.

Parent-child reactivity is **opt-in**: child components do not automatically re-render when parent props change. To enable it, add `#[Reactive]` to the child property:

```php
use Livewire\Attributes\Reactive;

class PostItem extends Component
{
    #[Reactive]
    public Post $post;
}
```

v4 introduced **Islands** — sub-regions within a component that update independently, avoiding a full component re-render for isolated sections. An island wraps expensive content and can be lazy-loaded or appended to (for infinite scroll):

```blade
@island
    <div>Revenue: {{ $this->revenue }}
    <button wire:click="$refresh">Refresh</button></div>
@endisland
```

### Async Handling

Livewire is synchronous HTTP by default. Async patterns:

1. **`wire:loading`** — built-in visual feedback during any pending request
2. **Lazy loading** — `wire:init="loadData"` defers a method call to after the initial page render
3. **Polling** — `wire:poll.5s="refresh"` calls a method on a timer
4. **Queue dispatch** — methods dispatch Laravel queue jobs for heavy work
5. **Laravel Echo / Reverb** — `#[On('echo:orders,OrderCreated')]` listens on a WebSocket channel

```php
#[On('echo:orders,OrderCreated')]
public function orderCreated(array $order): void
{
    $this->orders[] = $order;
}
```

### Derived State

```php
use Livewire\Attributes\Computed;

class ShowUser extends Component
{
    public int $userId;

    #[Computed]
    public function user(): User
    {
        return User::find($this->userId);
    }

    // Persist across requests (cache_key auto-generated from component+method)
    #[Computed(persist: true)]
    public function expensiveStat(): array
    {
        return Stats::expensiveQuery($this->userId);
    }
}
```

Cache invalidation is manual — `unset($this->user)` clears the cached value.

---

## Rendering

### Philosophy & Approach

Rendering is **server-side HTML diffing**: every interaction round-trips to PHP, Blade re-renders the full component template, and Livewire sends only the changed HTML fragments to the browser, which Alpine Morph applies to the DOM. No virtual DOM on the client — morphdom diffs real HTML strings.

The browser's job is to:
1. Capture a DOM event
2. Serialize current form-bound property values
3. POST the AJAX request to the `/livewire-{hash}/update` endpoint
4. Receive and apply the HTML diff

### Update Strategy

Default: deferred — `wire:model` without `.live` only syncs property values when an action (form submit, click) fires. This reduces round-trips.

Live updates:

```blade
<input wire:model.live="search">              {{-- syncs on every keystroke (150ms debounce) --}}
<input wire:model.live.debounce.300ms="q">    {{-- custom debounce --}}
<input wire:model.blur="email">              {{-- sync on blur only --}}
```

### Reconciliation

Morphdom (wrapped as Alpine Morph) diffs the old and new HTML string server-side, produces a set of DOM patch instructions, and applies them on the client. Livewire preserves:
- Focus state on focused inputs
- Scroll positions (unless `wire:replace` is used)
- Input values not bound to `wire:model`
- Third-party widget initialization state

### Templating & Syntax

Blade — Laravel's templating engine — provides:

```blade
{{-- Escaped output (XSS-safe) --}}
<h1>{{ $title }}</h1>

{{-- Raw HTML (use cautiously) --}}
{!! $htmlContent !!}

{{-- Control structures --}}
@if($published)
    <span class="badge">Live</span>
@endif

@foreach($posts as $post)
    <div wire:key="post-{{ $post->id }}">{{ $post->title }}</div>
@endforeach

{{-- Component composition --}}
<x-alert :message="$errorMessage" />
<livewire:post-editor :post="$post" />
```

### Component Model

v4 offers four component formats:

**Single-file (default in v4)** — PHP class and Blade template in one `.blade.php` file:

```php
<?php
use Livewire\Component;

new class extends Component {
    public string $title = '';

    public function save(): void
    {
        Post::create(['title' => $this->title]);
        $this->redirect('/posts');
    }
};
?>

<div>
    <input wire:model="title" type="text">
    <button wire:click="save">Save</button>
</div>
```

**Class-based (v3-compatible)** — separate PHP file (`app/Livewire/CreatePost.php`) + Blade view (`resources/views/livewire/create-post.blade.php`).

**Multi-file** — same as class-based but organized in a directory (`app/Livewire/CreatePost/class.php`, `view.blade.php`, `test.php`, `styles.css`, `script.js`).

**Volt (via `livewire/volt`)** — an older single-file format that predates v4's built-in single-file support; class-based and functional API variants. Largely superseded by v4's native single-file support, but remains available.

v4's choice to add a fourth format alongside three existing ones was explicitly acknowledged by Livewire's creator as a fragmentation problem — and is addressed directly in the convention-strength evidence below.

---

## Event Handling

### Philosophy & Approach

Events in Livewire are primarily `wire:*` HTML directive bindings that invoke named PHP methods. The browser event fires → Livewire JS captures it → AJAX round-trip → PHP method executes → diff returned. This means event handlers are always PHP methods — no client-side event logic by default.

For client-side-only behavior, Alpine.js is bundled and the `$wire` bridge allows Alpine to call PHP methods directly.

### Event Binding

```blade
{{-- Click --}}
<button wire:click="save">Save</button>
<button wire:click="delete({{ $post->id }})">Delete</button>

{{-- Form --}}
<form wire:submit="save">
    <input wire:model="title" type="text">
    <button type="submit">Save Post</button>
</form>

{{-- Keyboard --}}
<input wire:keydown.enter="search" type="text">
<input wire:keydown.escape="cancel" type="text">

{{-- Other input events --}}
<input wire:model.live="search" type="text">  {{-- real-time bind --}}
<input wire:blur="validate" type="email">
```

### Event Modifiers

```blade
<a href="/logout" wire:click.prevent="logout">Logout</a>
<div wire:click="outer"><button wire:click.stop="inner">Click</button></div>
<button wire:click.throttle.1s="save">Save</button>
<button wire:click.async="logEvent">Log (parallel, no re-render)</button>
<button wire:click.renderless="trackClick">Track (no re-render)</button>
```

### Magic Actions (Client-Side Shortcuts)

```blade
<button wire:click="$refresh">Refresh</button>
<button wire:click="$toggle('open')">Toggle</button>
<button wire:click="$set('count', 0)">Reset</button>
<button wire:click="$dispatch('post-created')">Dispatch</button>
```

### Component Communication

**PHP dispatch (server-side)**:
```php
// Child dispatches an event
$this->dispatch('post-updated', postId: $this->post->id);

// Another component listens via attribute
#[On('post-updated')]
public function handlePostUpdated(int $postId): void
{
    $this->loadPost($postId);
}
```

**Targeted dispatch**:
```php
$this->dispatch('cart-updated')->to(Navbar::class);
$this->dispatch('refresh')->self(); // Only the current component
```

### Alpine.js + $wire Bridge

```blade
<div x-data="{ open: false }">
    <button @click="open = !open">Toggle</button>
    <div x-show="open">
        {{-- Call Livewire method from Alpine --}}
        <button @click="$wire.save()">Save</button>
        <span x-text="$wire.count"></span>
    </div>
</div>
```

---

## Rubric Evidence

### Evidence: Type-system integration

**Categorical: community-types (via PHPStan + larastan-livewire extension)**

PHP itself has a native type system (type hints, return types, enums, property types since PHP 7.4/8.0). Livewire's public properties do not enforce PHP type hints at the framework level — unsupported property types cause runtime serialization errors, not type errors at declaration time. The framework documentation notes: "PHP type hints are not enforced by Livewire itself." PHPStan provides static analysis via the `calebdw/larastan-livewire` extension (v2.5.0, March 2026, 643k downloads).

**Sample type error** — deliberate mistake: calling a non-existent method on a component:

```php
class Counter extends Component
{
    public int $count = 0;

    public function increment(): void
    {
        $this->nonExistentHelper(); // PHPStan error
    }
}
```

PHPStan output (level 5):
```
 ------ ---------------------------------------------------
  Line   app/Livewire/Counter.php
 ------ ---------------------------------------------------
  9      Call to an undefined method App\Livewire\Counter::nonExistentHelper().
 ------ ---------------------------------------------------
```

Without PHPStan, this is a silent runtime exception. The larastan-livewire extension additionally resolves `#[Computed]` property inference and flags incorrect Livewire test assertion calls (the common `::test()` chain false-positive). Livewire v4's single-file anonymous class components expose an additional gap: PHPStan v2 cannot fully analyze the inline `new class extends Component {}` syntax in `.blade.php` files per GitHub discussion #9826 — this part of the codebase falls outside static analysis coverage.

**Score rationale: 5.5** — PHP has a real type system and PHPStan is well-adopted in the Laravel ecosystem, but the framework itself doesn't enforce types on the most critical surface (public property hydration/dehydration), the larastan extension is community-maintained not first-party, and v4 single-file components have a static analysis blind spot.

### Evidence: Compiler/build feedback quality

Livewire has no build compiler — it is PHP interpreted at request time. Errors surface in one of three ways:

1. **PHP parse errors** — caught before execution, immediately actionable
2. **PHP runtime exceptions** — detailed Laravel Ignition error pages in development with stack trace, source context, and suggested solutions
3. **Livewire hydration errors** — custom exception classes with component context

**Deliberately broken example: wrong event attribute name**

```php
class Counter extends Component
{
    public int $count = 0;

    // Wrong: using #[Listen] instead of #[On]
    #[Listen('post-updated')]
    public function handleUpdate(): void
    {
        $this->count++;
    }
}
```

This produces no error at all — PHP happily accepts unknown attributes and ignores them. The event handler is silently never registered. No runtime error, no build warning, no static analysis warning by default. This is the most dangerous error class in Livewire: **silent wrong behavior from a typo in an attribute name**.

**Deliberately broken example: missing view**

```php
public function render()
{
    return view('livewire.nonexistent');
}
```

Runtime error (with Ignition):
```
Illuminate\View\Exception\InvalidArgumentException
View [livewire.nonexistent] not found.

at vendor/laravel/framework/src/Illuminate/View/FileViewFinder.php:137
```

Ignition adds the file paths searched, which is actionable. But it fires at request time, not at definition time.

**Score rationale: 6.0** — Laravel Ignition's development error pages are genuinely good: source context, stack traces, suggested solutions. The real deduction is the PHP-as-runtime gap: no compile step means no pre-flight check. The most dangerous errors (typo'd attribute names, unknown method calls without PHPStan) are silent at the point of definition. PHPStan compensates significantly but is opt-in. The feedback loop is "request → error page" rather than "save → editor diagnostic".

### Evidence: Locality of behavior

**Feature traced: live search field that filters a list and shows a loading spinner**

Files touched to understand and change this feature end-to-end:

| # | File / Concept | What it holds |
|---|---|---|
| 1 | `app/Livewire/SearchPosts.php` | PHP class: `$query` property, `render()` method with DB query |
| 2 | `resources/views/livewire/search-posts.blade.php` | Template: `wire:model.live="query"`, `wire:loading`, `@foreach` loop |

Total: **2 touchpoints**.

If using v4 single-file format, this collapses to **1 file**:

```php
{{-- resources/views/livewire/search-posts.blade.php --}}
<?php
use Livewire\Component;
use App\Models\Post;

new class extends Component {
    public string $query = '';

    public function render()
    {
        return view('livewire.search-posts', [
            'posts' => Post::where('title', 'like', "%{$this->query}%")->get(),
        ]);
    }
};
?>

<div>
    <input wire:model.live.debounce.300ms="query" type="text" placeholder="Search...">
    <div wire:loading>Searching...</div>
    @foreach ($posts as $post)
        <div wire:key="post-{{ $post->id }}">{{ $post->title }}</div>
    @endforeach
</div>
```

For comparison, understanding a React equivalent with TanStack Query would touch: the component file, a custom hook or query function, possibly a context provider, and TanStack Query's configuration.

**No documentation friction** locating this pattern — the Livewire v4 quickstart leads directly to the two-touchpoint or single-file model.

**Score rationale: 8.0** — Locality is Livewire's strongest dimension. State, rendering, and event handling for a feature co-locate in one or two files. The Blade template directly references class properties by name without an import or binding layer. The only structural cost is the required `render()` method in the class-based format, and even that collapses in v4 single-file components.

### Evidence: Explicitness / data-flow traceability

**State change traced: user types in a search input, filtered list re-renders**

| Step | Hop | Type |
|---|---|---|
| 1 | User types in `<input wire:model.live="query">` | Explicit — directive names the property |
| 2 | Livewire JS debounces and sends AJAX POST to `/livewire-{hash}/update` | Implicit — framework intercepts the input event |
| 3 | Server: `$this->query` is updated from the POST payload | Explicit — direct property assignment (visible in framework source, documented) |
| 4 | `render()` is called; `Post::where(..., $this->query)` returns filtered results | Explicit — the render method is readable PHP |
| 5 | Blade template re-renders with the new `$posts` collection | Explicit — standard Blade `@foreach` |
| 6 | Livewire diffs old vs new HTML, sends patch | Implicit — morphdom patching is framework magic |
| 7 | Browser DOM is updated | Implicit — framework applies the patch |

Explicit hops: 4 / Total hops: 7. The implicit hops (AJAX interception, morphdom patching) are framework infrastructure and well-documented. The **binding between template directive and class property is by name string** — `wire:model="query"` references `$query` by string, not by type or reference. A typo in the directive name is silent (wrong property update, no error).

Compared to Phoenix LiveView's socket assigns model, which uses `handle_event/3` for each event type and `assign/3` to update state with explicit function clauses, Livewire is slightly less explicit at the event-dispatch-to-property link (string binding vs. pattern-matched function heads). Compared to React, Livewire is more explicit — there is no `useEffect` dependency array magic, no reconciler batching to reason about, and no stale closure problem.

**Score rationale: 8.5** — The data flow is unusually traceable: directive → named method → property mutation → render. The implicit infrastructure (AJAX, morphdom) is unavoidable for a server-rendered framework and well-documented. The main traceability gap is string-keyed directive names (both `wire:click="save"` and `wire:model="query"` reference PHP method/property names as strings, so a typo is not caught statically without PHPStan).

### Evidence: Convention strength

**Task: "fetch data when the component loads"**

Searched the official v4 docs and ecosystem for alternative approaches:

| Approach | Source | Notes |
|---|---|---|
| `render()` with inline DB query | Official docs — quickstart | Most idiomatic; no separate lifecycle hook needed |
| `mount()` lifecycle hook | Official docs — lifecycle hooks | Initializes properties; preferred when data depends on mount arguments |
| `#[Computed]` method | Official docs — computed properties | Lazy; only runs when `$this->propertyName` is accessed in template |
| `wire:init="loadData"` | Official docs — deferred loading | Fires after initial page render; used for progressive loading |
| `boot()` hook | Official docs — lifecycle hooks | Runs before every request; less common for data loading |

Count: **5 idiomatic-looking approaches** to data loading.

**The component format proliferation problem** is a more significant convention fragmentation: v4 ships with four distinct component formats (class-based, single-file, multi-file, Volt), each documented and officially supported. The creator's Laracon 2025 talk explicitly framed this as a problem Livewire 4 was meant to solve ("completely and totally forked into three different ways"), then resolved it by adding a fourth canonical format. The upgrade guide identifies the now-preferred path (single-file by default), but the ecosystem carries all four patterns in tutorials, packages, and existing codebases.

Documentation friction note: identifying which of the five data-loading patterns is most idiomatic in v4 required cross-referencing the quickstart, the properties docs, the computed properties docs, and the lifecycle hooks docs. The docs are individually excellent but do not prominently signal "prefer this over that" ordering across patterns. The quickstart uses `render()` with an inline query — which is correct for simple cases — but the computed properties docs present `#[Computed]` as the idiomatic pattern for database queries without cross-referencing the quickstart pattern.

**Score rationale: 7.5** — Core conventions (public properties = state, `wire:click` = event, `render()` = view, `#[On]` = listener) are extremely stable and few. The penalty comes from the component format proliferation (four formats, all officially valid) and the five distinct data-loading patterns with no clear "prefer this one" signal across the docs.

### Evidence: Token efficiency / boilerplate density

**No canonical Livewire entry on todomvc.com.** Falling back to: community TodoMVC-style implementation ([YannickYayo/livewire-todolist](https://github.com/YannickYayo/livewire-todolist), Livewire 1.x) plus a fresh v4 implementation following the official v4 quickstart idioms (single-file format, `#[Computed]`, `#[On]`).

**v4 Todo implementation (single-file format)**:

```php
{{-- resources/views/livewire/todos.blade.php --}}
<?php
use Livewire\Component;
use Livewire\Attributes\Computed;
use App\Models\Todo;

new class extends Component {
    public string $newTodo = '';
    public string $filter = 'all';  // 'all' | 'active' | 'completed'

    public function addTodo(): void
    {
        $this->validate(['newTodo' => 'required|min:2']);
        Todo::create(['title' => trim($this->newTodo), 'completed' => false]);
        $this->newTodo = '';
        unset($this->todos);
    }

    public function toggleTodo(int $id): void
    {
        $todo = Todo::findOrFail($id);
        $todo->update(['completed' => !$todo->completed]);
        unset($this->todos);
    }

    public function deleteTodo(int $id): void
    {
        Todo::destroy($id);
        unset($this->todos);
    }

    #[Computed]
    public function todos()
    {
        return match($this->filter) {
            'active'    => Todo::where('completed', false)->get(),
            'completed' => Todo::where('completed', true)->get(),
            default     => Todo::all(),
        };
    }

    public function render() { return view('livewire.todos'); }
};
?>

<div>
    <form wire:submit="addTodo">
        <input wire:model="newTodo" type="text" placeholder="What needs doing?">
        <button type="submit">Add</button>
    </form>

    <ul>
        @foreach($this->todos as $todo)
            <li wire:key="todo-{{ $todo->id }}">
                <input type="checkbox" wire:click="toggleTodo({{ $todo->id }})"
                    {{ $todo->completed ? 'checked' : '' }}>
                <span>{{ $todo->title }}</span>
                <button wire:click="deleteTodo({{ $todo->id }})">×</button>
            </li>
        @endforeach
    </ul>

    <div>
        <button wire:click="$set('filter', 'all')">All</button>
        <button wire:click="$set('filter', 'active')">Active</button>
        <button wire:click="$set('filter', 'completed')">Completed</button>
    </div>
</div>
```

**Line count: ~57 lines** for the complete Todo feature (add, toggle, delete, filter). This is a single file covering the full feature.

For comparison, the Phoenix LiveView equivalent is approximately 60-65 lines in a single LiveView file. The React TodoMVC canonical reference (tastejs/todomvc) is ~110 lines across multiple files (component + reducer + types).

The Livewire implementation does require a Laravel `Todo` model and a migration to exist separately — this is Laravel's standard ORM layer, not Livewire-specific boilerplate. The component itself contains zero boilerplate scaffolding beyond the `render()` return statement.

**Score rationale: 7.5** — Competitive token density, particularly for a full-stack feature that includes persistence. The single-file v4 format eliminates the class/view split. Loses points versus pure-client frameworks because real Livewire features typically involve a model migration and factory as additional files — that's an unavoidable cost of the server-side PHP approach, not a Livewire design choice.

### Evidence: Familiarity composite

**GitHub stars**: 23,528 (Packagist, June 2026)
**Packagist total installs**: 85,612,285 (June 2026)
**Packagist dependents**: 2,190
**First released**: 2019 (7 years)
**Status**: Active, maintained by original creator

**Stack Overflow**: stackoverflow.com/questions/tagged/livewire was inaccessible for direct scraping. Proxy: the `laravel-livewire` tag exists and is actively used; the Laravel ecosystem overall has ~500k SO questions and Livewire is the dominant Laravel UI layer. Community volume is high within the Laravel ecosystem but the framework is Laravel-specific — there is no cross-ecosystem usage.

**Registry trend**: Packagist installs are strongly upward (v3 shipped 2023, v4 shipped January 2026). The PHP/Laravel space is large but smaller than the JavaScript ecosystem — npm download volumes for comparable JS tools (Alpine.js: 1M+/week, HTMX: 300k+/week) are structurally higher.

**Ecosystem signal**: Livewire is the default UI layer in Laravel starter kits (replacing Jetstream's Vue/React options as the "pure PHP" path). Filament — the most popular Laravel admin panel (3k+ dependents) — is built on Livewire. This produces strong downstream adoption pressure.

**Familiarity for LLM pretraining**: Livewire has been training data since 2019 but the ecosystem is PHP/Laravel-specific. v1/v2 code patterns significantly outnumber v3/v4 patterns in the pretraining corpus (similar to the Phoenix LiveView 0.x vs 1.0 gap). The v3→v4 idiom shift (event attributes, component formats, wire:model semantics) means the most common training examples may be outdated.

**Score rationale: 6.5** — Well-established within the Laravel ecosystem (7 years, 85M installs, dominant position). Loses points versus JavaScript-ecosystem tools: (a) PHP/Laravel-specific, so total community volume and pretraining corpus is smaller than React/Vue, (b) significant v3→v4 API changes mean pre-2026 training data demonstrates deprecated idioms, (c) not on npm so JS-focused agent toolchains don't encounter it.

### Evidence: Stability / convention durability

Checked: Packagist changelog, the official [upgrade guide](https://livewire.laravel.com/docs/upgrading), the [Laravel News announcement](https://laravel-news.com/livewire-4-is-dropping-next-week-and-wiretransition-makes-animations-effortless) (January 8, 2026), and the laravel.com blog post (August 18, 2025).

**v3→v4 breaking changes (already shipped, stable)**:
1. Routing: `Route::livewire()` now required for full-page components (was `Route::get()`)
2. `wire:model`: no longer responds to events bubbling from child elements by default; add `.deep` to restore
3. `wire:scroll` renamed to `wire:navigate:scroll`
4. `wire:transition`: now uses browser's native View Transitions API instead of Alpine's `x-transition`; `.opacity` and `.scale` modifiers no longer work
5. JavaScript hooks: `commit`/`request` deprecated in favor of `interceptMessage`/`interceptRequest`
6. URL structure change: `/livewire/` → `/livewire-{hash}/`
7. Config key renamed: `layout` → `component_layout`

These are **already stable in v4**. They do not constitute a current stability penalty — they are the current convention.

**v4.x track (current)**: The 4.x point releases (latest: 4.3.1, June 2, 2026) are stability-focused: bug fixes to Islands, lazy loading, parallel test cache, computed properties. No announced breaking changes on the 4.x track.

**No v5 roadmap or breaking-change RFCs** found as of this review date.

**`next_release` assessment**: No new major release is announced or in progress. The `stability_penalty: false` flag reflects this — the current convention set is stable and the 4.x track is maintenance.

**Score rationale: 6.5** — The v4 convention set is stable and well-documented. The penalty reflects: (a) the v3→v4 migration was significant (7 documented breaking changes, routing change, wire:model semantics change), which happened within ~2 years of v3; (b) the component format history (4 formats accumulated over the project's life) signals convention evolution speed faster than ideal; (c) the Volt package introduced a convention now being superseded by v4's native single-file format. The current state is stable, but the convention durability record over the project's lifetime is mixed.

### Evidence: Ecosystem tooling facts

**Devtools**
- [x] **Browser devtools panel**: Livewire ships a browser devtools integration showing component updates, AJAX payloads, and network timing. Available in Chromium and Firefox.
- [x] **Laravel Telescope**: First-party Laravel request monitoring — all Livewire AJAX requests are logged with their payload and response. ([laravel.com/docs/telescope](https://laravel.com/docs/telescope))
- [x] **Laravel Debugbar**: In-browser query profiling and timeline. Shows per-request DB queries triggered by Livewire actions.

**Test utilities**
- [x] **Livewire test API**: Fluent test helper built into the package — no browser needed, no separate install. ([livewire.laravel.com/docs/testing](https://livewire.laravel.com/docs/testing))
  ```php
  Livewire::test(Counter::class)
      ->set('count', 5)
      ->call('increment')
      ->assertSet('count', 6)
      ->assertSee('6');
  ```
- [x] **PHPUnit integration**: Standard Laravel test runner; Livewire tests run as standard PHPUnit test cases.
- [x] **Pest support**: The testing docs show Pest examples as the primary style.
- [x] **Laravel Dusk**: Browser testing for Livewire via Chrome WebDriver. ([laravel.com/docs/dusk](https://laravel.com/docs/dusk))
- [x] **Playwright integration**: Mentioned in v4 docs as a modern alternative to Dusk.

**IDE / LSP support**
- [x] **PhpStorm 2026.1**: Explicit Livewire support listed in 2026.1 release notes (IntelliJ plugin maintained by JetBrains). ([blog.jetbrains.com/phpstorm/2026/03](https://blog.jetbrains.com/phpstorm/2026/03/phpstorm-2026-1-is-now-out/))
- [x] **VS Code (Laravel Extension v1.4.3)**: Livewire 4 support added — syntax highlighting, IntelliSense for `wire:*` directives. ([laravel-news.com/laravel-vscode-extension-v1-4-3](https://laravel-news.com/laravel-vscode-extension-v1-4-3))
- [x] **PHPStan (larastan-livewire)**: Static analysis extension for Livewire v4, community-maintained. ([packagist.org/packages/calebdw/larastan-livewire](https://packagist.org/packages/calebdw/larastan-livewire))
- [x] **Artisan scaffolding**: `php artisan make:livewire ComponentName` generates class + view with correct namespacing.

**Score rationale: 7.5** — Solid tooling story within the PHP/Laravel ecosystem. The main deduction is that the IDE support is add-on (not built-in language server parity with TypeScript) and the PHPStan extension is community-maintained with a known blind spot for v4 single-file anonymous class components. No dedicated Livewire-specific browser devtools extension comparable to React DevTools or Vue DevTools — debugging goes through Laravel's general-purpose tools.

---

## On the Horizon

### Next release
- **Name/version:** No v5 announced; active on the 4.x track
- **Status:** null — no pre-release in progress
- **What's changing:** v4.x maintenance track: Islands stability, lazy-loading improvements, Blaze compiler refinements, PHP 8.4 property hooks expansion. All additive.
- **Anticipated impact:** No rubric score changes anticipated from the 4.x maintenance track. The v4 convention set is the stable target.
- **Stability penalty:** no — v4 is current stable with no announced breaking changes on the 4.x track. The stability score reflects v3→v4 convention history, not a forward-looking risk.

### AI-tooling investment
- **What exists:**
  - **Laravel Boost** ([github.com/laravel/boost](https://github.com/laravel/boost)) — official first-party AI tooling for the Laravel ecosystem. Ships a `livewire-development` skill automatically installed when `livewire/livewire` is in `composer.json`. Connects agents to the [Laravel documentation API](https://laravel.com/docs/12.x/boost#documentation-api) with 17,000+ indexed pieces of versioned ecosystem documentation including Livewire, filtered to the installed major version. Announced March 2026.
  - **Laravel Skills directory** ([skills.laravel.cloud](https://skills.laravel.cloud/)) — community skill extensions, including Livewire-specific patterns.
  - **No `llms.txt`** at livewire.laravel.com as of June 2026.
  - **No dedicated Livewire MCP server** — Laravel MCP ([github.com/laravel/mcp](https://github.com/laravel/mcp)) is a server-building framework, not a Livewire-specific context server.
- **Observed delta:** See `ai_tooling.observed_delta` in frontmatter. Summary: Laravel Boost's `livewire-development` skill corrected two v3→v4 idiom gaps (event attribute syntax, `wire:key` requirement) and one wire:model modifier use on first attempt. The delta is bounded — it closes the training-data freshness gap on v4 API changes rather than teaching structural framework concepts from scratch. The framework's explicit binding conventions (`wire:click="methodName"`, `wire:model="property"`) mean even baseline model output is largely correct in structure; the skill primarily fixes version-specific syntax differences.
