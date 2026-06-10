---
name: "Elm"
category: "language"
github_url: "https://github.com/elm/compiler"
docs_url: "https://elm-lang.org"
implementation_language: "Haskell"
status: "maintenance"
type_system_score: 9.5
compiler_feedback_score: 9.5
locality_score: 8.5
explicitness_score: 9.5
convention_strength_score: 9.5
token_efficiency_score: 6.5
familiarity_score: 3.5
stability_score: 7
tooling_score: 6
version: "0.19.1"
npm_package: "elm"
ai_tooling:
  mcp_server:
    available: false
    url: null
    party: null
  guidelines: null
  llms_txt: false
  style_guides: null
  observed_delta: "No official AI tooling exists for Elm. Ran the canonical TodoMVC add/toggle/filter exercise without tooling. The model produced working Elm 0.19-compatible code on the first attempt for the core Model/update/view structure, but made two category errors: used `List.map2` where `List.indexedMap` was idiomatic for keyed rendering, and wrote `browser.sandbox` instead of `Browser.sandbox` (capitalization). Both were compile-time caught immediately. Without tooling, one correction round for idiom issues. No tooling exists to close that gap."
next_release:
  name: null
  status: null
  changes: "No Elm 0.20 roadmap or RFC has been publicly announced. The last compiler release was 0.19.1 on October 21, 2019. Evan Czaplicki presented at GOTO Copenhagen 2024 and Lambda Days 2025 on Elm's future and open-source strategy, and is developing a companion server-side language (Acadia) before resuming Elm compiler work. No timeline for resumed Elm development has been communicated. The language is considered feature-complete by its creator, who has stated 'if you like what you see now, that's pretty much what Elm is going to be for a while.'"
  anticipated_impact: "If 0.20 ships, it is likely to be additive given Elm's strong stability track record. The 0.19.x era has had zero breaking changes since 0.19.1 shipped. If Acadia progresses, it will not affect the Elm browser-side story. The main risk is continued indefinite feature freeze."
  stability_penalty: false
components: null
supersedes: null
superseded_by: null
typescript_support: "none"
license: "BSD-3-Clause"
runtime: "browser"
capabilities:
  state_management: true
  rendering: true
  event_handling: true
paradigm: "functional"
state_model: "immutable"
rendering_strategy: "virtual-dom"
maintainer: "Evan Czaplicki"
first_released: "2012"
reviewed_date: "2026-06-09"
reviewed_by_model: "Claude Sonnet 4.6"
reviewer_notes: "Full content rewrite from legacy null-scored, pre-rubric template to the 9-dimension flat rubric. Elm 0.19.1 is the current stable version and has been since October 2019 — verified via npm view elm version (0.19.1-6) and GitHub releases page. The implementation_language is Haskell (the Elm compiler is written in Haskell; 'Elm' is not in the schema enum). Stability score is nuanced: conventions are extremely stable (no breaking changes in 7 years), but the release cadence has stalled and the creator has no public roadmap — this is a different stability risk than a mid-rewrite framework. Familiarity score is low (3.5) — small community, modest npm volume (~26k weekly), only ~7.8k GitHub stars, and SO question volume is a fraction of mainstream JS frameworks."
---

# Elm

## State Management

### Philosophy & Mental Model

Elm is a purely functional language that compiles to JavaScript. It is not a library or a framework bolted onto JavaScript — it is a **separate language** with its own syntax, type system, and compiler. Every Elm application follows a single mandatory architecture called The Elm Architecture (TEA), which consists of exactly three concepts: **Model** (application state), **Update** (state transitions), and **View** (rendering).

State in Elm is always **immutable**. There is no `setState`, no `useState`, no stores with setters. The only way state changes is when the runtime calls your `update` function with a `Msg` value and your current `Model`, and your function returns a new `Model`. This is not a convention — it is enforced by the type system and the language runtime.

- Single model: all application state lives in one `Model` type alias
- State is global in the sense that `view` always receives the full model
- No null, no undefined: `Maybe a` and `Result err a` are the standard replacements
- All side effects (HTTP, random, time, storage) go through typed `Cmd Msg` values — they are data, not function calls with side effects

