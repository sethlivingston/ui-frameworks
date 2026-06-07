---
name: "Elm"
category: "language"
github_url: "https://github.com/elm/compiler"
docs_url: "https://elm-lang.org"
implementation_language: "Haskell"
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

# Elm

## Philosophy & Mental Model

Elm is **"a delightful language for reliable web applications"**—a pure functional programming language that compiles to JavaScript. It's not a framework; it's a **language** with its own syntax, compiler, and type system.

**Mental model**: **No runtime exceptions, ever**. Elm's compiler uses static types to guarantee that your program won't crash. If it compiles, it works. No `null`, no `undefined`, no runtime type errors.

**Core principles:**

1. **No Runtime Exceptions** - Compiler catches all errors before runtime
2. **Pure Functions** - No side effects, all functions are deterministic
3. **Immutability** - All values are immutable by default
4. **The Elm Architecture** - Every app follows Model-Update-View pattern
5. **Helpful Compiler** - Error messages guide you to solutions
6. **Enforced Semantic Versioning** - Type system detects breaking changes

**Key insight**: Elm treats **correctness as the primary goal**. Performance, bundle size, and developer experience are all important, but the compiler won't let you write buggy code.

The Elm Architecture (Model-Update-View) inspired Redux. "Good React code in 2025 looks suspiciously like Elm code from 2015."

## State Management

### The Elm Architecture

**Every Elm app** follows this pattern:

```elm
import Browser
import Html exposing (Html, button, div, text)
import Html.Events exposing (onClick)

-- MODEL (state)
type alias Model = Int

init : Model
init = 0

-- UPDATE (state transitions)
type Msg
  = Increment
  | Decrement

update : Msg -> Model -> Model
update msg model =
  case msg of
    Increment ->
      model + 1

    Decrement ->
      model - 1

-- VIEW (rendering)
view : Model -> Html Msg
view model =
  div []
    [ button [ onClick Decrement ] [ text "-" ]
    , div [] [ text (String.fromInt model) ]
    , button [ onClick Increment ] [ text "+" ]
    ]

-- MAIN (wire everything together)
main =
  Browser.sandbox
    { init = init
    , update = update
    , view = view
    }
```

**Data flow** is unidirectional and explicit:

1. **Model** → **View** renders current state
2. User interaction produces **Msg**
3. **Msg** → **Update** function
4. **Update** returns new **Model**
5. Repeat

No setState, no reducers, no context, no hooks. Just pure functions.

### Model (State)

**Define your state** as a type:

```elm
type alias Model =
  { count : Int
  , name : String
  , todos : List Todo
  }

type alias Todo =
  { id : Int
  , text : String
  , completed : Bool
  }

init : Model
init =
  { count = 0
  , name = ""
  , todos = []
  }
```

### Messages (Events)

**All state changes** are represented as messages:

```elm
type Msg
  = Increment
  | Decrement
  | SetName String
  | AddTodo String
  | ToggleTodo Int
  | DeleteTodo Int
```

Messages are **data**, not functions. They describe what happened, not how to handle it.

### Update (State Transitions)

**Pure function** that takes a message and current model, returns new model:

```elm
update : Msg -> Model -> Model
update msg model =
  case msg of
    Increment ->
      { model | count = model.count + 1 }

    Decrement ->
      { model | count = model.count - 1 }

    SetName name ->
      { model | name = name }

    AddTodo text ->
      let
        newTodo = { id = List.length model.todos, text = text, completed = False }
      in
      { model | todos = model.todos ++ [ newTodo ] }

    ToggleTodo id ->
      { model | todos = List.map (toggleTodo id) model.todos }

    DeleteTodo id ->
      { model | todos = List.filter (\todo -> todo.id /= id) model.todos }

toggleTodo : Int -> Todo -> Todo
toggleTodo targetId todo =
  if todo.id == targetId then
    { todo | completed = not todo.completed }
  else
    todo
```

**Immutability**: `{ model | count = model.count + 1 }` creates a **new** record with updated `count`. Original model is unchanged.

### Read Pattern

Access state in view:

```elm
view : Model -> Html Msg
view model =
  div []
    [ h1 [] [ text model.name ]
    , p [] [ text ("Count: " ++ String.fromInt model.count) ]
    , div [] (List.map viewTodo model.todos)
    ]

viewTodo : Todo -> Html Msg
viewTodo todo =
  li []
    [ input [ type_ "checkbox", checked todo.completed, onClick (ToggleTodo todo.id) ] []
    , text todo.text
    , button [ onClick (DeleteTodo todo.id) ] [ text "Delete" ]
    ]
```

