"use client";
import React, { useState, useRef, useCallback, useEffect, memo } from "react";
import { type Page, type Block, uid, iconBtnStyle } from "@/lib/data";

const BLOCK_TYPES = [
  { type: 'paragraph', label: 'Metin', icon: '📝', shortcut: 'p' },
  { type: 'h1', label: 'Başlık 1', icon: '𝐇₁', shortcut: 'h1' },
  { type: 'h2', label: 'Başlık 2', icon: '𝐇₂', shortcut: 'h2' },
  { type: 'h3', label: 'Başlık 3', icon: '𝐇₃', shortcut: 'h3' },
  { type: 'bullet', label: 'Madde İşareti', icon: '•', shortcut: 'b' },
  { type: 'numbered', label: 'Numaralı Liste', icon: '1.', shortcut: 'n' },
  { type: 'todo', label: 'Yapılacaklar', icon: '☑️', shortcut: 'todo' },
  { type: 'toggle', label: 'Açılır/Kapanır', icon: '▶', shortcut: 'tog' },
  { type: 'code', label: 'Kod Bloğu', icon: '💻', shortcut: 'code' },
  { type: 'quote', label: 'Alıntı', icon: '❝', shortcut: 'q' },
  { type: 'callout', label: 'Bilgi Kutusu', icon: '💡', shortcut: 'call' },
  { type: 'divider', label: 'Ayırıcı', icon: '─', shortcut: 'div' },
];

