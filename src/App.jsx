import React, { useState, useRef, useEffect, useMemo, Fragment } from 'react'

/* ─── Design tokens ──────────────────────────────────────────────────────────── */
const FONT = "'Archivo', sans-serif"
const R = 20

const C = {
  bg:          '#141517',
  card:        '#FFFFFF',
  cardAlt:     '#F2F4F7',
  text:        '#141517',
  textMuted:   '#8A8D93',
  textLight:   '#C4C6CA',
  textWhite:   '#FFFFFF',
  accent:      '#FF4F18',
  accentLight: '#FF8A5C',
  danger:      '#D45858',
  dangerBg:    '#D4585833',
  border:      '#222426',
  borderHover: '#3A3A3A',
  shadow:      'rgba(0,0,0,0.1)',
  shadowDeep:  'rgba(0,0,0,0.5)',
  overlay06:   'rgba(0,0,0,0.06)',
  overlayW10:  'rgba(255,255,255,0.10)',
  overlayW15:  'rgba(255,255,255,0.15)',
  overlayW20:  'rgba(255,255,255,0.20)',
  overlayW25:  'rgba(255,255,255,0.25)',
  overlayW30:  'rgba(255,255,255,0.30)',
  overlayW35:  'rgba(255,255,255,0.35)',
  overlayW40:  'rgba(255,255,255,0.40)',
  overlayW50:  'rgba(255,255,255,0.50)',
  overlayB10:  'rgba(0,0,0,0.10)',
  overlayB20:  'rgba(0,0,0,0.20)',
  overlayB35:  'rgba(0,0,0,0.35)',
  overlayB40:  'rgba(0,0,0,0.40)',
}

const PALETTE = [
  '#f94144','#f3722c','#f8961e','#f9844a','#f9c74f',
  '#90be6d','#43aa8b','#4d908e','#577590','#277da1',
]

const LABEL_COLORS = [
  '#f94144','#f3722c','#f8961e','#f9844a','#f9c74f',
  '#90be6d','#43aa8b','#4d908e','#577590','#277da1',
]

/* ─── Global CSS ─────────────────────────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; background: #141517; }
  body { font-family: 'Archivo', sans-serif; }
  #root { width: 100% !important; max-width: 100% !important; margin: 0 !important;
          border: none !important; display: block !important; text-align: left !important; min-height: 100vh; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.10); border-radius: 4px; }
  input, textarea { caret-color: ${C.text} !important; }
  input:focus, textarea:focus { outline: none; }
  .task-card:hover { border-color: rgba(255,255,255,0.25) !important; transform: translateY(-1px); }
  .task-card:hover .chk-tr { opacity: 1 !important; }
  .task-card[draggable]:active { opacity: 0.5; }
  .view-btn { border: none; background: transparent; padding: 10px 20px; font-size: 11px; font-weight: 800;
              cursor: pointer; border-radius: 12px; font-family: 'Archivo', sans-serif;
              color: rgba(255,255,255,0.35); transition: all .15s; letter-spacing: 1px; }
  .view-btn:hover { background: ${C.border}; color: ${C.textWhite}; }
  .view-btn.active { background: ${C.accent}; color: ${C.textWhite}; }
  @keyframes check-bounce-anim { 0%{transform:scale(1)} 35%{transform:scale(1.2)} 65%{transform:scale(.95)} 100%{transform:scale(1)} }
  .check-bounce { animation: check-bounce-anim .5s cubic-bezier(.3,.7,.4,1) 1.3s; transform-origin: center; }
  @media (max-width: 640px) { .top-bar h1 { font-size: 20px !important; } .board-grid { grid-template-columns: 1fr !important; } }
  @media (hover: none) { .chk-tr { opacity: 1 !important; } }
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
      date:   d.toISOString().split('T')[0],
      full:   d.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase(),
      short:  d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
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
  return { id: uid(), text, done: false, note: '', dueDate, startTime: '', endTime: '', labels: [], checklist: [] }
}

function newBoard(name) {
  return { id: uid(), name, color: PALETTE[0], lists: [], dayTags: {} }
}

function templateBoard() {
  return {
    id: uid(), name: 'MY BOARD', color: PALETTE[0], dayTags: {},
    lists: [
      { id: uid(), name: 'TO DO',       color: PALETTE[0], collapsed: false, tasks: [] },
      { id: uid(), name: 'IN PROGRESS', color: PALETTE[1], collapsed: false, tasks: [] },
      { id: uid(), name: 'DONE',        color: PALETTE[2], collapsed: false, tasks: [] },
    ],
  }
}

/* ─── Editable ───────────────────────────────────────────────────────────────── */
function Editable({ value, onChange, style }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(value)
  const ref = useRef(null)

  useEffect(() => { setDraft(value) }, [value])
  useEffect(() => { if (editing && ref.current) ref.current.focus() }, [editing])

  if (!editing) {
    return <span style={{ ...style, cursor: 'text' }} onClick={() => setEditing(true)}>{value}</span>
  }
  return (
    <input ref={ref} value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={() => { onChange(draft); setEditing(false) }}
      onKeyDown={e => {
        if (e.key === 'Enter')  { onChange(draft); setEditing(false) }
        if (e.key === 'Escape') { setDraft(value); setEditing(false) }
      }}
      style={{
        border: 'none', outline: 'none', background: 'transparent', width: '100%', padding: 0, margin: 0,
        fontFamily: style?.fontFamily || FONT, fontSize: style?.fontSize || 'inherit',
        fontWeight: style?.fontWeight || 'inherit', color: style?.color || 'inherit',
        letterSpacing: style?.letterSpacing || 'inherit', lineHeight: style?.lineHeight || 'inherit',
        caretColor: C.text,
      }}
    />
  )
}

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

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose])

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
      {showPicker && <ColorPicker colors={LABEL_COLORS} current={label.color} onPick={onChangeColor} onClose={() => setShowPicker(false)} />}
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
    dx:  Math.cos(Math.PI * 2 * i / 8 - Math.PI / 2) * 14,
    dy:  Math.sin(Math.PI * 2 * i / 8 - Math.PI / 2) * 14,
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
function DueBadge({ date }) {
  if (!date) return null
  const ov = isOverdue(date)
  return (
    <span style={{
      fontSize: 9, fontWeight: 800, fontFamily: FONT, letterSpacing: 1, padding: '3px 8px', borderRadius: 6,
      background: ov ? C.dangerBg : C.overlayW20, color: ov ? C.danger : C.textWhite,
    }}>{formatDate(date)}</span>
  )
}

