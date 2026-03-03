# Contributor Skills Guide

Welcome! This guide outlines the skills and knowledge needed to contribute to **liunnn1994.github.io**, a personal blog built with Astro. Whether you are fixing a bug, adding a feature, or writing a new post, this document points you to the right areas.

For a full breakdown of every technology used, see [TECHNOLOGY.md](./TECHNOLOGY.md).

---

## Required Skills by Contribution Type

### 1. Writing or Editing Blog Posts

This is the most common contribution. Posts live in `src/data/blog/` and are written in **Markdown** (`.md`) or **MDX** (`.mdx`).

**Skills needed:**
- Basic Markdown syntax (headings, lists, links, code blocks, images)
- Understanding the **front-matter** schema (fields defined in `src/content.config.ts`):

  ```yaml
  ---
  title: "Your Post Title"
  pubDatetime: 2024-01-01T00:00:00+08:00
  tags: ["javascript", "tutorial"]
  description: "A short summary shown in the post list."
  draft: false          # set true to hide from production
  featured: false       # set true to pin to the index page
  ---
  ```

- For MDX posts: basic knowledge of how to import and embed React components inline.
- For posts with math: [KaTeX](https://katex.org/docs/supported.html) syntax (enabled via `remark-math` + `rehype-katex`).

**Useful commands:**
```bash
pnpm dev    # Live-reload preview at http://localhost:4321
```

---

### 2. Modifying Layout, Pages, or Routing

Pages and layouts are written in **Astro** (`.astro` files) using a superset of HTML with a front-matter code block.

**Skills needed:**
- [Astro component syntax](https://docs.astro.build/en/basics/astro-components/) — `---` code block (server-side JS/TS) + HTML template
- Astro's [file-based routing](https://docs.astro.build/en/basics/routing/) (`src/pages/`)
- Astro [content collections](https://docs.astro.build/en/guides/content-collections/) — how `getCollection()` and the blog schema work
- Basic **TypeScript** for typed props and utility functions
- **Tailwind CSS v4** for styling (utility classes directly in the template)

**Key files:**
| File | Purpose |
|---|---|
| `src/layouts/Layout.astro` | Root HTML shell, `<head>`, theme script |
| `src/layouts/Main.astro` | Main content area wrapper |
| `src/layouts/PostDetails.astro` | Single-post layout |
| `src/pages/index.astro` | Home page |
| `src/pages/posts/[...page].astro` | Paginated post list |
| `src/pages/search.astro` | Pagefind search UI |

---

### 3. Modifying or Adding UI Components

Most UI components are **Astro components** (`src/components/*.astro`). Interactive components that require client-side state are **React components** (`src/components/LiquidGlass/*.tsx`).

**Skills needed for Astro components:**
- Astro component syntax (see above)
- Tailwind CSS v4 utility classes
- SVG basics (icons in `src/assets/icons/` are inline SVGs)

**Skills needed for React components:**
- React v19 — functional components, hooks (`useState`, `useRef`, `useEffect`, `useId`)
- TypeScript with React (`React.FC`, typed props, `useRef<HTMLElement>`)
- [Motion (`motion/react`)](https://motion.dev/docs/react) — `useMotionValue`, `useTransform`, `useInView` for animation
- [Lucide React](https://lucide.dev) and [React Icons](https://react-icons.github.io/react-icons/) for icons

**LiquidGlass components** (`src/components/LiquidGlass/`) additionally require:
- SVG filter primitives (`feDisplacementMap`, `feColorMatrix`, `feImage`)
- Basic linear algebra / vector math (used in ray-tracing and displacement-map calculations)
- Understanding of Phong shading / specular highlights (see `specular.ts`)
- Canvas API (`ImageData`, pixel manipulation)

---

### 4. Modifying Styles

Global styles are in `src/styles/global.css` and `src/styles/typography.css`.

**Skills needed:**
- [Tailwind CSS v4](https://tailwindcss.com/docs) — including `@theme`, `@utility`, `@layer`, and `@custom-variant` directives
- CSS custom properties (`--background`, `--accent`, etc.) for theming
- The `@tailwindcss/typography` plugin for prose styles in blog content

**Theme colours** are set via CSS custom properties in `src/styles/global.css`. To change colours, update the `:root` (light) and `html[data-theme="dark"]` blocks.

---

### 5. Utility Functions and Configuration

**Skills needed:**
- TypeScript
- Astro configuration API (`astro.config.ts`)
- Familiarity with the plugins used: `remark-toc`, `remark-collapse`, `remark-math`, Shiki transformers

**Key utilities:**
| File | Purpose |
|---|---|
| `src/config.ts` | `SITE` constant — update site title, URL, author, etc. |
| `src/utils/getSortedPosts.ts` | Filters and sorts posts by date |
| `src/utils/getUniqueTags.ts` | Extracts unique tags from all posts |
| `src/utils/slugify.ts` | Converts titles to URL slugs |
| `src/utils/generateOgImages.ts` | Builds OG images using Satori + resvg |

---

### 6. OG Image Templates

**Skills needed:**
- [Satori JSX templates](https://github.com/vercel/satori#jsx) — JSX-style object trees that describe an SVG layout
- Basic understanding of `@resvg/resvg-js` (SVG → PNG pipeline)
- Font loading (`src/utils/loadGoogleFont.ts` fetches fonts at build time)

Templates are plain JavaScript files in `src/utils/og-templates/`.

---

### 7. Build, Tooling, and CI

**Skills needed:**
- **pnpm** — workspace setup, `pnpm install`, `pnpm run <script>`
- **Node.js** (LTS) — the runtime for the build pipeline
- ESLint v9 flat config (`eslint.config.js`) and `typescript-eslint`
- Prettier with plugins (`prettier-plugin-astro`, `prettier-plugin-tailwindcss`)
- Docker — multi-stage Dockerfile; `docker-compose.yml` for local container preview
- Conventional commits enforced by [Commitizen](https://commitizen-tools.github.io/commitizen/) (`cz.yaml`)

---

## Development Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Start dev server (available on all interfaces)
pnpm dev

# 3. Check types + build + generate search index
pnpm build

# 4. Preview production build locally
pnpm preview
```

### Code quality checks

```bash
pnpm lint           # ESLint
pnpm format:check   # Prettier dry-run
pnpm format         # Auto-fix formatting
```

### Docker (optional)

```bash
docker compose up --build   # Build and serve on port 80
```

---

## Skills Summary Table

| Contribution Area | Must Know | Helpful to Know |
|---|---|---|
| Blog posts | Markdown, front-matter YAML | MDX, KaTeX |
| Pages & layouts | Astro, TypeScript, Tailwind CSS | Astro content collections |
| Astro UI components | Astro, Tailwind CSS, SVG | — |
| React interactive components | React v19, TypeScript | Motion, Lucide React |
| LiquidGlass physics components | React, TypeScript, SVG filters | Linear algebra, ray tracing, Canvas API |
| Styles / theming | Tailwind CSS v4, CSS custom properties | `@tailwindcss/typography` |
| OG image templates | Satori JSX, Node.js | resvg, sharp |
| Build & tooling | pnpm, Node.js, ESLint, Prettier | Docker, Commitizen |

---

## Code Style

- **Formatting** is enforced by Prettier — run `pnpm format` before committing.
- **Linting** is enforced by ESLint — run `pnpm lint` and fix any reported issues.
- **Commit messages** should follow the [Conventional Commits](https://www.conventionalcommits.org/) spec (`feat:`, `fix:`, `docs:`, `chore:`, etc.).
- TypeScript strict mode is enabled — avoid `any` unless absolutely necessary.

---

## Getting Help

- [Astro documentation](https://docs.astro.build)
- [Tailwind CSS v4 documentation](https://tailwindcss.com/docs)
- [Motion documentation](https://motion.dev/docs)
- [Pagefind documentation](https://pagefind.app/docs)
- Open an issue or discussion on [GitHub](https://github.com/liunnn1994/liunnn1994.github.io)