### Async Handling (Commands)

For side effects (HTTP, random, time), use **Commands**:

```elm
import Browser
import Http
import Json.Decode as Decode

type Model
  = Loading
  | Failure
  | Success String

type Msg
  = GotData (Result Http.Error String)

init : () -> (Model, Cmd Msg)
init _ =
  ( Loading
  , Http.get
      { url = "https://api.example.com/data"
      , expect = Http.expectString GotData
      }
  )

update : Msg -> Model -> (Model, Cmd Msg)
update msg model =
  case msg of
    GotData result ->
      case result of
        Ok data ->
          (Success data, Cmd.none)

        Err _ ->
          (Failure, Cmd.none)
```

**Commands** are data describing what effect to perform. The Elm runtime executes them and sends results back as messages.

### Subscriptions

Listen to external events:

```elm
import Browser
import Time

type Msg
  = Tick Time.Posix

subscriptions : Model -> Sub Msg
subscriptions model =
  Time.every 1000 Tick

update : Msg -> Model -> (Model, Cmd Msg)
update msg model =
  case msg of
    Tick time ->
      ({ model | currentTime = time }, Cmd.none)
```

### Derived State

Use functions:

```elm
type alias Model =
  { items : List { price : Float, qty : Int }
  }

subtotal : Model -> Float
subtotal model =
  model.items
    |> List.map (\item -> item.price * toFloat item.qty)
    |> List.sum

tax : Model -> Float
tax model =
  subtotal model * 0.08

total : Model -> Float
total model =
  subtotal model + tax model

view : Model -> Html Msg
view model =
  div []
    [ p [] [ text ("Subtotal: $" ++ String.fromFloat (subtotal model)) ]
    , p [] [ text ("Tax: $" ++ String.fromFloat (tax model)) ]
    , p [] [ text ("Total: $" ++ String.fromFloat (total model)) ]
    ]
```

## Rendering

### View Function

**Pure function** from Model to HTML:

```elm
view : Model -> Html Msg
view model =
  div [ class "container" ]
    [ h1 [] [ text "My App" ]
    , p [] [ text ("Count: " ++ String.fromInt model.count) ]
    , button [ onClick Increment ] [ text "+" ]
    ]
```

### HTML as Functions

Elm HTML is **functions**, not JSX:

```elm
div [ class "card", id "main" ]
  [ h2 [] [ text "Title" ]
  , p [] [ text "Content" ]
  , button [ onClick ClickedButton ] [ text "Click me" ]
  ]
```

First argument: **attributes**.
Second argument: **children**.

### Conditional Rendering

Standard if-expressions:

```elm
view : Model -> Html Msg
view model =
  div []
    [ if model.isLoggedIn then
        div [] [ text ("Welcome, " ++ model.userName) ]
      else
        button [ onClick ClickedLogin ] [ text "Login" ]
    ]
```

Or case-expressions:

```elm
view : Model -> Html Msg
view model =
  case model.loadingState of
    Loading ->
      div [] [ text "Loading..." ]

    Failure ->
      div [] [ text "Error loading data" ]

    Success data ->
      div [] [ text data ]
```

### List Rendering

```elm
view : Model -> Html Msg
view model =
  ul []
    (List.map viewItem model.items)

viewItem : Item -> Html Msg
viewItem item =
  li []
    [ text item.name
    , button [ onClick (DeleteItem item.id) ] [ text "Delete" ]
    ]
```

Or using `List.indexedMap` for keys:

```elm
ul []
  (List.indexedMap viewIndexedItem model.items)

viewIndexedItem : Int -> Item -> Html Msg
viewIndexedItem index item =
  li [ key (String.fromInt index) ]
    [ text item.name ]
```

### Virtual DOM

Elm uses **virtual DOM** (like React):

1. `view` returns virtual DOM tree
2. Elm runtime diffs against previous tree
3. Apply minimal DOM updates

## Event Handling

### Standard Events

```elm
import Html exposing (button, input, form)
import Html.Events exposing (onClick, onInput, onSubmit)

view : Model -> Html Msg
view model =
  div []
    [ button [ onClick Increment ] [ text "+" ]
    , input [ onInput SetName, value model.name ] []
    , form [ onSubmit SubmittedForm ]
        [ button [ type_ "submit" ] [ text "Submit" ]
        ]
    ]
```

### Event Messages

Events produce messages:

