"use client";
import React, { useState, useEffect, useRef } from "react";
import { type Page, type Database, iconBtnStyle } from "@/lib/data";

interface BloktionSearchProps {
  pages: Page[];
  databases: Database[];
  onSelectPage: (pageId: string) => void;
  onSelectDatabase: (dbId: string) => void;
  onClose: () => void;
}

export default function BloktionSearch({ pages, databases, onSelectPage, onSelectDatabase, onClose }: BloktionSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results: { type: 'page' | 'database'; id: string; icon: string; title: string; subtitle: string }[] = [];

  const q = query.toLowerCase();
  pages.forEach(p => {
    if (!q || p.title.toLowerCase().includes(q) || p.blocks.some(b => b.content.toLowerCase().includes(q))) {
      results.push({ type: 'page', id: p.id, icon: p.icon, title: p.title, subtitle: p.blocks.find(b => b.content)?.content.slice(0, 60) || '' });
    }
  });
  databases.forEach(db => {
    if (!q || db.title.toLowerCase().includes(q)) {
      results.push({ type: 'database', id: db.id, icon: db.icon, title: db.title, subtitle: `${db.records.length} kayıt` });
    }
  });

  const handleSelect = (item: typeof results[0]) => {
    if (item.type === 'page') onSelectPage(item.id);
    else onSelectDatabase(item.id);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[selectedIdx]) { handleSelect(results[selectedIdx]); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '15vh' }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)' }} />

      {/* Modal */}
      <div className="scale-in" onClick={e => e.stopPropagation()} style={{ position: 'relative', width: '100%', maxWidth: 560, background: '#1a1a1a', borderRadius: 14, border: '1px solid rgba(255,255,255,.1)', boxShadow: '0 20px 60px rgba(0,0,0,.6)', overflow: 'hidden' }}>
        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <span style={{ fontSize: 18, opacity: 0.5 }}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIdx(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Sayfa veya veritabanı ara..."
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#e5e5e5', fontSize: 16, fontFamily: 'inherit' }}
          />
          <kbd style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,.08)', color: '#888' }}>ESC</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 360, overflowY: 'auto', padding: '6px' }}>
          {results.length === 0 ? (
            <div style={{ padding: '32px 18px', textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
              Sonuç bulunamadı
            </div>
          ) : (
            results.map((item, i) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item)}
                style={{
                  ...iconBtnStyle, width: '100%', justifyContent: 'flex-start', gap: 12, padding: '10px 14px',
                  borderRadius: 8, background: i === selectedIdx ? 'rgba(124,106,247,.12)' : 'transparent',
                  color: '#e5e5e5', fontSize: 14, textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.subtitle}</div>
                </div>
                <span style={{ fontSize: 11, color: 'var(--muted)', background: 'rgba(255,255,255,.06)', padding: '2px 8px', borderRadius: 4 }}>
                  {item.type === 'page' ? 'Sayfa' : 'Veritabanı'}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '8px 18px', borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', gap: 16, fontSize: 11, color: '#555' }}>
          <span>↑↓ gezin</span>
          <span>↵ aç</span>
          <span>esc kapat</span>
        </div>
      </div>
    </div>
  );
}
