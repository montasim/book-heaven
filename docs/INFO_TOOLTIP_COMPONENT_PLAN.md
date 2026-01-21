# Reusable Info Tooltip Component - Implementation Plan

## Problem Summary

The codebase has repetitive tooltip code across multiple files. The pattern `TooltipProvider > Tooltip > TooltipTrigger + TooltipContent` is repeated with the same `Info` icon and styling.

### Current Duplication Pattern

**Files with duplication:**
1. `src/app/dashboard/books/components/books-mutate-drawer.tsx` (2 instances)
2. `src/app/dashboard/book-requests/components/book-requests-approve-drawer.tsx`
3. `src/app/(user)/library/upload-books-mutate-drawer.tsx`
4. `src/app/(user)/library/bookshelf-mutate-drawer.tsx`

**Repeated Code Pattern:**
```tsx
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Info className='h-4 w-4 text-muted-foreground cursor-help' />
    </TooltipTrigger>
    <TooltipContent>
      <p>Tooltip text here</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

---

## Solution: Create `InfoTooltip` Component

A reusable component that encapsulates the common tooltip pattern with an info icon.

### Component Specification

**File:** `src/components/ui/info-tooltip.tsx`

#### Component Interface

```tsx
interface InfoTooltipProps {
  content: string | React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'start' | 'center' | 'end'
  className?: string
  iconClassName?: string
}
```

#### Features
- Default Info icon (Lucide `Info` icon)
- Configurable tooltip content (string or JSX)
- Configurable position (side/align)
- Optional custom styling
- No need to wrap individual tooltips with TooltipProvider

---

## Implementation Plan

### Step 1: Create `InfoTooltip` Component

**File:** `src/components/ui/info-tooltip.tsx`

```tsx
'use client'

import * as React from 'react'
import { Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface InfoTooltipProps {
  content: string | React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'start' | 'center' | 'end'
  className?: string
  iconClassName?: string
}

export function InfoTooltip({
  content,
  side = 'top',
  align = 'center',
  className,
  iconClassName,
}: InfoTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className={cn('h-4 w-4 text-muted-foreground cursor-help', iconClassName)} />
        </TooltipTrigger>
        <TooltipContent side={side} align={align} className={cn('max-w-xs', className)}>
          {typeof content === 'string' ? <p>{content}</p> : content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
```

### Step 2: Replace Usages in Files

#### File 1: `books-mutate-drawer.tsx`

**Before:**
```tsx
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Info className='h-4 w-4 text-muted-foreground cursor-help' />
    </TooltipTrigger>
    <TooltipContent>
      <p>Enabling this book will make the book publicly visible.</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

**After:**
```tsx
<InfoTooltip content="Enabling this book will make the book publicly visible." />
```

**Full replacement for both fields:**
```tsx
<FormField
  control={form.control}
  name='isPublic'
  render={({ field }) => (
    <FormItem className='flex flex-row items-center justify-between space-y-0'>
      <div className='flex items-center gap-2'>
        <FormLabel className='flex items-center gap-2'>
          Make Public
        </FormLabel>
        <InfoTooltip content="Enabling this book will make the book publicly visible." />
      </div>
      <FormControl>
        <Switch checked={field.value} onCheckedChange={field.onChange} />
      </FormControl>
    </FormItem>
  )}
/>

<FormField
  control={form.control}
  name='requiresPremium'
  render={({ field }) => (
    <FormItem className='flex flex-row items-center justify-between space-y-0'>
      <div className='flex items-center gap-2'>
        <FormLabel className='flex items-center gap-2'>
          Requires Premium
        </FormLabel>
        <InfoTooltip content="Enabling this will require users to have premium access to view this book." />
      </div>
      <FormControl>
        <Switch checked={field.value} onCheckedChange={field.onChange} />
      </FormControl>
    </FormItem>
  )}
/>
```

#### File 2: `book-requests-approve-drawer.tsx`
- Replace similar tooltip patterns

#### File 3: `upload-books-mutate-drawer.tsx`
- Replace similar tooltip patterns

#### File 4: `bookshelf-mutate-drawer.tsx`
- Replace similar tooltip patterns

---

## Optional Enhancements

### Enhancement 1: Wrap Form Labels with Tooltip

For even cleaner code, create a `LabelWithTooltip` component:

```tsx
interface LabelWithTooltipProps {
  label: string
  tooltip: string
  className?: string
}

export function LabelWithTooltip({ label, tooltip, className }: LabelWithTooltipProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <FormLabel>{label}</FormLabel>
      <InfoTooltip content={tooltip} />
    </div>
  )
}
```

**Usage:**
```tsx
<LabelWithTooltip
  label="Make Public"
  tooltip="Enabling this book will make the book publicly visible."
/>
```

### Enhancement 2: Global Tooltip Provider

Instead of wrapping each tooltip with `TooltipProvider`, wrap the entire app once:

**File:** `src/app/layout.tsx` or `src/components/providers.tsx`

```tsx
import { TooltipProvider as UiTooltipProvider } from '@/components/ui/tooltip'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UiTooltipProvider>
      {children}
    </UiTooltipProvider>
  )
}
```

Then update `InfoTooltip` to not include its own provider.

---

## Benefits

| Before | After |
|--------|-------|
| 9 lines of code per tooltip | 1 line of code |
| Multiple imports needed | Single import |
| Inconsistent styling | Consistent styling |
| Hard to maintain | Easy to update |
| No type safety | Full TypeScript support |

---

## Files to Modify/Create

| File | Action |
|------|--------|
| `src/components/ui/info-tooltip.tsx` | **CREATE** - New reusable component |
| `src/app/dashboard/books/components/books-mutate-drawer.tsx` | **MODIFY** - Replace 2 tooltips |
| `src/app/dashboard/book-requests/components/book-requests-approve-drawer.tsx` | **MODIFY** - Replace tooltips |
| `src/app/(user)/library/upload-books-mutate-drawer.tsx` | **MODIFY** - Replace tooltips |
| `src/app/(user)/library/bookshelf-mutate-drawer.tsx` | **MODIFY** - Replace tooltips |

---

## Testing Checklist

- [ ] Tooltip appears on hover
- [ ] Tooltip positioning works correctly (top, bottom, left, right)
- [ ] Tooltip text wraps properly for long content
- [ ] Tooltips work in all forms (books, book requests, etc.)
- [ ] No console errors
- [ ] Keyboard accessibility (tab navigation)
- [ ] Mobile touch support

---

## Migration Strategy

1. **Create** the new `InfoTooltip` component
2. **Test** in isolation with a simple example
3. **Replace** usages one file at a time
4. **Test** each file after replacement
5. **Remove** unused imports (TooltipProvider, Tooltip, TooltipTrigger, TooltipContent)

---

## Code Quality Improvements

- **DRY Principle**: Single source of truth for tooltip styling
- **Type Safety**: Props interface prevents incorrect usage
- **Maintainability**: Change tooltip style in one place
- **Consistency**: All tooltips look and behave the same
- **Readability**: Less boilerplate, more focus on content
