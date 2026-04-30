"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  type Page, type Database, type Member, type AuditLog, type Automation, type Form, type Integration,
  BOKTION_ICONS, iconBtnStyle,
  INITIAL_DATABASES, INITIAL_MEMBERS, INITIAL_AUDIT_LOGS,
  INITIAL_AUTOMATIONS, INITIAL_FORMS, INITIAL_INTEGRATIONS,
} from "@/lib/data";
import BloktionEditor from "@/components/editor/bloktion-editor";
import BloktionDatabase from "@/components/database/bloktion-database";
import BloktionSearch from "@/components/search/bloktion-search";
import BloktionSettings from "@/components/settings/bloktion-settings";
import BloktionExtras from "@/components/extras/bloktion-extras";

// ─── Sidebar Section ────────────────────────────────────────────────

type NavSection = 'pages' | 'databases' | 'automations' | 'forms' | 'integrations';
type ContentView = { type: 'page'; id: string } | { type: 'database'; id: string };

export default function BoktionApp() {
  const [pages, setPages] = useState<Page[]>([]);
  const [databases, setDatabases] = useState<Database[]>(INITIAL_DATABASES);
  const [members] = useState<Member[]>(INITIAL_MEMBERS);
  const [auditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [automations] = useState<Automation[]>(INITIAL_AUTOMATIONS);
  const [forms] = useState<Form[]>(INITIAL_FORMS);
  const [integrations] = useState<Integration[]>(INITIAL_INTEGRATIONS);

  const [currentView, setCurrentView] = useState<ContentView | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [extrasOpen, setExtrasOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<NavSection, boolean>>({
    pages: true, databases: true, automations: false, forms: false, integrations: false,
  });

  // Debounce timer ref for block saves
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Load pages from DB ─────────────────────────────────────

  const loadPages = useCallback(async () => {
    try {
      const res = await fetch('/api/pages');
      if (!res.ok) throw new Error('Failed to fetch pages');
      const data: Page[] = await res.json();

      if (data.length === 0) {
        // No pages — run seed
        const seedRes = await fetch('/api/seed');
        const seedData = await seedRes.json();
        if (seedData.seeded) {
          // Reload after seed
          const res2 = await fetch('/api/pages');
          const data2: Page[] = await res2.json();
          setPages(data2);
          if (data2.length > 0) setCurrentView({ type: 'page', id: data2[0].id });
        }
      } else {
        setPages(data);
        if (!currentView && data.length > 0) {
          setCurrentView({ type: 'page', id: data[0].id });
        }
      }
    } catch (err) {
      console.error('Failed to load pages:', err);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  // ─── ⌘K Shortcut ─────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ─── Save blocks (debounced) ──────────────────────────────────

  const saveBlocks = useCallback(async (pageId: string, blocks: Page['blocks']) => {
    setSaving(true);
    try {
      await fetch(`/api/pages/${pageId}/blocks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks }),
      });
    } catch (err) {
      console.error('Failed to save blocks:', err);
    } finally {
      setSaving(false);
    }
  }, []);

  const debouncedSaveBlocks = useCallback((pageId: string, blocks: Page['blocks']) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveBlocks(pageId, blocks), 1000);
  }, [saveBlocks]);

  // ─── Handlers ─────────────────────────────────────────────────

  const handlePageUpdate = useCallback((updated: Page) => {
    setPages(prev => prev.map(p => p.id === updated.id ? updated : p));

    // Debounced save blocks to DB
    debouncedSaveBlocks(updated.id, updated.blocks);

    // Save title/icon changes immediately
    const original = pages.find(p => p.id === updated.id);
    if (original && (original.title !== updated.title || original.icon !== updated.icon)) {
      fetch(`/api/pages/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: updated.title, icon: updated.icon }),
      }).catch(err => console.error('Failed to save page:', err));
    }
  }, [pages, debouncedSaveBlocks]);

  const handleDatabaseUpdate = useCallback((updated: Database) => {
    setDatabases(prev => prev.map(db => db.id === updated.id ? updated : db));
  }, []);

  const addNewPage = useCallback(async () => {
    const icon = BOKTION_ICONS[Math.floor(Math.random() * BOKTION_ICONS.length)];
    try {
      const res = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Yeni Sayfa', icon }),
      });
      const newPage: Page = await res.json();
      setPages(prev => [...prev, newPage]);
      setCurrentView({ type: 'page', id: newPage.id });
    } catch (err) {
      console.error('Failed to create page:', err);
    }
  }, []);

  const deletePage = useCallback(async (id: string) => {
    try {
      await fetch(`/api/pages/${id}`, { method: 'DELETE' });
      setPages(prev => prev.filter(p => p.id !== id));
      if (currentView?.type === 'page' && currentView.id === id) {
        setCurrentView(pages.length > 1 ? { type: 'page', id: pages.find(p => p.id !== id)?.id || '' } : null);
      }
    } catch (err) {
      console.error('Failed to delete page:', err);
    }
  }, [currentView, pages]);

  const toggleSection = useCallback((section: NavSection) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  }, []);

  // ─── Current content ─────────────────────────────────────────

  const currentPage = currentView?.type === 'page' ? pages.find(p => p.id === currentView.id) : null;
  const currentDatabase = currentView?.type === 'database' ? databases.find(db => db.id === currentView.id) : null;

  // ─── Breadcrumb ───────────────────────────────────────────────

  const breadcrumb = currentView?.type === 'page' && currentPage
    ? `${currentPage.icon} ${currentPage.title}`
    : currentView?.type === 'database' && currentDatabase
    ? `${currentDatabase.icon} ${currentDatabase.title}`
    : '';

  // ─── Loading Screen ──────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--background)', color: 'var(--foreground)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16, animation: 'pulse 1.5s infinite' }}>📚</div>
          <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>Boktion</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Yükleniyor...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--background)', color: 'var(--foreground)', overflow: 'hidden' }}>
      {/* ─── Sidebar ─────────────────────────────────────────────── */}
      {sidebarOpen && (
        <aside className="slide-in" style={{
          width: 260, minWidth: 260, height: '100vh', background: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column',
          overflow: 'hidden', position: 'relative',
        }}>
          {/* Sidebar Header */}
          <div style={{ padding: '16px 14px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 22, background: 'linear-gradient(135deg, #7c6af7, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>B</span>
              <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em' }}>Boktion</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} style={{ ...iconBtnStyle, fontSize: 14, color: 'var(--muted)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-bg)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >◀</button>
          </div>

          {/* Search Button */}
          <button onClick={() => setSearchOpen(true)} style={{ ...iconBtnStyle, margin: '8px 10px', padding: '8px 12px', borderRadius: 8, gap: 8, justifyContent: 'flex-start', border: '1px solid var(--border-color)', color: 'var(--muted)', fontSize: 13 }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-bg)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            🔍 Ara... <kbd style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.5, padding: '1px 5px', borderRadius: 3, background: 'rgba(255,255,255,.06)' }}>⌘K</kbd>
          </button>

          {/* Nav Sections */}
          <nav style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
            {/* Pages Section */}
            <SidebarSection
              title="Sayfalar"
              icon="📄"
              expanded={expandedSections.pages}
              onToggle={() => toggleSection('pages')}
              action={<button onClick={addNewPage} style={{ ...iconBtnStyle, fontSize: 16, padding: '2px 6px', color: 'var(--muted)' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#7c6af7')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
              >＋</button>}
            >
              {/* Pinned Pages */}
              {pages.filter(p => p.pinned).map(p => (
                <SidebarItem
                  key={p.id}
                  icon={p.icon}
                  title={p.title}
                  active={currentView?.type === 'page' && currentView.id === p.id}
                  pinned
                  onClick={() => setCurrentView({ type: 'page', id: p.id })}
                  onDelete={() => deletePage(p.id)}
                />
              ))}
              {/* Regular Pages */}
              {pages.filter(p => !p.pinned).map(p => (
                <SidebarItem
                  key={p.id}
                  icon={p.icon}
                  title={p.title}
                  active={currentView?.type === 'page' && currentView.id === p.id}
                  onClick={() => setCurrentView({ type: 'page', id: p.id })}
                  onDelete={() => deletePage(p.id)}
                />
              ))}
            </SidebarSection>

            {/* Databases Section */}
            <SidebarSection
              title="Veritabanları"
              icon="📊"
              expanded={expandedSections.databases}
              onToggle={() => toggleSection('databases')}
            >
              {databases.map(db => (
                <SidebarItem
                  key={db.id}
                  icon={db.icon}
                  title={db.title}
                  active={currentView?.type === 'database' && currentView.id === db.id}
                  onClick={() => setCurrentView({ type: 'database', id: db.id })}
                />
              ))}
            </SidebarSection>

            {/* Extra Sections */}
            <SidebarSection title="Otomasyonlar" icon="⚡" expanded={expandedSections.automations} onToggle={() => toggleSection('automations')}>
              {automations.map(a => (
                <div key={a.id} onClick={() => setExtrasOpen(true)} style={{ padding: '6px 14px 6px 36px', fontSize: 13, color: 'var(--muted)', cursor: 'pointer', borderRadius: 4 }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-bg)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  ⚡ {a.name}
                </div>
              ))}
            </SidebarSection>
          </nav>

          {/* Sidebar Footer */}
          <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: 4 }}>
            <button onClick={() => setSettingsOpen(true)} style={{ ...iconBtnStyle, flex: 1, fontSize: 13, color: 'var(--muted)', gap: 6 }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-bg)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >⚙️ Ayarlar</button>
            <button onClick={() => setExtrasOpen(true)} style={{ ...iconBtnStyle, flex: 1, fontSize: 13, color: 'var(--muted)', gap: 6 }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-bg)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >🧩 Ekstralar</button>
          </div>
        </aside>
      )}

      {/* ─── Main Content ────────────────────────────────────────── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <header style={{
          height: 48, minHeight: 48, display: 'flex', alignItems: 'center', padding: '0 16px',
          borderBottom: '1px solid var(--border-color)', background: 'rgba(15,15,15,.85)',
          backdropFilter: 'blur(12px)', gap: 12, justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} style={{ ...iconBtnStyle, fontSize: 16, color: 'var(--muted)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-bg)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >☰</button>
            )}
            <span style={{ fontSize: 14, color: 'var(--muted)' }}>{breadcrumb}</span>
            {saving && <span style={{ fontSize: 11, color: '#7c6af7', animation: 'pulse 1s infinite' }}>💾 Kaydediliyor...</span>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={() => setSearchOpen(true)} style={{ ...iconBtnStyle, fontSize: 14, color: 'var(--muted)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-bg)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >🔍</button>
            <button onClick={addNewPage} style={{ ...iconBtnStyle, background: '#7c6af7', color: '#fff', padding: '5px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, gap: 4 }}
              onMouseEnter={e => (e.currentTarget.style.background = '#6b5be6')}
              onMouseLeave={e => (e.currentTarget.style.background = '#7c6af7')}
            >＋ Yeni</button>
          </div>
        </header>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {currentView?.type === 'page' && currentPage && (
            <BloktionEditor key={currentPage.id} page={currentPage} onPageUpdate={handlePageUpdate} />
          )}
          {currentView?.type === 'database' && currentDatabase && (
            <BloktionDatabase database={currentDatabase} onDatabaseUpdate={handleDatabaseUpdate} />
          )}
          {!currentView && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted)' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
                <div style={{ fontSize: 16 }}>Bir sayfa seçin veya yeni oluşturun</div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ─── Modals ──────────────────────────────────────────────── */}
      {searchOpen && (
        <BloktionSearch
          pages={pages}
          databases={databases}
          onSelectPage={id => setCurrentView({ type: 'page', id })}
          onSelectDatabase={id => setCurrentView({ type: 'database', id })}
          onClose={() => setSearchOpen(false)}
        />
      )}
      {settingsOpen && (
        <BloktionSettings
          members={members}
          auditLogs={auditLogs}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      {extrasOpen && (
        <BloktionExtras
          automations={automations}
          forms={forms}
          integrations={integrations}
          onClose={() => setExtrasOpen(false)}
        />
      )}
    </div>
  );
}

