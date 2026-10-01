# Arch — UI Principles

## 1. Understand Before Designing

Before implementing or modifying a UI:

1. Inspect the existing application.
2. Study existing pages and components.
3. Identify established spacing, typography, colors, shapes, and interaction patterns.
4. Reuse existing components where appropriate.
5. Extend existing patterns before creating new ones.

Never implement a UI request from the prompt alone when an existing design system or implementation is available.

The existing application is the primary visual reference.

---

## 2. Minimal Does Not Mean Empty

Minimalism means removing unnecessary elements, not removing useful information.

Every visible element should have a reason to exist.

Ask:

> Does this help the user understand, decide, or act?

If not, consider removing it.

---

## 3. Hierarchy Before Decoration

Visual hierarchy should come from:

- spacing
- typography
- size
- alignment
- contrast
- grouping

Do not rely on decorative effects to establish hierarchy.

---

## 4. One Clear Primary Action

Pages should have an obvious primary action when one exists.

Secondary actions should remain visually secondary.

Do not give every button equal visual importance.

---

## 5. Information Density

Arch can contain substantial information, especially on opportunity detail pages.

The solution is not to remove information.

Instead:

- group related information
- establish hierarchy
- use whitespace
- progressively reveal detail where appropriate
- avoid presenting everything at the same visual weight

---

## 6. Consistency

Existing patterns should be reused.

Before creating a new:

- button
- input
- card
- modal
- navigation element
- status indicator
- transition

check whether an equivalent pattern already exists.

A new component should solve a genuinely different problem.

---

## 7. Animation

Animation should support:

- continuity
- feedback
- state changes
- orientation

Animation should not exist simply because it is possible.

Prefer subtle, smooth transitions over dramatic effects.

Respect reduced-motion preferences.

---

## 8. Feedback

User actions should receive appropriate feedback.

Examples:

- loading
- success
- failure
- disabled states
- saved state
- application state

Feedback should be clear without interrupting the user's flow unnecessarily.

---

## 9. Empty States

An empty state should explain what is happening and what the user can do next.

Do not use empty space as a substitute for an empty-state design.

For example, an incomplete profile should communicate:

- why the profile matters
- what the user should do
- where they should go

---

## 10. Responsive Behavior

Responsive layouts should preserve hierarchy and usability.

Do not simply compress desktop layouts until they fit a mobile screen.

When necessary, change:

- navigation
- layout direction
- content grouping
- interaction patterns

while preserving the same product logic.

---

## 11. Accessibility

UI should support:

- keyboard navigation
- readable contrast
- visible focus states
- semantic HTML
- accessible labels
- reduced motion
- appropriate touch targets

Accessibility is part of the implementation, not a final polish step.

---

## 12. Agent Rule

When an agent is asked to implement UI, it must first study the current application.

It should inspect:

- existing pages
- components
- styling
- tokens
- responsive behavior
- animations
- interaction patterns

It should then implement the requested change using the existing visual language.

**Do not redesign the application while implementing a feature unless redesign is explicitly requested.**