```elm
type Msg
  = Increment
  | SetName String
  | SubmittedForm
```

### Custom Decoders

Decode event data:

```elm
import Html.Events exposing (on)
import Json.Decode as Decode

onEnter : Msg -> Html.Attribute Msg
onEnter msg =
  on "keydown"
    (Decode.field "key" Decode.string
      |> Decode.andThen
          (\key ->
            if key == "Enter" then
              Decode.succeed msg
            else
              Decode.fail "not enter"
          )
    )

-- Usage
input [ onEnter SubmittedForm ] []
```

## Reuse Patterns

### Component Functions

Elm doesn't have "components"—just **functions**:

```elm
viewButton : String -> Msg -> Html Msg
viewButton label msg =
  button [ onClick msg, class "btn" ]
    [ text label ]

view : Model -> Html Msg
view model =
  div []
    [ viewButton "Increment" Increment
    , viewButton "Decrement" Decrement
    , viewButton "Reset" Reset
    ]
```

### Modules

Organize code in modules:

```elm
-- Button.elm
module Button exposing (view)

import Html exposing (Html, button, text)
import Html.Events exposing (onClick)

view : String -> msg -> Html msg
view label msg =
  button [ onClick msg, class "btn" ]
    [ text label ]

-- Main.elm
import Button

view : Model -> Html Msg
view model =
  div []
    [ Button.view "Click me" Increment ]
```

### Nested Components

Use nested Model-Update-View:

```elm
-- Parent
type alias Model =
  { counter : Counter.Model
  , name : String
  }

type Msg
  = CounterMsg Counter.Msg
  | SetName String

update : Msg -> Model -> Model
update msg model =
  case msg of
    CounterMsg counterMsg ->
      { model | counter = Counter.update counterMsg model.counter }

    SetName name ->
      { model | name = name }

view : Model -> Html Msg
view model =
  div []
    [ Html.map CounterMsg (Counter.view model.counter)
    , input [ onInput SetName, value model.name ] []
    ]
```

## Developer Experience

### Learning Curve

**High**. Elm is a different language with functional paradigm:

**New concepts**:
- Pure functions
- Immutability
- Type system
- Pattern matching
- Custom types
- Commands and Subscriptions
- No null/undefined

**Easier if you know**:
- Haskell, F#, OCaml (similar languages)
- Functional programming concepts

**Harder if you're from**:
- JavaScript (imperative, mutable)
- React (hooks, classes)

### Type System

**Full type inference**:

```elm
add : Int -> Int -> Int
add x y =
  x + y

-- Compiler infers types even without annotation
multiply x y =
  x * y  -- Inferred as: number -> number -> number
```

**Custom types**:

```elm
type User
  = Anonymous
  | Registered String Int  -- name, age
  | Admin String

greet : User -> String
greet user =
  case user of
    Anonymous ->
      "Hello, guest!"

    Registered name age ->
      "Hello, " ++ name ++ "!"

    Admin name ->
      "Hello, admin " ++ name ++ "!"
```

**Maybe (no null)**:

```elm
type Maybe a
  = Just a
  | Nothing

findUser : Int -> Maybe User
findUser id =
  -- Returns Just user or Nothing

view : Model -> Html Msg
view model =
  case model.user of
    Just user ->
      div [] [ text user.name ]

    Nothing ->
      div [] [ text "No user" ]
```

**Result (no exceptions)**:

```elm
type Result error value
  = Ok value
  | Err error

parseInt : String -> Result String Int
parseInt str =
  case String.toInt str of
    Just n ->
      Ok n

    Nothing ->
      Err ("Invalid number: " ++ str)
```

### Tooling

**Elm CLI**: `elm init`, `elm make`, `elm install`

**elm-format**: Auto-formatter (like Prettier)

**elm-test**: Built-in testing

**elm reactor**: Live dev server

**elm-json**: Package management

**Time-Traveling Debugger**: Step through state changes

### Compiler Messages

**Helpful errors**:

```
-- TYPE MISMATCH ------------------------------------------------- Main.elm

The 1st argument to `div` is not what I expect:

14|   div [ onClick Increment ]
          ^^^^^^^^^^^^^^^^^^^^
This `onClick` call produces:

    Html.Attribute Msg

But `div` needs the 1st argument to be:

    List (Html.Attribute Msg)

Hint: It looks like a list is missing. Try adding [ ... ] around it?
```

Compiler guides you to the fix.

### JavaScript Interop

**Ports** for JS communication:

