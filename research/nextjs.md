---
name: Next.js
category: Meta-Framework
type: React Framework
docs_url: https://nextjs.org
github_url: https://github.com/vercel/next.js
mcp_servers: null
implementation_language: TypeScript
reviewed_with_model: claude-sonnet-4-5-20250929
ai_friendliness_score: 7
---

# Next.js

## Philosophy & Mental Model

Next.js is **"The React Framework"**—a full-stack framework that extends React with server-side rendering, routing, data fetching, and build optimizations. It transforms React from a UI library into a complete application framework.

**Mental model**: React handles UI components. Next.js handles everything else: routing (file-system based), data fetching (server/client), rendering strategies (SSR/SSG/ISR), API routes, and deployment optimization.

**Core principles:**
1. **Convention over Configuration** - File structure defines routes
2. **Server-First** - Server Components default (App Router)
3. **Hybrid Rendering** - Mix SSR, SSG, ISR, client rendering per-route
4. **Zero-Config** - Works out of the box, configure only when needed
5. **Production-Ready** - Built-in optimizations for images, fonts, scripts

Next.js is for building production React apps with SEO, performance, and full-stack capabilities.

## State Management

Next.js doesn't provide state management—use React state (useState, useContext) or libraries (Zustand, Redux, Jotai). The framework focuses on rendering strategies and data fetching patterns.

**Server state** vs **Client state**:

```typescript
// Server Component (default in App Router)
async function UserProfile() {
  const user = await fetch('/api/user').then(r => r.json()); // Server-side
  return <div>{user.name}</div>;
}

// Client Component
'use client';
function Counter() {
  const [count, setCount] = useState(0); // Client-side state
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

Server Components fetch data on the server. Client Components use React hooks.

## Rendering

### App Router (Modern)

**File-system routing**:

```
app/
  page.tsx          → /
  about/page.tsx    → /about
  blog/[slug]/page.tsx → /blog/:slug
```

**Server Components** (default):

```typescript
// app/page.tsx - Server Component
export default async function Page() {
  const data = await fetch('https://api.example.com/data');
  return <div>{data}</div>;
}
```

**Client Components** (opt-in):

```typescript
// components/Counter.tsx
'use client';

import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

**Layouts** for shared UI:

```typescript
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <nav>Shared Nav</nav>
        {children}
      </body>
    </html>
  );
}
```

**Streaming with Suspense**:

```typescript
import { Suspense } from 'react';

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <AsyncData />
    </Suspense>
  );
}
```

## Data Fetching

**Server Components** (async/await):

```typescript
async function Posts() {
  const posts = await fetch('https://api.example.com/posts');
  return posts.map(post => <Post key={post.id} {...post} />);
}
```

**Server Actions** (form handling):

```typescript
'use server';

export async function createPost(formData: FormData) {
  const title = formData.get('title');
  await db.posts.create({ title });
}

// Usage
<form action={createPost}>
  <input name="title" />
  <button type="submit">Create</button>
</form>
```

**Client fetching** (SWR, React Query):

```typescript
'use client';
import useSWR from 'swr';

export function ClientData() {
  const { data } = useSWR('/api/data', fetcher);
  return <div>{data}</div>;
}
```

## Event Handling

Standard React event handling in Client Components:

```typescript
'use client';

export function Button() {
  return <button onClick={() => console.log('clicked')}>Click</button>;
}
```

Server Actions for form submissions:

```typescript
<form action={serverAction}>
  <button type="submit">Submit</button>
</form>
```

## Reuse Patterns

**Shared components**:

```typescript
// components/Button.tsx
export function Button({ children, onClick }) {
  return <button onClick={onClick}>{children}</button>;
}
```

**API routes**:

```typescript
// app/api/hello/route.ts
export async function GET() {
  return Response.json({ message: 'Hello' });
}
```

**Middleware**:

```typescript
// middleware.ts
export function middleware(request: Request) {
  // Auth, redirects, etc.
}
```

## Developer Experience

**TypeScript-first**, file-system routing, hot reload, built-in optimizations. Learning curve is moderate—requires understanding React, SSR/SSG concepts, and App Router conventions.

**Tooling**: Vercel deployment (one-click), Turbopack (fast bundler), Next.js DevTools.

### Component Reusability Assessment

**Quality: Good (8/10)**

**Strengths**: All React components reusable. Server and Client Components can be packaged. File-system conventions make structure clear. API routes can be abstracted into libraries. Middleware reusable across projects. TypeScript makes contracts explicit.

**Weaknesses**: Server Components tied to Next.js - not portable to other frameworks. App Router conventions create Next.js-specific patterns. Image, Link, and other Next.js components not usable outside Next. Some optimizations only work in Next.js context.

**Cross-Project Reuse**: Good within Next.js ecosystem. React components portable to other React frameworks. Server Components require Next.js or similar RSC-enabled framework. Routes and layouts are Next.js-specific structure.

**Design System Support**: Excellent for UI components. Tailwind, shadcn/ui, MUI all integrate well. Server/Client Component split requires careful design system architecture.

## Maintainability

**Quality: Good (7.5/10)**

**Strengths**: TypeScript-first ensures type safety. File-system routing makes code location predictable. Built-in optimizations reduce manual tuning. Vercel deployment simplifies infrastructure. React DevTools for component debugging. Fast Refresh for quick iteration.

**Weaknesses**: App Router introduces complexity (Server vs Client Components, async components). Caching behavior can be confusing. Migration from Pages Router to App Router is major undertaking. Framework abstractions can obscure what's happening. Rapid evolution creates breaking changes.

**Code Organization**: File-system routing enforces structure. Colocation of components, styles, tests encouraged. Server/Client split requires thoughtful boundaries.

**Testing**: Can test components in isolation (React Testing Library). E2E testing with Playwright/Cypress. Server Components harder to test - often require integration tests. Route testing requires framework context.

**Debugging**: React DevTools work. Server logs vs client logs can be confusing. Caching issues hard to debug. Network tab shows RSC payloads (opaque format).

**Scalability**: Excellent for large apps. File-system routing scales well. Partial pre-rendering and streaming improve performance. Monorepo support with Turbo. Edge runtime for global distribution.

**Breaking Changes**: Frequent. Pages Router → App Router was massive shift. Vercel pushes latest features aggressively. Ecosystem moves fast - can be hard to keep up.

## AI-Friendly Assessment

**Score: 7/10**

**Strengths**: TypeScript-first, file-system conventions are explicit, React patterns carry over.

**Weaknesses**: Server vs Client Component boundaries complex, RSC payload abstraction, many rendering strategies (SSR/SSG/ISR), framework magic (caching, revalidation).

**Key Insight**: Next.js shows meta-frameworks add complexity for production features (SEO, perf, SSR). The abstractions help humans but add cognitive load for AI understanding execution flow.

---

Sources:
- [Next.js Server Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Next.js Data Fetching](https://nextjs.org/docs/app/getting-started/fetching-data)
- [Next.js Streaming](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming)
