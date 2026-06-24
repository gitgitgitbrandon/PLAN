import { useState, useRef, useEffect, useMemo, useImperativeHandle, forwardRef, Fragment } from 'react'

/* ─── Design tokens ──────────────────────────────────────────────────────────── */
const FONT = "'Inter', sans-serif"
const R = 20
const LIST_R = 10

const C = {
  bg: '#141517',
  card: '#FFFFFF',
  cardAlt: '#F2F4F7',
  text: '#141517',
  textMuted: '#8A8D93',
  textLight: '#C4C6CA',
  textWhite: '#FFFFFF',
  accent: '#f94144',
  accentLight: '#f94144aa',
  danger: '#f94144',
  dangerBg: '#f9414433',
  border: '#222426',
  borderHover: '#3A3A3A',
  hoverBlue: '#4da6ff',
  shadow: 'rgba(0,0,0,0.1)',
  shadowDeep: 'rgba(0,0,0,0.5)',
  overlay06: 'rgba(0,0,0,0.06)',
  overlayW10: 'rgba(255,255,255,0.10)',
  overlayW15: 'rgba(255,255,255,0.15)',
  overlayW20: 'rgba(255,255,255,0.20)',
  overlayW25: 'rgba(255,255,255,0.25)',
  overlayW30: 'rgba(255,255,255,0.30)',
  overlayW35: 'rgba(255,255,255,0.35)',
  overlayW40: 'rgba(255,255,255,0.40)',
  overlayW50: 'rgba(255,255,255,0.50)',
  overlayB10: 'rgba(0,0,0,0.10)',
  overlayB20: 'rgba(0,0,0,0.20)',
  overlayB35: 'rgba(0,0,0,0.35)',
  overlayB40: 'rgba(0,0,0,0.40)',
}

const PALETTE = [
  '#f94144', '#f3722c', '#f8961e', '#f9844a', '#f9c74f',
  '#90be6d', '#43aa8b', '#4d908e', '#577590', '#277da1',
]


/* ─── Global CSS ─────────────────────────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; background: #141517; overflow-x: hidden; max-width: 100vw; }
  body { font-family: 'Inter', sans-serif; }
  #root { width: 100% !important; max-width: 100% !important; margin: 0 !important;
          border: none !important; display: block !important; text-align: left !important; min-height: 100vh; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.10); border-radius: 4px; }
  input, textarea { caret-color: currentColor; }
  input:focus, textarea:focus { outline: none; }
  button { transition: transform 120ms cubic-bezier(.4,0,.2,1), opacity 120ms ease, background 150ms ease, filter 150ms ease; }
  button:active:not(:disabled) { transform: scale(0.94); filter: brightness(0.92); }
  .task-card:hover { border-color: ${C.hoverBlue} !important; }
  .task-card:hover .chk-tr { opacity: 1 !important; }
  .task-card.is-dragging { opacity: 0.5; }
  .task-card.is-focused { outline: 2px solid ${C.accent} !important; outline-offset: 2px; }
  .task-card.is-selected { background: rgba(243,114,44,0.12) !important; border-color: rgba(243,114,44,0.45) !important; }
  .task-card:focus-visible { outline: 2px solid ${C.accent}; outline-offset: 2px; }
  @keyframes check-bounce-anim { 0%{transform:scale(1)} 35%{transform:scale(1.2)} 65%{transform:scale(.95)} 100%{transform:scale(1)} }
  .check-bounce { animation: check-bounce-anim .5s cubic-bezier(.3,.7,.4,1) 1.3s; transform-origin: center; }
  @media (max-width: 640px) { .top-bar h1 { font-size: 20px !important; } }
  @media (hover: none) { .chk-tr { opacity: 1 !important; } }
  .task-chk { opacity: 0; transition: opacity .15s, border-color .15s, background .15s; }
  .task-card:hover .task-chk { opacity: 1; }
  .task-chk.chk-done { opacity: 1; }
  .task-chk:not(.chk-done):hover { border-color: rgba(255,255,255,0.6) !important; background: rgba(255,255,255,0.10) !important; }
  .task-chk:hover ~ .task-text { transform: translateX(4px); }
  .task-text { transition: transform .15s; }
`

/* ─── Utilities ──────────────────────────────────────────────────────────────── */
const uid = () => Math.random().toString(36).slice(2, 9)
const todayStr = () => new Date().toISOString().split('T')[0]

function formatDate(ds) {
  if (!ds) return ''
  const d = new Date(ds + 'T00:00:00')
  const now = new Date()
  const t = now.toISOString().split('T')[0]
  const tmrw = new Date(now); tmrw.setDate(tmrw.getDate() + 1)
  if (ds === t) return 'TODAY'
  if (ds === tmrw.toISOString().split('T')[0]) return 'TOMORROW'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()
}

function isOverdue(ds) { return ds ? ds < todayStr() : false }

function getWeekDates(offset = 0) {
  const now = new Date()
  const dow = now.getDay()
  const mon = new Date(now)
  mon.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1) + offset * 7)
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(mon); d.setDate(mon.getDate() + i)
    return {
      date: d.toISOString().split('T')[0],
      full: d.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase(),
      short: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      dayNum: d.getDate(),
    }
  })
}

function getWeekLabel(offset) {
  const d = getWeekDates(offset)
  const opts = { month: 'short', day: 'numeric' }
  const s = new Date(d[0].date + 'T00:00:00').toLocaleDateString('en-US', opts)
  const e = new Date(d[4].date + 'T00:00:00').toLocaleDateString('en-US', opts)
  return `${s} – ${e}`
}

function formatTime12(s) {
  if (!s) return null
  const [h, m] = s.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')}${h >= 12 ? 'pm' : 'am'}`
}

function newTask(text, dueDate = '') {
  return { id: uid(), text, done: false, note: '', dueDate, startTime: '', endTime: '', labels: [], checklist: [], priority: null }
}

const DEFAULT_BOARD_LABELS = () => [
  { id: uid(), name: '', color: '#90be6d' },
  { id: uid(), name: '', color: '#43aa8b' },
  { id: uid(), name: '', color: '#f3722c' },
  { id: uid(), name: '', color: '#f94144' },
  { id: uid(), name: '', color: '#f9c74f' },
  { id: uid(), name: '', color: '#277da1' },
]

const DEFAULT_BOARD_SETTINGS = () => ({ listWidth: 'normal', newListColorMode: 'cycle', layoutMode: 'classic', taskTextSize: 'medium' })

const LIST_SIZE_PRESETS = {
  compact: { width: 220, titleSize: 15, headerPad: '10px 14px' },
  normal:  { width: 272, titleSize: 18, headerPad: '14px 16px' },
  wide:    { width: 320, titleSize: 21, headerPad: '16px 20px' },
}

const TASK_TEXT_SIZE_PRESETS = {
  small:  { title: 12, meta: 9 },
  medium: { title: 14, meta: 11 },
  large:  { title: 16, meta: 13 },
}

const DEFAULT_PRIORITY_COLORS = () => ({ low: '#90be6d', medium: '#277da1', high: '#f3722c', critical: '#f94144' })
const PRIORITY_LEVEL_ORDER = ['low', 'medium', 'high', 'critical']
const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' }

function newBoard(name, color = PALETTE[0]) {
  return { id: uid(), name, color, lists: [], dayTags: {}, boardLabels: DEFAULT_BOARD_LABELS(), settings: DEFAULT_BOARD_SETTINGS(), priorityColors: DEFAULT_PRIORITY_COLORS() }
}

const PRIORITY_LEVELS = [
  ['CRITICAL', '#f94144'],
  ['HIGH', '#f3722c'],
  ['MEDIUM-HIGH', '#f8961e'],
  ['MEDIUM', '#f9844a'],
  ['MEDIUM-LOW', '#f9c74f'],
  ['LOW', '#90be6d'],
  ['MINIMAL', '#43aa8b'],
  ['BACKLOG', '#4d908e'],
  ['ICEBOX', '#577590'],
]

function priorityTemplateBoard() {
  return {
    id: uid(), name: 'MY BOARD', color: PALETTE[0], dayTags: {}, boardLabels: DEFAULT_BOARD_LABELS(), settings: DEFAULT_BOARD_SETTINGS(), priorityColors: DEFAULT_PRIORITY_COLORS(),
    lists: PRIORITY_LEVELS.map(([name, color]) => ({ id: uid(), name, color, tasks: [] })),
  }
}

function templateBoard() {
  return {
    id: uid(), name: 'MY BOARD', color: PALETTE[0], dayTags: {}, boardLabels: DEFAULT_BOARD_LABELS(), settings: DEFAULT_BOARD_SETTINGS(), priorityColors: DEFAULT_PRIORITY_COLORS(),
    lists: [
      { id: uid(), name: 'TO DO', color: '#FF573B', tasks: [] },
      { id: uid(), name: 'IN PROGRESS', color: '#0988EF', tasks: [] },
      { id: uid(), name: 'DONE', color: '#018848', tasks: [] },
    ],
  }
}

/* ─── Hooks ──────────────────────────────────────────────────────────────────── */
function useClickOutside(ref, onClose) {
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) onCloseRef.current() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
}

const MOBILE_BREAKPOINT = 768
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)
    const h = e => setIsMobile(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])
  return isMobile
}

/* ─── Editable ───────────────────────────────────────────────────────────────── */
const Editable = forwardRef(function Editable({ value, onChange, style }, fwdRef) {
  const [draft, setDraft] = useState(value)
  const ref = useRef(null)
  useEffect(() => { setDraft(value) }, [value])
  useImperativeHandle(fwdRef, () => ({
    focus: () => { ref.current?.focus(); ref.current?.select() },
  }))
  return (
    <input ref={ref} value={draft}
      draggable={false}
      onChange={e => setDraft(e.target.value)}
      onBlur={() => onChange(draft)}
      onKeyDown={e => {
        if (e.key === 'Enter')  { onChange(draft); ref.current?.blur() }
        if (e.key === 'Escape') { setDraft(value);  ref.current?.blur() }
      }}
      style={{
        border: 'none', outline: 'none', background: 'transparent', width: '100%', padding: 0, margin: 0,
        cursor: 'text',
        fontFamily: style?.fontFamily || FONT, fontSize: style?.fontSize || 'inherit',
        fontWeight: style?.fontWeight || 'inherit', color: style?.color || 'inherit',
        letterSpacing: style?.letterSpacing || 'inherit', lineHeight: style?.lineHeight || 'inherit',
        caretColor: 'currentColor',
      }}
    />
  )
})

/* ─── ColorPicker ────────────────────────────────────────────────────────────── */
function ColorPicker({ colors, current, onPick, onClose }) {
  const ref = useRef(null)
  const [pos, setPos] = useState({ top: '100%', left: 0, right: 'auto' })

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      if (rect.right > window.innerWidth - 8) setPos({ top: '100%', left: 'auto', right: 0 })
    }
  }, [])

  useClickOutside(ref, onClose)

  return (
    <div ref={ref} style={{
      position: 'absolute', top: pos.top, left: pos.left, right: pos.right, zIndex: 100,
      background: C.card, borderRadius: R, padding: 8,
      display: 'flex', gap: 4, flexWrap: 'wrap', width: 152,
      boxShadow: `0 8px 32px ${C.shadowDeep}`,
    }}>
      {colors.map(c => (
        <div key={c} onClick={() => { onPick(c); onClose() }} style={{
          width: 24, height: 24, borderRadius: 8, background: c, cursor: 'pointer',
          border: c === current ? `2px solid ${C.textWhite}` : '2px solid transparent',
        }} />
      ))}
    </div>
  )
}

/* ─── Label ──────────────────────────────────────────────────────────────────── */
function LabelPill({ label, onRename, onChangeColor, onRemove }) {
  const [showPicker, setShowPicker] = useState(false)
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        background: label.color, borderRadius: 6, padding: '4px 10px',
        fontSize: 10, fontWeight: 800, color: C.textWhite, letterSpacing: 0.8, fontFamily: FONT,
      }}>
        <div onClick={() => setShowPicker(true)} style={{ width: 6, height: 6, borderRadius: '50%', background: C.overlayW50, cursor: 'pointer' }} />
        <Editable value={label.name} onChange={onRename} style={{ fontSize: 10, fontWeight: 800, color: C.textWhite, fontFamily: FONT }} />
        <span onClick={onRemove} style={{ cursor: 'pointer', opacity: 0.6, fontSize: 9, marginLeft: 2 }}>×</span>
      </div>
      {showPicker && <ColorPicker colors={PALETTE} current={label.color} onPick={onChangeColor} onClose={() => setShowPicker(false)} />}
    </div>
  )
}

/* ─── BoardLabelPicker ───────────────────────────────────────────────────────── */
function ColorGrid({ selected, onPick }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, marginBottom: 10 }}>
      {PALETTE.map(c => (
        <div key={c} onClick={() => onPick(c)} style={{
          height: 26, borderRadius: 5, background: c, cursor: 'pointer',
          outline: selected === c ? `2px solid ${C.textWhite}` : '2px solid transparent',
          outlineOffset: 1, transition: 'outline .1s',
        }} />
      ))}
    </div>
  )
}

