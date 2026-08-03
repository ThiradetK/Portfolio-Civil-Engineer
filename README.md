# Storytelling Portfolio

Premium scroll-driven portfolio built with Vite, React, Zustand, and GSAP ScrollTrigger.

## Stack

- **Vite** + **React 19**
- **Zustand** — single source of truth for all content
- **GSAP** + **ScrollTrigger** — cinematic scroll animations
- **SCSS Modules** — scoped, maintainable styles
- No UI framework

## Getting started

```bash
npm install
npm run dev
```

## Editing content

All visible text lives in `src/data/`:

| File | Content |
|------|---------|
| `profile.js` | Name, bio, education, vision, goals |
| `skills.js` | Skill categories & items |
| `experience.js` | Work history / timeline |
| `lessons.js` | Lessons flowchart nodes |
| `projects.js` | Case studies |
| `socials.js` | Links |

The Zustand store (`src/store/usePortfolioStore.js`) exposes this data. Components only read from the store — never hardcode copy.

## Structure

```
src/
  components/     # Shared UI (SectionLabel, …)
  sections/       # Hero, About, Skills, Experience, Lessons, Projects, Contact
  animations/     # Ready for shared timeline helpers
  hooks/          # useGSAP and other reusable hooks
  store/          # Zustand store
  data/           # Editable content
  styles/         # Global SCSS
  utils/          # Helpers (splitText, …)
```

## Story chapters

1. **Who Am I** — Documentary-style intro (Hero + About)
2. **Skills** — Tools grouped by purpose
3. **Experience** — Animated timeline
4. **Lessons** — Connected flowchart of growth
5. **Projects** — Deep case studies
6. **Contact** — Memorable close

## Notes

- Animations use `gsap.context` for automatic cleanup
- ScrollTrigger is refreshed on mount
- Dark, minimal, large-type aesthetic
- Fully responsive

Replace placeholder data in `src/data/` with your own story.