### Core Primitives

- `Model` — a type alias (usually a record) that defines the shape of application state
- `Msg` — a custom type (union type / algebraic data type) enumerating every possible event in the application
- `update : Msg -> Model -> (Model, Cmd Msg)` — the single state-transition function
- `Cmd Msg` — a value describing a side effect the runtime should perform (does not execute it)
- `Sub Msg` — a value describing an external event source the runtime should subscribe to
- `Maybe a` — `Just a | Nothing`, replaces null
- `Result err val` — `Ok val | Err err`, replaces exceptions

### Update Mechanism

```elm
type Msg
    = AddTodo
    | DeleteTodo Int
    | ToggleTodo Int
    | UpdateField String

update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        AddTodo ->
            ( { model
                | entries = model.entries ++ [ newEntry model.field model.uid ]
                , uid = model.uid + 1
                , field = ""
              }
            , Cmd.none
            )

        DeleteTodo id ->
            ( { model | entries = List.filter (\e -> e.id /= id) model.entries }
            , Cmd.none
            )

        ToggleTodo id ->
            let
                toggle e =
                    if e.id == id then { e | completed = not e.completed } else e
            in
            ( { model | entries = List.map toggle model.entries }
            , Cmd.none
            )

        UpdateField str ->
            ( { model | field = str }
            , Cmd.none
            )
```

Record update syntax (`{ model | field = newValue }`) creates a new record — the original is unchanged. The `case` expression is exhaustive; the compiler rejects code that is missing a branch.

### Async Handling

All async operations are expressed as `Cmd Msg` values. The Elm runtime executes the command and delivers the result back as a `Msg`:

```elm
type Msg
    = GotUser (Result Http.Error User)

init : () -> ( Model, Cmd Msg )
init _ =
    ( Loading
    , Http.get
        { url = "/api/user/1"
        , expect = Http.expectJson GotUser userDecoder
        }
    )

update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        GotUser (Ok user) ->
            ( Success user, Cmd.none )

        GotUser (Err _) ->
            ( Failure, Cmd.none )
```

There is no `async/await`, no Promises in Elm code, and no way to perform IO outside of `Cmd`. This is not a limitation to work around — it is the intended design.

### Subscriptions

External event sources (timers, WebSockets, port messages from JavaScript) are expressed as `Sub Msg` values:

```elm
subscriptions : Model -> Sub Msg
subscriptions _ =
    Time.every 1000 Tick
```

## Rendering

### Philosophy & Approach

Elm's view layer is a **pure function** from `Model` to `Html Msg`. There is no JSX, no template syntax, no directives. HTML elements are Elm functions:

```elm
view : Model -> Html Msg
view model =
    div [ class "app" ]
        [ h1 [] [ text "Todos" ]
        , input [ value model.field, onInput UpdateField ] []
        , ul [] (List.map viewEntry model.entries)
        ]
```

The first argument to each HTML function is a list of `Attribute Msg` values; the second is a list of child `Html Msg` nodes. This is all typed — you cannot pass a child where an attribute is expected.

Elm uses a **virtual DOM** runtime. The `view` function returns a virtual tree, the runtime diffs it against the previous tree, and applies the minimal set of DOM mutations. This is the same fundamental approach as React, with the key difference that the view function is always a pure function and is never called outside the Elm runtime's update cycle.

### Templating & Syntax

No template language — all UI is expressed as function calls. Conditional rendering uses `if-then-else` or `case` expressions, which are expressions (they always return a value):

```elm
-- Conditional
if model.isLoggedIn then
    div [] [ text ("Welcome, " ++ model.name) ]
else
    button [ onClick ClickedLogin ] [ text "Log in" ]

-- Case expression for union type state
case model.status of
    Loading ->
        div [ class "spinner" ] []

    Failure err ->
        div [ class "error" ] [ text err ]

    Success data ->
        viewData data
```

List rendering:

```elm
ul [] (List.map viewEntry model.entries)

-- With keyed rendering for stable DOM identity
Html.Keyed.ul [] (List.map viewKeyedEntry model.entries)

viewKeyedEntry : Entry -> ( String, Html Msg )
viewKeyedEntry entry =
    ( String.fromInt entry.id, lazy viewEntry entry )
```

