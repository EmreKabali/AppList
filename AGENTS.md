# AGENTS.md - Coding Guidelines

## Quick Commands

### Development
```bash
# Start development server (port 3000)
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run ESLint
npm run lint
```

### Testing

**Note:** No test framework is currently installed. Add Vitest for testing:

```bash
# Install Vitest (recommended for Next.js App Router)
npm install --save-dev vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom

# Recommended package.json scripts to add:
# "test": "vitest",
# "test:run": "vitest run",
# "test:coverage": "vitest run --coverage",

# Run tests in watch mode
npm run test

# Run tests once
npm run test:run

# Run single test file
npm run test -- src/components/Button.test.tsx

# Run tests matching a pattern
npm run test -- -t "Button component"
```

## Code Style Guidelines

### TypeScript
- **Strict mode enabled**: All strict TypeScript options are active
- **Path aliases**: Use `@/` prefix for all imports (mapped to `./*`)
  ```typescript
  // ✅ Good
  import { Button } from "@/components/ui/button";
  import { createClient } from "@/lib/supabase/server";
  
  // ❌ Avoid relative paths like ../../components/
  ```
- Always define explicit return types for public APIs
- Use type inference for local variables when obvious

### Component Patterns

**UI Components** (`/components/ui/`)
```typescript
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "secondary";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", size = "md", className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "base-styles",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
```

**Key patterns:**
- Always use `forwardRef` for components that accept ref
- Always set `displayName` after component definition
- Use the `cn()` utility for className merging (combines clsx + tailwind-merge)
- Support `className` prop to allow style overrides

### Server Components (Data Fetching)

**Direct Supabase Queries:**
```typescript
// app/(public)/page.tsx pattern
import { createClient } from "@/lib/supabase/server";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  
  const { data: apps } = await supabase
    .from("apps")
    .select("*")
    .eq("status", "approved");
    
  return <div>{/* render apps */}</div>;
}
```

**Key patterns:**
- Server Components query Supabase directly (no API routes)
- Always `await createClient()` - it's async
- Handle searchParams as a Promise (Next.js 15+)
- Use early returns for empty states

### Supabase Clients

**Three client types:**
```typescript
// Browser client (Client Components)
import { createClient } from "@/lib/supabase/client";

// Server client (Server Components / Server Actions)
import { createClient } from "@/lib/supabase/server";

// Service role client (Admin operations, bypass RLS)
import { createServiceClient } from "@/lib/supabase/server";
```

### Styling (Tailwind CSS v4)

- **Primary colors**: Indigo for actions, Gray for secondary
- **Custom classes**: Defined in `app/globals.css` with `@theme` syntax
- **Class ordering**: Base → Layout → Spacing → Colors → Typography → Effects → Conditionals
- **Responsive**: Mobile-first (default → sm: → md: → lg:)

### Database Types

**Type definitions** (`/types/database.ts`):
```typescript
import { Database } from "@/types/database";

// Use exported convenience types
import type { App, AppInsert, AppUpdate } from "@/types/database";
```

### Error Handling

- Use explicit error messages in Turkish for user-facing errors
- Log detailed errors server-side, show generic messages client-side
- Use try/catch around Supabase operations that might fail

### ESLint

```bash
# Check all files
npm run lint

# Auto-fix issues
npx next lint --fix
```

Only `next/core-web-vitals` config is active. Add more rules to `.eslintrc.json` as needed.

### File Organization

```
app/              # Next.js App Router
  (admin)/        # Route group: Admin pages
  (public)/       # Route group: Public pages
components/
  ui/             # Reusable UI components (Button, Input, etc.)
lib/
  supabase/       # Supabase clients (client.ts, server.ts)
  utils.ts        # Utility functions (cn, formatDate)
types/
  database.ts     # Generated DB types + convenience exports
```

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

*Generated for Next.js 16 + React 19 + TypeScript 5 + Tailwind CSS v4 + Supabase stack*
