# Building Components

Guide for building modern, accessible, and composable UI components. Use when building new components, implementing accessibility, creating composable APIs, setting up design tokens, publishing to npm/registry, or writing component documentation.

## When to use this skill

Use when the user is:

- Building new UI components (primitives, components, blocks, templates)
- Implementing accessibility features (ARIA, keyboard navigation, focus management)
- Creating composable component APIs (slots, render props, controlled/uncontrolled state)
- Setting up design tokens and theming systems
- Publishing components to npm or a registry
- Writing component documentation
- Implementing polymorphism or as-child patterns
- Working with data attributes for styling/state

---

## Definitions

### Artifact Taxonomy

**Primitive**: The lowest-level building block that provides behavior and accessibility without any styling (headless). Examples: Radix UI Primitives, React Aria, Base UI, Headless UI. Ships with exhaustive a11y behavior for its role.

**Component**: A styled, reusable UI unit that adds visual design to primitives or composes multiple elements. Examples: shadcn/ui, Material UI, Ant Design. Clear props API; supports controlled and uncontrolled usage. Composable via children/slots, render props, or compound subcomponents.

**Pattern**: A specific composition of primitives or components to solve a UI/UX problem (form validation with inline errors, typeahead search, optimistic UI). Describes behavior, a11y, keyboard map, and failure modes.

**Block**: An opinionated, production-ready composition of components for a concrete use case (pricing table, auth screens, onboarding stepper). Strong defaults, copy-paste friendly, easily branded/themed.

**Page**: A complete, single-route view composed of multiple blocks for a specific user-facing purpose (landing page, dashboard, product detail page).

**Template**: A multi-page collection or full-site scaffold bundling pages, routing, shared layouts, global providers, and project structure. Fork and customize rather than import as dependency.

**Utility (Non-visual)**: A helper for developer ergonomics or composition; not rendered UI (hooks, class utilities, keybinding helpers, focus scopes).

### API and Composition Vocabulary

- **Props API**: Public configuration surface. Stable, typed, documented with defaults.
- **Children / Slots**: Placeholders for caller-provided content. Named slots via props or subcomponents.
- **Render Prop**: Function child delegating rendering while parent supplies state/data.
- **Controlled vs. Uncontrolled**: Controlled = value driven by props + onChange. Uncontrolled = internal state + defaultValue.
- **Provider / Context**: Top-level component supplying shared state to a subtree.
- **Portal**: Rendering UI outside DOM hierarchy for layering while preserving a11y.

### Classification Heuristic

1. Single behavior/a11y concern, no styling → Primitive
2. Styled, reusable UI element → Component
3. Concrete product use case, opinionated composition → Block
4. Scaffolds page/flow with routing/providers → Template
5. Documentation of recurring solution → Pattern
6. Non-visual logic → Utility

---

## Core Principles

1. **Composability and Reusability**: Favor composition over inheritance. Expose clear APIs via props/slots for combining components.
2. **Accessible by Default**: Use semantic HTML, augment with WAI-ARIA. Ensure keyboard navigation and focus management. Accessibility is a baseline, not optional.
3. **Customizability and Theming**: Avoid hard-coded styles. Provide CSS variables, class names, or style props. Components should fit any brand without fighting defaults.
4. **Lightweight and Performant**: Minimize dependencies and re-renders. Consider virtualization for data-intensive components but keep optional.
5. **Transparency and Code Ownership**: Components should not be black boxes. Provide readable code and thorough documentation.
6. **Well-documented and DX-Friendly**: Document purpose, props, usage examples, accessibility notes, and customization options.

---

## Composition

Break monolithic components into smaller, focused subcomponents using the compound component pattern.

### Making a component composable

Instead of one component handling rendering, state, and data, split into:
1. **Root Component** - Container managing shared state via Context
2. **Item Component** - Wrapper for each item
3. **Trigger Component** - Interactive element toggling state
4. **Content Component** - Content shown/hidden based on state

Each sub-component extends native HTML attributes for maximum customization.

### Naming Conventions

- `Root` - Main container wrapping all sub-components, manages shared state/context
- `Trigger` - Initiates an action (opening, closing, toggling)
- `Content` - Contains main content being shown/hidden
- `Header` / `Body` / `Footer` - Structured content areas
- `Title` / `Description` - Informational components

---

## Accessibility

### Core Principles

1. **Semantic HTML First**: Always start with the most appropriate HTML element.
2. **Keyboard Navigation**: Every interactive element must be keyboard accessible (ArrowDown/Up, Home/End, Escape, Tab).
3. **Screen Reader Support**: Use ARIA attributes for proper announcements.
4. **Visual Accessibility**: Visible focus indicators, sufficient contrast (4.5:1 normal, 3:1 large text), responsive text sizing.

### ARIA Rules

