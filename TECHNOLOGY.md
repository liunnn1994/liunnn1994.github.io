# Technology Analysis

This document describes the technologies used in **liunnn1994.github.io** — a personal Chinese-language blog at <https://liunian.js.org>.

---

## Core Framework

| Technology | Version | Role |
|---|---|---|
| [Astro](https://astro.build) | v5 | Static Site Generator (SSG) — orchestrates all pages, layouts, and content |
| [TypeScript](https://www.typescriptlang.org) | v5 | Primary language for all source files |
| [React](https://react.dev) | v19 | UI library used for interactive components (via `@astrojs/react`) |

Astro's **content collections** API (configured in `src/content.config.ts`) manages blog posts stored as Markdown/MDX files under `src/data/blog/`.

---

## Styling

| Technology | Version | Role |
|---|---|---|
| [Tailwind CSS](https://tailwindcss.com) | v4 | Utility-first CSS framework (Vite plugin, `@tailwindcss/vite`) |
| [@tailwindcss/typography](https://tailwindcss.com/docs/typography-plugin) | v0.5 | Prose styles for blog post content |
| [tailwind-merge](https://github.com/dcastil/tailwind-merge) | v3 | Merges conflicting Tailwind class names at runtime |

CSS custom properties (defined in `src/styles/global.css`) drive light/dark theme colours:

```
--background  --foreground  --accent  --muted  --border
```

The dark theme is toggled via `data-theme="dark"` on the `<html>` element and is persisted in `public/toggle-theme.js`.

---

## Content Authoring

| Technology | Version | Role |
|---|---|---|
| Markdown / [MDX](https://mdxjs.com) | — | Blog post format (`src/data/blog/*.{md,mdx}`) |
| [remark-toc](https://github.com/remarkjs/remark-toc) | v9 | Auto-generates a Table of Contents |
| [remark-collapse](https://github.com/Rokt33r/remark-collapse) | v0.1 | Collapses the generated Table of Contents section |
| [remark-math](https://github.com/remarkjs/remark-math) | v6 | Parses LaTeX math expressions in Markdown |
| [rehype-katex](https://github.com/remarkjs/remark-math/tree/main/packages/rehype-katex) | v7 | Renders parsed math expressions with KaTeX |

---

## Syntax Highlighting

| Technology | Version | Role |
|---|---|---|
| [Shiki](https://shiki.style) (via Astro built-in) | — | Code block syntax highlighting (`min-light` / `night-owl` themes) |
| [@shikijs/transformers](https://shiki.style/packages/transformers) | v3 | Adds diff notation, highlight notation, and word-highlight notation |
| Custom `transformers/fileName.js` | — | Displays a filename label above code blocks |

---

## Search

| Technology | Version | Role |
|---|---|---|
| [Pagefind](https://pagefind.app) | v1 | Client-side full-text search; index is built post-`astro build` and copied into `public/pagefind/` |
| [@pagefind/default-ui](https://pagefind.app/docs/ui/) | v1 | Pre-built search UI widget embedded in `src/pages/search.astro` |

---

## OG Image Generation

Dynamic Open Graph images are generated at build time for every post:

| Technology | Role |
|---|---|
| [Satori](https://github.com/vercel/satori) | Renders JSX templates to SVG |
| [@resvg/resvg-js](https://github.com/yisibl/resvg-js) | Converts SVG to PNG |
| [sharp](https://sharp.pixelplumbing.com) | Image processing and compression |
| [canvas](https://github.com/Automattic/node-canvas) | Node.js canvas API (used by OG template utilities) |
| `src/utils/loadGoogleFont.ts` | Fetches and embeds the Google Font used in OG images |

---

## Animation & Icons

| Technology | Version | Role |
|---|---|---|
| [Motion](https://motion.dev) (`motion/react`) | v12 | Physics-based animations in interactive React components |
| [Lucide React](https://lucide.dev) | v0.544 | SVG icon set |
| [React Icons](https://react-icons.github.io/react-icons/) | v5 | Additional icon families |

---

## Featured Interactive Component: LiquidGlass

`src/components/LiquidGlass/` is a custom React component suite that simulates an iOS-style frosted-glass / liquid-glass effect entirely in the browser. Key internal pieces:

| File | Description |
|---|---|
| `Filter.tsx` | SVG `<feDisplacementMap>` filter that applies the lens distortion |
| `displacementMap.ts` | Computes a pixel-level displacement map from a surface equation |
| `surfaceEquations.ts` | Defines convex, concave, lip, and circular surface profiles |
| `rayColor.ts` | Ray-tracing utility that calculates colour for each displaced pixel |
| `specular.ts` | Phong-style specular highlight calculations |
| `Playground.tsx` | Interactive demo (used in the `liquid-glass.mdx` blog post) |
| `useValueOrMotion.tsx` | Hook that accepts either a plain value or a Motion `MotionValue` |

---

## RSS & Sitemap

| Technology | Role |
|---|---|
| [@astrojs/rss](https://docs.astro.build/en/guides/rss/) | Generates `/rss.xml` |
| [@astrojs/sitemap](https://docs.astro.build/en/guides/integrations-guide/sitemap/) | Generates `/sitemap-index.xml` at build time |

---

## Date & Slug Utilities

| Technology | Role |
|---|---|
| [Day.js](https://day.js.org) | Timezone-aware date formatting (configured via `SITE.timezone`) |
| [lodash.kebabcase](https://lodash.com/docs/#kebabCase) | Converts post titles to URL-safe slugs |

---

## Tooling & Developer Experience

| Tool | Version | Role |
|---|---|---|
| [pnpm](https://pnpm.io) | (workspace) | Fast, disk-efficient package manager; monorepo workspace config in `pnpm-workspace.yaml` |
| [ESLint](https://eslint.org) | v9 | Linter — configured in `eslint.config.js` with `eslint-plugin-astro` and `typescript-eslint` |
| [Prettier](https://prettier.io) | v3 | Code formatter — plugins for Astro, Tailwind, and `package.json` |
| [Commitizen](https://commitizen-tools.github.io/commitizen/) | (cz.yaml) | Enforces conventional commit message format |
| [VS Code](https://code.visualstudio.com) | (.vscode/) | Recommended extensions and code snippets for Astro development |

### Useful scripts (from `package.json`)

```bash
pnpm dev          # Start dev server (all network interfaces)
pnpm build        # Type-check → build → generate Pagefind index
pnpm preview      # Serve the built output locally
pnpm lint         # Run ESLint
pnpm format       # Auto-format with Prettier
pnpm format:check # Dry-run Prettier check
```

---

## Deployment

| Technology | Role |
|---|---|
| [Docker](https://www.docker.com) | Multi-stage build: Node LTS (build) → `nginx:mainline-alpine-slim` (serve) |
| [docker-compose](https://docs.docker.com/compose/) | Local container orchestration (`docker-compose.yml`) |
| GitHub Pages | Primary deployment target (static files served from `dist/`) |

---

## Project Structure Overview

```
liunnn1994.github.io/
├── src/
│   ├── components/       # Astro & React UI components
│   │   └── LiquidGlass/  # Interactive glass-effect React components
│   ├── data/blog/        # Markdown/MDX blog posts
│   ├── layouts/          # Page layout wrappers
│   ├── pages/            # Astro file-based routes
│   ├── styles/           # Global CSS (Tailwind + custom properties)
│   ├── utils/            # Shared helpers (OG image, post sorting, slugs…)
│   ├── config.ts         # Site-wide constants (SITE object)
│   └── content.config.ts # Content collection schema
├── public/               # Static assets served as-is
├── astro.config.ts       # Astro + integrations configuration
├── tsconfig.json         # TypeScript configuration
├── eslint.config.js      # ESLint flat config
├── .prettierrc.mjs       # Prettier configuration
└── Dockerfile            # Container build definition
```
