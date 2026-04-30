"use client";
import React, { useState } from "react";
import { type Automation, type Form, type Integration, iconBtnStyle } from "@/lib/data";

type ExtrasTab = 'automations' | 'forms' | 'integrations';

interface BloktionExtrasProps {
  automations: Automation[];
  forms: Form[];
  integrations: Integration[];
  onClose: () => void;
}

export default function BloktionExtras({ automations, forms, integrations, onClose }: BloktionExtrasProps) {
  const [tab, setTab] = useState<ExtrasTab>('automations');

  const TABS: { key: ExtrasTab; label: string; icon: string }[] = [
    { key: 'automations', label: 'Otomasyonlar', icon: '⚡' },
    { key: 'forms', label: 'Formlar', icon: '📋' },
    { key: 'integrations', label: 'Entegrasyonlar', icon: '🔌' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)' }} />

      <div className="scale-in" onClick={e => e.stopPropagation()} style={{ position: 'relative', width: '100%', maxWidth: 640, maxHeight: '80vh', background: '#1a1a1a', borderRadius: 14, border: '1px solid rgba(255,255,255,.1)', boxShadow: '0 20px 60px rgba(0,0,0,.6)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>🧩 Ekstralar</h2>
          <button onClick={onClose} style={{ ...iconBtnStyle, fontSize: 18 }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-bg)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, padding: '0 16px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              ...iconBtnStyle, padding: '10px 16px', fontSize: 13, fontWeight: tab === t.key ? 600 : 400,
              color: tab === t.key ? '#7c6af7' : 'var(--muted)',
              borderBottom: tab === t.key ? '2px solid #7c6af7' : '2px solid transparent',
              borderRadius: 0, gap: 6,
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
          {/* Automations */}
          {tab === 'automations' && (
            <div className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>İş akışlarınızı otomatikleştirin</p>
                <button style={{ ...iconBtnStyle, background: '#7c6af7', color: '#fff', padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500 }}>
                  + Yeni Otomasyon
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {automations.map(auto => (
                  <div key={auto.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,.06)', background: 'rgba(255,255,255,.02)' }}>
                    <span style={{ fontSize: 22 }}>⚡</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{auto.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                        <span style={{ color: '#f59e0b' }}>Tetikleyici:</span> {auto.trigger} → <span style={{ color: '#22c55e' }}>Aksiyon:</span> {auto.action}
                      </div>
                    </div>
                    <div style={{
                      width: 44, height: 24, borderRadius: 12, cursor: 'pointer', padding: 2, transition: 'background .2s',
                      background: auto.enabled ? '#22c55e' : 'rgba(255,255,255,.1)',
                      display: 'flex', alignItems: 'center', justifyContent: auto.enabled ? 'flex-end' : 'flex-start',
                    }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'all .2s' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Forms */}
          {tab === 'forms' && (
            <div className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>Form oluşturun ve yanıtları toplayın</p>
                <button style={{ ...iconBtnStyle, background: '#7c6af7', color: '#fff', padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500 }}>
                  + Yeni Form
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {forms.map(form => (
                  <div key={form.id} style={{ padding: '16px', borderRadius: 10, border: '1px solid rgba(255,255,255,.06)', background: 'rgba(255,255,255,.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>📋 {form.title}</div>
                      <span style={{ fontSize: 12, color: '#7c6af7', background: 'rgba(124,106,247,.1)', padding: '3px 10px', borderRadius: 8 }}>
                        {form.responses} yanıt
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {form.fields.map((f, i) => (
                        <span key={i} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, background: 'rgba(255,255,255,.05)', color: 'var(--muted)' }}>
                          {f.label} {f.required && <span style={{ color: '#ef4444' }}>*</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Integrations */}
          {tab === 'integrations' && (
            <div className="fade-in">
              <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16 }}>Favori araçlarınızı bağlayın</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {integrations.map(int => (
                  <div key={int.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,.06)', background: 'rgba(255,255,255,.02)' }}>
                    <span style={{ fontSize: 28 }}>{int.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{int.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{int.description}</div>
                    </div>
                    <button style={{
                      ...iconBtnStyle, padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                      background: int.connected ? 'rgba(34,197,94,.12)' : 'rgba(255,255,255,.06)',
                      color: int.connected ? '#22c55e' : 'var(--muted)',
                      border: `1px solid ${int.connected ? 'rgba(34,197,94,.2)' : 'rgba(255,255,255,.08)'}`,
                    }}>
                      {int.connected ? '✓ Bağlı' : 'Bağla'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