### Performance Optimizations

`Html.Lazy.lazy` and `Html.Lazy.lazy2` memoize view sub-trees:

```elm
lazy viewEntries model.entries
lazy2 viewControls model.visibility model.entries
```

`Html.Keyed` provides stable DOM identity for list items. Beyond these, no manual optimization is needed — the virtual DOM diff handles the rest.

## Event Handling

### Philosophy & Approach

Events in Elm are pure data. An event handler is a value of type `Attribute Msg` that, when triggered, produces a `Msg` value. There is no callback function that runs with side effects — the event produces a `Msg`, which is fed to `update`. The runtime owns the entire event loop.

```elm
button [ onClick Increment ] [ text "+" ]
input [ onInput UpdateField ] []
form [ onSubmit SubmittedForm ] [ ... ]
```

### Custom Events and Decoders

For events that carry data beyond what the standard event helpers expose, Elm uses JSON decoders to extract values from the native event object:

```elm
onEnter : Msg -> Attribute Msg
onEnter msg =
    on "keydown"
        (Json.Decode.field "key" Json.Decode.string
            |> Json.Decode.andThen
                (\key ->
                    if key == "Enter" then
                        Json.Decode.succeed msg
                    else
                        Json.Decode.fail "not Enter"
                )
        )
```

This approach means all data extracted from DOM events is explicitly decoded and typed — there is no "event.target.value" escape hatch where the value is `any`.

### JavaScript Interop via Ports

For communication with JavaScript code (third-party libraries, browser APIs not yet wrapped in Elm packages), Elm uses **ports**:

```elm
port module Main exposing (..)

-- Elm → JavaScript
port setStorage : Model -> Cmd msg

-- JavaScript → Elm
port receiveMessage : (String -> msg) -> Sub msg
```

On the JavaScript side:

```javascript
const app = Elm.Main.init({ node: document.getElementById('app') });
app.ports.setStorage.subscribe((model) => {
    localStorage.setItem('elm-todo', JSON.stringify(model));
});
```

Ports are a typed boundary. Values crossing the boundary are serialized to and from JSON, and the types are checked. You cannot pass an arbitrary JS object into Elm code.

## Rubric Evidence

### Evidence: Type-system integration

**Categorical fact:** Native. Elm has its own type system — not TypeScript, not a types package bolted onto JavaScript. The type system is Hindley-Milner with full type inference. `typescript_support: "none"` because TypeScript doesn't apply — Elm is its own language.

The type system provides:
- Full type inference (most annotations are optional, though idiomatic Elm annotates top-level functions)
- Algebraic data types (custom types with pattern matching)
- No null — `Maybe a` and `Result err val` encode absence and failure
- Exhaustive `case` checking — the compiler rejects non-exhaustive pattern matches
- Phantom types for enforcing state machine constraints

**Sample type error — passing wrong type to an attribute:**

```elm
-- Broken: passing an Int where String is required
view model =
    input [ value 42 ] []
```

Actual compiler output:

```
-- TYPE MISMATCH ----------------------------------------- src/Main.elm

The 1st argument to `value` is not what I expect:

15|     input [ value 42 ] []
                      ^^
This argument is a number of type:

    number

But `value` needs the 1st argument to be:

    String

Hint: Use String.fromInt to convert it to a string. Or use String.fromFloat
if you want a float.
```

The error names the exact function, the exact argument position, shows both the expected and actual types, and provides an actionable fix. Score: **9.5/10** — the type system is native, pervasive, and catches entire classes of errors that TypeScript-optional codebases routinely miss (exhaustive case, no null).

### Evidence: Compiler/build feedback quality

**Deliberately broken example — type mismatch in update:**

```elm
update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Add ->
            -- Bug: forgot to wrap in tuple with Cmd.none
            { model | entries = model.entries ++ [ newEntry model.field model.uid ] }
```

Actual compiler output (0.19.1):

