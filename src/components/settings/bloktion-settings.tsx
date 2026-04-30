"use client";
import React, { useState } from "react";
import { type Member, type AuditLog, iconBtnStyle } from "@/lib/data";

interface BloktionSettingsProps {
  members: Member[];
  auditLogs: AuditLog[];
  onClose: () => void;
}

type SettingsTab = 'members' | 'security' | 'audit';

export default function BloktionSettings({ members, auditLogs, onClose }: BloktionSettingsProps) {
  const [tab, setTab] = useState<SettingsTab>('members');

  const TABS: { key: SettingsTab; label: string; icon: string }[] = [
    { key: 'members', label: 'Üyeler', icon: '👥' },
    { key: 'security', label: 'Güvenlik', icon: '🔒' },
    { key: 'audit', label: 'Denetim', icon: '📋' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)' }} />

      <div className="scale-in" onClick={e => e.stopPropagation()} style={{ position: 'relative', width: '100%', maxWidth: 640, maxHeight: '80vh', background: '#1a1a1a', borderRadius: 14, border: '1px solid rgba(255,255,255,.1)', boxShadow: '0 20px 60px rgba(0,0,0,.6)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>⚙️ Ayarlar</h2>
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
          {/* Members Tab */}
          {tab === 'members' && (
            <div className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>Çalışma alanı üyelerini yönetin</p>
                <button style={{ ...iconBtnStyle, background: '#7c6af7', color: '#fff', padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500 }}>
                  + Davet Et
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {members.map(m => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,.06)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-bg)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ fontSize: 28 }}>{m.avatar}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{m.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{m.email}</div>
                    </div>
                    <span style={{
                      padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 500,
                      background: m.role === 'owner' ? 'rgba(124,106,247,.15)' : m.role === 'admin' ? 'rgba(59,130,246,.15)' : 'rgba(255,255,255,.06)',
                      color: m.role === 'owner' ? '#7c6af7' : m.role === 'admin' ? '#3b82f6' : 'var(--muted)',
                    }}>
                      {m.role === 'owner' ? 'Sahip' : m.role === 'admin' ? 'Yönetici' : m.role === 'member' ? 'Üye' : 'Misafir'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security Tab */}
          {tab === 'security' && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>Güvenlik ayarlarını yönetin</p>
              {[
                { label: 'İki Faktörlü Kimlik Doğrulama (2FA)', desc: 'Tüm üyeler için 2FA\'yı zorunlu kılın', enabled: false },
                { label: 'Oturum Süresi', desc: 'Etkin olmayan oturumları 30 gün sonra sonlandır', enabled: true },
                { label: 'IP Kısıtlama', desc: 'Belirli IP adreslerinden erişimi sınırla', enabled: false },
                { label: 'Dışa Aktarmayı Kısıtla', desc: 'Misafir kullanıcıların veri dışa aktarmasını engelle', enabled: true },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,.06)' }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{item.desc}</div>
                  </div>
                  <div style={{
                    width: 44, height: 24, borderRadius: 12, cursor: 'pointer', padding: 2, transition: 'background .2s',
                    background: item.enabled ? '#7c6af7' : 'rgba(255,255,255,.1)',
                    display: 'flex', alignItems: item.enabled ? 'center' : 'center',
                    justifyContent: item.enabled ? 'flex-end' : 'flex-start',
                  }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'all .2s' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Audit Tab */}
          {tab === 'audit' && (
            <div className="fade-in">
              <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16 }}>Son aktiviteler</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {auditLogs.map(log => (
                  <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 6, fontSize: 13 }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-bg)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ fontSize: 12, color: 'var(--muted)', minWidth: 120 }}>{log.timestamp}</span>
                    <span style={{ fontWeight: 500, color: '#7c6af7' }}>{log.user}</span>
                    <span style={{ color: 'var(--muted)' }}>{log.action}</span>
                    <span style={{ fontWeight: 500 }}>{log.target}</span>
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