1. Don't use ARIA if you can use semantic HTML
2. Don't change native semantics unless necessary
3. All interactive elements must be keyboard accessible
4. Don't hide focusable elements from assistive technologies
5. All interactive elements must have accessible names

### Focus Management

- `:focus-visible` for keyboard-only focus indicators
- Focus trapping in modals/dialogs
- Focus restoration after interactions close

### Live Regions

- `aria-live="polite"` for status messages (waits for screen reader)
- `aria-live="assertive"` / `role="alert"` for errors (interrupts)
- `aria-busy` for loading states

### Mobile

- Minimum 44x44px touch targets
- Never prevent zooming with `maximum-scale=1, user-scalable=no`

### Common Pitfalls

- Don't use placeholder as the only label
- Always provide accessible text for icon buttons (`aria-label` or visually hidden text)
- Prefer `aria-disabled` over `disabled` attribute (explain why it's disabled)

---

## Types

### Single Element Wrapping

Each exported component should wrap a single HTML/JSX element. This enables maximum customization, no prop drilling, semantic HTML, and better a11y.

### Extending HTML Attributes

Every component should extend native HTML attributes:

```tsx
export type CardRootProps = React.ComponentProps<"div"> & {
  variant?: "default" | "outlined";
};
```

### Best Practices

1. Always spread props last so users can override defaults
2. Avoid prop name conflicts with HTML attributes
3. Export all component prop types as `<ComponentName>Props`
4. Add JSDoc comments to custom props

---

## State

### Uncontrolled State

Component manages its own state internally. Default usage pattern.

### Controlled State

Parent component manages the state via props.

### Merging Both

Use `useControllableState` from `@radix-ui/react-use-controllable-state` to support both modes:

```tsx
const [value, setValue] = useControllableState({
  prop: controlledValue,
  defaultProp: defaultValue,
  onChange: onValueChange,
});
```

---

## Data Attributes

### data-state for Visual States

Expose component state declaratively instead of multiple className props:

```tsx
<div data-state={isOpen ? "open" : "closed"} />
```

Style with Tailwind: `data-[state=open]:opacity-100 data-[state=closed]:opacity-0`

### data-slot for Component Identification

Stable identifiers for targeting child components without fragile class names:

```tsx
<div data-slot="card-header" />
```

Target with: `[&_[data-slot=card-header]]:mb-4` or `has-[>[data-slot=checkbox-group]]:gap-3`

### Naming Conventions

- Use kebab-case: `data-slot="form-field"`
- Be specific: `data-slot="submit-button"` not `data-slot="button"`
- Match component purpose, not structure

---

## Styling

### The `cn` utility

Combines `clsx` (conditional logic) and `tailwind-merge` (intelligent conflict resolution):

```tsx
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Class Order

1. Base styles (always applied)
2. Variant styles (based on props)
3. Conditional styles (based on state)
4. User overrides (className prop)

### Class Variance Authority (CVA)

For components with many variants, use CVA for declarative variant definitions. Define variants outside components to avoid recreation on every render.

---

## Design Tokens

Use semantic CSS variables to separate what something is from how it looks:

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
}
```

Map to Tailwind with `@theme inline`.

---

## asChild Pattern

Replaces default markup with custom elements while preserving component functionality:

```tsx
<Dialog.Trigger asChild>
  <button>Open Dialog</button>
</Dialog.Trigger>
```

Benefits: semantic HTML, clean DOM structure, design system integration, component composition.

Rules:
- Always spread props in child components
- Single child element only (no fragments, no multiple children)
- Maintain accessibility when changing element types

---

## Polymorphism (as prop)

Change the underlying HTML element while preserving styling and behavior:

```tsx
<Button as="a" href="/home">Go Home</Button>
```

**Use `as` when**: simpler API, switching between HTML elements, avoiding dependencies.
**Use `asChild` + Slot when**: composing with other components, need automatic prop merging, building libraries like Radix/shadcn.

---

## Registry Distribution

Component registries distribute source code (not compiled packages). Users copy source into their projects via CLI:

```bash
npx shadcn@latest add <component-url>
```

Core elements: components with source code, a public JSON endpoint, and a CLI for installation.

---

## NPM Distribution

Traditional versioned package distribution:

```bash
npm install @acme/ui-components
```

For Tailwind-based packages, users need `@source` directive:

```css
@source "../node_modules/@acme/ui-components";
```

---

## Documentation

Essential sections for component docs:

1. **Overview** - Brief introduction
2. **Demo/Preview** - Component in action with source code
3. **Installation** - Single copy-paste command
4. **Features** - Key capabilities list
5. **Examples** - Variants, states, advanced usage, composition, responsive behavior
6. **Props/API Reference** - Name, type, default, required, description for each prop
7. **Accessibility** - Keyboard navigation, ARIA, focus management, contrast
8. **Changelog** - Semantic versioning, migration guides for breaking changes
