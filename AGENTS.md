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
date: "2026-04-19"
cover: "url_to_image"
---
```

**Property Breakdown:**
- `title` *(String / Required)*: The visible header of the page inside the Reader UI.
- `description` *(String / Optional)*: A short synopsis. If this is the *first* page of a Book, the Library utilizes this description for the Book's preview card.
- `date` *(String / Optional)*: Used for sorting books in the Library. Should be in sortable format (`YYYY-MM-DD`).
- `cover` *(String / Optional)*: A future-proof token for attaching book covers.

## 3. Styling & The Reader Platform

- **Routing:** `<Route path="/reader/:bookSlug/:pageSlug" element={<Reader />} />`
- **Pagination Context:** The application securely calculates `Next Page` and `Previous Page` using the `bookSlug`. I do not need to manually configure next/prev links in the markdown. The UI handles it automatically.
- **Minimalism:** No heavy images are used on the Home screen. Pure typography and precise spacing are prioritized locally to focus on my writing.

## 4. Maintenance Notes
- Avoid inserting arbitrary standalone `.mdx` files into the `stories/` root folder. They will not be rendered by my Library unless wrapped inside a dedicated book folder. 
- Avoid quotes with inline commas or unescaped strings in my frontmatter unless strictly necessary; keep parsing simple.
