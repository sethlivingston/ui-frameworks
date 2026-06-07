# StrictTS Language Design

A TypeScript-like language that compiles to JavaScript with Elm-like guarantees.

> **Goal**: Remove entire classes of runtime errors by eliminating null, undefined, and escape hatches at the language level.

> **2026 viability check (added 2026-06-07):** Research into frontier model capabilities (see the "Frontier LLM Capabilities Reshape the Calculus" section of [NEXT-GEN-FRAMEWORK.md](./NEXT-GEN-FRAMEWORK.md)) suggests the novelty penalty for an invented language has shrunk from an estimated 50%+ accuracy gap to roughly 10-20%, given a clear spec and a handful of examples — and adaptive-thinking models can reason through *why* a construct like exhaustive `match` exists, not just pattern-match its syntax. StrictTS-as-a-new-language remains defensible. That said, a TypeScript **subset/extension** (teaching a model a variant of something it already knows deeply) is still the lower-risk path versus a from-scratch grammar — keep that trade-off explicit when resolving the syntax-choice open questions below.

---

## Core Principles

1. **No null, no undefined** - Use `Option<T>` instead
2. **No escape hatches** - No `!`, no `as`, no `any`
3. **Exhaustive pattern matching** - Compiler enforces all cases handled
4. **If it compiles, it works** - Inspired by Elm's promise
5. **Familiar syntax** - TypeScript developers feel at home
6. **Clean JS output** - Readable, debuggable JavaScript

---

## What We Remove from TypeScript

| Removed | Reason | Replacement |
|---------|--------|-------------|
| `null` | Billion-dollar mistake | `Option<T>` |
| `undefined` | Same problem, different name | `Option<T>` |
| `any` | Defeats type system | Remove or explicit `unsafe` block |
| `unknown` | Too permissive | Pattern matching |
| `!` (non-null assertion) | Escape hatch | Pattern matching |
| `as` (type assertion) | Escape hatch | Pattern matching |
| `?.` (optional chaining) | Silent failure propagation | Explicit Option handling |
| `??` (nullish coalescing) | Band-aid for null | `Option.getOrElse()` |

---

## Core Types

### Option<T>

Represents a value that may or may not exist.

```
type Option<T> = Some(T) | None

// Construction
let user: Option<User> = Some(user)
let missing: Option<User> = None

// Pattern matching (required)
match maybeUser {
  Some(user) => user.name,
  None => "Guest"
}
```

### Result<T, E>

Represents success or failure with error information.

```
type Result<T, E> = Ok(T) | Err(E)

// Construction
let success: Result<User, string> = Ok(user)
let failure: Result<User, string> = Err("User not found")

// Pattern matching (required)
match fetchUser(id) {
  Ok(user) => renderUser(user),
  Err(error) => renderError(error)
}
```

---

## Syntax Examples

### Variable Declarations

```
// Immutable by default
let name = "Alice"
name = "Bob"  // Error: cannot reassign immutable binding

// Explicit mutability
let mut counter = 0
counter = counter + 1  // OK
```

### Functions

```
// Return type inference
function add(a: number, b: number) {
  return a + b  // Inferred: number
}

// Explicit return type
function getUser(id: string): Option<User> {
  // ...
}

// Arrow functions
let double = (x: number) => x * 2
```

### Pattern Matching

```
// Match expression (returns a value)
let message = match status {
  "loading" => "Please wait...",
  "success" => "Done!",
  "error" => "Something went wrong"
}

// Match with destructuring
match user {
  Some({ name, age }) => `${name} is ${age}`,
  None => "Unknown user"
}

// Match with guards
match age {
  n if n < 0 => Err("Invalid age"),
  n if n < 18 => Ok("Minor"),
  n => Ok("Adult")
}
```

### Records (Structs)

```
// Record type
type User = {
  id: string,
  name: string,
  email: Option<string>
}

// Construction
let user: User = {
  id: "123",
  name: "Alice",
  email: None
}

// Update syntax (immutable - creates new record)
let updated = { ...user, name: "Alicia" }
```

### Enums (Tagged Unions)