// ─── Sidebar Sub-Components ──────────────────────────────────────────

function SidebarSection({ title, icon, expanded, onToggle, action, children }: {
  title: string; icon: string; expanded: boolean; onToggle: () => void;
  action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div style={{ margin: '2px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '6px 14px', cursor: 'pointer', userSelect: 'none' }}
        onClick={onToggle}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-bg)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <span style={{ fontSize: 10, color: 'var(--muted)', marginRight: 6, transition: 'transform .15s', transform: expanded ? 'rotate(90deg)' : 'none' }}>▶</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', flex: 1 }}>{icon} {title}</span>
        <div onClick={e => e.stopPropagation()}>{action}</div>
      </div>
      {expanded && <div className="fade-in" style={{ paddingBottom: 4 }}>{children}</div>}
    </div>
  );
}

function SidebarItem({ icon, title, active, pinned, onClick, onDelete }: {
  icon: string; title: string; active?: boolean; pinned?: boolean;
  onClick: () => void; onDelete?: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px 6px 28px',
        cursor: 'pointer', borderRadius: 4, fontSize: 14, position: 'relative',
        background: active ? 'rgba(124,106,247,.1)' : hovered ? 'var(--hover-bg)' : 'transparent',
        color: active ? '#e5e5e5' : '#ccc',
        borderLeft: active ? '2px solid #7c6af7' : '2px solid transparent',
      }}
    >
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: active ? 500 : 400 }}>{title}</span>
      {pinned && <span style={{ fontSize: 10, color: '#7c6af7', opacity: 0.6 }}>📌</span>}
      {hovered && onDelete && (
        <button onClick={e => { e.stopPropagation(); onDelete(); }}
          style={{ ...iconBtnStyle, fontSize: 12, padding: '2px 4px', color: 'var(--muted)' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
        >🗑</button>
      )}
    </div>
  );
}