/* ─── ChecklistItem ──────────────────────────────────────────────────────────── */
function ChecklistItem({ item, lc, onToggle, onRename, onDelete, onSetDue }) {
  const [active, setActive]   = useState(false)
  const [draft, setDraft]     = useState(item.text)
  const [showDue, setShowDue] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { setDraft(item.text) }, [item.text])
  useEffect(() => { if (active && inputRef.current) inputRef.current.focus() }, [active])

  const save   = () => { onRename(draft); setActive(false); setShowDue(false) }
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
        <div style={{ flex: 1, minWidth: 0 }} onClick={() => !active && setActive(true)}>
          {active ? (
            <textarea ref={inputRef} value={draft} onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') cancel() }} rows={2}
              style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: 13, fontFamily: FONT, fontWeight: 500, color: C.textWhite, lineHeight: 1.4, resize: 'none', padding: 0, textDecoration: item.done ? 'line-through' : 'none' }}
            />
          ) : (
            <>
              <span style={{ fontSize: 13, fontWeight: 500, fontFamily: FONT, color: item.done ? C.textMuted : C.textWhite, textDecoration: item.done ? 'line-through' : 'none', lineHeight: 1.4, cursor: 'text', display: 'block' }}>
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
function TaskPanel({ task, onUpdate, onDelete, onClose, listName, listColor }) {
  const ref     = useRef(null)
  const itemRef = useRef(null)
  const [newItem, setNewItem]       = useState('')
  const [editingDesc, setEditingDesc] = useState(false)
  const lc = listColor || C.accent
  const cl = task.checklist || []
  const clDone = cl.filter(c => c.done).length

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose])

  const addItem  = () => { if (!newItem.trim()) return; onUpdate({ ...task, checklist: [...cl, { id: uid(), text: newItem.trim(), done: false, dueDate: '' }] }); setNewItem('') }
  const togItem  = id => onUpdate({ ...task, checklist: cl.map(c => c.id === id ? { ...c, done: !c.done } : c) })
  const delItem  = id => onUpdate({ ...task, checklist: cl.filter(c => c.id !== id) })
  const renItem  = (id, t) => onUpdate({ ...task, checklist: cl.map(c => c.id === id ? { ...c, text: t } : c) })
  const addLabel = () => onUpdate({ ...task, labels: [...task.labels, { id: uid(), name: 'LABEL', color: LABEL_COLORS[Math.floor(Math.random() * LABEL_COLORS.length)] }] })
  const updLabel = (id, k, v) => onUpdate({ ...task, labels: task.labels.map(l => l.id === id ? { ...l, [k]: v } : l) })
  const rmLabel  = id => onUpdate({ ...task, labels: task.labels.filter(l => l.id !== id) })

  const SideBtn = ({ label, icon, onClick }) => (
    <div onClick={onClick} style={{ padding: '7px 12px', borderRadius: 6, cursor: 'pointer', background: C.overlayW10, fontSize: 12, fontWeight: 600, color: C.textWhite, display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4, transition: 'background .1s' }}
      onMouseEnter={e => { e.currentTarget.style.background = C.overlayW20 }}
      onMouseLeave={e => { e.currentTarget.style.background = C.overlayW10 }}>
      {icon}{label}
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 40, overflowY: 'auto' }}>
      <div ref={ref} style={{ background: '#23272A', borderRadius: 12, width: '100%', maxWidth: 700, margin: '0 12px 60px', fontFamily: FONT, boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
        {/* Panel header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: lc }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: 0.3 }}>{listName}</span>
          </div>
          <div onClick={onClose} style={{ width: 30, height: 30, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={e => { e.currentTarget.style.background = C.overlayW10 }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke={C.textMuted} strokeWidth="2" strokeLinecap="round" /></svg>
          </div>
        </div>

        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px 0' }}>
          <div onClick={() => onUpdate({ ...task, done: !task.done })} style={{
            width: 22, height: 22, borderRadius: '50%', cursor: 'pointer', flexShrink: 0, marginTop: 4,
            border: task.done ? 'none' : `2px solid ${C.textMuted}`, background: task.done ? lc : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {task.done && <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
          </div>
          <Editable value={task.text} onChange={v => onUpdate({ ...task, text: v })} style={{
            fontSize: 20, fontWeight: 700, fontFamily: FONT, color: C.textWhite, lineHeight: 1.3,
            textDecoration: task.done ? 'line-through' : 'none',
          }} />
        </div>

        <div style={{ display: 'flex', gap: 0 }}>
          {/* Main area */}
          <div style={{ flex: 1, padding: '16px 16px 24px', minWidth: 0 }}>
            {/* Action pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
              {[
                { l: '+ Label', fn: addLabel },
                { l: 'Checklist', fn: () => setTimeout(() => itemRef.current?.focus(), 50) },
              ].map(({ l, fn }) => (
                <div key={l} onClick={fn} style={{ padding: '6px 12px', borderRadius: 6, background: C.overlayW10, fontSize: 12, fontWeight: 600, color: C.textWhite, cursor: 'pointer', transition: 'background .1s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.overlayW20 }}
                  onMouseLeave={e => { e.currentTarget.style.background = C.overlayW10 }}>
                  {l}
                </div>
              ))}
            </div>

            {/* Labels */}
            {task.labels.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, marginBottom: 8 }}>Labels</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                  {task.labels.map(l => (
                    <LabelPill key={l.id} label={l} onRename={v => updLabel(l.id, 'name', v)} onChangeColor={c => updLabel(l.id, 'color', c)} onRemove={() => rmLabel(l.id)} />
                  ))}
                  <div onClick={addLabel} style={{ width: 28, height: 28, borderRadius: 6, background: C.overlayW10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onMouseEnter={e => { e.currentTarget.style.background = C.overlayW20 }}
                    onMouseLeave={e => { e.currentTarget.style.background = C.overlayW10 }}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 4v8M4 8h8" stroke={C.textMuted} strokeWidth="2" strokeLinecap="round" /></svg>
                  </div>
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
          <div style={{ width: 190, padding: '16px 16px 24px 0', flexShrink: 0 }}>
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
function TaskCard({ task, listId, listColor, listName, onToggle, onUpdate, onDelete, compact }) {
  const [panelOpen, setPanelOpen] = useState(false)
  const [burst, setBurst]         = useState(null)
  const chkRef = useRef(null)
  const lc = listColor || C.accent
  const cl = task.checklist || []
  const clDone = cl.filter(c => c.done).length

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
      <div className="task-card" draggable
        onClick={() => setPanelOpen(true)}
        onDragStart={e => { e.stopPropagation(); e.dataTransfer.setData('taskId', task.id); e.dataTransfer.setData('sourceListId', listId); e.dataTransfer.effectAllowed = 'move' }}
        style={{
          background: '#1E2328', borderRadius: 12,
          padding: compact ? '12px 14px' : '18px 18px',
          cursor: 'pointer', position: 'relative',
          border: '1px solid rgba(255,255,255,0.07)',
          opacity: task.done ? 0.55 : 1,
          transition: 'border-color .15s, transform .12s',
        }}
      >
        {/* Label colour bars */}
        {task.labels.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
            {task.labels.map(l => <div key={l.id} style={{ height: 6, width: 36, borderRadius: 3, background: l.color }} />)}
          </div>
        )}

        {/* Task text */}
        <div style={{ fontSize: 14, fontWeight: 600, color: C.textWhite, lineHeight: 1.5, paddingRight: 32, textDecoration: task.done ? 'line-through' : 'none', marginBottom: 12 }}>
          {task.text}
        </div>

        {/* Badges row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Checklist */}
          {cl.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="12" height="12" rx="2.5" stroke={clDone === cl.length ? '#43aa8b' : C.textMuted} strokeWidth="1.4" />
                {clDone === cl.length && <path d="M4.5 8l3 3 4-5" stroke="#43aa8b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
              </svg>
              <span style={{ fontSize: 11, fontWeight: 700, color: clDone === cl.length ? '#43aa8b' : C.textMuted, fontFamily: FONT, letterSpacing: 0.2 }}>{clDone}/{cl.length}</span>
            </div>
          )}

          {/* Due date */}
          {task.dueDate && <DueBadge date={task.dueDate} />}

          {/* Note indicator */}
          {task.note && (
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.4 }}>
              <line x1="2" y1="5" x2="14" y2="5" stroke={C.textWhite} strokeWidth="1.5" strokeLinecap="round" />
              <line x1="2" y1="8" x2="14" y2="8" stroke={C.textWhite} strokeWidth="1.5" strokeLinecap="round" />
              <line x1="2" y1="11" x2="9" y2="11" stroke={C.textWhite} strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </div>

        {/* Checkmark top-right (visible on hover) */}
        <div style={{ position: 'absolute', top: 10, right: 10 }} onClick={e => e.stopPropagation()}>
          <div ref={chkRef} onClick={handleToggle} className="chk-tr" style={{
            width: 22, height: 22, borderRadius: '50%', cursor: 'pointer',
            border: task.done ? 'none' : '2px solid rgba(255,255,255,0.18)',
            background: task.done ? lc : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0, transition: 'opacity .15s',
          }}>
            {task.done && (
              <svg width="10" height="10" viewBox="0 0 12 12" className={burst ? 'check-bounce' : ''}>
                <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </div>
      </div>

      <Confetti burst={burst} onDone={() => setBurst(null)} />
      {panelOpen && (
        <TaskPanel task={task} onUpdate={onUpdate} onDelete={onDelete}
          onClose={() => setPanelOpen(false)} listColor={lc} listName={listName || 'List'} />
      )}
    </>
  )
}

/* ─── TaskList ───────────────────────────────────────────────────────────────── */
function TaskList({ list, onUpdate, onDelete, taskDrop, onTaskDragOver, onTaskDrop, isDragging, onListDragStart, onListDragOver, onListDrop, onListDragEnd }) {
  const [showCP, setShowCP]     = useState(false)
  const [taskText, setTaskText] = useState('')
  const [adding, setAdding]     = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { if (adding && inputRef.current) inputRef.current.focus() }, [adding])

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
  const DropLine = () => <div style={{ height: 3, background: C.card, borderRadius: 2, margin: '2px 8px', opacity: 0.6 }} />

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
      style={{ borderRadius: R, background: list.color, position: 'relative', opacity: isDragging ? 0.4 : 1, transition: 'opacity .15s' }}>
      {/* List header */}
      <div onClick={() => updList({ collapsed: !list.collapsed })}
        style={{ padding: '36px 28px 24px', cursor: 'pointer', userSelect: 'none', minHeight: 140, position: 'relative' }}>
        <div onClick={e => e.stopPropagation()} style={{ position: 'relative', zIndex: 1 }}>
          <Editable value={list.name} onChange={v => updList({ name: v })} style={{
            fontSize: 40, fontFamily: FONT, fontWeight: 900, color: C.text, letterSpacing: -2, lineHeight: 1, display: 'block',
          }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: C.overlayB40, fontFamily: FONT, letterSpacing: 1 }}>
            {list.tasks.length} {list.tasks.length === 1 ? 'TASK' : 'TASKS'}
          </span>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
            <div style={{ position: 'relative' }}>
              <div onMouseDown={e => e.stopPropagation()} onClick={() => setShowCP(!showCP)} style={{ width: 20, height: 20, borderRadius: 6, background: C.overlayB10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: C.overlayB20 }} />
              </div>
              {showCP && <ColorPicker colors={PALETTE} current={list.color} onPick={c => updList({ color: c })} onClose={() => setShowCP(false)} />}
            </div>
            <div onClick={onDelete} style={{ width: 20, height: 20, borderRadius: 6, background: C.overlayB10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: C.overlayB40, fontWeight: 700 }}>×</div>
          </div>
        </div>
        <svg width="12" height="12" viewBox="0 0 12 12" style={{ position: 'absolute', bottom: 8, left: '50%', transform: `translateX(-50%) rotate(${list.collapsed ? '180deg' : '0deg'})`, transition: 'transform .2s', opacity: 0.3 }}>
          <path d="M3 4l3 3 3-3" stroke={C.text} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Tasks */}
      {!list.collapsed && (
        <div onDragOver={handleAreaDragOver} onDrop={handleDrop} style={{ padding: '0 10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {list.tasks.map((task, idx) => (
            <Fragment key={task.id}>
              {showInd && taskDrop.index === idx && <DropLine />}
              <div onDragOver={e => handleCardDragOver(e, idx)}>
                <TaskCard task={task} listId={list.id} listColor={list.color} listName={list.name}
                  onToggle={() => togTask(task.id)}
                  onUpdate={u => updTask(task.id, u)}
                  onDelete={() => delTask(task.id)} />
              </div>
            </Fragment>
          ))}
          {showInd && taskDrop.index === list.tasks.length && <DropLine />}

          {adding ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '4px 8px' }}>
              <input ref={inputRef} value={taskText} onChange={e => setTaskText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addTask(); if (e.key === 'Escape') { setAdding(false); setTaskText('') } }}
                placeholder="Task name…"
                style={{ width: '100%', border: 'none', borderRadius: R - 4, padding: '12px 16px', fontSize: 14, fontFamily: FONT, fontWeight: 600, outline: 'none', background: C.card, color: C.text, boxSizing: 'border-box' }} />
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
        </div>
      )}
    </div>
  )
}