```
// Simple enum
type Status = Loading | Success | Error

// Enum with data
type Message =
  | Text(string)
  | Image(url: string, alt: string)
  | File(name: string, size: number)

// Pattern matching
match message {
  Text(content) => renderText(content),
  Image(url, alt) => renderImage(url, alt),
  File(name, size) => renderFile(name, size)
}
```

---

## Exhaustiveness Checking

The compiler enforces that all cases are handled:

```
type Color = Red | Green | Blue

function toHex(color: Color): string {
  match color {
    Red => "#ff0000",
    Green => "#00ff00"
  }
}
// Error: Non-exhaustive match. Missing case: Blue
```

Adding a new variant to an enum causes compile errors everywhere it's used:

```
// Before: type Status = Loading | Success | Error
// After:  type Status = Loading | Success | Error | Cancelled

// Every `match status` in codebase now errors until Cancelled is handled
```

This is a feature, not a bug. AI can find and fix all locations.

---

## Option<T> Methods

```
// map: Transform the inner value if present
let userName: Option<string> = maybeUser.map(u => u.name)

// flatMap: Chain Option-returning functions
let userEmail: Option<string> = maybeUser.flatMap(u => u.email)

// getOrElse: Extract with default
let name: string = maybeUser.map(u => u.name).getOrElse("Guest")

// match: Pattern match inline
maybeUser.match({
  Some: user => greet(user),
  None: () => greet("Guest")
})
```

---

## Result<T, E> Methods

```
// map: Transform success value
let userId: Result<string, Error> = userResult.map(u => u.id)

// mapErr: Transform error value
let formatted: Result<User, string> = userResult.mapErr(e => e.message)

// flatMap: Chain Result-returning functions
let profile: Result<Profile, Error> = userResult.flatMap(u => fetchProfile(u.id))

// getOrElse: Extract with default on error
let user: User = userResult.getOrElse(defaultUser)

// unwrapOrThrow: Convert to exception (explicit, auditable)
let user: User = userResult.unwrapOrThrow()  // Throws if Err
```

---

## Interop with JavaScript

### Importing from JavaScript/TypeScript

External JavaScript returns nullable values. We wrap them at the boundary:

```
// Option A: Explicit wrapping
import { legacyGetUser } from "./legacy.js"

function getUser(id: string): Option<User> {
  return Option.fromNullable(legacyGetUser(id))
}

// Option B: Declaration file (.d.sts)
// legacy.d.sts
declare function legacyGetUser(id: string): Option<User>
```

### Exporting to JavaScript

StrictTS compiles to clean JavaScript that external code can call:

```
// StrictTS source
export function getUser(id: string): Option<User> {
  // ...
  return Some(user)
}

// Compiled JS output
export function getUser(id) {
  // ...
  return { _tag: "Some", value: user }
}

// JavaScript consumer
const result = getUser("123")
if (result._tag === "Some") {
  console.log(result.value.name)
}
```

### Unsafe Blocks (Escape Hatch for Experts)

For rare cases where you need to interact with unsafe JS:

```
// Explicit, auditable, greppable
let user: User = unsafe {
  legacyGetUser(id)!  // Non-null assertion allowed here
}

// Linter can warn on unsafe blocks
// Code review can search for "unsafe {"
```

---

## Compilation Output

### Option<T>

```
// StrictTS
let user: Option<User> = Some({ name: "Alice" })

// JavaScript output
let user = { _tag: "Some", value: { name: "Alice" } }
```

```
// StrictTS
let missing: Option<User> = None

// JavaScript output
let missing = { _tag: "None" }
```

### Pattern Matching

```
// StrictTS
let greeting = match maybeUser {
  Some(user) => `Hello, ${user.name}`,
  None => "Hello, guest"
}

// JavaScript output
let greeting
if (maybeUser._tag === "Some") {
  let user = maybeUser.value
  greeting = `Hello, ${user.name}`
} else {
  greeting = "Hello, guest"
}
```

### Result<T, E>