function LabelEditForm({ draft, setDraft, onSave, onDelete: onDel, saveLabel = 'Save' }) {
  const inputStyle = { width: '100%', border: 'none', borderRadius: 6, padding: '8px 10px', fontSize: 12, fontFamily: FONT, fontWeight: 600, outline: 'none', background: C.overlayW10, color: C.textWhite, marginBottom: 8 }
  return (
    <div style={{ padding: '0 12px 12px' }}>
      <div style={{ height: 32, borderRadius: 7, background: draft.color, marginBottom: 10, display: 'flex', alignItems: 'center', padding: '0 10px' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(0,0,0,0.6)' }}>{draft.name || ' '}</span>
      </div>
      <input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
        placeholder="Label name (optional)" style={inputStyle} />
      <div style={{ fontSize: 9, fontWeight: 800, color: C.textMuted, letterSpacing: 1, marginBottom: 6 }}>SELECT A COLOR</div>
      <ColorGrid selected={draft.color} onPick={c => setDraft(d => ({ ...d, color: c }))} />
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onSave}
          style={{ flex: 1, border: 'none', borderRadius: 6, padding: '7px 0', fontSize: 12, fontWeight: 700, background: C.accent, color: C.textWhite, cursor: 'pointer', fontFamily: FONT }}>{saveLabel}</button>
        {onDel && (
          <button onClick={onDel}
            style={{ border: 'none', borderRadius: 6, padding: '7px 12px', fontSize: 12, fontWeight: 700, background: C.dangerBg, color: C.danger, cursor: 'pointer', fontFamily: FONT }}>Delete</button>
        )}
      </div>
    </div>
  )
}

function BoardLabelPicker({ boardLabels = [], cardLabels = [], onToggle, onCreate, onUpdate, onDelete, onClose, style = {} }) {
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState({ name: '', color: PALETTE[0] })
  const [creating, setCreating] = useState(false)
  const [newDraft, setNewDraft] = useState({ name: '', color: PALETTE[0] })
  const ref = useRef(null)
  const searchRef = useRef(null)

  useEffect(() => { if (!editingId && !creating) searchRef.current?.focus() }, [editingId, creating])

  const filtered = boardLabels.filter(l =>
    !search.trim() || l.name.toLowerCase().includes(search.trim().toLowerCase())
  )
  const isOnCard = id => cardLabels.some(l => l.id === id)

  const startEdit = (label, e) => {
    e.stopPropagation()
    setEditingId(label.id)
    setEditDraft({ name: label.name, color: label.color })
    setCreating(false)
  }

  const saveEdit = () => { onUpdate(editingId, editDraft); setEditingId(null) }

  const handleCreate = () => {
    const nl = { id: uid(), name: newDraft.name, color: newDraft.color }
    onCreate(nl)
    setCreating(false)
    setNewDraft({ name: '', color: PALETTE[0] })
  }


  const header = (title) => (
    <div style={{ display: 'flex', alignItems: 'center', padding: '10px 12px 8px' }}>
      {(editingId || creating) && (
        <button onClick={() => { setEditingId(null); setCreating(false) }}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.textMuted, padding: '0 8px 0 0', fontSize: 18, lineHeight: 1 }}>‹</button>
      )}
      <span style={{ flex: 1, textAlign: 'center', fontSize: 12, fontWeight: 800, color: C.textWhite, letterSpacing: 0.3 }}>{title}</span>
      <button onClick={onClose}
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.textMuted, fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
    </div>
  )


  return (
    <div ref={ref} style={{ width: 250, background: '#2B2F34', borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.7)', fontFamily: FONT, overflow: 'hidden', ...style }}>
      {editingId ? (
        <>
          {header('Edit label')}
          <LabelEditForm draft={editDraft} setDraft={setEditDraft} onSave={saveEdit}
            onDelete={() => { onDelete(editingId); setEditingId(null) }} />
        </>
      ) : creating ? (
        <>
          {header('Create label')}
          <LabelEditForm draft={newDraft} setDraft={setNewDraft} onSave={handleCreate} saveLabel="Create label" />
        </>
      ) : (
        <>
          {header('Labels')}
          <div style={{ padding: '0 10px 6px' }}>
            <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search labels…" style={{ width: '100%', border: 'none', borderRadius: 6, padding: '8px 10px', fontSize: 12, fontFamily: FONT, fontWeight: 600, outline: 'none', background: C.overlayW10, color: C.textWhite }} />
          </div>
          <div style={{ maxHeight: 240, overflowY: 'auto', padding: '2px 0' }}>
            {filtered.length === 0 && (
              <div style={{ padding: '10px 14px', fontSize: 12, color: C.textMuted, textAlign: 'center' }}>No labels found</div>
            )}
            {filtered.map(label => {
              const on = isOnCard(label.id)
              return (
                <div key={label.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 10px', cursor: 'pointer' }}
                  onClick={e => { if (label.name) onToggle(label); else startEdit(label, e) }}>
                  <div style={{ width: 16, height: 16, borderRadius: 3, flexShrink: 0, border: `2px solid ${on ? label.color : C.textMuted}`, background: on ? label.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {on && <svg width="9" height="9" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </div>
                  <div style={{ flex: 1, height: 32, borderRadius: 6, background: label.color, display: 'flex', alignItems: 'center', padding: '0 10px', overflow: 'hidden' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(0,0,0,0.65)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label.name || 'Click to add a name'}</span>
                  </div>
                  <button onClick={e => startEdit(label, e)}
                    style={{ width: 28, height: 28, borderRadius: 6, background: C.overlayW10, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                    onMouseEnter={e => { e.currentTarget.style.background = C.overlayW20 }}
                    onMouseLeave={e => { e.currentTarget.style.background = C.overlayW10 }}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M11.5 2.5l2 2-8 8H3.5v-2l8-8z" stroke={C.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                </div>
              )
            })}
          </div>
          <div style={{ padding: '8px 10px', borderTop: `1px solid ${C.border}` }}>
            <button onClick={() => setCreating(true)}
              style={{ width: '100%', background: C.overlayW10, border: 'none', borderRadius: 8, padding: '8px 0', fontSize: 12, fontWeight: 700, color: C.textWhite, cursor: 'pointer', fontFamily: FONT, transition: 'background .1s' }}
              onMouseEnter={e => { e.currentTarget.style.background = C.overlayW20 }}
              onMouseLeave={e => { e.currentTarget.style.background = C.overlayW10 }}>
              + Create a new label
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/* ─── Confetti ───────────────────────────────────────────────────────────────── */
function Confetti({ burst, onDone }) {
  useEffect(() => {
    if (!burst) return
    const t = setTimeout(onDone, 2000)
    return () => clearTimeout(t)
  }, [burst, onDone])

  if (!burst) return null
  const particles = Array.from({ length: 8 }, (_, i) => ({
    dx: Math.cos(Math.PI * 2 * i / 8 - Math.PI / 2) * 14,
    dy: Math.sin(Math.PI * 2 * i / 8 - Math.PI / 2) * 14,
    deg: 45 * i, id: i,
  }))

  return (
    <div style={{ position: 'fixed', top: burst.y, left: burst.x, width: 0, height: 0, pointerEvents: 'none', zIndex: 10000 }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute', width: 3, height: 7, borderRadius: 1,
          background: p.id % 2 === 0 ? C.accent : C.accentLight,
          top: p.dy, left: p.dx, opacity: 0,
          animation: `r${burst.id}p${p.id} 900ms ease-out ${p.id * 70}ms forwards`,
        }} />
      ))}
      <style>{particles.map(p => `
        @keyframes r${burst.id}p${p.id} {
          0%   { opacity:0; transform:translate(-50%,-50%) rotate(${p.deg}deg) scale(.5); }
          10%  { opacity:1; transform:translate(-50%,-50%) rotate(${p.deg}deg) scale(1); }
          80%  { opacity:1; transform:translate(-50%,-50%) rotate(${p.deg}deg) scale(1); }
          100% { opacity:0; transform:translate(-50%,-50%) rotate(${p.deg}deg) scale(1); }
        }
      `).join('')}</style>
    </div>
  )
}

/* ─── DueBadge ───────────────────────────────────────────────────────────────── */
function DueBadge({ date, fontSize = 9 }) {
  if (!date) return null
  const ov = isOverdue(date)
  return (
    <span style={{
      fontSize, fontWeight: 800, fontFamily: FONT, letterSpacing: 1, padding: '3px 8px', borderRadius: 6,
      background: ov ? C.dangerBg : C.overlayW20, color: ov ? C.danger : C.textWhite,
    }}>{formatDate(date)}</span>
  )
}

/* ─── ChecklistItem ──────────────────────────────────────────────────────────── */
function ChecklistItem({ item, lc, onToggle, onRename, onDelete, onSetDue }) {
  const [active, setActive] = useState(false)
  const [draft, setDraft] = useState(item.text)
  const [showDue, setShowDue] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { setDraft(item.text) }, [item.text])
  useEffect(() => { if (active && inputRef.current) inputRef.current.focus() }, [active])

  const save = () => { onRename(draft); setActive(false); setShowDue(false) }
  const cancel = () => { setDraft(item.text); setActive(false); setShowDue(false) }

  return (
    <div style={{ marginBottom: 2 }}>
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 8, padding: '5px 6px',
        borderRadius: active ? '6px 6px 0 0' : 6,
        background: active ? C.overlayW10 : 'transparent', transition: 'background .1s',
      }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
      >
        <div onClick={e => { e.stopPropagation(); onToggle() }} style={{
          width: 16, height: 16, borderRadius: 3, cursor: 'pointer', flexShrink: 0, marginTop: 2,
          border: item.done ? 'none' : `2px solid ${C.textMuted}`,
          background: item.done ? lc : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {item.done && <svg width="9" height="9" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
        </div>
        <div style={{ flex: 1, minWidth: 0, cursor: active ? 'auto' : 'text' }} onClick={() => !active && setActive(true)}>
          {active ? (
            <textarea ref={inputRef} value={draft} onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') cancel() }} rows={2}
              style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: 13, fontFamily: FONT, fontWeight: 500, color: C.textWhite, lineHeight: 1.4, resize: 'none', padding: 0, textDecoration: item.done ? 'line-through' : 'none' }}
            />
          ) : (
            <>
              <span className="renameable" style={{ fontSize: 13, fontWeight: 500, fontFamily: FONT, color: item.done ? C.textMuted : C.textWhite, textDecoration: item.done ? 'line-through' : 'none', lineHeight: 1.4, cursor: 'text', display: 'block' }}>
                {item.text}
              </span>
              {item.dueDate && (
                <span style={{ display: 'inline-block', marginTop: 3, fontSize: 9, fontWeight: 800, letterSpacing: 0.8, padding: '2px 6px', borderRadius: 4, fontFamily: FONT, background: isOverdue(item.dueDate) ? C.dangerBg : C.overlayW15, color: isOverdue(item.dueDate) ? C.danger : C.textMuted }}>
                  {formatDate(item.dueDate)}
                </span>
              )}
            </>
          )}
        </div>
      </div>
      {active && (
        <div style={{ background: C.overlayW10, borderRadius: '0 0 6px 6px', padding: '6px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={save} style={{ background: '#0052CC', border: 'none', borderRadius: 4, padding: '5px 12px', fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: FONT }}>Save</button>
          <button onClick={cancel} style={{ background: 'transparent', border: 'none', borderRadius: 4, padding: '5px 10px', fontSize: 12, fontWeight: 600, color: C.textWhite, cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
          <div style={{ flex: 1 }} />
          {/* Due date picker */}
          <div style={{ position: 'relative' }}>
            <div onClick={() => setShowDue(!showDue)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px', borderRadius: 4, cursor: 'pointer', background: showDue ? C.overlayW10 : 'transparent', transition: 'background .1s' }}
              onMouseEnter={e => { if (!showDue) e.currentTarget.style.background = C.overlayW10 }}
              onMouseLeave={e => { if (!showDue) e.currentTarget.style.background = 'transparent' }}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="3" width="12" height="11" rx="2" stroke={item.dueDate ? C.accentLight : C.textMuted} strokeWidth="1.3" />
                <line x1="2" y1="7" x2="14" y2="7" stroke={item.dueDate ? C.accentLight : C.textMuted} strokeWidth="1.3" />
                <line x1="6" y1="1" x2="6" y2="5" stroke={item.dueDate ? C.accentLight : C.textMuted} strokeWidth="1.3" strokeLinecap="round" />
                <line x1="10" y1="1" x2="10" y2="5" stroke={item.dueDate ? C.accentLight : C.textMuted} strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <span style={{ fontSize: 12, fontWeight: 600, color: item.dueDate ? C.accentLight : C.textMuted, fontFamily: FONT }}>
                {item.dueDate ? formatDate(item.dueDate) : 'Due date'}
              </span>
            </div>
            {showDue && (
              <div style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: 4, background: '#1C2026', borderRadius: 8, padding: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 100 }}>
                <input type="date" value={item.dueDate || ''}
                  onChange={e => { onSetDue(e.target.value); setShowDue(false) }}
                  style={{ border: 'none', borderRadius: 6, padding: '7px 10px', fontSize: 12, fontFamily: FONT, outline: 'none', background: C.overlayW10, color: C.textWhite, cursor: 'pointer' }} />
                {item.dueDate && (
                  <div onClick={() => { onSetDue(''); setShowDue(false) }} style={{ fontSize: 10, color: C.textMuted, cursor: 'pointer', textAlign: 'right', marginTop: 4 }}>Clear</div>
                )}
              </div>
            )}
          </div>
          <div onClick={() => { onDelete(); setActive(false) }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px', borderRadius: 4, cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#37222A' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1M5 7v5M8 7v5M11 7v5" stroke={C.danger} strokeWidth="1.3" strokeLinecap="round" /></svg>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.danger, fontFamily: FONT }}>Delete</span>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── TaskPanel ──────────────────────────────────────────────────────────────── */
function SideBtn({ label, icon, onClick }) {
  return (
    <div onClick={onClick} style={{ padding: '7px 12px', borderRadius: 6, cursor: 'pointer', background: C.overlayW10, fontSize: 12, fontWeight: 600, color: C.textWhite, display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4, transition: 'background .1s' }}
      onMouseEnter={e => { e.currentTarget.style.background = C.overlayW20 }}
      onMouseLeave={e => { e.currentTarget.style.background = C.overlayW10 }}>
      {icon}{label}
    </div>
  )
}

function TaskPanel({ task, onUpdate, onDelete, onClose, listName, listColor, boardLabels, onCreateBoardLabel, onUpdateBoardLabel, onDeleteBoardLabel, priorityColors, onUpdatePriorityColor }) {
  const ref = useRef(null)
  const itemRef = useRef(null)
  const [newItem, setNewItem] = useState('')
  const [editingDesc, setEditingDesc] = useState(false)
  const [labelPickerOpen, setLabelPickerOpen] = useState(false)
  const [editingPriorityColor, setEditingPriorityColor] = useState(null)
  const isMobile = useIsMobile()
  const lc = listColor || C.accent
  const pc = priorityColors || DEFAULT_PRIORITY_COLORS()
  const cl = task.checklist || []
  const clDone = cl.filter(c => c.done).length

  useClickOutside(ref, onClose)

  const addItem = () => { if (!newItem.trim()) return; onUpdate({ ...task, checklist: [...cl, { id: uid(), text: newItem.trim(), done: false, dueDate: '' }] }); setNewItem('') }
  const togItem = id => onUpdate({ ...task, checklist: cl.map(c => c.id === id ? { ...c, done: !c.done } : c) })
  const delItem = id => onUpdate({ ...task, checklist: cl.filter(c => c.id !== id) })
  const renItem = (id, t) => onUpdate({ ...task, checklist: cl.map(c => c.id === id ? { ...c, text: t } : c) })

  const closeRef = useRef(null)
  useEffect(() => { closeRef.current?.focus() }, [])

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="tp-title"
      style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: isMobile ? 16 : 40, overflowY: 'auto' }}>
      <div ref={ref} style={{ background: '#23272A', borderRadius: 12, width: '100%', maxWidth: 700, margin: isMobile ? '0 8px 24px' : '0 12px 60px', boxSizing: 'border-box', fontFamily: FONT, boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
        {/* Panel header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: lc }} aria-hidden="true" />
            <span style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: 0.3 }}>{listName}</span>
          </div>
          <button ref={closeRef} onClick={onClose} aria-label="Close card"
            style={{ width: 30, height: 30, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.background = C.overlayW10 }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke={C.textMuted} strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>

        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px 0' }}>
          <div onClick={() => onUpdate({ ...task, done: !task.done })} aria-label={task.done ? 'Mark incomplete' : 'Mark complete'} role="checkbox" aria-checked={task.done} style={{
            width: 22, height: 22, borderRadius: '50%', cursor: 'pointer', flexShrink: 0, marginTop: 4,
            border: task.done ? 'none' : `2px solid ${C.textMuted}`, background: task.done ? lc : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {task.done && <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
          </div>
          <h2 id="tp-title" style={{ margin: 0 }}>
            <Editable value={task.text} onChange={v => onUpdate({ ...task, text: v })} style={{
              fontSize: 20, fontWeight: 700, fontFamily: FONT, color: C.textWhite, lineHeight: 1.3,
              textDecoration: task.done ? 'line-through' : 'none',
            }} />
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 0 }}>
          {/* Main area */}
          <div style={{ flex: 1, padding: '16px 16px 24px', minWidth: 0 }}>
            {/* Action pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20, position: 'relative' }}>
              {[
                { l: '+ Edit labels', fn: () => setLabelPickerOpen(p => !p) },
                { l: '+ Checklist', fn: () => setTimeout(() => itemRef.current?.focus(), 50) },
              ].map(({ l, fn }) => (
                <div key={l} onClick={fn} style={{ padding: '6px 12px', borderRadius: 6, background: C.overlayW10, fontSize: 12, fontWeight: 600, color: C.textWhite, cursor: 'pointer', transition: 'background .1s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.overlayW20 }}
                  onMouseLeave={e => { e.currentTarget.style.background = C.overlayW10 }}>
                  {l}
                </div>
              ))}
              {labelPickerOpen && (
                <div style={{ position: 'absolute', top: '110%', left: 0, zIndex: 100 }}>
                  <BoardLabelPicker
                    boardLabels={boardLabels || []}
                    cardLabels={task.labels}
                    onToggle={label => {
                      const on = task.labels.some(l => l.id === label.id)
                      onUpdate({ ...task, labels: on ? task.labels.filter(l => l.id !== label.id) : [...task.labels, { ...label }] })
                    }}
                    onCreate={nl => {
                      onCreateBoardLabel?.(nl)
                      onUpdate({ ...task, labels: [...task.labels, { ...nl }] })
                    }}
                    onUpdate={(id, patch) => onUpdateBoardLabel?.(id, patch)}
                    onDelete={id => onDeleteBoardLabel?.(id)}
                    onClose={() => setLabelPickerOpen(false)}
                  />
                </div>
              )}
            </div>

            {/* Labels (applied) */}
            {task.labels.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, marginBottom: 8 }}>Labels</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                  {task.labels.map(l => (
                    <div key={l.id} style={{ height: 24, borderRadius: 6, background: l.color, padding: '0 10px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                      onClick={() => setLabelPickerOpen(true)}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(0,0,0,0.6)', letterSpacing: 0.5 }}>{l.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <line x1="2" y1="5" x2="14" y2="5" stroke={C.textMuted} strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="2" y1="8" x2="14" y2="8" stroke={C.textMuted} strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="2" y1="11" x2="9" y2="11" stroke={C.textMuted} strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.textWhite }}>Description</span>
                </div>
                <div onClick={() => setEditingDesc(!editingDesc)} style={{ padding: '4px 12px', borderRadius: 6, background: C.overlayW10, fontSize: 11, fontWeight: 600, color: C.textWhite, cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.overlayW20 }}
                  onMouseLeave={e => { e.currentTarget.style.background = C.overlayW10 }}>
                  Edit
                </div>
              </div>
              {editingDesc ? (
                <textarea value={task.note || ''} onChange={e => onUpdate({ ...task, note: e.target.value })}
                  autoFocus placeholder="Add a more detailed description…" rows={4}
                  style={{ width: '100%', border: 'none', borderRadius: 8, padding: 12, fontSize: 13, fontFamily: FONT, outline: 'none', resize: 'vertical', background: C.overlayW10, color: C.textWhite, lineHeight: 1.5 }} />
              ) : (
                <div onClick={() => setEditingDesc(true)} style={{ fontSize: 13, color: task.note ? C.textWhite : C.textMuted, lineHeight: 1.5, cursor: 'text', padding: '8px 0' }}>
                  {task.note || 'Add a more detailed description…'}
                </div>
              )}
            </div>

            {/* Checklist */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8l4 4 8-8" stroke={C.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.textWhite }}>Checklist</span>
                {cl.length > 0 && <span style={{ fontSize: 11, color: C.textMuted, marginLeft: 4 }}>{clDone}/{cl.length}</span>}
              </div>
              {cl.length > 0 && (
                <div style={{ height: 4, borderRadius: 2, background: C.overlayW10, marginBottom: 10 }}>
                  <div style={{ height: '100%', borderRadius: 2, background: lc, width: `${(clDone / cl.length) * 100}%`, transition: 'width .3s' }} />
                </div>
              )}
              {cl.map(item => (
                <ChecklistItem key={item.id} item={item} lc={lc}
                  onToggle={() => togItem(item.id)}
                  onRename={t => renItem(item.id, t)}
                  onDelete={() => delItem(item.id)}
                  onSetDue={d => onUpdate({ ...task, checklist: cl.map(c => c.id === item.id ? { ...c, dueDate: d } : c) })}
                />
              ))}
              <div style={{ marginTop: 6 }}>
                <input ref={itemRef} value={newItem} onChange={e => setNewItem(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addItem() }}
                  placeholder="Add an item…"
                  style={{ width: '100%', border: 'none', borderRadius: 6, padding: '8px 10px', fontSize: 13, fontFamily: FONT, outline: 'none', background: C.overlayW10, color: C.textWhite }} />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ width: isMobile ? '100%' : 190, padding: isMobile ? '0 16px 24px' : '16px 16px 24px 0', flexShrink: 0, boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: 0.5 }}>Priority</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
              {PRIORITY_LEVEL_ORDER.map(level => {
                const active = task.priority === level
                return (
                  <div key={level} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button onClick={() => onUpdate({ ...task, priority: active ? null : level })}
                      aria-pressed={active}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', gap: 8, border: 'none', borderRadius: 6,
                        padding: '7px 10px', cursor: 'pointer', fontFamily: FONT,
                        background: active ? pc[level] : C.overlayW10,
                        color: active ? 'rgba(0,0,0,0.75)' : C.textWhite,
                        fontSize: 12, fontWeight: 700, textAlign: 'left',
                      }}>
                      <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', background: pc[level], flexShrink: 0, boxShadow: active ? 'none' : `0 0 0 1px ${C.overlayW40}` }} />
                      {PRIORITY_LABELS[level]}
                    </button>
                    <button onClick={() => setEditingPriorityColor(p => p === level ? null : level)}
                      aria-label={`Customize ${PRIORITY_LABELS[level]} color`}
                      style={{ width: 22, height: 22, flexShrink: 0, border: 'none', borderRadius: 5, background: C.overlayW10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M11.5 2.5l2 2-8 8H3.5v-2l8-8z" stroke={C.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                    {editingPriorityColor === level && (
                      <ColorPicker colors={PALETTE} current={pc[level]}
                        onPick={c => onUpdatePriorityColor?.(level, c)}
                        onClose={() => setEditingPriorityColor(null)} />
                    )}
                  </div>
                )
              })}
            </div>

            <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: 0.5, marginBottom: 8 }}>Due date</div>
            <input type="date" value={task.dueDate || ''}
              onChange={e => onUpdate({ ...task, dueDate: e.target.value })}
              style={{ width: '100%', border: 'none', borderRadius: 6, padding: '7px 10px', fontSize: 12, fontFamily: FONT, outline: 'none', background: C.overlayW10, color: C.textWhite, cursor: 'pointer', marginBottom: 2 }} />
            {task.dueDate && <div onClick={() => onUpdate({ ...task, dueDate: '' })} style={{ fontSize: 10, color: C.textMuted, cursor: 'pointer', textAlign: 'right', marginBottom: 12 }}>Clear</div>}

            <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: 0.5, marginBottom: 8, marginTop: 8 }}>Time slot</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
              <input type="time" value={task.startTime || ''} onChange={e => onUpdate({ ...task, startTime: e.target.value })}
                style={{ width: '100%', border: 'none', borderRadius: 6, padding: '7px 10px', fontSize: 12, fontFamily: FONT, outline: 'none', background: C.overlayW10, color: C.textWhite, cursor: 'pointer' }} />
              <input type="time" value={task.endTime || ''} onChange={e => onUpdate({ ...task, endTime: e.target.value })}
                style={{ width: '100%', border: 'none', borderRadius: 6, padding: '7px 10px', fontSize: 12, fontFamily: FONT, outline: 'none', background: C.overlayW10, color: C.textWhite, cursor: 'pointer' }} />
              {(task.startTime || task.endTime) && <div onClick={() => onUpdate({ ...task, startTime: '', endTime: '' })} style={{ fontSize: 10, color: C.textMuted, cursor: 'pointer', textAlign: 'right' }}>Clear</div>}
            </div>

            <div style={{ height: 1, background: C.overlayW10, marginBottom: 8 }} />
            <SideBtn label="Delete card"
              icon={<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke={C.danger} strokeWidth="1.5" strokeLinecap="round" /></svg>}
              onClick={() => { onClose(); onDelete() }} />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── TaskCard ───────────────────────────────────────────────────────────────── */
function QItem({ label, color, onClick }) {
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', padding: '9px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: color || C.textWhite, fontFamily: FONT, transition: 'background .1s' }}
      onMouseEnter={e => { e.currentTarget.style.background = C.overlayW10 }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
      <span>{label}</span>
    </div>
  )
}

function TaskCard({ task, listId, listColor, onToggle, onUpdate, onDelete,
  isFocused, isSelected, focusedAction, onActionDone, onOpenPanel, onFocusCard, onShiftClick,
  boardLabels, onCreateBoardLabel, onUpdateBoardLabel, onDeleteBoardLabel,
  textSize, priorityColors }) {
  const ts = textSize || TASK_TEXT_SIZE_PRESETS.medium
  const pc = priorityColors || DEFAULT_PRIORITY_COLORS()
  const [burst, setBurst] = useState(null)
  const [qView, setQView] = useState('main') // 'main' | 'labels'
  const [quickEdit, setQuickEdit] = useState(false)
  const [editDraft, setEditDraft] = useState('')
  const [isHovered, setIsHovered] = useState(false)
  const [isDraggingSelf, setIsDraggingSelf] = useState(false)
  const [quickEditRect, setQuickEditRect] = useState(null)
  const [labelsCompact, setLabelsCompact] = useState(false)
  const chkRef = useRef(null)
  const editRef = useRef(null)
  const cardRef = useRef(null)
  const quickMenuRef = useRef(null)
  const lc = listColor || C.accent
  const cl = task.checklist || []
  const clDone = cl.filter(c => c.done).length

  const openQuickEdit = () => {
    setEditDraft(task.text)
    const r = cardRef.current?.getBoundingClientRect()
    setQuickEditRect(r ? { top: r.top, right: r.right, left: r.left, bottom: r.bottom } : null)
    setQuickEdit(true)
  }
  const closeQuickEdit = () => { setQuickEdit(false); setQuickEditRect(null); setQView('main') }
  const saveEdit = () => { if (editDraft.trim()) onUpdate({ ...task, text: editDraft.trim() }); closeQuickEdit() }

  useEffect(() => { if (quickEdit && editRef.current) editRef.current.focus() }, [quickEdit])

  useEffect(() => {
    if (!quickEdit) return
    const h = e => {
      if (cardRef.current?.contains(e.target) || quickMenuRef.current?.contains(e.target)) return
      closeQuickEdit()
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [quickEdit])

  useEffect(() => {
    if (!isHovered || quickEdit) return
    const h = e => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return
      if (e.key === 'e' || e.key === 'E') { e.preventDefault(); openQuickEdit() }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [isHovered, quickEdit, task.text])

  useEffect(() => {
    if (!isFocused || !focusedAction) return
    if (focusedAction === 'quickEdit') { openQuickEdit(); onActionDone?.() }
  }, [isFocused, focusedAction])

  const handleToggle = e => {
    e.stopPropagation()
    if (!task.done && chkRef.current) {
      const r = chkRef.current.getBoundingClientRect()
      setBurst({ id: Date.now(), x: r.left + r.width / 2, y: r.top + r.height / 2 })
    }
    onToggle()
  }

  return (
    <>
      <div ref={cardRef}
        className={`task-card${isFocused ? ' is-focused' : ''}${isSelected ? ' is-selected' : ''}${isDraggingSelf ? ' is-dragging' : ''}`}
        role="article"
        tabIndex={0}
        aria-label={`${task.text}${task.done ? ', completed' : ''}`}
        draggable
        onClick={e => {
          if (quickEdit) return
          if (e.shiftKey) { onShiftClick?.(listId, task.id); return }
          onFocusCard?.(listId, task.id)
          onOpenPanel?.(task.id)
        }}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onFocusCard?.(listId, task.id); onOpenPanel?.(task.id) }
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDragStart={e => { e.stopPropagation(); e.dataTransfer.setData('taskId', task.id); e.dataTransfer.setData('sourceListId', listId); e.dataTransfer.effectAllowed = 'move'; setIsDraggingSelf(true) }}
        onDragEnd={() => setIsDraggingSelf(false)}
        style={{
          background: '#1E2328', borderRadius: 12,
          padding: '18px 18px',
          cursor: 'pointer', position: 'relative',
          border: '2px solid rgba(255,255,255,0.07)',
          transition: 'border-color .15s, transform .12s',
        }}
      >
        {isSelected && (
          <div aria-hidden="true" style={{ position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: '50%', background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
            <svg width="10" height="10" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
        )}
        {/* Label pills */}
        {task.labels.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10, alignItems: 'center' }} onClick={e => { e.stopPropagation(); setLabelsCompact(c => !c) }}>
            {task.labels.map(l => (
              labelsCompact
                ? <div key={l.id} style={{ height: 8, width: 36, borderRadius: 3, background: l.color, cursor: 'pointer' }} />
                : <div key={l.id} className="renameable" style={{ display: 'inline-flex', alignItems: 'center', background: l.color, borderRadius: 6, padding: '5px 9px', fontSize: 10, fontWeight: 800, color: C.textWhite, letterSpacing: 0.6, fontFamily: FONT, cursor: 'pointer', userSelect: 'none' }}>
                  {l.name}
                </div>
            ))}
          </div>
        )}

        {/* Task text row */}
        {quickEdit ? (
          <div onClick={e => e.stopPropagation()} style={{ marginBottom: 12 }}>
            <textarea ref={editRef} value={editDraft} onChange={e => setEditDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit() } if (e.key === 'Escape') closeQuickEdit() }}
              rows={3} style={{ width: '100%', background: C.overlayW10, border: 'none', borderRadius: 6, padding: '8px 10px', outline: 'none', fontSize: 14, fontWeight: 600, color: C.textWhite, fontFamily: FONT, lineHeight: 1.5, resize: 'none' }} />
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginBottom: 12 }}>
            <div ref={chkRef} onClick={handleToggle}
              className={`task-chk${task.done ? ' chk-done' : ''}`}
              style={{
                width: 18, height: 18, borderRadius: '50%', cursor: 'pointer', flexShrink: 0, marginTop: 2,
                border: task.done ? 'none' : '2px solid rgba(255,255,255,0.22)',
                background: task.done ? lc : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              {task.done && <svg width="9" height="9" viewBox="0 0 12 12" className={burst ? 'check-bounce' : ''}><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </div>
            <div className="task-text" style={{ flex: 1, fontSize: ts.title, fontWeight: 600, color: C.textWhite, lineHeight: 1.5 }}>
              {task.text}
            </div>
            <div onClick={e => { e.stopPropagation(); openQuickEdit() }} className="chk-tr" style={{
              width: 22, height: 22, borderRadius: 6, cursor: 'pointer', flexShrink: 0,
              background: C.overlayW10, display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: 0, transition: 'opacity .15s',
            }}>
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M11.5 2.5l2 2-8 8H3.5v-2l8-8z" stroke={C.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
          </div>
        )}

        {/* Badges row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Priority */}
          {task.priority && (
            <span style={{
              fontSize: ts.meta, fontWeight: 800, fontFamily: FONT, letterSpacing: 0.6, textTransform: 'uppercase',
              padding: '3px 8px', borderRadius: 6, background: pc[task.priority], color: 'rgba(0,0,0,0.7)',
            }}>{PRIORITY_LABELS[task.priority]}</span>
          )}

          {/* Checklist */}
          {cl.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="12" height="12" rx="2.5" stroke={clDone === cl.length ? '#43aa8b' : C.textMuted} strokeWidth="1.4" />
                {clDone === cl.length && <path d="M4.5 8l3 3 4-5" stroke="#43aa8b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
              </svg>
              <span style={{ fontSize: ts.meta, fontWeight: 700, color: clDone === cl.length ? '#43aa8b' : C.textMuted, fontFamily: FONT, letterSpacing: 0.2 }}>{clDone}/{cl.length}</span>
            </div>
          )}

          {/* Due date */}
          {task.dueDate && <DueBadge date={task.dueDate} fontSize={ts.meta} />}

          {/* Note indicator */}
          {task.note && (
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.4 }}>
              <line x1="2" y1="5" x2="14" y2="5" stroke={C.textWhite} strokeWidth="1.5" strokeLinecap="round" />
              <line x1="2" y1="8" x2="14" y2="8" stroke={C.textWhite} strokeWidth="1.5" strokeLinecap="round" />
              <line x1="2" y1="11" x2="9" y2="11" stroke={C.textWhite} strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </div>

      </div>

      <Confetti burst={burst} onDone={() => setBurst(null)} />
      {quickEdit && quickEditRect && (() => {
        const isLabels = qView === 'labels'
        const menuW = isLabels ? 250 : 210
        const spaceRight = window.innerWidth - quickEditRect.right - 8
        const left = spaceRight >= menuW ? quickEditRect.right + 8 : quickEditRect.left - menuW - 8
        const top = Math.min(quickEditRect.top, window.innerHeight - (isLabels ? 420 : 280))
        return (
          <div ref={quickMenuRef} onClick={e => e.stopPropagation()}
            style={{ position: 'fixed', top, left, zIndex: 10001, width: menuW, background: '#2B2F34', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.65)', overflow: 'hidden', fontFamily: FONT }}>
            {isLabels ? (
              <BoardLabelPicker
                boardLabels={boardLabels || []}
                cardLabels={task.labels}
                onToggle={label => {
                  const on = task.labels.some(l => l.id === label.id)
                  onUpdate({ ...task, labels: on ? task.labels.filter(l => l.id !== label.id) : [...task.labels, { ...label }] })
                }}
                onCreate={nl => {
                  onCreateBoardLabel?.(nl)
                  onUpdate({ ...task, labels: [...task.labels, { ...nl }] })
                }}
                onUpdate={(id, patch) => onUpdateBoardLabel?.(id, patch)}
                onDelete={id => onDeleteBoardLabel?.(id)}
                onClose={() => setQView('main')}
                style={{ boxShadow: 'none', borderRadius: 0 }}
              />
            ) : (
              <>
                <div style={{ padding: '10px 12px 8px', borderBottom: `1px solid ${C.border}` }}>
                  <button onClick={saveEdit} style={{ width: '100%', background: lc, border: 'none', borderRadius: 6, padding: '7px 0', fontSize: 12, fontWeight: 800, color: '#fff', cursor: 'pointer', fontFamily: FONT, letterSpacing: 0.3 }}>Save</button>
                </div>
                <div style={{ padding: '4px 0' }}>
                  <QItem label="Open card" onClick={() => { saveEdit(); closeQuickEdit(); onOpenPanel?.(task.id) }} />
                  <QItem label="Edit labels" onClick={() => setQView('labels')} />
                  <QItem label="Edit due date" onClick={() => { saveEdit(); closeQuickEdit(); onOpenPanel?.(task.id) }} />
                  <div style={{ height: 1, background: C.border, margin: '4px 0' }} />
                  <QItem label="Delete card" color={C.danger} onClick={() => { closeQuickEdit(); onDelete() }} />
                </div>
              </>
            )}
          </div>
        )
      })()}
    </>
  )
}

/* ─── TaskList ───────────────────────────────────────────────────────────────── */
function DropLine() {
  return <div style={{ height: 3, background: C.card, borderRadius: 2, margin: '2px 8px', opacity: 0.6 }} />
}

function TaskList({ list, onUpdate, onDelete, onCopy, onMoveLeft, onMoveRight, canMoveLeft, canMoveRight, boards, currentBoardId, onMoveToBoard,
  taskDrop, onTaskDragOver, onTaskDrop, isDragging, onListDragStart, onListDragOver, onListDrop, onListDragEnd,
  focusedCard, selectedCards, focusedAction, onActionDone, onOpenPanel, onFocusCard, onShiftClick, requestAdd, onAddDone,
  requestRename, onRenameDone, sizePreset, layoutMode,
  boardLabels, onCreateBoardLabel, onUpdateBoardLabel, onDeleteBoardLabel,
  textSize, priorityColors, onUpdatePriorityColor }) {
  const preset = sizePreset || LIST_SIZE_PRESETS.normal
  const isClassic = layoutMode === 'classic'
  const isGray = list.color === C.borderHover
  const [showMenu, setShowMenu]       = useState(false)
  const [menuPos, setMenuPos]         = useState(null)
  const [showCPMenu, setShowCPMenu]   = useState(false)
  const [showBoardPicker, setShowBoardPicker] = useState(false)
  const [taskText, setTaskText]   = useState('')
  const [adding, setAdding]       = useState(false)
  const inputRef  = useRef(null)
  const menuRef   = useRef(null)
  const menuBtnRef = useRef(null)
  const addBoxRef = useRef(null)
  const nameRef = useRef(null)

  useEffect(() => {
    if (requestRename === list.id) { nameRef.current?.focus(); onRenameDone?.() }
  }, [requestRename])

  useEffect(() => {
    if (!showMenu) return
    const h = e => {
      if (!menuRef.current?.contains(e.target) && !menuBtnRef.current?.contains(e.target)) {
        setShowMenu(false); setShowCPMenu(false)
      }
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [showMenu])

  useEffect(() => {
    if (!adding) return
    const h = e => {
      if (addBoxRef.current && !addBoxRef.current.contains(e.target)) {
        setAdding(false); setTaskText('')
      }
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [adding])

  const openMenu = e => {
    e.stopPropagation()
    const r = menuBtnRef.current?.getBoundingClientRect()
    if (r) setMenuPos({ top: r.bottom + 6, left: Math.min(r.left, window.innerWidth - 220) })
    setShowMenu(v => !v)
    setShowCPMenu(false)
  }

  useEffect(() => { if (adding && inputRef.current) inputRef.current.focus() }, [adding])

  useEffect(() => {
    if (requestAdd === list.id) { setAdding(true); onAddDone?.() }
  }, [requestAdd])

  const updList = patch => onUpdate({ ...list, ...patch })
  const addTask = () => {
    if (!taskText.trim()) return
    onUpdate({ ...list, tasks: [...list.tasks, newTask(taskText.trim())] })
    setTaskText('')
  }
  const updTask = (id, u) => onUpdate({ ...list, tasks: list.tasks.map(t => t.id === id ? u : t) })
  const togTask = id => onUpdate({ ...list, tasks: list.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t) })
  const delTask = id => onUpdate({ ...list, tasks: list.tasks.filter(t => t.id !== id) })

  const handleAreaDragOver = e => {
    if (!e.dataTransfer.types.includes('taskid')) return
    e.preventDefault(); e.stopPropagation()
    onTaskDragOver(list.id, list.tasks.length)
  }
  const handleCardDragOver = (e, i) => {
    if (!e.dataTransfer.types.includes('taskid')) return
    e.preventDefault(); e.stopPropagation()
    const r = e.currentTarget.getBoundingClientRect()
    onTaskDragOver(list.id, e.clientY < r.top + r.height / 2 ? i : i + 1)
  }
  const handleDrop = e => {
    if (!e.dataTransfer.types.includes('taskid')) return
    e.preventDefault(); e.stopPropagation()
    onTaskDrop(e.dataTransfer.getData('taskId'), e.dataTransfer.getData('sourceListId'))
  }

  const showInd = taskDrop && taskDrop.listId === list.id

  return (
    <div
      draggable
      data-listid={list.id}
      onDragStart={onListDragStart}
      onDragOver={e => {
        if (e.dataTransfer.types.includes('taskid')) { e.preventDefault(); onTaskDragOver(list.id, list.tasks.length) }
        else onListDragOver(e)
      }}
      onDrop={e => { if (e.dataTransfer.types.includes('taskid')) handleDrop(e); else onListDrop(e) }}
      onDragEnd={onListDragEnd}
      style={isClassic
        ? { borderRadius: LIST_R, background: list.color, position: 'relative', opacity: isDragging ? 0.15 : 1, transition: 'opacity .15s', cursor: 'pointer' }
        : { borderRadius: LIST_R, background: list.color, position: 'relative', opacity: isDragging ? 0.15 : 1, transition: 'opacity .15s', cursor: 'pointer', width: preset.width, flexShrink: 0 }}>
      {/* List header */}
      {isClassic ? (
        <div style={{ padding: '18px 28px 24px', userSelect: 'none', minHeight: 122, position: 'relative' }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <Editable ref={nameRef} value={list.name} onChange={v => updList({ name: v })} style={{
              fontSize: 40, fontFamily: FONT, fontWeight: 900, color: isGray ? C.textWhite : C.text, letterSpacing: -2, lineHeight: 1, display: 'block',
            }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: isGray ? C.overlayW40 : C.overlayB40, fontFamily: FONT, letterSpacing: 1 }}>
              {list.tasks.length} {list.tasks.length === 1 ? 'TASK' : 'TASKS'}
            </span>
            <div style={{ flex: 1 }} />
            <div ref={menuBtnRef} onClick={openMenu} style={{ width: 28, height: 28, borderRadius: 8, background: isGray ? C.overlayW10 : C.overlayB10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: isGray ? C.overlayW40 : C.overlayB40 }} />)}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: preset.headerPad, userSelect: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Editable ref={nameRef} value={list.name} onChange={v => updList({ name: v })} style={{
              fontSize: preset.titleSize, fontFamily: FONT, fontWeight: 800, color: isGray ? C.textWhite : C.text, letterSpacing: -0.3, lineHeight: 1.2, display: 'block',
            }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 800, color: isGray ? C.overlayW40 : C.overlayB40, fontFamily: FONT, letterSpacing: 0.5, flexShrink: 0 }}>
            {list.tasks.length}
          </span>
          <div ref={menuBtnRef} onClick={openMenu} style={{ width: 26, height: 26, borderRadius: 8, background: isGray ? C.overlayW10 : C.overlayB10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, flexShrink: 0 }}>
            {[0,1,2].map(i => <div key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: isGray ? C.overlayW40 : C.overlayB40 }} />)}
          </div>
        </div>
      )}

      {/* Tasks */}
      <ul role="list" aria-label={`${list.name} tasks`}
        onDragOver={handleAreaDragOver} onDrop={handleDrop}
        style={{ padding: '0 10px 12px', display: 'flex', flexDirection: 'column', gap: 8, listStyle: 'none', margin: 0 }}>
          {list.tasks.map((task, idx) => (
            <Fragment key={task.id}>
              {showInd && taskDrop.index === idx && <DropLine />}
              <li onDragOver={e => handleCardDragOver(e, idx)} style={{ listStyle: 'none' }}>
                <TaskCard task={task} listId={list.id} listColor={list.color}
                  onToggle={() => togTask(task.id)}
                  onUpdate={u => updTask(task.id, u)}
                  onDelete={() => delTask(task.id)}
                  isFocused={focusedCard?.listId === list.id && focusedCard?.taskId === task.id}
                  isSelected={selectedCards?.has(task.id)}
                  focusedAction={focusedCard?.listId === list.id && focusedCard?.taskId === task.id ? focusedAction : null}
                  onActionDone={onActionDone}
                  onOpenPanel={onOpenPanel}
                  onFocusCard={onFocusCard}
                  onShiftClick={onShiftClick}
                  boardLabels={boardLabels}
                  onCreateBoardLabel={onCreateBoardLabel}
                  onUpdateBoardLabel={onUpdateBoardLabel}
                  onDeleteBoardLabel={onDeleteBoardLabel}
                  textSize={textSize}
                  priorityColors={priorityColors}
                  onUpdatePriorityColor={onUpdatePriorityColor} />
              </li>
            </Fragment>
          ))}
          {showInd && taskDrop.index === list.tasks.length && <DropLine />}

          {adding ? (
            <div ref={addBoxRef} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{
                background: '#1E2328', borderRadius: 12, padding: '18px 18px',
                border: '2px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'flex-start', gap: 9,
              }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 2, border: '2px solid rgba(255,255,255,0.22)' }} />
                <input ref={inputRef} value={taskText} onChange={e => setTaskText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addTask(); if (e.key === 'Escape') { setAdding(false); setTaskText('') } }}
                  placeholder="Task name…"
                  style={{ flex: 1, border: 'none', padding: 0, fontSize: 14, fontFamily: FONT, fontWeight: 600, outline: 'none', background: 'transparent', color: C.textWhite, lineHeight: 1.5 }} />
              </div>
              <div onClick={addTask} style={{ fontSize: 12, color: C.overlayB35, cursor: 'pointer', padding: '10px 16px', textAlign: 'center', borderRadius: R - 4, transition: 'all .15s', fontFamily: FONT, fontWeight: 800, letterSpacing: 0.5 }}
                onMouseEnter={e => { e.target.style.background = C.overlay06; e.target.style.color = C.text }}
                onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = C.overlayB35 }}>
                + ADD TASK
              </div>
            </div>
          ) : (
            <div onClick={() => setAdding(true)} style={{ fontSize: 12, color: C.overlayB35, cursor: 'pointer', padding: '12px 16px', textAlign: 'center', borderRadius: R - 4, transition: 'all .15s', fontFamily: FONT, fontWeight: 800, letterSpacing: 0.5 }}
              onMouseEnter={e => { e.target.style.background = C.overlay06; e.target.style.color = C.text }}
              onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = C.overlayB35 }}>
              + ADD TASK
            </div>
          )}
      </ul>
      {showMenu && menuPos && (
        <div ref={menuRef} onClick={e => e.stopPropagation()} style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, zIndex: 10002, width: 210, background: '#2B2F34', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.6)', overflow: 'hidden', fontFamily: FONT }}>
          <div style={{ padding: '16px 14px 14px', borderBottom: `1px solid ${C.border}`, textAlign: 'center', position: 'relative' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.textWhite, letterSpacing: 0.3 }}>List actions</span>
            <div onClick={() => setShowMenu(false)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: C.textMuted, fontSize: 18, lineHeight: 1 }}>×</div>
          </div>
          {[
            { label: 'Add task',  fn: () => { setAdding(true); setShowMenu(false) } },
            { label: 'Copy list', fn: () => { onCopy?.(); setShowMenu(false) } },
          ].map(({ label, fn }) => (
            <div key={label} onClick={fn} style={{ padding: '9px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C.textWhite, transition: 'background .1s' }}
              onMouseEnter={e => { e.currentTarget.style.background = C.overlayW10 }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
              {label}
            </div>
          ))}
          <div>
            <div style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: C.textWhite }}>
              Move list
            </div>
            <div style={{ display: 'flex', gap: 6, padding: '0 14px 10px', alignItems: 'center' }}>
              <div onClick={() => { if (canMoveLeft) { onMoveLeft?.(); setShowMenu(false) } }} style={{ flex: 1, textAlign: 'center', padding: '6px 0', borderRadius: 6, background: canMoveLeft ? C.overlayW10 : C.border, opacity: canMoveLeft ? 1 : 0.35, cursor: canMoveLeft ? 'pointer' : 'default', fontSize: 13, color: C.textWhite, transition: 'background .1s' }}
                onMouseEnter={e => { if (canMoveLeft) e.currentTarget.style.background = C.overlayW20 }}
                onMouseLeave={e => { if (canMoveLeft) e.currentTarget.style.background = C.overlayW10 }}>← Left</div>
              <div onClick={() => { if (canMoveRight) { onMoveRight?.(); setShowMenu(false) } }} style={{ flex: 1, textAlign: 'center', padding: '6px 0', borderRadius: 6, background: canMoveRight ? C.overlayW10 : C.border, opacity: canMoveRight ? 1 : 0.35, cursor: canMoveRight ? 'pointer' : 'default', fontSize: 13, color: C.textWhite, transition: 'background .1s' }}
                onMouseEnter={e => { if (canMoveRight) e.currentTarget.style.background = C.overlayW20 }}
                onMouseLeave={e => { if (canMoveRight) e.currentTarget.style.background = C.overlayW10 }}>Right →</div>
            </div>
            <div onClick={() => setShowBoardPicker(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C.textWhite, transition: 'background .1s' }}
              onMouseEnter={e => { e.currentTarget.style.background = C.overlayW10 }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
              Move to board
              <svg width="10" height="10" viewBox="0 0 12 12" style={{ marginLeft: 'auto', transform: showBoardPicker ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} fill="none"><path d="M2 4l4 4 4-4" stroke={C.textMuted} strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            {showBoardPicker && (
              <div style={{ padding: '0 10px 8px' }}>
                {(boards || []).filter(b => b.id !== currentBoardId).map(b => (
                  <div key={b.id} onClick={() => { onMoveToBoard?.(b.id); setShowMenu(false) }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: C.textWhite, transition: 'background .1s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = C.overlayW10 }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: b.color, flexShrink: 0 }} />
                    {b.name}
                  </div>
                ))}
                {(boards || []).filter(b => b.id !== currentBoardId).length === 0 && (
                  <div style={{ padding: '6px 10px', fontSize: 11, color: C.textMuted, fontFamily: FONT }}>No other boards</div>
                )}
              </div>
            )}
          </div>
          <div style={{ height: 1, background: C.border }} />
          <div onClick={() => setShowCPMenu(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C.textWhite, transition: 'background .1s' }}
            onMouseEnter={e => { e.currentTarget.style.background = C.overlayW10 }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
            <div style={{ width: 14, height: 14, borderRadius: 4, background: list.color, flexShrink: 0 }} />
            Change list color
            <svg width="10" height="10" viewBox="0 0 12 12" style={{ marginLeft: 'auto', transform: showCPMenu ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} fill="none"><path d="M2 4l4 4 4-4" stroke={C.textMuted} strokeWidth="1.5" strokeLinecap="round" /></svg>
          </div>
          {showCPMenu && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, padding: '6px 14px 10px' }}>
              {PALETTE.map(c => (
                <div key={c} onClick={() => { updList({ color: c }); setShowMenu(false); setShowCPMenu(false) }} style={{ width: 22, height: 22, borderRadius: 6, background: c, cursor: 'pointer', border: c === list.color ? `2px solid ${C.textWhite}` : '2px solid transparent', transition: 'transform .1s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.15)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }} />
              ))}
            </div>
          )}
          <div style={{ height: 1, background: C.border }} />
          <div onClick={() => { onDelete(); setShowMenu(false) }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C.danger, transition: 'background .1s' }}
            onMouseEnter={e => { e.currentTarget.style.background = C.dangerBg }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
            Delete list
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── MiniCalendar ───────────────────────────────────────────────────────────── */
function MiniCalendar({ onPickDate, onClose }) {
  const [viewDate, setViewDate] = useState(new Date())
  const ref = useRef(null)

  useClickOutside(ref, onClose)

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const monthName = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()

  const firstDay = new Date(year, month, 1)
  const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1
  const daysInMon = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMon; d++) cells.push(d)

  const t = todayStr()
  const DAY_LABELS = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']

  return (
    <div ref={ref} style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 8, zIndex: 200, background: C.card, borderRadius: R, padding: 16, width: 280, boxShadow: `0 16px 48px ${C.shadowDeep}`, fontFamily: FONT }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div onClick={() => setViewDate(new Date(year, month - 1, 1))} style={{ cursor: 'pointer', padding: 4 }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 4l-4 4 4 4" stroke={C.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <span style={{ fontSize: 13, fontWeight: 800, color: C.text, letterSpacing: 0.5 }}>{monthName}</span>
        <div onClick={() => setViewDate(new Date(year, month + 1, 1))} style={{ cursor: 'pointer', padding: 4 }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke={C.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {DAY_LABELS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 9, fontWeight: 800, color: C.textMuted, padding: 4, letterSpacing: 0.5 }}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((day, i) => {
          if (day === null) return <div key={`e${i}`} />
          const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isT = ds === t
          return (
            <div key={i} onClick={() => { onPickDate(ds); onClose() }} style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: isT ? C.textWhite : C.text, background: isT ? C.accent : 'transparent', borderRadius: 8, padding: '6px 0', cursor: 'pointer', transition: 'background .1s' }}
              onMouseEnter={e => { if (!isT) e.currentTarget.style.background = C.cardAlt }}
              onMouseLeave={e => { if (!isT) e.currentTarget.style.background = 'transparent' }}>
              {day}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── AgendaDay ──────────────────────────────────────────────────────────────── */
function AgendaDay({ day, tasks, isToday, lists, tags, onUpdateTags, onToggle, onAddTask }) {
  const [adding, setAdding] = useState(false)
  const [taskText, setTaskText] = useState('')
  const [selListId, setSelListId] = useState(lists[0]?.id || '')
  const inputRef = useRef(null)

  useEffect(() => { if (adding && inputRef.current) inputRef.current.focus() }, [adding])

  const handleAdd = () => {
    if (!taskText.trim() || !selListId) return
    onAddTask(selListId, taskText.trim(), day.date)
    setTaskText('')
  }

  const addTag = () => onUpdateTags([...tags, { id: uid(), name: 'TAG', color: PALETTE[Math.floor(Math.random() * PALETTE.length)] }])
  const updTag = (id, k, v) => onUpdateTags(tags.map(t => t.id === id ? { ...t, [k]: v } : t))
  const removeTag = id => onUpdateTags(tags.filter(t => t.id !== id))

  const numStr = String(day.dayNum).padStart(2, '0')
  const dayAbbr = day.full.slice(0, 2)

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0, borderBottom: `1px solid ${C.border}`, overflow: 'hidden' }}>

      {/* ── Left: large date ── */}
      <div style={{ width: 110, flexShrink: 0, padding: '12px 18px 12px 0', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
        <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1, letterSpacing: -3, fontFamily: FONT, color: isToday ? C.accent : C.textWhite }}>
          {numStr}
        </div>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 3, marginTop: 4, fontFamily: FONT, color: isToday ? C.accent : C.textMuted }}>
          {dayAbbr}
        </div>
      </div>

      {/* ── Vertical rule ── */}
      <div style={{ width: 1, background: C.border, flexShrink: 0, margin: '12px 0' }} />

      {/* ── Right: events ── */}
      <div style={{ flex: 1, padding: '10px 0 10px 24px', minWidth: 0, overflowY: 'auto' }}>

        {/* Day tags row */}
        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 16, alignItems: 'center' }}>
            {tags.map(tag => (
              <LabelPill key={tag.id} label={tag} onRename={v => updTag(tag.id, 'name', v)} onChangeColor={c => updTag(tag.id, 'color', c)} onRemove={() => removeTag(tag.id)} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {tasks.length === 0 && !adding && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: C.textMuted, fontSize: 13, fontFamily: FONT, fontWeight: 500, paddingTop: 6 }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="3" width="12" height="11" rx="2" stroke={C.textMuted} strokeWidth="1.3" />
              <line x1="2" y1="7" x2="14" y2="7" stroke={C.textMuted} strokeWidth="1.3" />
              <line x1="6" y1="1" x2="6" y2="5" stroke={C.textMuted} strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            No task planned yet
          </div>
        )}

        {/* Event rows */}
        {tasks.map(t => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'stretch', gap: 16, padding: '12px 0', borderBottom: `1px solid ${C.border}` }}>
            {/* Time slot */}
            <div style={{ width: 88, flexShrink: 0, paddingTop: 2 }}>
              {t.startTime || t.endTime ? (
                <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, fontFamily: FONT, letterSpacing: 0.2, lineHeight: 1.5 }}>
                  {t.startTime && <div>{t.startTime}</div>}
                  {t.endTime && <div style={{ opacity: 0.6 }}>– {t.endTime}</div>}
                </div>
              ) : (
                <div style={{ fontSize: 11, color: C.textMuted, opacity: 0.4, fontFamily: FONT }}>—</div>
              )}
            </div>

            {/* Accent bar */}
            <div style={{ width: 3, borderRadius: 2, background: t._listColor || C.accent, flexShrink: 0, minHeight: 36 }} />

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, fontFamily: FONT, color: t.done ? C.textMuted : C.textWhite, textDecoration: t.done ? 'line-through' : 'none', lineHeight: 1.3 }}>
                {t.text}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: C.textMuted, fontFamily: FONT }}>{t._listName}</span>
                {t.labels.map(l => <span key={l.id} style={{ width: 6, height: 6, borderRadius: '50%', background: l.color, display: 'inline-block' }} />)}
                {t.dueDate && <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.5, padding: '1px 5px', borderRadius: 4, fontFamily: FONT, background: isOverdue(t.dueDate) ? C.dangerBg : C.overlayW10, color: isOverdue(t.dueDate) ? C.danger : C.textMuted }}>{formatDate(t.dueDate)}</span>}
              </div>
            </div>

            {/* Done toggle */}
            <div style={{ marginTop: 4, flexShrink: 0 }}>
              <Chk done={t.done} size={22} color={t._listColor || C.accent} onToggle={() => onToggle(t._listId, t.id)} />
            </div>
          </div>
        ))}

        {/* Add event */}
        {adding ? (
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <input ref={inputRef} value={taskText} onChange={e => setTaskText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { handleAdd(); if (!taskText.trim()) setAdding(false) } if (e.key === 'Escape') { setTaskText(''); setAdding(false) } }}
              placeholder="Task name…"
              style={{ flex: 1, minWidth: 160, border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontFamily: FONT, fontWeight: 600, outline: 'none', background: C.border, color: C.textWhite }} />
            <select value={selListId} onChange={e => setSelListId(e.target.value)}
              style={{ border: 'none', borderRadius: 8, padding: '4px 12px', fontSize: 11, fontFamily: FONT, fontWeight: 800, outline: 'none', background: C.border, color: C.textWhite, cursor: 'pointer' }}>
              {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <button onClick={() => { handleAdd(); setAdding(false) }} style={{ border: 'none', background: C.accent, color: C.textWhite, borderRadius: 8, padding: '0 18px', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: FONT }}>ADD</button>
          </div>
        ) : (
          <button onClick={() => setAdding(true)} style={{ marginTop: 12, background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, fontFamily: FONT, fontSize: 11, fontWeight: 800, letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6, padding: 0, transition: 'color .15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = C.textWhite }}
            onMouseLeave={e => { e.currentTarget.style.color = C.textMuted }}>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
            ADD TASK
          </button>
        )}
      </div>

      {/* Tag + button on far right */}
      <div style={{ padding: '28px 0 28px 12px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
        <div onClick={addTag} style={{ width: 22, height: 22, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.overlayW10, opacity: tags.length > 0 ? 1 : 0.4, transition: 'opacity .15s, background .15s' }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = C.overlayW20 }}
          onMouseLeave={e => { e.currentTarget.style.opacity = tags.length > 0 ? '1' : '0.4'; e.currentTarget.style.background = C.overlayW10 }}>
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M8 4v8M4 8h8" stroke={C.textWhite} strokeWidth="2" strokeLinecap="round" /></svg>
        </div>
      </div>
    </div>
  )
}

/* ─── AgendaView ─────────────────────────────────────────────────────────────── */
function ArrowBtn({ dir, onClick }) {
  return (
    <div onClick={onClick} style={{ width: 40, height: 40, borderRadius: R, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.border }}
      onMouseEnter={e => { e.currentTarget.style.background = C.borderHover }}
      onMouseLeave={e => { e.currentTarget.style.background = C.border }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d={dir === 'l' ? 'M10 4l-4 4 4 4' : 'M6 4l4 4-4 4'} stroke={C.textWhite} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

function AgendaView({ lists, onUpdateLists, dayTags, onUpdateDayTags }) {
  const [weekOffset, setWeekOffset] = useState(0)
  const [calOpen, setCalOpen] = useState(false)

  const weekDays = useMemo(() => getWeekDates(weekOffset), [weekOffset])
  const weekLabel = useMemo(() => getWeekLabel(weekOffset), [weekOffset])
  const today = todayStr()

  const jumpToDate = ds => {
    if (!ds) return
    const picked = new Date(ds + 'T00:00:00')
    const now = new Date()
    const nowDow = now.getDay()
    const nowMon = new Date(now); nowMon.setDate(now.getDate() - (nowDow === 0 ? 6 : nowDow - 1))
    const pickedDow = picked.getDay()
    const pickedMon = new Date(picked); pickedMon.setDate(picked.getDate() - (pickedDow === 0 ? 6 : pickedDow - 1))
    setWeekOffset(Math.round((pickedMon - nowMon) / (7 * 24 * 60 * 60 * 1000)))
    setCalOpen(false)
  }

  useEffect(() => {
    const h = e => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return
      if (e.key === 'ArrowLeft') setWeekOffset(w => w - 1)
      if (e.key === 'ArrowRight') setWeekOffset(w => w + 1)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  const tasksByDate = useMemo(() => {
    const map = {}
    weekDays.forEach(d => { map[d.date] = [] })
    lists.forEach(l => l.tasks.forEach(t => {
      if (t.dueDate && map[t.dueDate]) map[t.dueDate].push({ ...t, _listId: l.id, _listName: l.name, _listColor: l.color })
    }))
    return map
  }, [lists, weekDays])

  const togTask = (lid, tid) => onUpdateLists(lists.map(l => l.id === lid ? { ...l, tasks: l.tasks.map(t => t.id === tid ? { ...t, done: !t.done } : t) } : l))
  const addTask = (lid, text, dueDate) => onUpdateLists(lists.map(l => l.id === lid ? { ...l, tasks: [...l.tasks, newTask(text, dueDate)] } : l))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Week navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 0 16px', flexShrink: 0 }}>
        <ArrowBtn dir="l" onClick={() => setWeekOffset(w => w - 1)} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span onMouseDown={e => e.stopPropagation()} onClick={() => setCalOpen(!calOpen)}
            style={{ fontSize: 15, fontWeight: 900, fontFamily: FONT, color: C.textWhite, letterSpacing: -0.5, cursor: 'pointer', borderBottom: `2px dashed ${C.overlayW30}`, paddingBottom: 2 }}>
            {weekLabel.toUpperCase()}
          </span>
          {calOpen && <MiniCalendar onPickDate={jumpToDate} onClose={() => setCalOpen(false)} />}
          {weekOffset !== 0 && (
            <div onClick={() => setWeekOffset(0)} style={{ fontSize: 9, fontWeight: 800, fontFamily: FONT, color: C.textWhite, cursor: 'pointer', padding: '4px 10px', borderRadius: 6, background: C.accent, letterSpacing: 1 }}>TODAY</div>
          )}
        </div>
        <ArrowBtn dir="r" onClick={() => setWeekOffset(w => w + 1)} />
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {weekDays.map(day => (
          <AgendaDay key={day.date} day={day} tasks={tasksByDate[day.date] || []}
            isToday={day.date === today} lists={lists}
            tags={dayTags[day.date] || []}
            onUpdateTags={tags => onUpdateDayTags(day.date, tags)}
            onToggle={togTask} onAddTask={addTask} />
        ))}
      </div>
    </div>
  )
}

/* ─── DayView ────────────────────────────────────────────────────────────────── */
function Chk({ done, size, color, onToggle }) {
  return (
    <div onClick={e => { e.stopPropagation(); onToggle() }} style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
      border: `2px solid ${done ? color : C.textMuted}`,
      background: done ? color : 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s',
    }}>
      {done && (
        <svg width={size * 0.48} height={size * 0.48} viewBox="0 0 12 12">
          <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  )
}

function DayView({ lists, onToggleTask, onToggleChecklist }) {
  const now = new Date()
  const today = todayStr()

  const dayLabel = now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
  const dateLabel = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()

  const allTasks = useMemo(() =>
    lists
      .flatMap(l => l.tasks.map(t => ({ ...t, _listColor: l.color, _listName: l.name, _listId: l.id })))
      .filter(t => t.dueDate === today || !t.dueDate)
      .sort((a, b) => {
        if (!a.startTime && !b.startTime) return 0
        if (!a.startTime) return 1
        if (!b.startTime) return -1
        return a.startTime.localeCompare(b.startTime)
      }),
    [lists, today]
  )

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: C.bg, fontFamily: FONT }}>
      <div style={{ padding: '36px 36px 48px' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.textMuted, letterSpacing: 2, marginBottom: 16 }}>
            {dayLabel} · {dateLabel}
          </div>
          <div style={{ fontSize: 40, fontWeight: 900, color: C.textWhite, letterSpacing: -2, lineHeight: 1 }}>
            TODAY'S
          </div>
          <div style={{ fontSize: 40, fontWeight: 900, color: C.accent, letterSpacing: -2, lineHeight: 1, marginBottom: 4 }}>
            SCHEDULE
          </div>
        </div>

        {/* ── Empty state ── */}
        {allTasks.length === 0 && (
          <div style={{ color: C.textMuted, fontSize: 13, fontWeight: 500, fontStyle: 'italic', marginTop: 8 }}>
            No tasks for today — enjoy your day.
          </div>
        )}

        {/* ── Task rows ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {allTasks.map(task => {
            const cl = task.checklist || []
            const lc = task._listColor || C.accent

            return (
              <div key={task.id} style={{ background: '#1E2328', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>

                {/* Main task row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
                  <Chk done={task.done} size={20} color={lc} onToggle={() => onToggleTask(task._listId, task.id)} />

                  {task.startTime && (
                    <span style={{
                      background: lc + '25', color: lc, fontSize: 10, fontWeight: 800,
                      padding: '3px 9px', borderRadius: 20, flexShrink: 0, letterSpacing: 0.5,
                    }}>
                      {formatTime12(task.startTime)}{task.endTime ? `–${formatTime12(task.endTime)}` : ''}
                    </span>
                  )}

                  <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: task.done ? C.textMuted : C.textWhite, textDecoration: task.done ? 'line-through' : 'none', lineHeight: 1.4 }}>
                    {task.text}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {task.dueDate && <DueBadge date={task.dueDate} />}
                    <span style={{ fontSize: 10, fontWeight: 700, color: lc, background: lc + '35', padding: '2px 7px', borderRadius: 10 }}>{task._listName}</span>
                  </div>
                </div>

                {/* Checklist sub-items */}
                {cl.length > 0 && (
                  <div style={{ borderTop: `1px solid rgba(255,255,255,0.06)` }}>
                    {cl.map((item, idx) => (
                      <div key={item.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 16px 10px 48px',
                        borderBottom: idx < cl.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        background: 'rgba(0,0,0,0.12)',
                      }}>
                        <Chk done={item.done} size={16} color={lc} onToggle={() => onToggleChecklist(task._listId, task.id, item.id)} />

                        <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: item.done ? C.textMuted : C.textLight, textDecoration: item.done ? 'line-through' : 'none', lineHeight: 1.4 }}>
                          {item.text}
                        </span>

                        {item.dueDate && (
                          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.5, padding: '2px 6px', borderRadius: 4, flexShrink: 0, background: isOverdue(item.dueDate) ? C.dangerBg : C.overlayW10, color: isOverdue(item.dueDate) ? C.danger : C.textMuted }}>
                            {formatDate(item.dueDate)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ─── BoardDetail ────────────────────────────────────────────────────────────── */
function NavItem({ label, icon, active, onClick, collapsed }) {
  return (
    <div role="button" tabIndex={0} onClick={onClick}
      aria-current={active ? 'page' : undefined}
      aria-label={collapsed ? label : undefined}
      title={collapsed ? label : undefined}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, cursor: 'pointer', background: active ? C.border : 'transparent', transition: 'background .15s', marginBottom: 2, overflow: 'hidden' }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = C.overlayW10 }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</span>
      <span style={{
        fontSize: 11, fontWeight: 800, color: active ? C.textWhite : C.textMuted, letterSpacing: 0.8, fontFamily: FONT,
        whiteSpace: 'nowrap', overflow: 'hidden', display: 'inline-block', flexShrink: 0,
        opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 70,
        transition: 'opacity 260ms cubic-bezier(.4,0,.2,1), width 260ms cubic-bezier(.4,0,.2,1)',
      }}>{label}</span>
    </div>
  )
}

function BoardDetail({ board, boards, onUpdate, onSwitchBoard, onCreateBoard, onDeleteBoard }) {
  const [view, setView] = useState('day')
  const [taskDrop, setTaskDrop] = useState(null)
  const [newName, setNewName] = useState('')
  const [weekFilter, setWeekFilter] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(board.name)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const isMobile = useIsMobile()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const navCollapsed = !isMobile && sidebarCollapsed
  const closeMobileSidebar = () => { if (isMobile) setMobileSidebarOpen(false) }
  const newInputRef = useRef(null)

  // ── Keyboard / selection state ──
  const [focusedCard, setFocusedCard] = useState(null)   // { listId, taskId }
  const [selectedCards, setSelectedCards] = useState(new Set()) // Set<taskId>
  const [clipboard, setClipboard] = useState(null)   // { task, sourceListId, mode }
  const [openPanel, setOpenPanel] = useState(null)   // { listId, taskId }
  const [focusedAction, setFocusedAction] = useState(null)
  const [requestAddInList, setRequestAddInList] = useState(null)
  const [requestRenameList, setRequestRenameList] = useState(null)
  const [showBoardMenu, setShowBoardMenu] = useState(false)
  const [showBoardColorPicker, setShowBoardColorPicker] = useState(false)
  const undoStack = useRef([])
  const redoStack = useRef([])
  const boardMenuRef = useRef(null)
  const boardMenuBtnRef = useRef(null)

  useEffect(() => {
    if (!showBoardMenu) return
    const h = e => {
      if (!boardMenuRef.current?.contains(e.target) && !boardMenuBtnRef.current?.contains(e.target)) setShowBoardMenu(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [showBoardMenu])

  useEffect(() => { setTitleDraft(board.name) }, [board.name])

  const saveTitle = () => { if (titleDraft.trim()) boardUpdate({ ...board, name: titleDraft.trim() }); setEditingTitle(false) }

  const weekDays = useMemo(() => getWeekDates(weekOffset), [weekOffset])
  const weekLabel = useMemo(() => getWeekLabel(weekOffset), [weekOffset])
  const today = todayStr()

  const lists = board.lists
  const dayTags = board.dayTags || {}
  const settings = board.settings || DEFAULT_BOARD_SETTINGS()
  const sizePreset = LIST_SIZE_PRESETS[settings.listWidth] || LIST_SIZE_PRESETS.normal
  const layoutMode = settings.layoutMode || 'classic'
  const textSize = TASK_TEXT_SIZE_PRESETS[settings.taskTextSize] || TASK_TEXT_SIZE_PRESETS.medium
  const updateSettings = patch => boardUpdate({ ...board, settings: { ...settings, ...patch } })
  const priorityColors = board.priorityColors || DEFAULT_PRIORITY_COLORS()
  const updatePriorityColor = (level, color) => boardUpdate({ ...board, priorityColors: { ...priorityColors, [level]: color } })

  // Wrap onUpdate with undo history tracking
  const boardUpdate = updatedBoard => {
    undoStack.current.push(board)
    if (undoStack.current.length > 60) undoStack.current.shift()
    redoStack.current = []
    onUpdate(updatedBoard)
  }

  const setLists = updater => { const next = typeof updater === 'function' ? updater(lists) : updater; boardUpdate({ ...board, lists: next }) }
  const updDayTags = (date, tags) => boardUpdate({ ...board, dayTags: { ...dayTags, [date]: tags } })
  const updList = (id, u) => setLists(p => p.map(l => l.id === id ? u : l))
  const togTask = (lid, tid) => setLists(p => p.map(l => l.id === lid ? { ...l, tasks: l.tasks.map(t => t.id === tid ? { ...t, done: !t.done } : t) } : l))
  const togChecklist = (lid, tid, iid) => setLists(p => p.map(l => l.id === lid ? { ...l, tasks: l.tasks.map(t => t.id === tid ? { ...t, checklist: (t.checklist || []).map(ci => ci.id === iid ? { ...ci, done: !ci.done } : ci) } : t) } : l))
  const delList = id => setLists(p => p.filter(l => l.id !== id))
  const addList = () => {
    const color = settings.newListColorMode === 'cycle' ? PALETTE[lists.length % PALETTE.length] : C.borderHover
    const nl = { id: uid(), name: 'NEW LIST', color, tasks: [] }
    setLists(p => [...p, nl])
    setRequestRenameList(nl.id)
  }

  // ── List drag ──
  const [dragListId, setDragListId] = useState(null)
  const [dropIndex, setDropIndex] = useState(null)

  const handleListDragStart = (e, listId) => {
    setDragListId(listId)
    e.dataTransfer.setData('listid', listId)
    e.dataTransfer.effectAllowed = 'move'
  }
  const handleListDragOver = (e, hoveredListId) => {
    if (!e.dataTransfer.types.includes('listid')) return
    e.preventDefault()
    const fromIdx = lists.findIndex(l => l.id === dragListId)
    const toIdx = lists.findIndex(l => l.id === hoveredListId)
    const r = e.currentTarget.getBoundingClientRect()
    const raw = e.clientX < r.left + r.width / 2 ? toIdx : toIdx + 1
    setDropIndex(fromIdx < raw ? raw - 1 : raw)
  }
  const handleListDrop = e => {
    if (!e.dataTransfer.types.includes('listid')) return
    e.preventDefault()
    if (dragListId !== null && dropIndex !== null) {
      const fromIdx = lists.findIndex(l => l.id === dragListId)
      if (fromIdx !== dropIndex) {
        const next = [...lists]
        const [item] = next.splice(fromIdx, 1)
        next.splice(dropIndex, 0, item)
        setLists(next)
      }
    }
    setDragListId(null); setDropIndex(null)
  }
  const handleListDragEnd = () => { setDragListId(null); setDropIndex(null) }


  // ── Task drag ──
  const handleTaskDragOver = (lid, idx) => setTaskDrop({ listId: lid, index: idx })
  const handleTaskDrop = (taskId, srcListId) => {
    if (!taskDrop) return
    setLists(prev => {
      const nl = prev.map(l => ({ ...l, tasks: [...l.tasks] }))
      const src = nl.find(l => l.id === srcListId)
      const dst = nl.find(l => l.id === taskDrop.listId)
      if (!src || !dst) return prev
      const ti = src.tasks.findIndex(t => t.id === taskId)
      if (ti === -1) return prev
      const [task] = src.tasks.splice(ti, 1)
      let idx = taskDrop.index
      if (src.id === dst.id && ti < idx) idx--
      dst.tasks.splice(idx, 0, task)
      return nl
    })
    setTaskDrop(null)
  }

  const filteredLists = useMemo(() => {
    if (!weekFilter) return lists
    const wDates = new Set(weekDays.map(d => d.date))
    return lists.map(l => ({ ...l, tasks: l.tasks.filter(t => t.dueDate && wDates.has(t.dueDate)) }))
  }, [lists, weekFilter, weekDays])

  const handleCreate = () => { if (!newName.trim()) return; onCreateBoard(newName.trim()); setNewName('') }

  // ── Board labels ──
  const boardLabels = board.boardLabels || []
  const createBoardLabel = nl => boardUpdate({ ...board, boardLabels: [...boardLabels, nl] })
  const updateBoardLabel = (id, patch) => boardUpdate({
    ...board,
    boardLabels: boardLabels.map(l => l.id === id ? { ...l, ...patch } : l),
    lists: lists.map(list => ({ ...list, tasks: list.tasks.map(t => ({ ...t, labels: t.labels.map(l => l.id === id ? { ...l, ...patch } : l) })) })),
  })
  const deleteBoardLabel = id => boardUpdate({
    ...board,
    boardLabels: boardLabels.filter(l => l.id !== id),
    lists: lists.map(list => ({ ...list, tasks: list.tasks.map(t => ({ ...t, labels: t.labels.filter(l => l.id !== id) })) })),
  })

  // ── Derived panel task (always fresh from lists) ──
  const openPanelList = openPanel ? lists.find(l => l.id === openPanel.listId) : null
  const openPanelTask = openPanel ? openPanelList?.tasks.find(t => t.id === openPanel.taskId) : null

  // ── Panel / card helpers ──
  const handleOpenPanel = taskId => { for (const l of lists) { const t = l.tasks.find(t => t.id === taskId); if (t) { setOpenPanel({ listId: l.id, taskId }); return } } }
  const handleFocusCard = (listId, taskId) => setFocusedCard({ listId, taskId })
  const handleShiftClick = (listId, taskId) => {
    setSelectedCards(prev => { const n = new Set(prev); n.has(taskId) ? n.delete(taskId) : n.add(taskId); return n })
  }

  // ── Keyboard shortcut handler ──
  const kbRef = useRef({})
  useEffect(() => {
    kbRef.current = { view, focusedCard, openPanel, selectedCards, clipboard, lists, filteredLists, board, setLists, handleOpenPanel, onUpdate }
  })

  useEffect(() => {
    const h = e => {
      const { view, focusedCard, openPanel, selectedCards, clipboard, lists, filteredLists, board, setLists, handleOpenPanel, onUpdate } = kbRef.current
      const tag = e.target.tagName
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || e.target.isContentEditable

      // Esc — always
      if (e.key === 'Escape') {
        if (openPanel) { setOpenPanel(null); return }
        if (selectedCards.size) { setSelectedCards(new Set()); return }
        if (focusedCard) { setFocusedCard(null); return }
        return
      }

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && !typing) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault()
          const prev = undoStack.current.pop()
          if (prev) { redoStack.current.push(board); onUpdate(prev) }
          return
        }
        if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault()
          const next = redoStack.current.pop()
          if (next) { undoStack.current.push(board); onUpdate(next) }
          return
        }
      }

      if (typing) return

      // Panel open → navigate adjacent cards with j/k or ←/→
      if (openPanel) {
        const l = lists.find(l => l.id === openPanel.listId)
        if (!l) return
        const idx = l.tasks.findIndex(t => t.id === openPanel.taskId)
        if ((e.key === 'j' || e.key === 'ArrowRight') && idx < l.tasks.length - 1) { e.preventDefault(); setOpenPanel({ listId: l.id, taskId: l.tasks[idx + 1].id }) }
        if ((e.key === 'k' || e.key === 'ArrowLeft') && idx > 0) { e.preventDefault(); setOpenPanel({ listId: l.id, taskId: l.tasks[idx - 1].id }) }
        return
      }

      // Board-view only for card navigation
      if (view !== 'board') return

      // Arrow / j / k  → move focused card
      const moveFocus = dir => {
        if (!focusedCard) {
          const fl = filteredLists.find(l => l.tasks.length > 0)
          if (fl) setFocusedCard({ listId: fl.id, taskId: fl.tasks[0].id })
          return
        }
        const li = filteredLists.findIndex(l => l.id === focusedCard.listId)
        const cl = filteredLists[li]
        if (!cl) return
        const ti = cl.tasks.findIndex(t => t.id === focusedCard.taskId)
        if (dir === 'down' && ti < cl.tasks.length - 1) setFocusedCard({ listId: cl.id, taskId: cl.tasks[ti + 1].id })
        if (dir === 'up' && ti > 0) setFocusedCard({ listId: cl.id, taskId: cl.tasks[ti - 1].id })
        if (dir === 'left' && li > 0) { const pl = filteredLists[li - 1]; const ni = Math.min(ti, pl.tasks.length - 1); if (ni >= 0) setFocusedCard({ listId: pl.id, taskId: pl.tasks[ni].id }) }
        if (dir === 'right' && li < filteredLists.length - 1) { const nl = filteredLists[li + 1]; const ni = Math.min(ti, nl.tasks.length - 1); if (ni >= 0) setFocusedCard({ listId: nl.id, taskId: nl.tasks[ni].id }) }
      }

      if (e.key === 'ArrowDown' || e.key === 'j') { e.preventDefault(); moveFocus('down'); return }
      if (e.key === 'ArrowUp' || e.key === 'k') { e.preventDefault(); moveFocus('up'); return }
      if (e.key === 'ArrowLeft') { e.preventDefault(); moveFocus('left'); return }
      if (e.key === 'ArrowRight') { e.preventDefault(); moveFocus('right'); return }

      if (!focusedCard) return

      // Enter → open panel
      if (e.key === 'Enter') { handleOpenPanel(focusedCard.taskId); return }

      // E → quick edit
      if (e.key === 'e' || e.key === 'E') { setFocusedAction('quickEdit'); setTimeout(() => setFocusedAction(null), 50); return }

      // C → archive (delete) card
      if ((e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.metaKey) {
        setLists(p => p.map(l => l.id === focusedCard.listId ? { ...l, tasks: l.tasks.filter(t => t.id !== focusedCard.taskId) } : l))
        setFocusedCard(null); return
      }

      // N → new card in focused list
      if (e.key === 'n' || e.key === 'N') { setRequestAddInList(focusedCard.listId); return }

      // , . < >  → move card to adjacent list
      const moveToList = (side, pos) => {
        const li = filteredLists.findIndex(l => l.id === focusedCard.listId)
        const tgt = side === 'left' ? filteredLists[li - 1] : filteredLists[li + 1]
        if (!tgt) return
        setLists(p => {
          const nl = p.map(l => ({ ...l, tasks: [...l.tasks] }))
          const src = nl.find(l => l.id === focusedCard.listId)
          const dst = nl.find(l => l.id === tgt.id)
          const ti = src.tasks.findIndex(t => t.id === focusedCard.taskId)
          const [task] = src.tasks.splice(ti, 1)
          pos === 'top' ? dst.tasks.unshift(task) : dst.tasks.push(task)
          return nl
        })
        setFocusedCard({ listId: tgt.id, taskId: focusedCard.taskId })
      }
      if (e.key === ',') { moveToList('left', 'bottom'); return }
      if (e.key === '.') { moveToList('right', 'bottom'); return }
      if (e.key === '<') { moveToList('left', 'top'); return }
      if (e.key === '>') { moveToList('right', 'top'); return }

      // Ctrl/Cmd + C/X/V
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'c') {
          for (const l of lists) { const t = l.tasks.find(t => t.id === focusedCard.taskId); if (t) { setClipboard({ task: t, sourceListId: l.id, mode: 'copy' }); return } }
        }
        if (e.key === 'x') {
          for (const l of lists) {
            const t = l.tasks.find(t => t.id === focusedCard.taskId); if (t) {
              setClipboard({ task: t, sourceListId: l.id, mode: 'cut' })
              setLists(p => p.map(ll => ll.id === l.id ? { ...ll, tasks: ll.tasks.filter(tt => tt.id !== t.id) } : ll))
              setFocusedCard(null); return
            }
          }
        }
        if (e.key === 'v' && clipboard) {
          const newT = { ...clipboard.task, id: uid() }
          setLists(p => p.map(l => l.id === focusedCard.listId ? { ...l, tasks: [...l.tasks, newT] } : l))
          if (clipboard.mode === 'cut') setClipboard(null)
          setFocusedCard({ listId: focusedCard.listId, taskId: newT.id })
        }
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: C.bg, fontFamily: FONT }}>

      {/* ════════════════ LEFT SIDEBAR ════════════════ */}
      {isMobile && mobileSidebarOpen && (
        <div onClick={closeMobileSidebar} aria-hidden="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10009 }} />
      )}
      <nav aria-label="Application navigation" style={isMobile ? {
        width: 240, flexShrink: 0, background: '#191B1D', borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, height: '100vh', overflow: 'hidden', zIndex: 10010,
        transform: mobileSidebarOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 260ms cubic-bezier(.4,0,.2,1)',
      } : { width: sidebarCollapsed ? 64 : 220, flexShrink: 0, background: '#191B1D', borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', transition: 'width 260ms cubic-bezier(.4,0,.2,1)' }}>

        {/* Branding */}
        <div style={{ minHeight: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', gap: 10, flexShrink: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
            <img src="/favicon.svg" alt="PLANNA" width={28} height={28} style={{ borderRadius: 6, flexShrink: 0 }} />
            <strong style={{
              fontSize: 18, fontWeight: 900, color: C.textWhite, letterSpacing: -0.5, fontFamily: FONT,
              whiteSpace: 'nowrap', overflow: 'hidden', display: 'inline-block', flexShrink: 0,
              opacity: navCollapsed ? 0 : 1, width: navCollapsed ? 0 : 90,
              transition: 'opacity 260ms cubic-bezier(.4,0,.2,1), width 260ms cubic-bezier(.4,0,.2,1)',
            }}>PLANNA</strong>
          </div>
          {isMobile && (
            <button onClick={closeMobileSidebar} aria-label="Close sidebar"
              style={{ width: 32, height: 32, flexShrink: 0, border: 'none', background: 'transparent', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textMuted }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke={C.textMuted} strokeWidth="1.6" strokeLinecap="round" /></svg>
            </button>
          )}
        </div>

        {/* Collapse toggle (desktop only) */}
        {!isMobile && (
          <button onClick={() => setSidebarCollapsed(v => !v)} aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{ display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'flex-end', gap: 6, padding: sidebarCollapsed ? '6px 0' : '6px 16px', margin: '0 0 8px', background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0, opacity: 0.55, transition: 'opacity .15s' }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '1' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '0.55' }}
            onFocus={e => { e.currentTarget.style.opacity = '1' }}
            onBlur={e => { e.currentTarget.style.opacity = '0.55' }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 200ms cubic-bezier(.4,0,.2,1)' }}>
              <path d="M10 3l-5 5 5 5" stroke={C.textMuted} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        <div style={{ height: 1, background: C.border, margin: '0 16px 12px' }} aria-hidden="true" />

        {/* View nav */}
        <div style={{ padding: '0 8px 8px' }} role="group" aria-label="Views">
          <NavItem label="DAY" active={view === 'day'} onClick={() => { setView('day'); closeMobileSidebar() }} collapsed={navCollapsed}
            icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="6" stroke={view === 'day' ? C.textWhite : C.textMuted} strokeWidth="1.3" /><line x1="8" y1="4" x2="8" y2="8" stroke={view === 'day' ? C.textWhite : C.textMuted} strokeWidth="1.3" strokeLinecap="round" /><line x1="8" y1="8" x2="11" y2="10" stroke={view === 'day' ? C.textWhite : C.textMuted} strokeWidth="1.3" strokeLinecap="round" /></svg>}
          />
          <NavItem label="BOARD" active={view === 'board'} onClick={() => { setView('board'); closeMobileSidebar() }} collapsed={navCollapsed}
            icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="1" y="1" width="6" height="9" rx="1.5" stroke={view === 'board' ? C.textWhite : C.textMuted} strokeWidth="1.3" /><rect x="9" y="1" width="6" height="5" rx="1.5" stroke={view === 'board' ? C.textWhite : C.textMuted} strokeWidth="1.3" /><rect x="9" y="8" width="6" height="7" rx="1.5" stroke={view === 'board' ? C.textWhite : C.textMuted} strokeWidth="1.3" /></svg>}
          />
          <NavItem label="AGENDA" active={view === 'agenda'} onClick={() => { setView('agenda'); closeMobileSidebar() }} collapsed={navCollapsed}
            icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="2" y="2" width="12" height="12" rx="2" stroke={view === 'agenda' ? C.textWhite : C.textMuted} strokeWidth="1.3" /><line x1="2" y1="6" x2="14" y2="6" stroke={view === 'agenda' ? C.textWhite : C.textMuted} strokeWidth="1.3" /><line x1="6" y1="2" x2="6" y2="6" stroke={view === 'agenda' ? C.textWhite : C.textMuted} strokeWidth="1.3" /></svg>}
          />
        </div>

        {!navCollapsed && (
          <>
            <div style={{ height: 1, background: C.border, margin: '4px 16px 16px' }} aria-hidden="true" />

            {/* Boards list */}
            <div style={{ padding: '0 8px', flex: 1, minHeight: 0, overflowY: 'auto' }}>
              <p style={{ fontSize: 9, fontWeight: 800, color: C.textMuted, letterSpacing: 1.5, padding: '0 8px 8px', fontFamily: FONT, margin: 0 }}>BOARDS</p>
              <ul role="list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {boards.map(b => (
                  <li key={b.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', background: b.id === board.id ? C.border : 'transparent', marginBottom: 2, transition: 'background .15s' }}
                      role="button" tabIndex={0}
                      aria-current={b.id === board.id ? 'page' : undefined}
                      onClick={() => { onSwitchBoard(b.id); closeMobileSidebar() }}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSwitchBoard(b.id); closeMobileSidebar() } }}
                      onMouseEnter={e => { if (b.id !== board.id) e.currentTarget.style.background = C.overlayW10 }}
                      onMouseLeave={e => { if (b.id !== board.id) e.currentTarget.style.background = 'transparent' }}>
                      <div style={{ width: 8, height: 8, borderRadius: 3, background: b.color, flexShrink: 0 }} aria-hidden="true" />
                      <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: b.id === board.id ? C.textWhite : C.textMuted, fontFamily: FONT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</span>
                      <button onClick={e => { e.stopPropagation(); onDeleteBoard(b.id) }}
                        aria-label={`Delete board ${b.name}`}
                        style={{ width: 16, height: 16, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 12, color: C.textMuted, fontWeight: 700, flexShrink: 0, background: 'transparent', border: 'none', transition: 'color .15s' }}
                        onMouseEnter={e => { e.currentTarget.style.color = C.danger }}
                        onMouseLeave={e => { e.currentTarget.style.color = C.textMuted }}>×</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* New board input */}
            <div style={{ padding: '12px 12px 20px', borderTop: `1px solid ${C.border}`, marginTop: 8, flexShrink: 0 }}>
              <label htmlFor="new-board-input" style={{ display: 'block', fontSize: 9, fontWeight: 800, color: C.textMuted, letterSpacing: 1.5, fontFamily: FONT, marginBottom: 6 }}>NEW BOARD</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input id="new-board-input" ref={newInputRef} value={newName} onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setNewName('') }}
                  placeholder="New board…"
                  style={{ flex: 1, minWidth: 0, height: 42, boxSizing: 'border-box', border: 'none', borderRadius: 8, padding: '0 10px', fontSize: 11, fontFamily: FONT, fontWeight: 600, outline: 'none', background: C.border, color: C.textWhite }} />
                <button type="button" onClick={handleCreate} aria-label="Create board" style={{ width: 42, height: 42, flexShrink: 0, border: 'none', background: C.accent, color: C.textWhite, borderRadius: 8, fontSize: 24, fontWeight: 800, cursor: 'pointer', fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>+</button>
              </div>
            </div>
          </>
        )}

        {navCollapsed && (
          <>
            <div style={{ height: 1, background: C.border, margin: '4px 16px 12px' }} aria-hidden="true" />
            <div role="list" aria-label="Boards" style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '0 0 8px' }}>
              {boards.map(b => {
                const active = b.id === board.id
                return (
                  <button key={b.id} role="listitem" onClick={() => onSwitchBoard(b.id)}
                    aria-label={`Switch to board ${b.name}`} aria-current={active ? 'page' : undefined} title={b.name}
                    style={{
                      width: 28, height: 28, flexShrink: 0, borderRadius: 8, cursor: 'pointer', padding: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: active ? C.border : 'transparent',
                      border: active ? `2px solid ${b.color}` : '2px solid transparent',
                      transition: 'background .15s, border-color .15s',
                    }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = C.overlayW10 }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
                    <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 3, background: b.color, flexShrink: 0 }} />
                  </button>
                )
              })}
            </div>
            <div style={{ padding: '8px 0 20px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
              <button type="button" onClick={() => onCreateBoard('New board')} aria-label="Create board" title="Create board"
                style={{ width: 42, height: 42, flexShrink: 0, border: 'none', background: C.accent, color: C.textWhite, borderRadius: 8, fontSize: 24, fontWeight: 800, cursor: 'pointer', fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>+</button>
            </div>
          </>
        )}
      </nav>

      {/* ════════════════ MAIN CONTENT ════════════════ */}
      <main style={{ flex: 1, overflow: (view === 'agenda' || (view === 'board' && layoutMode === 'compact')) ? 'hidden' : 'auto', display: 'flex', flexDirection: 'column', height: '100vh' }}>

        {/* ── Top bar ── */}
        <header className="top-bar" style={{ minHeight: 72, padding: isMobile ? '0 12px' : '0 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, flexShrink: 0, borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            {isMobile && (
              <button onClick={() => setMobileSidebarOpen(true)} aria-label="Open sidebar"
                style={{ width: 36, height: 36, flexShrink: 0, border: 'none', background: 'transparent', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true"><line x1="2" y1="4" x2="14" y2="4" stroke={C.textWhite} strokeWidth="1.5" strokeLinecap="round" /><line x1="2" y1="8" x2="14" y2="8" stroke={C.textWhite} strokeWidth="1.5" strokeLinecap="round" /><line x1="2" y1="12" x2="14" y2="12" stroke={C.textWhite} strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            )}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowBoardColorPicker(v => !v)} aria-label="Change board color" aria-haspopup="true" aria-expanded={showBoardColorPicker}
                style={{ width: 10, height: 10, borderRadius: 3, background: board.color, border: 'none', padding: 0, cursor: 'pointer' }} />
              {showBoardColorPicker && (
                <ColorPicker colors={PALETTE} current={board.color} onPick={c => boardUpdate({ ...board, color: c })} onClose={() => setShowBoardColorPicker(false)} />
              )}
            </div>
            {editingTitle ? (
              <input
                autoFocus
                value={titleDraft}
                onChange={e => setTitleDraft(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setTitleDraft(board.name); setEditingTitle(false) } }}
                style={{ fontSize: 24, fontFamily: FONT, fontWeight: 900, color: C.textWhite, letterSpacing: -0.5, background: 'transparent', border: 'none', outline: 'none', padding: 0, minWidth: 60, caretColor: C.textWhite }}
              />
            ) : (
              <button type="button" className="renameable" onClick={() => setEditingTitle(true)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditingTitle(true) } }} aria-label={`Edit board name: ${board.name}`} style={{ fontSize: isMobile ? 18 : 24, fontFamily: FONT, fontWeight: 900, color: C.textWhite, letterSpacing: -0.5, cursor: 'text', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, background: 'none', border: 'none', padding: 0, textAlign: 'left' }}>{board.name}</button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
            {/* Week filter (board only) */}
            {view === 'board' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div onClick={() => setWeekFilter(!weekFilter)} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', background: weekFilter ? C.accent : C.border, borderRadius: 8, padding: '6px 12px', transition: 'background .15s' }}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="2" stroke={C.textWhite} strokeWidth="1.3" /><line x1="2" y1="7" x2="14" y2="7" stroke={C.textWhite} strokeWidth="1.3" /><line x1="6" y1="1" x2="6" y2="5" stroke={C.textWhite} strokeWidth="1.3" strokeLinecap="round" /><line x1="10" y1="1" x2="10" y2="5" stroke={C.textWhite} strokeWidth="1.3" strokeLinecap="round" /></svg>
                  <span style={{ fontSize: 10, fontWeight: 800, fontFamily: FONT, color: C.textWhite, letterSpacing: 0.5 }}>{weekFilter ? 'THIS WEEK' : 'ALL TASKS'}</span>
                </div>
                {weekFilter && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {[['l', 'M10 4l-4 4 4 4'], ['r', 'M6 4l4 4-4 4']].map(([dir, path]) => (
                      <div key={dir} onClick={() => setWeekOffset(w => dir === 'l' ? w - 1 : w + 1)} style={{ width: 26, height: 26, borderRadius: 6, cursor: 'pointer', background: C.border, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onMouseEnter={e => { e.currentTarget.style.background = C.borderHover }}
                        onMouseLeave={e => { e.currentTarget.style.background = C.border }}>
                        <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d={path} stroke={C.textWhite} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </div>
                    ))}
                    <span style={{ fontSize: 11, fontWeight: 800, fontFamily: FONT, color: C.textWhite }}>{weekLabel.toUpperCase()}</span>
                    {weekOffset !== 0 && <div onClick={() => setWeekOffset(0)} style={{ fontSize: 9, fontWeight: 800, fontFamily: FONT, color: C.textWhite, cursor: 'pointer', padding: '3px 8px', borderRadius: 5, background: C.borderHover, letterSpacing: 1 }}>TODAY</div>}
                    <div style={{ display: 'flex', gap: 3, marginLeft: 4 }}>
                      {weekDays.map(day => (
                        <div key={day.date} style={{ minWidth: 32, height: 32, borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: day.date === today ? C.accent : C.border }}>
                          <span style={{ fontSize: 6, fontWeight: 800, fontFamily: FONT, color: day.date === today ? C.textWhite : C.textMuted, letterSpacing: 0.5 }}>{day.full.slice(0, 2)}</span>
                          <span style={{ fontSize: 12, fontWeight: 900, fontFamily: FONT, color: C.textWhite }}>{day.dayNum}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Board options menu */}
            <button ref={boardMenuBtnRef} onClick={() => setShowBoardMenu(v => !v)} aria-label="Board options" aria-haspopup="true" aria-expanded={showBoardMenu}
              style={{ width: 32, height: 32, borderRadius: 8, background: C.border, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              onMouseEnter={e => { e.currentTarget.style.background = C.borderHover }}
              onMouseLeave={e => { e.currentTarget.style.background = C.border }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="3" cy="8" r="1.4" fill={C.textWhite} /><circle cx="8" cy="8" r="1.4" fill={C.textWhite} /><circle cx="13" cy="8" r="1.4" fill={C.textWhite} /></svg>
            </button>

            {showBoardMenu && (
              <div ref={boardMenuRef} role="menu" aria-label="Board options" style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, zIndex: 10003, width: 230, background: '#2B2F34', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.6)', overflow: 'hidden', fontFamily: FONT }}>
                <div style={{ padding: '14px 14px 10px', borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.textWhite }}>Board settings</span>
                </div>
                <div style={{ padding: '12px 14px 14px' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 0.8, marginBottom: 8 }}>BOARD LAYOUT</div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                    {[['classic', 'Classic'], ['compact', 'Compact']].map(([val, label]) => (
                      <button key={val} onClick={() => updateSettings({ layoutMode: val })} style={{
                        flex: 1, padding: '7px 0', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: FONT,
                        background: layoutMode === val ? C.accent : C.overlayW10, color: C.textWhite, transition: 'background .15s',
                      }}>{label}</button>
                    ))}
                  </div>
                  {layoutMode === 'compact' && (
                    <>
                      <div style={{ fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 0.8, marginBottom: 8 }}>LIST SIZE</div>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                        {['compact', 'normal', 'wide'].map(sz => (
                          <button key={sz} onClick={() => updateSettings({ listWidth: sz })} style={{
                            flex: 1, padding: '7px 0', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 800, fontFamily: FONT, letterSpacing: 0.4,
                            background: settings.listWidth === sz ? C.accent : C.overlayW10, color: C.textWhite, transition: 'background .15s',
                          }}>{sz.toUpperCase()}</button>
                        ))}
                      </div>
                    </>
                  )}
                  <div style={{ fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 0.8, marginBottom: 8 }}>NEW LIST COLOR</div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                    {[['gray', 'Gray'], ['cycle', 'Cycle colors']].map(([val, label]) => (
                      <button key={val} onClick={() => updateSettings({ newListColorMode: val })} style={{
                        flex: 1, padding: '7px 0', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: FONT,
                        background: settings.newListColorMode === val ? C.accent : C.overlayW10, color: C.textWhite, transition: 'background .15s',
                      }}>{label}</button>
                    ))}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 0.8, marginBottom: 8 }}>TASK CARD TEXT SIZE</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['small', 'medium', 'large'].map(sz => (
                      <button key={sz} onClick={() => updateSettings({ taskTextSize: sz })} style={{
                        flex: 1, padding: '7px 0', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 800, fontFamily: FONT, letterSpacing: 0.4, textTransform: 'uppercase',
                        background: (settings.taskTextSize || 'medium') === sz ? C.accent : C.overlayW10, color: C.textWhite, transition: 'background .15s',
                      }}>{sz}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* ── Board grid ── */}
        {view === 'board' && (
          <div style={layoutMode === 'compact'
            ? { flex: 1, overflow: 'auto', padding: isMobile ? '16px 12px 24px' : '32px 36px 40px' }
            : { padding: isMobile ? '16px 12px 24px' : '32px 36px 40px' }}>
            <div className="board-grid" style={layoutMode === 'compact'
              ? { display: 'flex', gap: 16, alignItems: 'flex-start' }
              : { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 16, alignItems: 'start' }}
              onDragOver={e => { if (e.dataTransfer.types.includes('listid')) e.preventDefault() }}
              onDrop={handleListDrop}>
              {filteredLists.map((list, idx) => (
                <Fragment key={list.id}>
                  {dropIndex === idx && dragListId && list.id !== dragListId && (
                    <div style={{ borderRadius: LIST_R, minHeight: 160, ...(layoutMode === 'compact' ? { width: sizePreset.width, flexShrink: 0 } : {}), background: 'rgba(255,255,255,0.05)' }} />
                  )}
                  <TaskList list={list}
                    sizePreset={sizePreset}
                    layoutMode={layoutMode}
                    onUpdate={u => updList(list.id, u)}
                    onDelete={() => delList(list.id)}
                    onCopy={() => {
                      const nl = { ...list, id: uid(), name: list.name + ' (copy)', tasks: list.tasks.map(t => ({ ...t, id: uid(), checklist: (t.checklist||[]).map(c => ({ ...c, id: uid() })) })) }
                      setLists(p => { const i = p.findIndex(l => l.id === list.id); const n = [...p]; n.splice(i + 1, 0, nl); return n })
                    }}
                    onMoveLeft={() => setLists(p => { const i = p.findIndex(l => l.id === list.id); if (i <= 0) return p; const n = [...p]; [n[i-1], n[i]] = [n[i], n[i-1]]; return n })}
                    onMoveRight={() => setLists(p => { const i = p.findIndex(l => l.id === list.id); if (i >= p.length - 1) return p; const n = [...p]; [n[i], n[i+1]] = [n[i+1], n[i]]; return n })}
                    canMoveLeft={idx > 0}
                    canMoveRight={idx < filteredLists.length - 1}
                    boards={boards}
                    currentBoardId={board.id}
                    onMoveToBoard={targetBoardId => {
                      onUpdate({ ...board, lists: board.lists.filter(l => l.id !== list.id) })
                      const target = boards.find(b => b.id === targetBoardId)
                      if (target) onUpdate({ ...target, lists: [...target.lists, { ...list, id: uid(), tasks: list.tasks.map(t => ({ ...t, id: uid() })) }] })
                    }}
                    taskDrop={taskDrop}
                    onTaskDragOver={handleTaskDragOver}
                    onTaskDrop={handleTaskDrop}
                    isDragging={list.id === dragListId}
                    onListDragStart={e => handleListDragStart(e, list.id)}
                    onListDragOver={e => handleListDragOver(e, list.id)}
                    onListDrop={handleListDrop}
                    onListDragEnd={handleListDragEnd}
                    focusedCard={focusedCard}
                    selectedCards={selectedCards}
                    focusedAction={focusedAction}
                    onActionDone={() => setFocusedAction(null)}
                    onOpenPanel={handleOpenPanel}
                    onFocusCard={handleFocusCard}
                    onShiftClick={handleShiftClick}
                    requestAdd={requestAddInList}
                    onAddDone={() => setRequestAddInList(null)}
                    requestRename={requestRenameList}
                    onRenameDone={() => setRequestRenameList(null)}
                    boardLabels={boardLabels}
                    onCreateBoardLabel={createBoardLabel}
                    onUpdateBoardLabel={updateBoardLabel}
                    onDeleteBoardLabel={deleteBoardLabel}
                    textSize={textSize}
                    priorityColors={priorityColors}
                    onUpdatePriorityColor={updatePriorityColor} />
                </Fragment>
              ))}
              {dropIndex === filteredLists.length && dragListId && (
                <div style={{ borderRadius: LIST_R, minHeight: 160, ...(layoutMode === 'compact' ? { width: sizePreset.width, flexShrink: 0 } : {}), background: 'rgba(255,255,255,0.05)' }} />
              )}
              <button onClick={addList} style={{ border: `2px dashed ${C.overlayW15}`, background: 'transparent', borderRadius: LIST_R, padding: 32, fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: FONT, color: C.overlayW30, letterSpacing: 1, transition: 'all .2s', minHeight: 160, ...(layoutMode === 'compact' ? { width: sizePreset.width, flexShrink: 0 } : {}) }}
                onMouseEnter={e => { e.target.style.borderColor = C.overlayW40; e.target.style.color = C.textWhite }}
                onMouseLeave={e => { e.target.style.borderColor = C.overlayW15; e.target.style.color = C.overlayW30 }}>
                + NEW LIST
              </button>
            </div>
          </div>
        )}

        {/* ── Agenda ── */}
        {view === 'agenda' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '0 36px' }}>
            <AgendaView lists={lists} onUpdateLists={setLists} dayTags={dayTags} onUpdateDayTags={updDayTags} />
          </div>
        )}

        {/* ── Day ── */}
        {view === 'day' && (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <DayView lists={lists} onToggleTask={togTask} onToggleChecklist={togChecklist} />
          </div>
        )}
      </main>

      {/* ── Lifted TaskPanel ── */}
      {openPanel && openPanelTask && (
        <TaskPanel
          task={openPanelTask}
          listColor={openPanelList?.color}
          listName={openPanelList?.name || 'List'}
          onUpdate={u => setLists(p => p.map(l => l.id === openPanel.listId ? { ...l, tasks: l.tasks.map(t => t.id === u.id ? u : t) } : l))}
          onDelete={() => { setLists(p => p.map(l => l.id === openPanel.listId ? { ...l, tasks: l.tasks.filter(t => t.id !== openPanel.taskId) } : l)); setOpenPanel(null) }}
          onClose={() => setOpenPanel(null)}
          boardLabels={boardLabels}
          onCreateBoardLabel={createBoardLabel}
          onUpdateBoardLabel={updateBoardLabel}
          onDeleteBoardLabel={deleteBoardLabel}
          priorityColors={priorityColors}
          onUpdatePriorityColor={updatePriorityColor}
        />
      )}
    </div>
  )
}

/* ─── App ────────────────────────────────────────────────────────────────────── */
export default function App() {
  const [boards, setBoards] = useState(() => {
    try { const s = localStorage.getItem('planner-boards'); return s ? JSON.parse(s) : [] } catch { return [] }
  })
  const [activeBoardId, setActiveBoardId] = useState(() => {
    return localStorage.getItem('planner-active') || null
  })
  const [newBoardName, setNewBoardName] = useState('')
  const isMobile = useIsMobile()

  useEffect(() => {
    const h = e => {
      const tag = e.target.tagName
      if (tag !== 'INPUT' && tag !== 'TEXTAREA') return
      let el = e.target.parentElement
      while (el) {
        if (el.draggable) {
          el.draggable = false
          document.addEventListener('mouseup', () => { el.draggable = true }, { once: true })
          break
        }
        el = el.parentElement
      }
    }
    document.addEventListener('mousedown', h, true)
    return () => document.removeEventListener('mousedown', h, true)
  }, [])

  useEffect(() => {
    try { localStorage.setItem('planner-boards', JSON.stringify(boards)) } catch { }
  }, [boards])

  useEffect(() => {
    if (activeBoardId) try { localStorage.setItem('planner-active', activeBoardId) } catch { }
  }, [activeBoardId])

  const createBoard = name => {
    const b = newBoard(name, PALETTE[boards.length % PALETTE.length])
    setBoards(p => [...p, b])
    setActiveBoardId(b.id)
    setNewBoardName('')
  }

  const deleteBoard = id => {
    setBoards(p => {
      const next = p.filter(b => b.id !== id)
      if (activeBoardId === id) setActiveBoardId(next[0]?.id || null)
      return next
    })
  }

  const updateBoard = updated => setBoards(p => p.map(b => b.id === updated.id ? updated : b))

  const activeBoard = boards.find(b => b.id === activeBoardId)

  /* ── Empty state ── */
  if (boards.length === 0) {
    return (
      <>
        <style>{GLOBAL_CSS}</style>
        <div style={{ minHeight: '100vh', background: C.bg, fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'left', width: '100%', maxWidth: '100%', padding: 20, boxSizing: 'border-box' }}>
            <div style={{ fontSize: isMobile ? 56 : 246, fontWeight: 900, color: C.textWhite, letterSpacing: -1, marginBottom: 8 }}>PLANNA</div>
            <p style={{ fontSize: 14, fontWeight: 600, color: C.textMuted, marginBottom: 32 }}>Create your first board to get started</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              <input autoFocus value={newBoardName} onChange={e => setNewBoardName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && newBoardName.trim()) createBoard(newBoardName.trim()) }}
                placeholder="Board name…"
                style={{ flex: 1, border: 'none', borderRadius: R, padding: '16px 20px', fontSize: 16, fontFamily: FONT, fontWeight: 700, outline: 'none', background: C.border, color: C.textWhite }} />
              <button onClick={() => { if (newBoardName.trim()) createBoard(newBoardName.trim()) }} style={{ border: 'none', background: C.accent, color: C.textWhite, borderRadius: R, padding: '16px 28px', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: FONT, letterSpacing: 0.5 }}>CREATE</button>
            </div>
            <div style={{ paddingTop: 24, borderTop: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, marginBottom: 2, letterSpacing: 0.5 }}>OR START WITH A TEMPLATE</p>
              <div onClick={() => { const b = templateBoard(); setBoards([b]); setActiveBoardId(b.id) }} style={{ background: C.border, borderRadius: R - 4, padding: '16px 20px', cursor: 'pointer', transition: 'background .15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = C.borderHover }}
                onMouseLeave={e => { e.currentTarget.style.background = C.border }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.textWhite, marginBottom: 8 }}>Kanban Board</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[['TO DO', '#FF573B'], ['IN PROGRESS', '#0988EF'], ['DONE', '#018848']].map(([l, c]) => (
                    <span key={l} style={{ background: c, borderRadius: 4, padding: '3px 10px', fontSize: 9, fontWeight: 800, color: '#fff', letterSpacing: 0.5 }}>{l}</span>
                  ))}
                </div>
              </div>
              <div onClick={() => { const b = priorityTemplateBoard(); setBoards([b]); setActiveBoardId(b.id) }} style={{ background: C.border, borderRadius: R - 4, padding: '16px 20px', cursor: 'pointer', transition: 'background .15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = C.borderHover }}
                onMouseLeave={e => { e.currentTarget.style.background = C.border }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.textWhite, marginBottom: 8 }}>Priority Levels</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {PRIORITY_LEVELS.map(([l, c]) => (
                    <span key={l} style={{ background: c, borderRadius: 4, padding: '3px 10px', fontSize: 9, fontWeight: 800, color: '#fff', letterSpacing: 0.5 }}>{l}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  /* ── Auto-select first board if active was deleted ── */
  if (!activeBoard) {
    setActiveBoardId(boards[0].id)
    return null
  }

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <BoardDetail
        board={activeBoard} boards={boards}
        onUpdate={updateBoard}
        onSwitchBoard={setActiveBoardId}
        onCreateBoard={createBoard}
        onDeleteBoard={deleteBoard}
      />
    </>
  )
}