```elm
port module Main exposing (..)

-- Elm → JavaScript
port sendMessage : String -> Cmd msg

-- JavaScript → Elm
port receiveMessage : (String -> msg) -> Sub msg

type Msg
  = Send
  | Received String

update : Msg -> Model -> (Model, Cmd Msg)
update msg model =
  case msg of
    Send ->
      (model, sendMessage "Hello from Elm!")

    Received message ->
      ({ model | lastMessage = message }, Cmd.none)

subscriptions : Model -> Sub Msg
subscriptions model =
  receiveMessage Received
```

```javascript
// JavaScript side
const app = Elm.Main.init({ node: document.getElementById('app') });

app.ports.sendMessage.subscribe((message) => {
  console.log('Received from Elm:', message);
});

app.ports.receiveMessage.send('Hello from JavaScript!');
```

### Boilerplate

**Minimal for Elm**, but different from JS:

```elm
module Main exposing (..)

import Browser
import Html exposing (Html, text)

type alias Model = ()

type Msg = NoOp

main =
  Browser.sandbox
    { init = ()
    , update = \_ model -> model
    , view = \_ -> text "Hello World"
    }
```

~15 lines for minimal app.

### Documentation

**Excellent**. https://guide.elm-lang.org is comprehensive, beginner-friendly, and explains functional concepts clearly.

### Component Reusability Assessment

**Quality: Good (7.5/10)**

**Strengths**: Pure functions are perfectly reusable. Elm packages guarantee semantic versioning. Type system ensures compatibility. Messages and updates compose cleanly. View functions are pure - easy to test and reuse. Elm Architecture scales from tiny components to large apps with same pattern.

**Weaknesses**: Cannot mix with other frameworks - Elm is all-or-nothing. Interop with JS requires ports (FFI). No component libraries like React has. Smaller ecosystem. Each "component" requires init/update/view boilerplate. Elm-UI provides layout primitives but still functional paradigm.

**Cross-Project Reuse**: Excellent within Elm ecosystem. Packages work across all Elm versions (semantic versioning enforced). Pure functions export easily. Cannot reuse outside Elm (compiles to JS but not meant for consumption). Patterns (TEA) transferable conceptually.

**Design System Support**: Different paradigm - no "components" but view functions. Elm-UI provides design system primitives (spacing, colors). elm-css for type-safe styling. Custom type systems enforce design constraints.

## Maintainability

**Quality: Excellent (9.5/10)**

**Strengths**: No runtime exceptions - "if it compiles, it works." Type system catches errors. Refactoring is fearless - compiler guides you. Pure functions easy to reason about. Immutability prevents bugs. Time-travel debugging built-in. Code doesn't rot - Elm from 2015 still works. Semantic versioning enforced by compiler.

**Weaknesses**: Learning curve for functional programming. Ecosystem small - fewer libraries. JS interop via ports is verbose. Compiler errors can be overwhelming for beginners. "Boilerplate" for Elm Architecture (though intentional design).

**Code Organization**: Elm Architecture enforces structure: Model, init, Msg, update, view. Modules for separation. Types define boundaries. File organization by feature or layer.

**Testing**: elm-test for unit tests. elm-program-test for integration tests. Pure functions trivial to test. Property-based testing (elm-explorations/test). Time-travel debugging reduces need for some tests.

**Debugging**: Time-travel debugging built-in. Compiler errors are famously helpful. Type holes (`Debug.todo`) for incremental development. `Debug.log` for inspecting values. No runtime exceptions to debug.

**Scalability**: Excellent. Elm Architecture scales identically from small to large apps. Type system ensures safety at scale. No global state conflicts. Lazy evaluation for performance. Large codebases remain maintainable.

**Breaking Changes**: Elm 0.19 has been stable for years. Packages cannot introduce breaking changes without major version bump (enforced). Extremely stable ecosystem.

## AI-Friendly Assessment

**Overall Score: 9/10**

### Strengths for AI-Assisted Development

**Extremely Explicit Data Flow**: One-way, traceable:

```
Model → View → User Interaction → Msg → Update → New Model
```

AI can trace every state change through explicit message types.

**No Runtime Exceptions**: Compiler guarantees correctness. AI-generated code that compiles **will work**. No need to reason about edge cases—compiler forces exhaustive pattern matching.

**Pure Functions**: All functions are deterministic:

```elm
update : Msg -> Model -> Model
```

Same inputs **always** produce same output. No hidden side effects. AI can reason locally without tracking global state.