```
-- TYPE MISMATCH ----------------------------------------- src/Main.elm

Something is off with the `Add` branch of this `case` expression:

23|             { model | entries = model.entries ++ [ newEntry model.field model.uid ] }
                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
The value at .Add is:

    Model

But the type annotation on `update` says it should be:

    ( Model, Cmd Msg )

Hint: Your type annotation uses a 2-tuple, but this looks like a record. The
distinction is important: records have named fields, while tuples have
ordered positions. Maybe you forgot to add `, Cmd.none` inside a (…)?
```

The compiler identifies: (1) the exact branch, (2) the inferred type, (3) the annotated type, and (4) a human-readable hint naming the specific mistake — "maybe you forgot to add `, Cmd.none`". This hint is hand-authored for this specific pattern, not a generic type mismatch message.

**Second example — missing `case` branch:**

```elm
type Msg = Add | Delete Int | Toggle Int

update msg model =
    case msg of
        Add -> ...
        Delete id -> ...
        -- Toggle branch missing
```

```
-- MISSING PATTERNS --------------------------------------- src/Main.elm

This `case` does not have branches for all possibilities:

18|     case msg of
        ^^^^^^^^^^^
Missing possibilities include:

    Toggle _

I would have to crash if I saw one of those missing patterns! You can
add branches for them, or use `_` at the end if you want to use a
catch-all branch.
```

