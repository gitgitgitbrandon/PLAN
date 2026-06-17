# PLANNA

A minimal, keyboard-friendly task planner built with React and Vite. Organise work across boards, track your week in the agenda, and see today's schedule at a glance — all stored locally in the browser.

## Views

| View | What it shows |
|---|---|
| **Day** | Every task due today (or with no due date), sorted by start time with checklist sub-items |
| **Board** | Kanban-style lists with drag-and-drop columns and cards, in **Classic** (full-width grid) or **Compact** (fixed-width scrolling columns) layout |
| **Agenda** | The current week as 5 fixed-height day rows — no page scrolling |

## Features

### Boards
- **Multiple boards** — create as many as you need; switch from the left sidebar
- **Board colour** — pick an accent colour shown next to the board name and in the sidebar
- **Starter template** — spin up a ready-made "Kanban Board" (To Do / In Progress / Done) when creating your first board
- **Board settings** — per-board options for layout mode (Classic/Compact), list width (Compact/Normal/Wide, compact layout only), and new-list colour behaviour (fixed grey or auto-cycling palette)
- **Undo / redo** — up to 60 steps of history per board

### Lists
- **Add, rename, delete** lists; newly created lists auto-focus their name field for instant renaming
- **Drag to reorder** lists, or use the list menu to move left/right
- **Copy a list** — duplicates the list and all of its tasks (with fresh IDs)
- **Move a list to another board**
- **Per-list colour** picker

### Tasks & cards
- **Drag-and-drop** cards between lists, with a live drop indicator
- **Quick edit** — hover a card and press **E** (or click the pencil icon) to edit the title inline; a shortcut menu beside the card offers Open card, Edit labels, Edit due date, and Delete card
- **Full card panel** — click a card to open a detail view with title, description, checklist, due date, time slot, labels, and delete
- **Checklists** — nested sub-items per task, each with its own optional due date and a progress bar
- **Due dates & time slots** — assign a date and start/end time; overdue items highlight in red
- **Notes** — a description field per task
- **Multi-select** — Shift+click cards to select several at once
- **Copy / cut / paste cards** via keyboard, and a satisfying confetti burst when you check one off

### Labels
- **Board-wide label library** — a searchable, Trello-style picker to create, rename, recolour, and delete labels shared across every card on the board
- **Toggle display** — click a card's labels to switch between full pill (name + colour) and compact (colour bar only) mode

### Navigation & layout
- **Week filter** — on Board view, filter cards to only those due this week
- **Mini calendar** — jump to any week from the Agenda view
- **Persistent storage** — all data is saved to `localStorage`; nothing leaves the browser
- **Installable PWA** — works offline and can be added to your home screen / desktop

## Keyboard shortcuts

| Key | Action |
|---|---|
| `E` | Quick-edit the hovered (or keyboard-focused) card |
| `Enter` | Save edit / add item, or open the focused card's panel |
| `Escape` | Close the open panel → clear card selection → clear card focus |
| `↑ ↓ ← →` / `j k` | Move card focus around the board (or jump to the first card if none is focused) |
| `← →` | Navigate weeks in the Agenda view |
| `j k` / `← →` | Navigate to the previous/next card while the card panel is open |
| `N` | Add a new card to the focused list |
| `C` | Delete the focused card |
| `, .` | Move the focused card to the bottom of the adjacent left/right list |
| `< >` | Move the focused card to the top of the adjacent left/right list |
| `Shift + Click` | Add/remove a card from the multi-selection |
| `Ctrl/Cmd + C` | Copy the focused card |
| `Ctrl/Cmd + X` | Cut the focused card |
| `Ctrl/Cmd + V` | Paste into the focused list |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` or `Ctrl/Cmd + Y` | Redo |

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
