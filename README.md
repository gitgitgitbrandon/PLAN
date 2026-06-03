# PLANNA

A minimal, keyboard-friendly task planner built with React and Vite. Organise work across boards, track your week in the agenda, and see today's schedule at a glance — all stored locally in the browser.

## Views

| View | What it shows |
|---|---|
| **Day** | Every task due today (or with no due date), sorted by start time with checklist sub-items |
| **Board** | Kanban-style lists with drag-and-drop columns and cards |
| **Agenda** | The current week as 5 fixed-height day rows — no page scrolling |

## Features

### Tasks & boards
- **Multiple boards** — create as many boards as you need; switch from the left sidebar
- **Kanban lists** — add lists to any board, drag to reorder both lists and cards
- **Checklists** — nested sub-items per task, each with its own due date and progress bar
- **Due dates & time slots** — assign a date and start/end time; overdue items highlight in red
- **Notes** — rich description field per task

### Labels
- **Colour-coded labels** per task with custom names
- **Inline editing** — click any label pill to rename and repick colour, with a live preview
- **Toggle display** — click a label on a card to switch between pill (name + colour) and compact (colour bar only) mode

### Editing
- **Quick edit** — hover a card and press **E** (or click the pencil icon) to edit the title inline; a shortcut menu appears beside the card with Open, Edit labels, Edit due date, and Delete
- **Click-to-position cursor** — all rename fields are real inputs; click anywhere in the text to place the cursor
- **Drag disabled while typing** — parent drag-and-drop is blocked while any rename field is focused

### Navigation & layout
- **Week filter** — on Board view, filter cards to only those due this week
- **Mini calendar** — jump to any week from the Agenda view
- **Persistent storage** — all data is saved to `localStorage`; nothing leaves the browser

## Keyboard shortcuts

| Key | Action |
|---|---|
| `E` | Open quick edit on the hovered card |
| `Enter` | Save / add item |
| `Escape` | Cancel edit |
| `← →` | Navigate weeks in Agenda view |

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

```bash
npm run build    # production build
npm run preview  # preview the production build
```

## Tech stack

- [React 19](https://react.dev)
- [Vite 8](https://vite.dev)
- PWA-ready via `vite-plugin-pwa`
- No external UI libraries — all components and styles written inline
