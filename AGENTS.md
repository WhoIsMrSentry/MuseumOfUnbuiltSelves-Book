# MyStory Agent Protocol & MDX Conventions

This document serves as a standard ruleset for any developers or AI agents interacting with my personal storytelling platform. It explains the core rendering logic, MDX syntax, and folder structuring necessary to maintain my ecosystem.

## 1. Architecture: Books & Chapters

The system operates strictly on a hierarchical **Books and Pages** approach located at `content/stories/`.

- **Books (Folders):** Every subfolder inside the `content/stories/` directory acts as a discrete "Book". 
  - The folder's name acts as the system's `bookSlug` (e.g., `the-wizard-of-oz`). 
  - The platform automatically formats this slug into a readable title ("The Wizard Of Oz") for the Library UI.
- **Pages (MDX Files):** The `.mdx` files nested inside the books act as the "Pages" or "Chapters". 
  - The file name acts as the `pageSlug` (e.g., `01-hello.mdx` -> `01-hello`).
  - Prefixing file names with logical numbers (e.g., `01-`, `02-`) enables natural, alphabetical sorting, allowing the Table of Contents & Pagination logic to traverse seamlessly.

## 2. Frontmatter Properties

All `.mdx` content files MUST begin with a YAML Frontmatter block delineated by triple dashes (`---`). The parser does not use `gray-matter`, but instead relies on a lightweight browser-safe regex implementation inside `utils/markdown.ts`.

### Core Properties
```yaml
---
title: "Chapter 1: An Expected Journey"
description: "Used primarily as a subheadline, and as the preview text for the Book card in the Library if it's the first page."
cover: "url_to_image"
---
```

**Property Breakdown:**
- `title` *(String / Required)*: The visible header of the page inside the Reader UI.
- `description` *(String / Optional)*: A short synopsis. If this is the *first* page of a Book, the Library utilizes this description for the Book's preview card.
- `cover` *(String / Optional)*: A future-proof token for attaching book covers.

> **Note:** `date` is **not** stored in frontmatter. The "Son düzenlenme" (last modified) date is automatically derived from each file's filesystem modification time via a Vite plugin (`plugins/mdx-mtime.ts`). No manual date entry is needed.

## 3. Styling & The Reader Platform

- **Routing:** `<Route path="/reader/:bookSlug/:pageSlug" element={<Reader />} />`
- **Pagination Context:** The application securely calculates `Next Page` and `Previous Page` using the `bookSlug`. I do not need to manually configure next/prev links in the markdown. The UI handles it automatically.
- **Minimalism:** No heavy images are used on the Home screen. Pure typography and precise spacing are prioritized locally to focus on my writing.

## 4. Maintenance Notes
- Avoid inserting arbitrary standalone `.mdx` files into the `stories/` root folder. They will not be rendered by my Library unless wrapped inside a dedicated book folder. 
- Avoid quotes with inline commas or unescaped strings in my frontmatter unless strictly necessary; keep parsing simple.
- **Short Lines (VS Code Compatibility):** All `.mdx` content should be formatted with manual line breaks (short lines) to ensure the text is easily readable and editable in VS Code without horizontal scrolling. Break lines at logical points (around 80-100 characters).
- **Cover Images:** When generating AI cover images for chapters, ALWAYS draw the pure environment. DO NOT include characters, human figures, or silhouettes in the generated cover art.

## 5. Kisho Library Files

When working inside `content/stories/kisho/`, always check the canon library files in
`content/stories/kisho/library/` and keep each file scoped correctly.

- `foundations.md`: World rules, crystal-system canon, social structure, and the
  story's baseline foundations.
- `rules.md`: Narrative discipline, spoiler boundaries, wording consistency, and
  workflow rules for edits.
- `story_memory.md`: Story-encountered people, animals, plants, places, concepts,
  and fixed terminology.

If new information is added, update the matching file instead of mixing categories.