**Immutability Enforced**: All values immutable by language:

```elm
{ model | count = model.count + 1 }  -- Creates new record
```

AI doesn't need to track mutation—everything is immutable.

**Exhaustive Pattern Matching**: Compiler ensures all cases handled:

```elm
case msg of
  Increment -> ...
  Decrement -> ...
  -- Forgot a case? Compiler error.
```

AI can't forget edge cases—compiler won't allow it.

**No Null/Undefined**: `Maybe` type instead:

```elm
type Maybe a = Just a | Nothing

case model.user of
  Just user -> ...
  Nothing -> ...
```

AI must handle both cases. No null reference errors.

**Simple, Consistent Architecture**: Every app follows same pattern:

- Model (state)
- Msg (events)
- Update (transitions)
- View (rendering)

AI learns one pattern, applies to all Elm apps.

**Type System**: Full type inference with helpful errors:

```elm
add : Int -> Int -> Int
add x y = x + y
```

AI gets immediate feedback from compiler if types don't match.

**Helpful Compiler**: Error messages guide to solution. AI can parse compiler output to fix code.

### Weaknesses for AI-Assisted Development

**Different Language**: Not JavaScript. AI trained on JS/TS must learn Elm syntax:

```elm
-- Elm
add x y = x + y

// JavaScript
function add(x, y) { return x + y; }
```

Less training data than JavaScript.

**Functional Paradigm**: Different from imperative. AI must understand:
- Pure functions
- Immutability
- Recursion (no loops)
- Pattern matching
- Function composition

**JSON Decoders**: Manual boilerplate for JSON:

```elm
import Json.Decode as Decode

userDecoder : Decode.Decoder User
userDecoder =
  Decode.map2 User
    (Decode.field "name" Decode.string)
    (Decode.field "age" Decode.int)
```

Verbose compared to TypeScript automatic parsing.

**Ports for JS Interop**: Boundary between Elm and JS is explicit but adds complexity:

```elm
port sendMessage : String -> Cmd msg
```

AI must understand ports to integrate with JS ecosystem.

**Smaller Ecosystem**: Fewer libraries than React/Vue. AI has less training data on Elm-specific patterns.

**Custom Types Everywhere**: Requires understanding algebraic data types:

```elm
type RemoteData
  = NotAsked
  | Loading
  | Failure String
  | Success Data
```

More abstract than simple objects/arrays.

### Why 9/10?

Elm scores **very high** for:
- **Explicit data flow** (Model-Update-View)
- **No runtime exceptions** (compiler guarantees)
- **Pure functions** (no side effects)
- **Immutability** (enforced by language)
- **Exhaustive pattern matching** (can't forget cases)
- **No null** (Maybe type)
- **Simple architecture** (one pattern for all apps)
- **Helpful compiler** (guides to fixes)

Loses only 1 point for:
- Different language from JavaScript (less training data)
- Functional paradigm (higher conceptual overhead)
- JSON decoder boilerplate
- Smaller ecosystem

**Key Insight**: Elm demonstrates that **strong type systems** are extremely AI-friendly. The compiler catches errors before runtime, guides developers to solutions, and enforces best practices. AI-generated Elm code that compiles is **guaranteed to work**.

The Elm Architecture's explicitness is ideal for AI: every state transition is represented as a message, every state change goes through a pure `update` function. No hidden mutations, no implicit side effects, no magic.

**Immutability enforced by the language** eliminates entire classes of bugs. AI doesn't need to reason about whether a function mutates its arguments—it can't in Elm.

**No null/undefined** via the `Maybe` type is brilliant. AI must explicitly handle both `Just value` and `Nothing` cases. The compiler won't let AI forget.

The tradeoff is **learning a different language**. AI trained primarily on JavaScript must adapt to Elm's functional syntax and paradigm. But once learned, Elm's constraints **guide AI toward correct code**.

Elm's philosophy—"if it compiles, it works"—is the ultimate goal for AI-assisted development. The compiler acts as a powerful collaborator, catching mistakes and suggesting fixes.

---

Sources:
- [Elm Language Official Site](https://elm-lang.org/)
- [Elm Guide](https://guide.elm-lang.org/)
- [Elm Architecture Introduction](https://guide.elm-lang.org/)
- [Why Elm in 2025](https://cekrem.github.io/posts/why-i-hope-i-get-to-write-a-lot-of-elm-code-in-2025/)
- [Elm Wikipedia](https://en.wikipedia.org/wiki/Elm_(programming_language))