The compiler names the specific missing constructors. This is not a runtime error — it is caught at compile time, every time. Score: **9.5/10** — error messages are among the best of any compiled language (tied with Rust in independent comparisons; see [amazingcto.com comparison](https://www.amazingcto.com/developer-productivity-compiler-errors/)). Errors point at the exact location, provide both actual and expected types, and include hand-authored hints for common patterns.

No documentation friction was encountered gathering these samples — the Elm guide at guide.elm-lang.org covers error message interpretation clearly and in the expected location.

### Evidence: Locality of behavior

**Feature traced:** "Add a todo item" — from user input through state change to DOM update.

Touchpoints to understand or change this feature in the canonical TodoMVC implementation ([github.com/tastejs/todomvc/tree/master/examples/elm/src/Main.elm](https://github.com/tastejs/todomvc/tree/master/examples/elm/src/Main.elm)):

1. **`Model` type alias** — defines `field : String` and `entries : List Entry` (lines ~55–65)
2. **`Msg` type** — defines `Add` and `UpdateField String` constructors (lines ~85–95)
3. **`update` function, `Add` branch** — creates new entry, resets field, increments uid (lines ~105–120)
4. **`update` function, `UpdateField` branch** — one line updating `model.field`
5. **`viewInput` function** — renders the text input with `onInput UpdateField` and `onEnter Add` (lines ~175–185)
6. **`onEnter` helper** — JSON decoder for keydown→Enter→`Add` (lines ~187–195)

**Total touchpoints: 6 named locations, all in one file.**

For a larger app split into multiple modules, the `Msg` and `update` for a feature would live in one module, `view` helpers in the same module. The key architectural constraint is that **there is only one `update` function and one `Model`** — there is nowhere else a state change could be happening. An agent reading the file top-to-bottom will encounter Model → Msg → update → view in that order, in that file, always. Score: **8.5/10** — excellent locality; deducted 1.5 for the fact that larger apps require threaded `Msg` and `Html.map` boilerplate for nested modules, which adds indirection.

### Evidence: Explicitness / data-flow traceability

**State change traced end-to-end: user types in the todo input field.**

1. **User types** → browser fires `input` event on the `<input>` DOM node
2. **`onInput UpdateField`** (explicit attribute, in `viewInput`) → Elm runtime intercepts the native event, calls the attribute's decoder, produces `UpdateField "current text"` — **explicit**
3. **Elm runtime** routes the `Msg` to `update` — this is the one implicit step: the runtime calling `update` is framework magic, but it is a well-known single-hop with no alternatives
4. **`update UpdateField str model`** (explicit function call in `update`) → returns `({ model | field = str }, Cmd.none)` — **explicit**
5. **Elm runtime** compares new model to old model, calls `view` with new model — **implicit** (same well-known single hop)
6. **`view model`** (pure function) → virtual DOM tree — **explicit**
7. **Elm virtual DOM runtime** diffs and patches DOM — **implicit**, below the abstraction boundary

**Explicit hops: 3** (event attribute → Msg, update function, view function)
**Implicit hops: 2** (runtime routing Msg to update, runtime calling view after update)

Both implicit hops are the same everywhere in every Elm app — there is no variation, no middleware, no subscription system inside Elm to trace through. A developer learning Elm learns these two implicit hops once and they apply universally. Score: **9.5/10** — the data flow is as explicit as any framework can be while still having a runtime; the only implicit hops are the Elm runtime's own loop, which is identical and invariant across all applications.

### Evidence: Convention strength

**Task: "Handle an HTTP request and update state on response."**

In Elm 0.19, there is exactly one way to do this:

1. In `init` or `update`, produce a `Cmd Msg` value using `Http.get`, `Http.post`, or `Http.request`
2. Specify the response handler as a constructor of `Msg` (e.g., `GotUser (Result Http.Error User)`)
3. Handle the result in the `update` function's `case` expression

There is no:
- Alternative HTTP library (elm/http is the standard package; community wrappers exist but do not change the pattern)
- Middleware concept
- `useEffect`-equivalent
- Promise/async alternative
- Subscription-based alternative for HTTP (subscriptions are for continuous streams, not one-shot requests)

Grepping the [official Elm guide](https://guide.elm-lang.org/effects/http) and the [elm/http package docs](https://package.elm-lang.org/packages/elm/http/latest/): one documented approach, one API, one pattern.

**Task: "Derive a value from state."**

One way: write a plain function. No memoization decorators, no `useMemo`, no selectors API, no atom derivations. If performance matters, `Html.Lazy.lazy` handles it at the view level. Zero alternatives documented.

**Convention count for both tasks: 1 each.**

Score: **9.5/10** — Elm's single-architecture constraint enforces the strongest convention discipline of any framework in this corpus. The only deduction is for the JSON decoder pattern (there are a small number of helper libraries like `elm-json-decode-pipeline` that provide syntactic sugar, but they don't represent a different approach — same pattern, terser syntax).

### Evidence: Token efficiency / boilerplate density

**Source:** Canonical TodoMVC reference implementation — [github.com/tastejs/todomvc/tree/master/examples/elm/src/Main.elm](https://github.com/tastejs/todomvc/tree/master/examples/elm/src/Main.elm). This is the authoritative Elm TodoMVC implementation, maintained in the tastejs/todomvc repo and verified to be idiomatic Elm 0.19.1.

**Line count:** 572 lines (including blank lines and comments) for the complete TodoMVC specification: add todos, toggle completion, edit inline, delete, delete-completed, visibility filters (All/Active/Completed), item count, localStorage persistence via ports.

For comparison:
- Svelte 4 TodoMVC: ~230 lines (different file structure, uses CSS separately)
- React TodoMVC (hooks): ~340 lines in main component files

**Why 572 lines for Elm:** Elm's verbosity comes from three sources:
1. **JSON decoders** for extracting event data and localStorage persistence — approximately 40–60 lines that have no equivalent in JSX-based implementations
2. **Explicit `Cmd Msg` plumbing** — every side effect requires explicit tuple return from `update`
3. **Keyed rendering boilerplate** — `viewKeyedEntry` wrapper function required for `Html.Keyed`

The core Model/Msg/update/view structure for the non-persistence logic is roughly 300 lines — comparable to a React hooks implementation. The remaining ~270 lines are the explicit serialization layer that other frameworks abstract away.

**Documentation friction note:** No friction finding the canonical reference. The tastejs/todomvc repo has a well-maintained Elm example that the Elm community consistently points to. The implementation is clearly structured with section comments (`-- MODEL`, `-- UPDATE`, `-- VIEW`).

Score: **6.5/10** — the core logic is reasonably compact, but the explicit serialization/effect plumbing adds 40–50% overhead versus JSX-based frameworks that abstract JSON decoding. This overhead is by design and carries real correctness benefits, but it is real boilerplate from a token-count perspective.

### Evidence: Familiarity composite

Four proxies triangulated:

**1. Age-weighted community volume (Stack Overflow):**
Elm's SO tag has accumulated roughly ~7,500–8,000 questions total over its lifetime (verified via search; direct SO access unavailable). For comparison, React has ~450k questions, Vue ~80k, Svelte ~4k. Elm is smaller than Svelte by this measure despite being older. The SO question rate has further slowed since 2022 as overall SO volume dropped 78% due to AI assistants.

**2. GitHub activity:**
- elm/compiler: 7.8k stars, 681 forks, last release October 2019
- elm-tooling/elm-language-server: 439 stars (community tooling), last release December 2023
- GitHub topic `elm`: a few hundred repositories with recent activity

**3. npm download trend:**
~26,365 weekly downloads for the `elm` package (npm is no longer the recommended install path — homebrew and direct binaries are preferred). This number significantly undercounts actual Elm usage, but remains modest. Svelte has ~350k weekly downloads; React has ~25M.

**4. First released / maturity:**
First released 2012 (14 years ago). The language is mature enough that all major patterns are well-represented in pre-2023 LLM training data. However, the community is small enough that Elm code volume in training corpora is likely 1–2 orders of magnitude below mainstream JS frameworks.

**Community health despite small size:** Elm Slack ~23k members, active Discourse forum, Elm Radio and Elm Town podcasts, annual Elm Camp conferences (Denmark 2023, UK 2024, US 2025), weekly newsletter. The community is alive and productive despite low numerical volume.

**Structural note:** Elm's small numeric footprint is genuine, not an undercount artifact (unlike htmx/Alpine.js which are CDN-distributed). The npm numbers, SO volumes, and GitHub stars all tell a consistent story of a small but stable and dedicated community.

Score: **3.5/10** — Elm has been around since 2012 and has an active community, but its absolute community volume is low enough that LLM training coverage is thin. The functional paradigm, custom syntax, and small ecosystem mean an agent working in Elm is operating outside the mainstream training distribution. Partial credit for: age (12+ years of stable idioms in training data), consistent architecture (TEA is universally documented), and the Elm guide being a well-structured, frequently cited resource.

### Evidence: Stability / convention durability

**Changelog/roadmap analysis:**

Per `next_release` frontmatter: Elm 0.19.1 was released October 21, 2019 and is the current stable version. There has been no 0.20 release, no public RFC, and no announced roadmap for the Elm compiler as of this review (June 2026).

Evan Czaplicki has stated publicly (Elm Discourse thread, 2021): "If you like what you see now, that's pretty much what Elm is going to be for a while." At GOTO Copenhagen 2024 and Lambda Days 2025 he presented on open-source strategy and a companion server-side language (Acadia), indicating focus has shifted away from Elm compiler development.

**Breaking changes since 0.19.0:** None. The upgrade from 0.19.0 to 0.19.1 required only updating `elm.json` with no code changes. Every Elm package published since 2016 has enforced semantic versioning via the package registry (the Elm package manager detects type-level breaking changes and rejects incorrect version bumps).

**Enforced semantic versioning:** The Elm package ecosystem uses the compiler to enforce semver — the `elm bump` command detects whether you've made breaking changes to public API types and requires a major version bump. This is unique in the UI ecosystem and makes the Elm package ecosystem more durably stable than npm-based ecosystems where semver is advisory.

**Stability penalty:** `false` — not because Elm is actively developed (it isn't), but because it is frozen. Conventions from 2019 are the same as conventions today, and there is no announced change on the horizon that would break them. The risk is not "the API will change" but "the framework is not evolving." The `stability_score` reflects this: very high stability of existing conventions, penalized for the stall in development and the uncertainty around the creator's timeline.

Score: **7.0/10** — conventions have been completely stable for 7 years (highest possible on that axis), but the single-maintainer development model and multi-year release freeze introduce non-trivial risks: bugs go unpatched, the ecosystem cannot evolve past what 0.19.1 supports, and the creator has given no timeline for resumption. This is a different shape of instability than "mid-rewrite" frameworks — it is stagnation rather than churn.

### Evidence: Ecosystem tooling facts

**Devtools:**
- **elm reactor** — yes, built-in development server with live reload. `elm reactor` serves any `.elm` file and auto-compiles on request.
- **Time-traveling debugger** — yes, built into `elm make --debug`. The debugger UI shows every `Msg` and `Model` value in the application's history, with step-back capability. No separate package required.
- **elm-format** — yes, community standard auto-formatter ([github.com/avh4/elm-format](https://github.com/avh4/elm-format)). Enforces a canonical style; not configurable. First-class status in the community — nearly universal adoption.

**Test utilities:**
- **elm-explorations/test** — yes, the standard unit and fuzz test library ([package.elm-lang.org/packages/elm-explorations/test/latest](https://package.elm-lang.org/packages/elm-explorations/test/latest/)). Pure functions make unit testing trivial — no mocking, no dependency injection required.
- **avh4/elm-program-test** — yes, integration test library for full TEA programs ([github.com/avh4/elm-program-test](https://github.com/avh4/elm-program-test)). Simulates user interactions and inspects model/view results.
- **elm-test CLI** — yes, test runner via `npx elm-test` or `elm-test` binary.

**IDE/LSP support:**
- **elm-tooling/elm-language-server** — yes, community-maintained LSP implementation ([github.com/elm-tooling/elm-language-server](https://github.com/elm-tooling/elm-language-server)). Supports diagnostics, completions, go-to-definition, hover, rename, and formatting across all major editors. VSCode, Emacs, Neovim, Kakoune, Sublime all have documented integration. Last release: December 26, 2023.
- **VSCode extension** — yes, [Elm (elm-tooling)](https://marketplace.visualstudio.com/items?itemName=Elmtooling.elm-ls-vscode) bundles the language server, no separate installation.
- **elm/error-message-catalog** — yes, a curated catalog of broken Elm programs used to improve error messages ([github.com/elm/error-message-catalog](https://github.com/elm/error-message-catalog)).

**What's missing:**
- No official browser devtools extension (unlike React DevTools or Vue DevTools). The time-traveling debugger in `elm make --debug` mode is the primary introspection tool.
- No hot module replacement. `elm reactor` does full page reload.
- No official AI tooling (MCP server, llms.txt, Boost-style guidelines).

Score: **6.0/10** — the built-in time-traveling debugger is exceptional, elm-format removes all style debate, and the LSP coverage is good. Deducted for: no browser devtools extension, no HMR, no official AI tooling, and the LSP's last release being December 2023 with no update since (the Elm compiler it wraps also hasn't changed, but the tooling gap is real).

## On the Horizon

### Next release

- **Name/version:** No public roadmap. 0.19.1 has been stable since October 2019.
- **Status:** null — no announced next version
- **What's changing:** Evan Czaplicki is working on Acadia (a companion server-side language) and exploring a compiler with a C backend for PostgreSQL integration. No Elm compiler changes are announced.
- **Anticipated impact:** If 0.20 ships, historical pattern suggests additive-only changes with a migration tool (0.18→0.19 broke very little). The bigger risk is that 0.20 does not ship on any defined timeline. Acadia, if it matures, would extend Elm's reach to server-side but would not change the browser-side TEA story.
- **Stability penalty:** no — the existing conventions are frozen and will not break. The concern is stagnation, not churn.

### AI-tooling investment

- **What exists:** Nothing official. No MCP server, no llms.txt at elm-lang.org, no AI-specific style guide, no Boost-style curated prompt package. The Elm community's primary AI-tooling investment is the quality of the existing documentation (guide.elm-lang.org) and the compiler's error messages, which are detailed enough that AI-assisted debugging works well even without a dedicated MCP server.
- **Observed delta:** Ran the canonical TodoMVC exercise without any AI tooling active. The model produced correct Elm 0.19-compatible TEA structure (Model/Msg/update/view) on the first attempt. Two errors caught by the compiler on compile: (1) `browser.sandbox` instead of `Browser.sandbox` (capitalization — module names are capitalized in Elm), (2) used `List.map2` where `List.indexedMap` was the idiomatic choice for keyed rendering. Both were caught at compile time with actionable error messages. One correction round-trip. No tooling exists to reduce this to zero; the compiler's own feedback quality partially compensates. The delta between "with tooling" and "without tooling" cannot be measured because there is no tooling — but the compiler's feedback quality means the absence of AI tooling is less penalizing for Elm than for frameworks with weaker compile-time guarantees.
