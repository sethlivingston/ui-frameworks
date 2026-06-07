---
name: "Laravel Livewire"
category: "full-framework"
github_url: "https://github.com/livewire/livewire"
docs_url: "https://livewire.laravel.com/docs/"
implementation_language: "PHP"
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

# Laravel Livewire

> **2026 update note (2026-06-07):** Livewire v4 shipped January 2026 with parallel live updates (faster reactivity), a `wire:transition` directive for animations, view-based components that keep PHP and Blade co-located, and an "Islands" feature for isolating reactive regions within a page. The "stay in PHP" philosophy and AJAX-by-default model described below remain the core identity — v4 sharpens the explicitness story (Islands narrows *what* re-renders, similar in spirit to Phoenix LiveView's explicit data flow) rather than replacing it.

## Philosophy & Mental Model

Laravel Livewire is a **full-stack framework for Laravel that takes the pain out of building dynamic UIs**. Like Phoenix LiveView, it represents the server-rendered approach to interactivity: keep state and logic on the server, communicate changes via AJAX/WebSocket, and update only what changed in the DOM.

The core philosophy is simple: **stay in PHP**. Instead of writing JavaScript for frontend interactivity and PHP for backend logic, Livewire lets Laravel developers build dynamic interfaces without leaving their comfort zone. This eliminates the frontend/backend split and the impedance mismatch between languages.

Mental model:
- Components are PHP classes with public properties (state)
- Blade templates define the UI (view)
- `wire:*` directives bind events and data
- User interactions trigger server-side methods
- State changes automatically re-render components
- Only HTML diffs are sent to the client

The framework sits between traditional server-rendered apps (full page reloads) and SPAs (complex client-side state). You get SPA-like interactivity with server-side simplicity.

**Key difference from Phoenix LiveView**: Livewire uses **AJAX by default** (HTTP requests per interaction), while LiveView uses persistent WebSockets. Livewire v3 added optional WebSocket support via "Livewire Volt" for real-time features, but the default is stateless HTTP.

## State Management

### Core Primitives

State is defined as **public properties** on Livewire component classes:

```php
<?php
namespace App\Livewire;
use Livewire\Component;

class Counter extends Component
{
    public $count = 0;

    public function render()
    {
        return view('livewire.counter');
    }
}
```

All public properties are automatically:
- Serialized and sent to the client
- Made available to Blade templates
- Synchronized between requests

**Property types supported**:
- Primitives: string, int, float, bool, null, array
- Common objects: Collections, Eloquent models, DateTime/Carbon, Stringable
- Custom objects (via `Wireable` interface)

### Update Mechanism

State updates happen through **method calls** triggered by `wire:*` directives:

```php
class Counter extends Component
{
    public $count = 0;

    public function increment()
    {
        $this->count++;
    }

    public function decrement()
    {
        $this->count--;
    }

    public function reset()
    {
        $this->count = 0;
    }
}
```

Template:
```blade
<div>
    <h1>{{ $count }}</h1>
    <button wire:click="increment">+</button>
    <button wire:click="decrement">-</button>
    <button wire:click="reset">Reset</button>
</div>
```

Updates are **mutable**—you modify properties directly. After the method completes, Livewire serializes the updated state, re-renders the component, and sends HTML diffs to the client.

**Helper methods**:
- `$this->fill(['title' => 'New', 'content' => 'Text'])` - Bulk assign
- `$this->reset('propertyName')` - Reset to initial value
- `$this->reset()` - Reset all properties
- `$this->pull('propertyName')` - Get value and reset

### Read Pattern

Access properties in Blade templates using standard PHP syntax:

```blade
<div>
    <p>Count: {{ $count }}</p>
    <p>Title: {{ $title }}</p>
    <p>User: {{ $user->name }}</p>
</div>
```

Properties are automatically available in the template—no explicit passing required.

### Reactivity & Granularity

**Component-level reactivity**: When any public property changes, the entire component re-renders. Livewire then diffs the HTML and sends only changed fragments to the client.

**Parent-child reactivity is NOT automatic** (this is a key difference from Vue/React):

```php
// Parent
class PostList extends Component
{
    public $posts;
}

// Child
class PostItem extends Component
{
    public $post;  // NOT reactive by default
}
```

To make child properties reactive, use the `#[Reactive]` attribute:

```php
use Livewire\Attributes\Reactive;

class PostItem extends Component
{
    #[Reactive]
    public $post;
}
```

**Why not reactive by default?** Performance. Livewire minimizes data transfer—when a parent updates, only the parent's state is sent to the server, not children's. Reactive properties require additional data on every parent update.

### Async Handling

Livewire is inherently synchronous (HTTP request/response), but you can handle async operations through:

**1. Loading states** (built-in UI feedback):

```blade
<div>
    <button wire:click="save">Save</button>
    <span wire:loading>Saving...</span>
</div>
```

The `wire:loading` directive shows/hides during requests.

**2. Deferred updates** (background processing):

```php
public function save()
{
    dispatch(new ProcessDataJob($this->data));
    $this->dispatch('job-queued');
}
```

**3. Polling** (periodic updates):

```blade
<div wire:poll.5s="refresh">
    Latest data: {{ $latestData }}
</div>
```

Automatically calls `refresh()` method every 5 seconds.

**4. Laravel Echo integration** (real-time events):

```php
public function getListeners()
{
    return [
        "echo:orders,OrderCreated" => 'orderCreated',
    ];
}

public function orderCreated($order)
{
    $this->orders[] = $order;
}
```

### Derived State

Use **computed properties** with the `#[Computed]` attribute:

```php
use Livewire\Attributes\Computed;

class ShowUser extends Component
{
    public $userId;

    #[Computed]
    public function user()
    {
        return User::find($this->userId);
    }

    #[Computed]
    public function posts()
    {
        return $this->user->posts;
    }
}
```

Template (requires `$this->` prefix):
```blade
<div>
    <h1>{{ $this->user->name }}</h1>
    <p>Posts: {{ $this->posts->count() }}</p>
</div>
```

**Caching behavior**:
- **Default**: Cached for single request (if accessed multiple times in one render)
- **`persist: true`**: Cached for component lifetime (default 3600s)
- **`cache: true`**: Cached application-wide across all instances

```php
#[Computed(persist: true)]
public function user() { ... }

#[Computed(cache: true, key: 'homepage-posts')]
public function posts() { ... }
```

**Cache busting**:
```php
public function createPost()
{
    Auth::user()->posts()->create(...);
    unset($this->posts);  // Clear computed property cache
}
```

## Rendering

### Core Primitives

Livewire uses **Blade**, Laravel's templating engine:

```blade
<div>
    <h1>{{ $title }}</h1>

    @if($show)
        <p>Visible content</p>
    @endif

    @foreach($items as $item)
        <li>{{ $item->name }}</li>
    @endforeach
</div>
```

Blade provides:
- `{{ }}` for escaped output (XSS protection)
- `{!! !!}` for raw HTML (use cautiously)
- `@if/@foreach/@for` for control structures
- `@include/@extends/@section` for composition

### Update Mechanism

1. User interacts (clicks button, submits form, etc.)
2. Livewire sends AJAX request with:
   - Method to call
   - Current component state (public properties)
   - Event parameters
3. Server executes method, updates properties
4. Livewire re-renders Blade template
5. DOM diff computed (morphdom algorithm)
6. Minimal HTML patch sent to client
7. Client updates DOM intelligently

**Performance**: Livewire uses "morphdom" to intelligently update the DOM, preserving:
- Focus states
- Scroll positions
- Input values (if not bound)
- Third-party widget states

### Conditional Rendering

Standard Blade directives:

```blade
@if($count > 0)
    <p>Count is positive</p>
@elseif($count < 0)
    <p>Count is negative</p>
@else
    <p>Count is zero</p>
@endif

@unless($hidden)
    <p>Visible unless hidden</p>
@endunless
```

### List Rendering

```blade
@foreach($users as $user)
    <div wire:key="user-{{ $user->id }}">
        {{ $user->name }}
    </div>
@endforeach

@forelse($posts as $post)
    <li>{{ $post->title }}</li>
@empty
    <li>No posts found</li>
@endforelse
```

**Important**: Use `wire:key` for list items to help Livewire track elements during updates.

### Component Model

**Three levels of composition**:

**1. Blade Components** (stateless):
```blade
<!-- resources/views/components/alert.blade.php -->
<div class="alert">{{ $message }}</div>

<!-- Usage: -->
<x-alert :message="$errorMessage" />
```

**2. Livewire Components** (stateful):
```php
// app/Livewire/CreatePost.php
class CreatePost extends Component
{
    public $title = '';

    public function save()
    {
        Post::create(['title' => $this->title]);
    }

    public function render()
    {
        return view('livewire.create-post');
    }
}

// Usage in Blade:
<livewire:create-post />
```

**3. Nested Livewire Components**:
```blade
<!-- Parent -->
<div>
    @foreach($posts as $post)
        <livewire:post-item :post="$post" :key="$post->id" />
    @endforeach
</div>
```

**Passing data to children**:
```blade
<livewire:user-profile :userId="$userId" />
<livewire:user-profile :$user /> <!-- PHP 8.0+ named argument shorthand -->
```

Child receives via `mount()` or matching properties:
```php
class UserProfile extends Component
{
    public $userId;

    public function mount($userId)
    {
        $this->userId = $userId;
    }
}
```

## Event Handling

### Core Primitives

Use `wire:*` directives for event binding:

```blade
<!-- Click events -->
<button wire:click="save">Save</button>
<button wire:click="delete({{ $postId }})">Delete</button>

<!-- Form events -->
<form wire:submit="save">
    <input type="text" wire:model="title">
    <button type="submit">Submit</button>
</form>

<!-- Input events -->
<input wire:keydown.enter="search">
<input wire:blur="validate">

<!-- Custom events -->
<div wire:custom-event="handleCustom">
```

### Event Handlers

Define methods in the component class:

```php
class CreatePost extends Component
{
    public $title = '';

    public function save()
    {
        $this->validate(['title' => 'required|min:3']);

        Post::create(['title' => $this->title]);

        session()->flash('message', 'Post created!');

        return redirect()->to('/posts');
    }

    public function delete($postId)
    {
        Post::findOrFail($postId)->delete();
    }
}
```

Methods can:
- Access component properties via `$this`
- Accept parameters from templates
- Return redirects or render responses
- Dispatch browser events
- Emit events to other components

### Event Modifiers

**Prevent default**:
```blade
<a href="/logout" wire:click.prevent="logout">Logout</a>
```

**Stop propagation**:
```blade
<div wire:click="outer">
    <button wire:click.stop="inner">Click</button>
</div>
```

**Key modifiers**:
```blade
<input wire:keydown.enter="search">
<input wire:keydown.escape="cancel">
```

**Debouncing**:
```blade
<input wire:model.live.debounce.500ms="search">
```

**Throttling**:
```blade
<button wire:click.throttle.1s="save">Save</button>
```

### Two-Way Data Binding

The `wire:model` directive:

```blade
<input type="text" wire:model="title">
<textarea wire:model="content"></textarea>
<select wire:model="status">
    <option value="draft">Draft</option>
    <option value="published">Published</option>
</select>
```

**Modifiers**:
- `wire:model.live` - Update on every keystroke (150ms debounce)
- `wire:model.blur` - Update when input loses focus
- `wire:model.change` - Update on change event
- `wire:model.debounce.500ms` - Custom debounce timing

**Default behavior**: Without `.live`, Livewire only syncs the property when an action occurs (`wire:click`, `wire:submit`). This reduces unnecessary server requests.

### Client-Side JavaScript Integration

**Alpine.js integration** (included with Livewire):

```blade
<div x-data="{ open: false }">
    <button @click="open = !open">Toggle</button>
    <div x-show="open">Content</div>
</div>
```

**Accessing Livewire from JavaScript**:

```blade
<div x-data="{ count: $wire.count }">
    <button @click="$wire.increment()">Increment</button>
    <span x-text="count"></span>
</div>
```

The magic `$wire` object provides:
- `$wire.property` - Access/modify properties
- `$wire.method()` - Call component methods
- `$wire.$refresh()` - Force re-render

**Custom JavaScript hooks**:

```javascript
Livewire.hook('message.sent', (message, component) => {
    console.log('Message sent:', message);
});

Livewire.hook('message.received', (message, component) => {
    console.log('Response received:', message);
});
```

## Reuse Patterns

### Blade Components (Stateless)

For simple, reusable UI elements:

```blade
<!-- resources/views/components/button.blade.php -->
<button {{ $attributes->merge(['class' => 'btn']) }}>
    {{ $slot }}
</button>

<!-- Usage: -->
<x-button wire:click="save">Save</x-button>
<x-button class="btn-primary" wire:click="delete">Delete</x-button>
```

### Livewire Components (Stateful)

For interactive, self-contained features:

```php
// app/Livewire/SearchUsers.php
class SearchUsers extends Component
{
    public $query = '';

    public function render()
    {
        return view('livewire.search-users', [
            'users' => User::where('name', 'like', "%{$this->query}%")->get()
        ]);
    }
}

// Usage:
<livewire:search-users />
```

### Traits for Shared Behavior

Extract common functionality:

```php
trait WithSorting
{
    public $sortField = 'created_at';
    public $sortDirection = 'desc';

    public function sortBy($field)
    {
        if ($this->sortField === $field) {
            $this->sortDirection = $this->sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            $this->sortField = $field;
            $this->sortDirection = 'asc';
        }
    }
}

class UserTable extends Component
{
    use WithSorting;

    public function render()
    {
        return view('livewire.user-table', [
            'users' => User::orderBy($this->sortField, $this->sortDirection)->get()
        ]);
    }
}
```

### Component Communication

**Parent → Child** (props):
```blade
<livewire:post-item :post="$post" />
```

**Child → Parent** (events):
```php
// Child
$this->dispatch('post-updated', postId: $this->post->id);

// Parent
public function getListeners()
{
    return ['post-updated' => 'refreshPost'];
}

public function refreshPost($postId)
{
    // Handle the event
}
```

**Global events** (broadcast to all components):
```php
$this->dispatch('user-logged-in')->to(Navbar::class);
$this->dispatch('cart-updated')->self(); // Only to current component
```

### Form Objects (Reusable State)

Laravel Form Objects pattern:

```php
use Livewire\Form;

class PostForm extends Form
{
    public $title = '';
    public $content = '';

    public function rules()
    {
        return [
            'title' => 'required|min:3',
            'content' => 'required|min:10',
        ];
    }

    public function save()
    {
        $this->validate();
        Post::create($this->all());
    }
}

// Usage in component:
class CreatePost extends Component
{
    public PostForm $form;

    public function save()
    {
        $this->form->save();
    }
}
```

## Developer Experience

### Learning Curve

**Initial**: Low for Laravel developers. If you know Blade and basic Laravel, you can be productive immediately. The `wire:model` and `wire:click` directives are intuitive.

**For non-Laravel devs**: Medium. Requires learning PHP, Laravel conventions, Composer, and the Laravel ecosystem.

**Mental Model Shift**: Server-side components feel familiar to backend developers but different for those coming from React/Vue.

### Tooling

- **Artisan CLI**: `php artisan make:livewire Counter` scaffolds components
- **Browser DevTools**: Livewire panel shows component updates, network requests
- **Testing**: `Livewire\Testing` provides fluent test API:
  ```php
  Livewire::test(Counter::class)
      ->assertSee('0')
      ->call('increment')
      ->assertSee('1');
  ```
- **IDE Support**: PHPStorm, VS Code with PHP extensions
- **Debugging**: Laravel Telescope, Debugbar, dd() helper

### Boilerplate

Minimal. A complete interactive component:

```php
// app/Livewire/Counter.php
<?php
namespace App\Livewire;
use Livewire\Component;

class Counter extends Component
{
    public $count = 0;

    public function increment() { $this->count++; }
    public function decrement() { $this->count--; }

    public function render()
    {
        return view('livewire.counter');
    }
}
```

```blade
<!-- resources/views/livewire/counter.blade.php -->
<div>
    <h1>{{ $count }}</h1>
    <button wire:click="increment">+</button>
    <button wire:click="decrement">-</button>
</div>
```

That's ~20 lines total for a fully interactive component.

### Common Patterns

**Real-time validation**:
```php
public function updated($propertyName)
{
    $this->validateOnly($propertyName);
}
```

**Confirmation modals**:
```blade
<button wire:click="delete" wire:confirm="Are you sure?">Delete</button>
```

**File uploads**:
```php
use Livewire\WithFileUploads;

class UploadPhoto extends Component
{
    use WithFileUploads;

    public $photo;

    public function save()
    {
        $this->validate(['photo' => 'image|max:1024']);
        $this->photo->store('photos');
    }
}
```

**Pagination**:
```php
use Livewire\WithPagination;

class ShowPosts extends Component
{
    use WithPagination;

    public function render()
    {
        return view('livewire.show-posts', [
            'posts' => Post::paginate(10)
        ]);
    }
}
```

### Documentation

Excellent. Comprehensive docs at livewire.laravel.com:
- Getting started guide
- Feature-specific documentation
- Cookbook with common patterns
- Screencasts and tutorials
- Active community forum

### Component Reusability Assessment

**Quality: Good (7.5/10)**

Laravel Livewire provides **two primary reuse mechanisms**:

1. **Blade Components** (stateless) - Standard Laravel components for UI elements
2. **Livewire Components** (stateful) - Full interactive components with lifecycle

**Strengths**:
- **Slot-based composition** - Named slots and default slots work well
- **Traits for shared behavior** - `WithPagination`, `WithFileUploads`, custom traits
- **Form Objects** - Reusable validation and state management via `Livewire\Form`
- **Packagable** - Components can be distributed via Composer packages
- **Laravel conventions** - Follows existing Laravel patterns, familiar to ecosystem

**Weaknesses**:
- **Non-reactive by default** - Child components don't auto-update when parent props change without `#[Reactive]` attribute. This breaks composition expectations from React/Vue
- **Less granular** - No built-in concept of "headless components" or render props
- **Two-template system** - Blade components (.blade.php) separate from Livewire components (class + template)
- **Limited cross-framework** - Tied to Laravel/PHP ecosystem, can't use in Node.js projects

**Design System Support**: Moderate. Blade components work well for design systems, but the dual-component model (Blade vs Livewire) adds complexity. Anonymous components help:

```blade
<!-- resources/views/components/button.blade.php -->
@props(['variant' => 'primary', 'size' => 'md'])

<button {{ $attributes->merge(['class' => "btn btn-{$variant} btn-{$size}"]) }}>
    {{ $slot }}
</button>
```

**Cross-Project Reuse**: Good within Laravel ecosystem via Composer packages, but non-reactive default limits true component isolation.

## Maintainability

**Quality: Good (7.5/10)**

**Refactoring**:
- **Type hints** (PHP 8+) provide safety when refactoring method signatures
- **Static analysis** via PHPStan/Psalm catches errors before runtime
- **Convention-based file locations** - easy to find related files
- **Laravel's migration system** - database changes are versioned and reversible

**Debugging**:
- **Laravel Telescope** - Comprehensive monitoring dashboard (requests, queries, events, logs)
- **Laravel Debugbar** - In-browser profiling and query analysis
- **`dd()` and `dump()`** - Convenient debugging helpers
- **Browser DevTools** - Livewire panel shows component updates and network activity
- **Verbose error pages** - Laravel's Ignition provides detailed error context

**Code Organization**:
- **Single-file components** - Each Livewire component is one class
- **Separation of concerns** - Models, services, components stay separate
- **Artisan generators** - `make:livewire` scaffolds consistent structure
- **Resource organization** - Views, components, layouts have clear conventions

**Testing**:
- **Fluent test API** - `Livewire::test()` provides readable assertions
- **PHPUnit integration** - Standard Laravel testing tools work
- **Browser testing** - Laravel Dusk for end-to-end tests
- **Fast** - No browser needed for Livewire component tests

**Scalability**:
- **Stateless by default** - AJAX requests don't maintain persistent connections (unlike WebSockets)
- **Caching strategies** - Request-level, component-level, application-level caching
- **Lazy loading** - Load components on-demand with `wire:init`
- **Queueable operations** - Offload heavy tasks to Laravel queues
- **Horizontal scaling** - Standard PHP-FPM scaling, no persistent state per connection

**Breaking Changes**:
- **Semantic versioning** - Laravel and Livewire follow SemVer
- **Upgrade guides** - Clear migration paths between major versions
- **Deprecation warnings** - Features marked deprecated before removal
- **Community packages** - May break between Laravel versions

**Weaknesses**:
- **Non-reactive default creates bugs** - Easy to forget `#[Reactive]`, leading to stale child data
- **Template/logic split** - Blade template separate from PHP class requires two file edits
- **Magic methods** - Some Livewire behaviors (lifecycle hooks, property hydration) use PHP magic methods that are harder to trace
- **Implicit serialization** - Public properties auto-serialize, which can cause issues with complex objects
- **PHP talent pool** - Smaller than JavaScript ecosystem

**Particularly Maintainable Aspects**:
- Laravel conventions provide consistency across teams
- Artisan commands standardize component creation
- Testing is first-class with no browser required
- Static analysis catches many errors

**Maintenance Challenges**:
- `#[Reactive]` attribute requirement is easy to miss, causing subtle bugs
- Understanding what gets serialized between requests requires mental model
- Blade template syntax has edge cases (escaping, directives)

## AI-Friendly Assessment

**Overall Score: 8/10**

### Strengths for AI-Assisted Development

**Laravel Convention Over Configuration**: Livewire follows Laravel's conventions strictly. File locations, naming patterns, and method signatures are predictable. AI can reliably generate code that matches the framework's expectations.

**Explicit Event Bindings**: `wire:click="save"` is scannable and greppable. AI can trace event handlers by searching for method names in the component class. No need to track complex callback chains.

**Single-File Components**: Each Livewire component is a single PHP class with all its state, methods, and lifecycle hooks. AI doesn't need to track state across multiple files.

**Strong Typing Potential**: PHP 8+ type declarations make properties and methods self-documenting:
```php
public int $count = 0;
public function setUser(User $user): void { ... }
```

**Mutable State**: Direct property mutations (`$this->count++`) are straightforward to understand and generate. No complex immutable update patterns.

**Built-in Patterns**: Traits like `WithPagination`, `WithFileUploads` provide standardized solutions. AI learns these patterns once and applies them consistently.

**Clear Data Flow**: Properties → Template → Events → Methods → Properties. The cycle is explicit and traceable.

**Testing API**: The fluent test syntax is highly readable:
```php
Livewire::test(Counter::class)
    ->set('count', 5)
    ->call('increment')
    ->assertSet('count', 6);
```

### Weaknesses for AI-Assisted Development

**Non-Reactive Default**: Child components don't automatically update when parent props change. AI must remember to add `#[Reactive]` when needed. This is a common gotcha.

**Magic `$wire` Object**: While powerful, `$wire` introduces implicit behavior in JavaScript that's harder to trace than explicit method calls.

**Blade Syntax Quirks**: The `@if/@foreach` directives and `{{ }}` vs `{!! !!}` escaping require PHP-specific knowledge. Mixed HTML/PHP syntax can be harder to parse than pure templating languages.

**Computed Property Prefix**: Requiring `$this->` for computed properties in templates but not for regular properties is inconsistent:
```blade
{{ $count }}           <!-- Regular property -->
{{ $this->total }}     <!-- Computed property -->
```

**Caching Complexity**: Multiple caching levels (request, persist, application-wide) and manual cache busting (`unset()`) add cognitive overhead.

**Request/Response Nature**: Unlike LiveView's persistent WebSocket, Livewire's AJAX model means component state is serialized/deserialized each request. This can lead to subtle bugs with complex objects.

**PHP Learning Curve**: For AI trained primarily on JavaScript, PHP syntax and Laravel patterns require additional context.

### Why 8/10?

Livewire scores highly because:
- **Explicit, traceable data flow** - Events clearly map to methods
- **Conventional patterns** - Laravel conventions make code predictable
- **Mutable, straightforward state** - No complex immutable updates
- **Strong testing story** - Easy to verify behavior
- **Minimal API surface** - `wire:model`, `wire:click`, public properties, that's 80% of the framework

The 2-point deduction is for:
- **Non-reactive default** - Easy to miss when children should be reactive
- **PHP-specific knowledge** - Requires understanding Laravel ecosystem
- **Template inconsistencies** - Computed properties needing `$this->`, Blade directive syntax

For developers already in the Laravel ecosystem, Livewire is effectively a **9/10**. The conventions feel natural and the AI-friendliness is exceptional.

---

**Key Insight for Next-Gen Framework Design**: Livewire demonstrates that **explicit event bindings** (`wire:click="methodName"`) are more AI-friendly than inline callbacks (`@click="() => setCount(count + 1)"`). Being able to grep for event names and find handlers immediately is valuable. Additionally, **mutable state with automatic tracking** (public properties) is simpler than immutable updates with manual dependency arrays. However, **reactivity should be opt-out, not opt-in**—the `#[Reactive]` requirement for parent-child updates is a common source of bugs.

## Context: Laravel's UI Ecosystem

Livewire is one of three approaches to building UIs in Laravel:

1. **Blade** (traditional): Server-rendered templates with full page reloads. No interactivity without custom JavaScript.

2. **Livewire** (this review): Server-rendered components with AJAX-driven interactivity. Stay in PHP, minimal JavaScript.

3. **Inertia.js**: Server-driven routing with client-side rendering. Use Vue/React/Svelte for the view layer, Laravel for routing/data. No API needed, but you write JavaScript components.

Livewire is the sweet spot for Laravel developers who want SPA-like UX without leaving PHP.
