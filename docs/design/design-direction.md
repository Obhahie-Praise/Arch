# Arch — Design Direction

## Design Goal

Arch should feel like a serious, modern product that gets out of the user's way.

The interface should communicate:

- clarity
- trust
- intelligence
- calm
- usefulness
- precision

It should not look like an "AI product" simply because AI exists underneath it.

## Visual Direction

The visual language is intentionally restrained.

Primary characteristics:

- near-black
- off-white
- restrained gray
- muted green accent
- rounded corners
- clean typography
- generous spacing
- subtle borders
- minimal visual noise

The interface should feel closer to a carefully designed consumer product than an enterprise dashboard.

## Color

Color should be used with restraint.

The primary palette is:

- near-black for strong contrast and primary dark surfaces
- off-white for light surfaces
- soft gray for secondary surfaces and borders
- muted green for actions, status, emphasis, and selected states

Green is an accent, not the identity of every component.

Do not turn the interface into a green-themed UI.

## Surfaces

Use simple surfaces and clear hierarchy.

Avoid excessive:

- cards inside cards
- borders around everything
- shadows
- gradients
- glass effects
- decorative backgrounds

A surface should exist because it improves grouping or comprehension.

## Typography

Typography should provide hierarchy without requiring excessive styling.

Prefer:

- strong but restrained headings
- readable body text
- clear secondary text
- consistent sizing
- comfortable line height

Avoid using large typography purely for visual drama.

## Shape

Rounded corners are part of the visual language.

Use them consistently across:

- buttons
- inputs
- cards
- menus
- dialogs
- navigation elements

Do not make every element excessively rounded.

## Layout

Layouts should feel spacious without wasting space.

Prioritize:

1. content hierarchy
2. readability
3. whitespace
4. alignment
5. interaction

Do not add sections merely because a page looks empty.

---

## Animation

Animation should make the interface feel responsive and polished without becoming noticeable as a feature.

The principle is:

> **The interface is responding to you, not performing for you.**

Prefer:

- opacity transitions
- subtle translation
- small scale changes
- smooth expansion/collapse
- gentle state transitions
- natural page transitions

Animations should generally feel quick and smooth.

Avoid:

- bouncing
- exaggerated spring effects
- dramatic zooms
- unnecessary parallax
- constant motion
- flashy entrance animations
- animation on every element

Animation should communicate a state change or improve continuity.

---

## Interaction Feel

Interactions should feel:

- immediate
- soft
- predictable
- deliberate

Avoid abrupt visual changes where a small transition would improve continuity.

Avoid making interactions slower simply to make them feel animated.

The interface should feel **silky**, not theatrical.

---

## Responsive Design

Desktop is designed around the top navigation model.

Mobile should adapt the information architecture rather than simply shrinking the desktop layout.

The interface should remain:

- usable
- readable
- touch-friendly
- uncluttered

The mobile navigation pattern may differ from desktop when necessary.

---

## Design Ownership

The primary UI implementation is intentionally owner-driven.

The design system documents the language and constraints of Arch.

It does not replace thoughtful screen-by-screen design.

When modifying or creating UI, an agent must first inspect the existing application and understand its current visual language before implementing anything.

It must extend the existing system rather than inventing a competing one.