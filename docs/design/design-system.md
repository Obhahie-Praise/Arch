# Arch — Design System

## Purpose

The Arch design system exists to keep the interface visually and behaviorally consistent.

It should remain small.

Do not create tokens or components simply for the sake of having a design system.

---

## Foundations

### Color

The initial visual palette consists of:

- near-black
- off-white
- soft gray
- muted green

Exact values should be established in the implementation and refined as the product develops.

Do not introduce additional colors without a clear UI purpose.

### Typography

Use a restrained typographic hierarchy.

Typography should distinguish:

- page titles
- section titles
- body content
- supporting information
- metadata
- labels

Avoid excessive font sizes or weights.

### Radius

Use a consistent rounded visual language across interactive and content surfaces.

### Spacing

Spacing should follow a consistent scale.

Prefer whitespace and grouping over unnecessary borders and containers.

---

## Components

Common UI components should be reusable when the same interaction or visual pattern appears in multiple places.

Likely foundational components include:

- Button
- Input
- Select
- Checkbox
- Badge
- Card
- Dialog
- Dropdown
- Navigation
- Tabs
- Toast
- Skeleton/loading state

The actual component set should emerge from the product rather than being created in advance.

---

## States

Interactive components should account for relevant states.

Examples:

```text
default
hover
focus
active
disabled
loading
success
error
```

Only implement states that are meaningful for the component.

---

## Motion

Motion should use a small number of consistent transition patterns.

Preferred motion characteristics:

- short
- smooth
- subtle
- predictable

Use motion to communicate:

- appearance
- disappearance
- state change
- hierarchy
- continuity

Avoid decorative motion.

---

## Cards

Cards should be used when they improve grouping or scanning.

Do not place every piece of content inside a card.

Opportunity cards should prioritize:

- title
- organization
- opportunity type
- location
- deadline
- useful match information
- primary action

The full opportunity should remain on the detail page.

---

## Navigation

Desktop uses a top navigation bar.

Structure:

```text
Logo              Primary navigation              Profile
```

Primary destinations:

- Home
- Opportunities
- Saved
- Applications

The navigation should remain visually lightweight.

---

## Design System Evolution

The design system is allowed to evolve.

However, changes should be intentional and reflected in the existing implementation.

Do not introduce a second visual language to solve a local UI problem.

Before creating a new pattern, determine whether an existing pattern can be extended.

The goal is not maximum component count.

The goal is a consistent interface with the smallest useful system.