```
// StrictTS
match fetchUser(id) {
  Ok(user) => renderUser(user),
  Err(error) => renderError(error)
}

// JavaScript output
let _result = fetchUser(id)
if (_result._tag === "Ok") {
  renderUser(_result.value)
} else {
  renderError(_result.error)
}
```

---

## Error Messages

Error messages should be AI-readable and actionable:

```
Error: Non-exhaustive pattern match
  --> src/app.sts:42:3
   |
42 |   match status {
43 |     Loading => showSpinner(),
44 |     Success => showContent()
   |   }
   |
   = Missing case: Error
   = Add this case to fix:
   |     Error => /* handle error */
```

```
Error: Cannot use 'null' - use Option<T> instead
  --> src/app.sts:15:12
   |
15 |   let x = null
   |           ^^^^
   |
   = 'null' does not exist in StrictTS
   = Use 'None' for absent values:
   |   let x: Option<User> = None
```

---

## Open Questions

### Syntax Choices

- [ ] `match` keyword vs enhanced `switch`?
- [ ] `let mut` vs `var` vs `let mutable`?
- [ ] `Some(x)` vs `Some x` vs `some(x)`?
- [ ] Semicolons required, optional, or forbidden?
- [ ] Curly braces for single-expression functions?

### Type System

- [ ] Structural typing (like TS) or nominal (like Rust)?
- [ ] Generics syntax: `Option<T>` or `Option[T]` or `Option T`?
- [ ] How to handle arrays? `Array<T>` with safe indexing?
- [ ] Tuple types? `(string, number)`?

### Async

- [ ] How do `async/await` interact with Result?
- [ ] Should async functions return `Result<T, E>` automatically?
- [ ] How to handle Promise rejection?

```
// Option A: Async returns Result automatically
async function fetchUser(id: string): Result<User, FetchError> {
  let response = await fetch(url)  // Can fail
  return response.json()           // Can fail
}

// Option B: Explicit error handling
async function fetchUser(id: string): Result<User, FetchError> {
  let response = await fetch(url).toResult()
  match response {
    Ok(res) => res.json().toResult(),
    Err(e) => Err(FetchError.network(e))
  }
}
```

### Tooling

- [ ] File extension: `.sts`, `.strict.ts`, `.stts`?
- [ ] LSP for IDE support?
- [ ] Source maps for debugging?
- [ ] REPL for experimentation?

---

## Implementation Roadmap

### Phase 1: Proof of Concept
- [ ] Define grammar for subset of language
- [ ] Build parser (hand-written or PEG)
- [ ] Implement Option<T> and Result<T, E>
- [ ] Basic pattern matching
- [ ] Compile to JavaScript

### Phase 2: Type System
- [ ] Type inference
- [ ] Exhaustiveness checking
- [ ] Generic types
- [ ] Error messages

### Phase 3: Tooling
- [ ] VS Code extension (syntax highlighting)
- [ ] LSP server (autocomplete, errors)
- [ ] Source maps
- [ ] npm package for runtime helpers

### Phase 4: Ecosystem
- [ ] Standard library
- [ ] Package manager integration
- [ ] Declaration files for popular npm packages
- [ ] Documentation

---

## Prior Art

| Language | Relationship |
|----------|--------------|
| **Elm** | Inspiration for Option/Result, exhaustiveness, "if it compiles it works" |
| **Rust** | Option/Result naming, match syntax, `mut` keyword |
| **TypeScript** | Syntax familiarity, JS interop model |
| **ReScript** | Compiles to JS, ML-inspired, prior art for this space |
| **Gleam** | Modern ML-like language compiling to JS/Erlang |

---

## Why Not Just Use...

| Alternative | Why StrictTS Instead |
|-------------|---------------------|
| **Elm** | Elm is a new language with different syntax. StrictTS feels like TypeScript. |
| **ReScript** | OCaml syntax is unfamiliar. We want TS developers to feel at home. |
| **TypeScript strict mode** | Still has escape hatches (`!`, `as`, `any`). Not strict enough. |
| **fp-ts** | Library, not language. No compiler enforcement. Easy to bypass. |

---

*This is a living document. Language design is iterative.*