/* ─── MiniCalendar ───────────────────────────────────────────────────────────── */
function MiniCalendar({ onPickDate, onClose }) {
  const [viewDate, setViewDate] = useState(new Date())
  const ref = useRef(null)

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose])

  const year  = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const monthName = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()

  const firstDay  = new Date(year, month, 1)
  const startDay  = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1
  const daysInMon = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMon; d++) cells.push(d)

  const t = todayStr()
  const DAY_LABELS = ['MO','TU','WE','TH','FR','SA','SU']

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
          const ds = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
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
function AgendaDay({ day, tasks, isToday, lists, tags, onUpdateTags, onToggle, onUpdate, onDelete, onAddTask }) {
  const [adding, setAdding]       = useState(false)
  const [taskText, setTaskText]   = useState('')
  const [selListId, setSelListId] = useState(lists[0]?.id || '')
  const inputRef = useRef(null)

  useEffect(() => { if (adding && inputRef.current) inputRef.current.focus() }, [adding])

  const handleAdd = () => {
    if (!taskText.trim() || !selListId) return
    onAddTask(selListId, taskText.trim(), day.date)
    setTaskText('')
  }

  const addTag    = () => onUpdateTags([...tags, { id: uid(), name: 'TAG', color: LABEL_COLORS[Math.floor(Math.random() * LABEL_COLORS.length)] }])
  const updTag    = (id, k, v) => onUpdateTags(tags.map(t => t.id === id ? { ...t, [k]: v } : t))
  const removeTag = id => onUpdateTags(tags.filter(t => t.id !== id))

  const numStr  = String(day.dayNum).padStart(2, '0')
  const dayAbbr = day.full.slice(0, 2)

  return (
    <div style={{ display: 'flex', minHeight: 100, borderBottom: `1px solid ${C.border}` }}>

      {/* ── Left: large date ── */}
      <div style={{ width: 140, flexShrink: 0, padding: '28px 24px 28px 0', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-start' }}>
        <div style={{ fontSize: 96, fontWeight: 900, lineHeight: 1, letterSpacing: -5, fontFamily: FONT, color: isToday ? C.accent : C.textWhite }}>
          {numStr}
        </div>
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 3, marginTop: 6, fontFamily: FONT, color: isToday ? C.accent : C.textMuted }}>
          {dayAbbr}
        </div>
      </div>

      {/* ── Vertical rule ── */}
      <div style={{ width: 1, background: C.border, flexShrink: 0, margin: '20px 0' }} />

      {/* ── Right: events ── */}
      <div style={{ flex: 1, padding: '28px 0 28px 36px', minWidth: 0 }}>

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
            There is no event set
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
                  {t.endTime   && <div style={{ opacity: 0.6 }}>– {t.endTime}</div>}
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
            <div onClick={() => onToggle(t._listId, t.id)} style={{ width: 22, height: 22, borderRadius: '50%', cursor: 'pointer', flexShrink: 0, marginTop: 4, border: t.done ? 'none' : `2px solid ${C.textMuted}`, background: t.done ? t._listColor || C.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {t.done && <svg width="11" height="11" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </div>
          </div>
        ))}

        {/* Add event */}
        {adding ? (
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <input ref={inputRef} value={taskText} onChange={e => setTaskText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { handleAdd(); if (!taskText.trim()) setAdding(false) } if (e.key === 'Escape') { setTaskText(''); setAdding(false) } }}
              placeholder="Event name…"
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
            ADD EVENT
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
function AgendaView({ lists, onUpdateLists, dayTags, onUpdateDayTags }) {
  const [weekOffset, setWeekOffset] = useState(0)
  const [calOpen, setCalOpen]       = useState(false)

  const weekDays  = useMemo(() => getWeekDates(weekOffset), [weekOffset])
  const weekLabel = useMemo(() => getWeekLabel(weekOffset), [weekOffset])
  const today     = todayStr()

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
      if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return
      if (e.key === 'ArrowLeft')  setWeekOffset(w => w - 1)
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
  const updTask = (lid, tid, u) => onUpdateLists(lists.map(l => l.id === lid ? { ...l, tasks: l.tasks.map(t => t.id === tid ? u : t) } : l))
  const delTask = (lid, tid) => onUpdateLists(lists.map(l => l.id === lid ? { ...l, tasks: l.tasks.filter(t => t.id !== tid) } : l))
  const addTask = (lid, text, dueDate) => onUpdateLists(lists.map(l => l.id === lid ? { ...l, tasks: [...l.tasks, newTask(text, dueDate)] } : l))

  const ArrowBtn = ({ dir, onClick }) => (
    <div onClick={onClick} style={{ width: 40, height: 40, borderRadius: R, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.border }}
      onMouseEnter={e => { e.currentTarget.style.background = C.borderHover }}
      onMouseLeave={e => { e.currentTarget.style.background = C.border }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d={dir === 'l' ? 'M10 4l-4 4 4 4' : 'M6 4l4 4-4 4'} stroke={C.textWhite} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Week navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 0 24px' }}>
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

      {weekDays.map(day => (
        <AgendaDay key={day.date} day={day} tasks={tasksByDate[day.date] || []}
          isToday={day.date === today} lists={lists}
          tags={dayTags[day.date] || []}
          onUpdateTags={tags => onUpdateDayTags(day.date, tags)}
          onToggle={togTask} onUpdate={updTask} onDelete={delTask} onAddTask={addTask} />
      ))}
    </div>
  )
}

/* ─── DayView ────────────────────────────────────────────────────────────────── */
function DayView({ lists, onToggleTask, onToggleChecklist }) {
  const now   = new Date()
  const today = todayStr()

  const dayLabel  = now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
  const dateLabel = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()

  const allTasks = lists
    .flatMap(l => l.tasks.map(t => ({ ...t, _listColor: l.color, _listName: l.name, _listId: l.id })))
    .filter(t => t.dueDate === today || !t.dueDate)
    .sort((a, b) => {
      if (!a.startTime && !b.startTime) return 0
      if (!a.startTime) return 1
      if (!b.startTime) return -1
      return a.startTime.localeCompare(b.startTime)
    })

  const Chk = ({ done, size, color, onToggle }) => (
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
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, background: lc + '20', padding: '2px 7px', borderRadius: 10 }}>{task._listName}</span>
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
function BoardDetail({ board, boards, onUpdate, onSwitchBoard, onCreateBoard, onDeleteBoard }) {
  const [view, setView]               = useState('day')
  const [taskDrop, setTaskDrop]       = useState(null)
  const [newName, setNewName]         = useState('')
  const [weekFilter, setWeekFilter]   = useState(false)
  const [weekOffset, setWeekOffset]   = useState(0)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft]   = useState(board.name)
  const newInputRef = useRef(null)

  useEffect(() => { setTitleDraft(board.name) }, [board.name])

  const saveTitle = () => { if (titleDraft.trim()) onUpdate({ ...board, name: titleDraft.trim() }); setEditingTitle(false) }

  const weekDays  = useMemo(() => getWeekDates(weekOffset), [weekOffset])
  const weekLabel = useMemo(() => getWeekLabel(weekOffset), [weekOffset])
  const today     = todayStr()

  const lists   = board.lists
  const dayTags = board.dayTags || {}

  const setLists   = updater => { const next = typeof updater === 'function' ? updater(lists) : updater; onUpdate({ ...board, lists: next }) }
  const updDayTags = (date, tags) => onUpdate({ ...board, dayTags: { ...dayTags, [date]: tags } })
  const updList    = (id, u) => setLists(p => p.map(l => l.id === id ? u : l))
  const togTask    = (lid, tid) => setLists(p => p.map(l => l.id === lid ? { ...l, tasks: l.tasks.map(t => t.id === tid ? { ...t, done: !t.done } : t) } : l))
  const togChecklist = (lid, tid, iid) => setLists(p => p.map(l => l.id === lid ? { ...l, tasks: l.tasks.map(t => t.id === tid ? { ...t, checklist: (t.checklist||[]).map(ci => ci.id === iid ? { ...ci, done: !ci.done } : ci) } : t) } : l))
  const delList    = id => setLists(p => p.filter(l => l.id !== id))
  const addList    = () => setLists(p => [...p, { id: uid(), name: 'NEW LIST', color: PALETTE[p.length % PALETTE.length], collapsed: false, tasks: [] }])

  // ── List drag ──
  const [dragListId, setDragListId] = useState(null)
  const [dropIndex,  setDropIndex]  = useState(null)

  const handleListDragStart = (e, listId) => {
    setDragListId(listId)
    e.dataTransfer.setData('listid', listId)
    e.dataTransfer.effectAllowed = 'move'
  }
  const handleListDragOver = (e, hoveredListId) => {
    if (!e.dataTransfer.types.includes('listid')) return
    e.preventDefault()
    const fromIdx = lists.findIndex(l => l.id === dragListId)
    const toIdx   = lists.findIndex(l => l.id === hoveredListId)
    const r   = e.currentTarget.getBoundingClientRect()
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

  /* ── Sidebar nav item ── */
  const NavItem = ({ label, icon, active, onClick }) => (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, cursor: 'pointer', background: active ? C.border : 'transparent', transition: 'background .15s', marginBottom: 2 }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = C.overlayW10 }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
      {icon}
      <span style={{ fontSize: 11, fontWeight: 800, color: active ? C.textWhite : C.textMuted, letterSpacing: 0.8, fontFamily: FONT }}>{label}</span>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, fontFamily: FONT }}>

      {/* ════════════════ LEFT SIDEBAR ════════════════ */}
      <div style={{ width: 220, flexShrink: 0, background: '#191B1D', borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>

        {/* Branding */}
        <div style={{ padding: '24px 16px 20px' }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: C.textWhite, letterSpacing: -0.5, fontFamily: FONT }}>PLANNA</div>
        </div>

        <div style={{ height: 1, background: C.border, margin: '0 16px 12px' }} />

        {/* View nav */}
        <div style={{ padding: '0 8px 8px' }}>
          <NavItem label="DAY" active={view === 'day'} onClick={() => setView('day')}
            icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke={view === 'day' ? C.textWhite : C.textMuted} strokeWidth="1.3" /><line x1="8" y1="4" x2="8" y2="8" stroke={view === 'day' ? C.textWhite : C.textMuted} strokeWidth="1.3" strokeLinecap="round" /><line x1="8" y1="8" x2="11" y2="10" stroke={view === 'day' ? C.textWhite : C.textMuted} strokeWidth="1.3" strokeLinecap="round" /></svg>}
          />
          <NavItem label="BOARD" active={view === 'board'} onClick={() => setView('board')}
            icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="9" rx="1.5" stroke={view === 'board' ? C.textWhite : C.textMuted} strokeWidth="1.3" /><rect x="9" y="1" width="6" height="5" rx="1.5" stroke={view === 'board' ? C.textWhite : C.textMuted} strokeWidth="1.3" /><rect x="9" y="8" width="6" height="7" rx="1.5" stroke={view === 'board' ? C.textWhite : C.textMuted} strokeWidth="1.3" /></svg>}
          />
          <NavItem label="AGENDA" active={view === 'agenda'} onClick={() => setView('agenda')}
            icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" stroke={view === 'agenda' ? C.textWhite : C.textMuted} strokeWidth="1.3" /><line x1="2" y1="6" x2="14" y2="6" stroke={view === 'agenda' ? C.textWhite : C.textMuted} strokeWidth="1.3" /><line x1="6" y1="2" x2="6" y2="6" stroke={view === 'agenda' ? C.textWhite : C.textMuted} strokeWidth="1.3" /></svg>}
          />
        </div>

        <div style={{ height: 1, background: C.border, margin: '4px 16px 16px' }} />

        {/* Boards list */}
        <div style={{ padding: '0 8px', flex: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: C.textMuted, letterSpacing: 1.5, padding: '0 8px 8px', fontFamily: FONT }}>BOARDS</div>
          {boards.map(b => (
            <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', background: b.id === board.id ? C.border : 'transparent', marginBottom: 2, transition: 'background .15s', group: true }}
              onClick={() => onSwitchBoard(b.id)}
              onMouseEnter={e => { if (b.id !== board.id) e.currentTarget.style.background = C.overlayW10 }}
              onMouseLeave={e => { if (b.id !== board.id) e.currentTarget.style.background = 'transparent' }}>
              <div style={{ width: 8, height: 8, borderRadius: 3, background: b.color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: b.id === board.id ? C.textWhite : C.textMuted, fontFamily: FONT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</span>
              <div onClick={e => { e.stopPropagation(); onDeleteBoard(b.id) }} style={{ width: 16, height: 16, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 12, color: C.textMuted, fontWeight: 700, flexShrink: 0, transition: 'color .15s' }}
                onMouseEnter={e => { e.currentTarget.style.color = C.danger }}
                onMouseLeave={e => { e.currentTarget.style.color = C.textMuted }}>×</div>
            </div>
          ))}
        </div>

        {/* New board input */}
        <div style={{ padding: '12px 16px 24px', borderTop: `1px solid ${C.border}`, marginTop: 8 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <input ref={newInputRef} value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setNewName('') }}
              placeholder="New board…"
              style={{ flex: 1, border: 'none', borderRadius: 8, padding: '8px 10px', fontSize: 11, fontFamily: FONT, fontWeight: 600, outline: 'none', background: C.border, color: C.textWhite }} />
            <button onClick={handleCreate} style={{ border: 'none', background: C.accent, color: C.textWhite, borderRadius: 8, padding: '0 10px', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: FONT }}>+</button>
          </div>
        </div>
      </div>

      {/* ════════════════ MAIN CONTENT ════════════════ */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* ── Top bar ── */}
        <div style={{ padding: '28px 36px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: board.color }} />
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
              <h1 onClick={() => setEditingTitle(true)} style={{ fontSize: 24, fontFamily: FONT, fontWeight: 900, color: C.textWhite, letterSpacing: -0.5, cursor: 'text' }}>{board.name}</h1>
            )}
          </div>

          {/* Week filter (board only) */}
          {view === 'board' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div onClick={() => setWeekFilter(!weekFilter)} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', background: weekFilter ? C.accent : C.border, borderRadius: 8, padding: '6px 12px', transition: 'background .15s' }}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="2" stroke={C.textWhite} strokeWidth="1.3" /><line x1="2" y1="7" x2="14" y2="7" stroke={C.textWhite} strokeWidth="1.3" /><line x1="6" y1="1" x2="6" y2="5" stroke={C.textWhite} strokeWidth="1.3" strokeLinecap="round" /><line x1="10" y1="1" x2="10" y2="5" stroke={C.textWhite} strokeWidth="1.3" strokeLinecap="round" /></svg>
                <span style={{ fontSize: 10, fontWeight: 800, fontFamily: FONT, color: C.textWhite, letterSpacing: 0.5 }}>{weekFilter ? 'THIS WEEK' : 'ALL TASKS'}</span>
              </div>
              {weekFilter && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {[['l','M10 4l-4 4 4 4'],['r','M6 4l4 4-4 4']].map(([dir, path]) => (
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
                        <span style={{ fontSize: 6, fontWeight: 800, fontFamily: FONT, color: day.date === today ? C.textWhite : C.textMuted, letterSpacing: 0.5 }}>{day.full.slice(0,2)}</span>
                        <span style={{ fontSize: 12, fontWeight: 900, fontFamily: FONT, color: C.textWhite }}>{day.dayNum}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Board grid ── */}
        {view === 'board' && (
          <div style={{ padding: '32px 36px 40px' }}>
            <div className="board-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, alignItems: 'start' }}
              onDragOver={handleGridDragOver}
              onDrop={handleListDrop}>
              {filteredLists.map((list, idx) => (
                <Fragment key={list.id}>
                  {dropIndex === idx && dragListId && list.id !== dragListId && (
                    <div style={{ borderRadius: R, border: `2px dashed ${C.overlayW30}`, minHeight: 160, background: 'transparent' }} />
                  )}
                  <TaskList list={list}
                    onUpdate={u => updList(list.id, u)}
                    onDelete={() => delList(list.id)}
                    taskDrop={taskDrop}
                    onTaskDragOver={handleTaskDragOver}
                    onTaskDrop={handleTaskDrop}
                    isDragging={list.id === dragListId}
                    onListDragStart={e => handleListDragStart(e, list.id)}
                    onListDragOver={e => handleListDragOver(e, list.id)}
                    onListDrop={handleListDrop}
                    onListDragEnd={handleListDragEnd} />
                </Fragment>
              ))}
              {dropIndex === filteredLists.length && dragListId && (
                <div style={{ borderRadius: R, border: `2px dashed ${C.overlayW30}`, minHeight: 160, background: 'transparent' }} />
              )}
              <button onClick={addList} style={{ border: `2px dashed ${C.overlayW15}`, background: 'transparent', borderRadius: R, padding: 32, fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: FONT, color: C.overlayW30, letterSpacing: 1, transition: 'all .2s', minHeight: 160 }}
                onMouseEnter={e => { e.target.style.borderColor = C.overlayW40; e.target.style.color = C.textWhite }}
                onMouseLeave={e => { e.target.style.borderColor = C.overlayW15; e.target.style.color = C.overlayW30 }}>
                + NEW LIST
              </button>
            </div>
          </div>
        )}

        {/* ── Agenda ── */}
        {view === 'agenda' && (
          <div style={{ padding: '32px 36px 40px' }}>
            <AgendaView lists={lists} onUpdateLists={setLists} dayTags={dayTags} onUpdateDayTags={updDayTags} />
          </div>
        )}

        {/* ── Day ── */}
        {view === 'day' && (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <DayView lists={lists} onToggleTask={togTask} onToggleChecklist={togChecklist} />
          </div>
        )}
      </div>
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

  useEffect(() => {
    try { localStorage.setItem('planner-boards', JSON.stringify(boards)) } catch {}
  }, [boards])

  useEffect(() => {
    if (activeBoardId) try { localStorage.setItem('planner-active', activeBoardId) } catch {}
  }, [activeBoardId])

  const createBoard = name => {
    const b = newBoard(name)
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
          <div style={{ textAlign: 'center', maxWidth: 360, padding: 20 }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: C.textWhite, letterSpacing: -1, marginBottom: 8 }}>PLANNA</div>
            <p style={{ fontSize: 14, fontWeight: 600, color: C.textMuted, marginBottom: 32 }}>Create your first board to get started</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              <input autoFocus value={newBoardName} onChange={e => setNewBoardName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && newBoardName.trim()) createBoard(newBoardName.trim()) }}
                placeholder="Board name…"
                style={{ flex: 1, border: 'none', borderRadius: R, padding: '16px 20px', fontSize: 16, fontFamily: FONT, fontWeight: 700, outline: 'none', background: C.border, color: C.textWhite }} />
              <button onClick={() => { if (newBoardName.trim()) createBoard(newBoardName.trim()) }} style={{ border: 'none', background: C.accent, color: C.textWhite, borderRadius: R, padding: '16px 28px', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: FONT, letterSpacing: 0.5 }}>CREATE</button>
            </div>
            <div style={{ paddingTop: 24, borderTop: `1px solid ${C.border}` }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, marginBottom: 12, letterSpacing: 0.5 }}>OR START WITH A TEMPLATE</p>
              <div onClick={() => { const b = templateBoard(); setBoards([b]); setActiveBoardId(b.id) }} style={{ background: C.border, borderRadius: R - 4, padding: '16px 20px', cursor: 'pointer', transition: 'background .15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = C.borderHover }}
                onMouseLeave={e => { e.currentTarget.style.background = C.border }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.textWhite, marginBottom: 8 }}>Kanban Board</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[['TO DO','#FF573B'],['IN PROGRESS','#0988EF'],['DONE','#018848']].map(([l, c]) => (
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
