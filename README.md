# PLANNA

A minimal, keyboard-friendly task planner built with React and Vite. Organise work across boards, track your week in the agenda, and see today's schedule at a glance — all stored locally in the browser.

## Views

| View | What it shows |
|---|---|
| **Day** | Every task due today (or with no due date), sorted by start time |
| **Board** | Kanban-style lists with drag-and-drop columns and cards |
| **Agenda** | The current week split into 5 day rows, fits the screen without scrolling |

## Features

- **Multiple boards** — create as many boards as you need; switch from the left sidebar
- **Lists & tasks** — add lists to any board, drag to reorder both lists and cards
- **Labels** — colour-coded label pills on cards; click any label to toggle between full (name) and compact (colour bar) mode
- **Checklists** — nested sub-items inside any task, each with its own due date and progress bar
- **Due dates & time slots** — assign a date and start/end time to any task; overdue tasks highlight in red
- **Week filter** — on the board view, filter cards to only show tasks due this week
- **Quick edit** — hover a card and press **E** (or click the pencil icon) to edit the title inline and access a shortcut menu
- **Drag & drop** — reorder lists and cards within and across lists
- **Persistent storage** — all data is saved to `localStorage`; nothing leaves the browser

## Keyboard shortcuts

| Key | Action |
|---|---|
| `E` | Open quick edit on the hovered card |
| `Enter` | Save quick edit / add task / add checklist item |
| `Escape` | Cancel any edit |
| `←` / `→` | Navigate weeks in the Agenda view |

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
- No external UI libraries — all components and styles are written inline
