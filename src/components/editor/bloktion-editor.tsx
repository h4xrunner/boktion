"use client";
import React, { useState, useRef, useCallback, useEffect } from "react";
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

function BlockRow({ block, index, numberedIndex, onUpdate, onKeyDown, onToggleCheck, onToggleOpen, registerRef }: BlockRowProps) {
  const [hovered, setHovered] = useState(false);

  if (block.type === 'divider') {
    return <div style={{ padding: '8px 0' }}><hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,.1)' }} /></div>;
  }

  if (block.type === 'callout') {
    return (
      <div
        style={{ display: 'flex', gap: 12, padding: '12px 16px', background: 'rgba(124,106,247,.08)', borderRadius: 8, border: '1px solid rgba(124,106,247,.15)', margin: '4px 0' }}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      >
        <span style={{ fontSize: 20, lineHeight: '1.6' }}>{block.emoji || '💡'}</span>
        <div
          ref={el => registerRef(block.id, el)}
          contentEditable suppressContentEditableWarning
          data-placeholder="Bilgi kutusu..."
          style={getBlockStyle('paragraph')}
          onInput={e => onUpdate(block.id, (e.target as HTMLElement).textContent || '')}
          onKeyDown={e => onKeyDown(e, block.id)}
          dangerouslySetInnerHTML={{ __html: block.content }}
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
      <div
        ref={el => registerRef(block.id, el)}
        contentEditable suppressContentEditableWarning
        data-placeholder={block.type === 'h1' ? 'Başlık 1' : block.type === 'h2' ? 'Başlık 2' : block.type === 'h3' ? 'Başlık 3' : block.type === 'code' ? 'Kod yazın...' : 'Yazmaya başlayın veya / tuşuna basın...'}
        style={{
          ...getBlockStyle(block.type),
          textDecoration: block.type === 'todo' && block.checked ? 'line-through' : undefined,
          opacity: block.type === 'todo' && block.checked ? 0.5 : 1,
          flex: 1,
        }}
        onInput={e => onUpdate(block.id, (e.target as HTMLElement).textContent || '')}
        onKeyDown={e => onKeyDown(e, block.id)}
        dangerouslySetInnerHTML={{ __html: block.content }}
      />
    </div>
  );
}

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

// ─── Main Editor ─────────────────────────────────────────────────────

interface BloktionEditorProps {
  page: Page;
  onPageUpdate: (page: Page) => void;
}

export default function BloktionEditor({ page, onPageUpdate }: BloktionEditorProps) {
  const [slashMenu, setSlashMenu] = useState<{ blockId: string; position: { top: number; left: number }; query: string } | null>(null);
  const blockRefs = useRef<Record<string, HTMLElement | null>>({});

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
    const updated = { ...page, blocks: page.blocks.map(b => b.id === id ? { ...b, content } : b) };
    onPageUpdate(updated);
  }, [page, onPageUpdate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, blockId: string) => {
    const idx = page.blocks.findIndex(b => b.id === blockId);
    if (idx === -1) return;

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const newBlock: Block = { id: uid(), type: 'paragraph', content: '' };
      const newBlocks = [...page.blocks];
      newBlocks.splice(idx + 1, 0, newBlock);
      onPageUpdate({ ...page, blocks: newBlocks });
      focusBlock(newBlock.id);
    }

    if (e.key === 'Backspace') {
      const el = blockRefs.current[blockId];
      if (el && el.textContent === '' && page.blocks.length > 1) {
        e.preventDefault();
        const newBlocks = page.blocks.filter(b => b.id !== blockId);
        onPageUpdate({ ...page, blocks: newBlocks });
        if (idx > 0) focusBlock(page.blocks[idx - 1].id);
      }
    }

    if (e.key === 'ArrowUp' && idx > 0) {
      const sel = window.getSelection();
      if (sel && sel.anchorOffset === 0) {
        e.preventDefault();
        focusBlock(page.blocks[idx - 1].id);
      }
    }
    if (e.key === 'ArrowDown' && idx < page.blocks.length - 1) {
      e.preventDefault();
      focusBlock(page.blocks[idx + 1].id);
    }

    // Tab for indenting
    if (e.key === 'Tab') {
      e.preventDefault();
      if (page.blocks[idx].type === 'paragraph') {
        const newBlocks = [...page.blocks];
        newBlocks[idx] = { ...newBlocks[idx], type: 'bullet' };
        onPageUpdate({ ...page, blocks: newBlocks });
      }
    }
  }, [page, onPageUpdate, focusBlock]);

  const handleSlashSelect = useCallback((type: string) => {
    if (!slashMenu) return;
    const el = blockRefs.current[slashMenu.blockId];
    if (el) el.textContent = '';
    const newBlocks = page.blocks.map(b => b.id === slashMenu.blockId ? { ...b, type: type as Block['type'], content: '' } : b);
    onPageUpdate({ ...page, blocks: newBlocks });
    setSlashMenu(null);
    focusBlock(slashMenu.blockId);
  }, [slashMenu, page, onPageUpdate, focusBlock]);

  const toggleCheck = useCallback((id: string) => {
    onPageUpdate({ ...page, blocks: page.blocks.map(b => b.id === id ? { ...b, checked: !b.checked } : b) });
  }, [page, onPageUpdate]);

  const toggleOpen = useCallback((id: string) => {
    onPageUpdate({ ...page, blocks: page.blocks.map(b => b.id === id ? { ...b, open: !b.open } : b) });
  }, [page, onPageUpdate]);

  let numberedCounter = 0;

  return (
    <div className="fade-in" style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 120px' }}>
      {/* Page Icon & Title */}
      <div style={{ marginBottom: 24 }}>
        <span style={{ fontSize: 48 }}>{page.icon}</span>
        <h1
          contentEditable suppressContentEditableWarning
          data-placeholder="Başlıksız"
          style={{ fontSize: '2.5rem', fontWeight: 700, outline: 'none', marginTop: 8, letterSpacing: '-0.03em', lineHeight: 1.2, background: 'none', border: 'none', color: 'inherit', width: '100%' }}
          onInput={e => onPageUpdate({ ...page, title: (e.target as HTMLElement).textContent || '' })}
          dangerouslySetInnerHTML={{ __html: page.title }}
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