function getBlockStyle(type: string): React.CSSProperties {
  const base: React.CSSProperties = { outline: 'none', width: '100%', minHeight: '1.5em', lineHeight: '1.6' };
  switch (type) {
    case 'h1': return { ...base, fontSize: '1.875rem', fontWeight: 700, letterSpacing: '-0.02em', marginTop: 16 };
    case 'h2': return { ...base, fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.01em', marginTop: 12 };
    case 'h3': return { ...base, fontSize: '1.25rem', fontWeight: 600, marginTop: 8 };
    case 'quote': return { ...base, borderLeft: '3px solid #7c6af7', paddingLeft: 16, fontStyle: 'italic', color: '#aaa' };
    case 'code': return { ...base, fontFamily: 'monospace', fontSize: '0.875rem', background: 'rgba(255,255,255,.05)', padding: '12px 16px', borderRadius: 8, whiteSpace: 'pre-wrap', overflowX: 'auto' };
    default: return base;
  }
}

// ─── Uncontrolled ContentEditable ────────────────────────────────────
// Key insight: contentEditable must be "uncontrolled" — set initial value
// via ref and read changes on blur/input, but NEVER re-render via dangerouslySetInnerHTML.

interface EditableDivProps {
  initialContent: string;
  blockId: string;
  placeholder: string;
  style: React.CSSProperties;
  onContentChange: (id: string, content: string) => void;
  onKeyDown: (e: React.KeyboardEvent, id: string) => void;
  registerRef: (id: string, el: HTMLElement | null) => void;
}

const EditableDiv = memo(function EditableDiv({ initialContent, blockId, placeholder, style, onContentChange, onKeyDown, registerRef }: EditableDivProps) {
  const elRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef(initialContent);

  // Set initial content only on mount
  useEffect(() => {
    if (elRef.current && elRef.current.textContent !== initialContent) {
      elRef.current.textContent = initialContent;
      contentRef.current = initialContent;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Register ref for external focus calls
  useEffect(() => {
    registerRef(blockId, elRef.current);
    return () => registerRef(blockId, null);
  }, [blockId, registerRef]);

  const handleInput = useCallback(() => {
    const text = elRef.current?.textContent || '';
    contentRef.current = text;
    onContentChange(blockId, text);
  }, [blockId, onContentChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    onKeyDown(e, blockId);
  }, [blockId, onKeyDown]);

  return (
    <div
      ref={elRef}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      style={style}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
    />
  );
}, (prev, next) => {
  // Only re-render if block type or id changes, NOT content
  return prev.blockId === next.blockId && prev.style === next.style && prev.placeholder === next.placeholder;
});

interface BlockRowProps {
  block: Block;
  index: number;
  numberedIndex?: number;
  onUpdate: (id: string, content: string) => void;
  onKeyDown: (e: React.KeyboardEvent, id: string) => void;
  onToggleCheck: (id: string) => void;
  onToggleOpen: (id: string) => void;
  registerRef: (id: string, el: HTMLElement | null) => void;
}

const BlockRow = memo(function BlockRow({ block, numberedIndex, onUpdate, onKeyDown, onToggleCheck, onToggleOpen, registerRef }: BlockRowProps) {
  const [hovered, setHovered] = useState(false);

  if (block.type === 'divider') {
    return <div style={{ padding: '8px 0' }}><hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,.1)' }} /></div>;
  }

  const placeholder = block.type === 'h1' ? 'Başlık 1' : block.type === 'h2' ? 'Başlık 2' : block.type === 'h3' ? 'Başlık 3' : block.type === 'code' ? 'Kod yazın...' : 'Yazmaya başlayın veya / tuşuna basın...';

  if (block.type === 'callout') {
    return (
      <div
        style={{ display: 'flex', gap: 12, padding: '12px 16px', background: 'rgba(124,106,247,.08)', borderRadius: 8, border: '1px solid rgba(124,106,247,.15)', margin: '4px 0' }}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      >
        <span style={{ fontSize: 20, lineHeight: '1.6' }}>{block.emoji || '💡'}</span>
        <EditableDiv
          initialContent={block.content}
          blockId={block.id}
          placeholder="Bilgi kutusu..."
          style={getBlockStyle('paragraph')}
          onContentChange={onUpdate}
          onKeyDown={onKeyDown}
          registerRef={registerRef}
        />
      </div>
    );
  }

  const prefix = (() => {
    switch (block.type) {
      case 'bullet': return <span style={{ color: '#7c6af7', marginRight: 8, marginTop: 2, fontSize: 20, lineHeight: '1.6' }}>•</span>;
      case 'numbered': return <span style={{ color: '#7c6af7', marginRight: 8, marginTop: 2, fontWeight: 600, minWidth: 20, lineHeight: '1.6' }}>{(numberedIndex || 1)}.</span>;
      case 'todo': return (
        <button onClick={() => onToggleCheck(block.id)} style={{ ...iconBtnStyle, marginRight: 4, marginTop: 2, fontSize: 18 }}>
          {block.checked ? '☑️' : '⬜'}
        </button>
      );
      case 'toggle': return (
        <button onClick={() => onToggleOpen(block.id)} style={{ ...iconBtnStyle, marginRight: 4, marginTop: 2, fontSize: 14, transition: 'transform .15s', transform: block.open ? 'rotate(90deg)' : 'none' }}>
          ▶
        </button>
      );
      default: return null;
    }
  })();

  return (
    <div
      style={{ display: 'flex', alignItems: 'flex-start', padding: '2px 0', position: 'relative', borderRadius: 4 }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    >
      {/* Drag handle */}
      <span style={{ opacity: hovered ? 0.4 : 0, fontSize: 14, cursor: 'grab', padding: '2px 4px', marginTop: 2, transition: 'opacity .15s', userSelect: 'none', color: 'var(--muted)' }}>⠿</span>
      {prefix}
      <EditableDiv
        initialContent={block.content}
        blockId={block.id}
        placeholder={placeholder}
        style={{
          ...getBlockStyle(block.type),
          textDecoration: block.type === 'todo' && block.checked ? 'line-through' : undefined,
          opacity: block.type === 'todo' && block.checked ? 0.5 : 1,
          flex: 1,
        }}
        onContentChange={onUpdate}
        onKeyDown={onKeyDown}
        registerRef={registerRef}
      />
    </div>
  );
}, (prev, next) => {
  // Re-render only when block identity/type/checked/open changes, NOT content
  return prev.block.id === next.block.id
    && prev.block.type === next.block.type
    && prev.block.checked === next.block.checked
    && prev.block.open === next.block.open
    && prev.numberedIndex === next.numberedIndex;
});

// ─── Slash Command Menu ──────────────────────────────────────────────

function SlashMenu({ position, query, onSelect, onClose }: {
  position: { top: number; left: number };
  query: string;
  onSelect: (type: string) => void;
  onClose: () => void;
}) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const filtered = BLOCK_TYPES.filter(b => b.label.toLowerCase().includes(query.toLowerCase()) || b.shortcut.includes(query.toLowerCase()));

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, filtered.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
      if (e.key === 'Enter') { e.preventDefault(); if (filtered[selectedIdx]) onSelect(filtered[selectedIdx].type); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [filtered, selectedIdx, onSelect, onClose]);

  if (filtered.length === 0) return null;

  return (
    <div className="scale-in" style={{ position: 'fixed', top: position.top, left: position.left, zIndex: 1000, background: '#1e1e1e', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: 6, minWidth: 220, boxShadow: '0 12px 40px rgba(0,0,0,.5)' }}>
      <div style={{ padding: '6px 10px', fontSize: 11, color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Blok Türleri</div>
      {filtered.map((item, i) => (
        <button
          key={item.type}
          onClick={() => onSelect(item.type)}
          style={{ ...iconBtnStyle, width: '100%', justifyContent: 'flex-start', gap: 10, padding: '8px 10px', borderRadius: 6, background: i === selectedIdx ? 'rgba(124,106,247,.15)' : 'transparent', color: '#e5e5e5', fontSize: 14 }}
        >
          <span style={{ width: 28, textAlign: 'center', fontSize: 16 }}>{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>
  );
}

// ─── Uncontrolled Title ──────────────────────────────────────────────

const EditableTitle = memo(function EditableTitle({ initialTitle, onTitleChange }: {
  initialTitle: string;
  onTitleChange: (title: string) => void;
}) {
  const elRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (elRef.current && elRef.current.textContent !== initialTitle) {
      elRef.current.textContent = initialTitle;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  return (
    <h1
      ref={elRef}
      contentEditable
      suppressContentEditableWarning
      data-placeholder="Başlıksız"
      style={{ fontSize: '2.5rem', fontWeight: 700, outline: 'none', marginTop: 8, letterSpacing: '-0.03em', lineHeight: 1.2, background: 'none', border: 'none', color: 'inherit', width: '100%' }}
      onInput={() => onTitleChange(elRef.current?.textContent || '')}
    />
  );
}, () => true); // Never re-render — fully uncontrolled

// ─── Main Editor ─────────────────────────────────────────────────────

interface BloktionEditorProps {
  page: Page;
  onPageUpdate: (page: Page) => void;
}

export default function BloktionEditor({ page, onPageUpdate }: BloktionEditorProps) {
  const [slashMenu, setSlashMenu] = useState<{ blockId: string; position: { top: number; left: number }; query: string } | null>(null);
  const blockRefs = useRef<Record<string, HTMLElement | null>>({});
  // Keep a mutable ref to page so callbacks always see latest
  const pageRef = useRef(page);
  pageRef.current = page;

  const registerRef = useCallback((id: string, el: HTMLElement | null) => {
    blockRefs.current[id] = el;
  }, []);

  const focusBlock = useCallback((id: string) => {
    setTimeout(() => {
      const el = blockRefs.current[id];
      if (el) { el.focus(); }
    }, 20);
  }, []);

  const updateBlock = useCallback((id: string, content: string) => {
    const p = pageRef.current;
    // Check for slash command
    if (content.startsWith('/')) {
      const el = blockRefs.current[id];
      if (el) {
        const rect = el.getBoundingClientRect();
        setSlashMenu({ blockId: id, position: { top: rect.bottom + 4, left: rect.left }, query: content.slice(1) });
      }
      return;
    }
    setSlashMenu(null);
    const updated = { ...p, blocks: p.blocks.map(b => b.id === id ? { ...b, content } : b) };
    onPageUpdate(updated);
  }, [onPageUpdate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, blockId: string) => {
    const p = pageRef.current;
    const idx = p.blocks.findIndex(b => b.id === blockId);
    if (idx === -1) return;

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const newBlock: Block = { id: uid(), type: 'paragraph', content: '' };
      const newBlocks = [...p.blocks];
      newBlocks.splice(idx + 1, 0, newBlock);
      onPageUpdate({ ...p, blocks: newBlocks });
      focusBlock(newBlock.id);
    }

    if (e.key === 'Backspace') {
      const el = blockRefs.current[blockId];
      if (el && el.textContent === '' && p.blocks.length > 1) {
        e.preventDefault();
        const newBlocks = p.blocks.filter(b => b.id !== blockId);
        onPageUpdate({ ...p, blocks: newBlocks });
        if (idx > 0) focusBlock(p.blocks[idx - 1].id);
      }
    }

    if (e.key === 'ArrowUp' && idx > 0) {
      const sel = window.getSelection();
      if (sel && sel.anchorOffset === 0) {
        e.preventDefault();
        focusBlock(p.blocks[idx - 1].id);
      }
    }
    if (e.key === 'ArrowDown' && idx < p.blocks.length - 1) {
      e.preventDefault();
      focusBlock(p.blocks[idx + 1].id);
    }

    // Tab for indenting
    if (e.key === 'Tab') {
      e.preventDefault();
      if (p.blocks[idx].type === 'paragraph') {
        const newBlocks = [...p.blocks];
        newBlocks[idx] = { ...newBlocks[idx], type: 'bullet' };
        onPageUpdate({ ...p, blocks: newBlocks });
      }
    }
  }, [onPageUpdate, focusBlock]);

  const handleSlashSelect = useCallback((type: string) => {
    if (!slashMenu) return;
    const p = pageRef.current;
    const el = blockRefs.current[slashMenu.blockId];
    if (el) el.textContent = '';
    const newBlocks = p.blocks.map(b => b.id === slashMenu.blockId ? { ...b, type: type as Block['type'], content: '' } : b);
    onPageUpdate({ ...p, blocks: newBlocks });
    setSlashMenu(null);
    focusBlock(slashMenu.blockId);
  }, [slashMenu, onPageUpdate, focusBlock]);

  const toggleCheck = useCallback((id: string) => {
    const p = pageRef.current;
    onPageUpdate({ ...p, blocks: p.blocks.map(b => b.id === id ? { ...b, checked: !b.checked } : b) });
  }, [onPageUpdate]);

  const toggleOpen = useCallback((id: string) => {
    const p = pageRef.current;
    onPageUpdate({ ...p, blocks: p.blocks.map(b => b.id === id ? { ...b, open: !b.open } : b) });
  }, [onPageUpdate]);

  const handleTitleChange = useCallback((title: string) => {
    const p = pageRef.current;
    onPageUpdate({ ...p, title });
  }, [onPageUpdate]);

  let numberedCounter = 0;

  return (
    <div className="fade-in" style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 120px' }}>
      {/* Page Icon & Title */}
      <div style={{ marginBottom: 24 }}>
        <span style={{ fontSize: 48 }}>{page.icon}</span>
        <EditableTitle
          key={page.id}
          initialTitle={page.title}
          onTitleChange={handleTitleChange}
        />
      </div>

      {/* Blocks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {page.blocks.map((block, i) => {
          if (block.type === 'numbered') numberedCounter++;
          else numberedCounter = 0;
          return (
            <BlockRow
              key={block.id}
              block={block}
              index={i}
              numberedIndex={block.type === 'numbered' ? numberedCounter : undefined}
              onUpdate={updateBlock}
              onKeyDown={handleKeyDown}
              onToggleCheck={toggleCheck}
              onToggleOpen={toggleOpen}
              registerRef={registerRef}
            />
          );
        })}
      </div>

      {/* Add block button */}
      <button
        onClick={() => {
          const newBlock: Block = { id: uid(), type: 'paragraph', content: '' };
          onPageUpdate({ ...page, blocks: [...page.blocks, newBlock] });
          focusBlock(newBlock.id);
        }}
        style={{ ...iconBtnStyle, marginTop: 16, color: 'var(--muted)', fontSize: 14, gap: 6 }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-bg)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        ＋ Blok ekle
      </button>

      {/* Slash Command Menu */}
      {slashMenu && (
        <SlashMenu
          position={slashMenu.position}
          query={slashMenu.query}
          onSelect={handleSlashSelect}
          onClose={() => setSlashMenu(null)}
        />
      )}
    </div>
  );
}
