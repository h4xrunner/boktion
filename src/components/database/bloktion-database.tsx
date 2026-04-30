"use client";
import React, { useState } from "react";
import { type Database, iconBtnStyle } from "@/lib/data";

const STATUS_COLORS: Record<string, string> = {
  'Yapılacak': '#ef4444',
  'Devam Ediyor': '#f59e0b',
  'Tamamlandı': '#22c55e',
  'İptal': '#6b7280',
  'Düşük': '#3b82f6',
  'Orta': '#f59e0b',
  'Yüksek': '#ef4444',
  'Kritik': '#dc2626',
};

function getStatusColor(val: unknown): string {
  if (typeof val !== 'string') return '#6b7280';
  return STATUS_COLORS[val] || '#6b7280';
}

// ─── Table View ──────────────────────────────────────────────────────

function TableView({ db }: { db: Database }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr>
            {db.fields.map(f => (
              <th key={f.id} style={{ textAlign: 'left', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,.1)', color: 'var(--muted)', fontWeight: 500, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                {f.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {db.records.map(record => (
            <tr key={record.id} style={{ borderBottom: '1px solid rgba(255,255,255,.05)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-bg)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {db.fields.map(f => {
                const val = record.values[f.id];
                const isTag = f.type === 'select' || f.type === 'multi_select' || f.type === 'status';
                return (
                  <td key={f.id} style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                    {isTag && typeof val === 'string' ? (
                      <span style={{
                        display: 'inline-block', padding: '2px 10px', borderRadius: 10, fontSize: 12, fontWeight: 500,
                        background: `${getStatusColor(val)}22`, color: getStatusColor(val), border: `1px solid ${getStatusColor(val)}44`
                      }}>
                        {val}
                      </span>
                    ) : (
                      <span>{val as string || '—'}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Kanban View ─────────────────────────────────────────────────────

function KanbanView({ db }: { db: Database }) {
  const statusField = db.fields.find(f => f.type === 'select' && f.options && f.options.length > 0);
  if (!statusField) return <div style={{ padding: 24, color: 'var(--muted)' }}>Kanban görünümü için bir select alanı gerekli.</div>;

  const columns = statusField.options || [];

  return (
    <div style={{ display: 'flex', gap: 16, overflowX: 'auto', padding: '8px 0', minHeight: 300 }}>
      {columns.map(col => {
        const records = db.records.filter(r => r.values[statusField.id] === col.label);
        return (
          <div key={col.label} style={{ minWidth: 240, flex: '0 0 240px', background: 'rgba(255,255,255,.03)', borderRadius: 10, padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '4px 0' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: col.color, display: 'inline-block' }} />
              <span style={{ fontWeight: 600, fontSize: 13 }}>{col.label}</span>
              <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 'auto' }}>{records.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {records.map(record => (
                <div key={record.id} style={{ background: 'var(--card-bg)', borderRadius: 8, padding: '12px 14px', border: '1px solid rgba(255,255,255,.06)', cursor: 'pointer', transition: 'border-color .15s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,.15)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,.06)')}
                >
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>{record.values[db.fields[0].id] as string}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {db.fields.filter(f => f.id !== db.fields[0].id && f.id !== statusField.id).map(f => {
                      const v = record.values[f.id];
                      if (!v) return null;
                      return <span key={f.id} style={{ fontSize: 11, color: 'var(--muted)', background: 'rgba(255,255,255,.05)', padding: '2px 6px', borderRadius: 4 }}>{v as string}</span>;
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── List View ──────────────────────────────────────────────────────

function ListView({ db }: { db: Database }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {db.records.map(record => (
        <div key={record.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,.05)', gap: 16, cursor: 'pointer' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-bg)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <span style={{ fontSize: 14, fontWeight: 500, flex: 1 }}>{record.values[db.fields[0].id] as string}</span>
          {db.fields.slice(1).map(f => {
            const val = record.values[f.id];
            const isTag = f.type === 'select';
            return isTag && typeof val === 'string' ? (
              <span key={f.id} style={{ padding: '2px 10px', borderRadius: 10, fontSize: 12, background: `${getStatusColor(val)}22`, color: getStatusColor(val) }}>{val}</span>
            ) : (
              <span key={f.id} style={{ fontSize: 13, color: 'var(--muted)', minWidth: 80 }}>{val as string || '—'}</span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── Main Database Component ──────────────────────────────────────────

interface BloktionDatabaseProps {
  database: Database;
  onDatabaseUpdate: (db: Database) => void;
}

export default function BloktionDatabase({ database, onDatabaseUpdate }: BloktionDatabaseProps) {
  const [activeViewId, setActiveViewId] = useState(database.activeView);
  const activeView = database.views.find(v => v.id === activeViewId) || database.views[0];

  return (
    <div className="fade-in" style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <span style={{ fontSize: 40 }}>{database.icon}</span>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginTop: 8, letterSpacing: '-0.02em' }}>{database.title}</h1>
      </div>

      {/* View Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,.08)', paddingBottom: 8 }}>
        {database.views.map(v => (
          <button
            key={v.id}
            onClick={() => setActiveViewId(v.id)}
            style={{
              ...iconBtnStyle, padding: '6px 14px', fontSize: 13, fontWeight: v.id === activeViewId ? 600 : 400,
              color: v.id === activeViewId ? '#7c6af7' : 'var(--muted)',
              borderBottom: v.id === activeViewId ? '2px solid #7c6af7' : '2px solid transparent',
              borderRadius: 0, marginBottom: -9,
            }}
          >
            {v.type === 'table' ? '📋' : v.type === 'kanban' ? '📌' : '📃'} {v.name}
          </button>
        ))}
      </div>

      {/* View Content */}
      {activeView.type === 'table' && <TableView db={database} />}
      {activeView.type === 'kanban' && <KanbanView db={database} />}
      {activeView.type === 'list' && <ListView db={database} />}

      {/* Record Count */}
      <div style={{ marginTop: 16, fontSize: 12, color: 'var(--muted)' }}>
        {database.records.length} kayıt
      </div>
    </div>
  );
}
