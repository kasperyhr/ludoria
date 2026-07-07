# Design System

Phase 8 introduces premium board game lounge visual design.

## Visual Style

- **Theme**: warm dark, board game lounge atmosphere
- **Accent**: soft amber (#e0ad63 / #f2c982)
- **Surfaces**: glass-morphism panels with subtle borders and inset highlights
- **Background**: layered radial gradients suggesting warm tabletop
- **Motion**: subtle hover transitions, no overwhelming animations

## Color Palette

| Role | Color |
|------|-------|
| Background | #17130f (near-black) |
| Surface | rgba(35, 28, 22, 0.82) |
| Text primary | #f7efe2 |
| Text muted | #cbb9a6 |
| Amber accent | #e0ad63 |
| Amber light | #f2c982 |
| Success | #9ce4b6 |
| Danger | #ffad9d |

## Typography

- Font: Inter, system-ui fallbacks
- Hero H1: clamp(2.25rem, 6vw, 4rem), letter-spacing -0.02em
- Section H2: clamp(1.5rem, 3vw, 2rem)
- Body: 1rem (0.88-1.02rem range), line-height 1.5-1.7

## Components

| Component | Description |
|-----------|-------------|
| Button | Primary (amber gradient), Secondary (glass), Ghost (text-only) |
| Card | Glass panel with inset highlight, subtle shadow, hover border glow |
| Badge | Pill-shaped, neutral/success/danger variants |
| TokenChip | Inline chip with token-color gradient (red/blue/gold) |
| ConnectionDot | Animated status indicator (green/amber/gray/red) |

## Spacing

- Shell padding: clamp(20px, 4vw, 56px)
- Card padding: 24px
- Grid gaps: 16-18px
- Section margins: 32-64px

## Responsive

- Desktop: 3-column catalog grid, 2-column demo grid, hero sidebar layout
- Tablet (< 840px): 1-column catalog/demo, stacked hero, sidebar below
- Mobile (< 480px): reduced padding, compact buttons, full-width boards

## Anti-Patterns

- No neon or cyberpunk aesthetics
- No casino-style flashing lights
- No full-3D scenes or heavy particle effects
- No pure-black backgrounds (always warm dark)
- No unreadable low-contrast text
