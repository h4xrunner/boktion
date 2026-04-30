// ─── Boktion Global Data & State ──────────────────────────────────────────

export const BOKTION_ICONS = ['📄','📝','📔','💡','🚀','🏠','⭐','📊','🎯','📌','🔖','💼','🗂️','📁','🎨','🔬','📐','🌐','🛠️','💬'];

export const iconBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px',
  borderRadius: 6, color: 'inherit', display: 'inline-flex', alignItems: 'center',
  justifyContent: 'center', fontSize: 16, transition: 'background .15s',
};

export function getTokens(dark: boolean) {
  return dark
    ? { bg: '#0f0f0f', fg: '#e5e5e5', muted: '#888', border: 'rgba(255,255,255,.08)', accent: '#7c6af7', accentHover: '#6b5be6', cardBg: '#181818', hoverBg: 'rgba(255,255,255,.06)', sidebarBg: '#0a0a0a' }
    : { bg: '#ffffff', fg: '#1a1a1a', muted: '#6b7280', border: 'rgba(0,0,0,.08)', accent: '#7c6af7', accentHover: '#6b5be6', cardBg: '#f9fafb', hoverBg: 'rgba(0,0,0,.04)', sidebarBg: '#f3f4f6' };
}

// ─── Types ─────────────────────────────────────────────────────────────────

export interface Block {
  id: string;
  type: 'paragraph' | 'h1' | 'h2' | 'h3' | 'bullet' | 'numbered' | 'todo' | 'toggle' | 'code' | 'quote' | 'callout' | 'divider' | 'image' | 'table';
  content: string;
  checked?: boolean;
  open?: boolean;
  children?: Block[];
  language?: string;
  rows?: string[][];
  url?: string;
  emoji?: string;
}

export interface Page {
  id: string;
  icon: string;
  title: string;
  blocks: Block[];
  pinned?: boolean;
  parentId?: string | null;
  children?: Page[];
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'multi_select' | 'date' | 'checkbox' | 'url' | 'email' | 'phone' | 'formula' | 'relation' | 'rollup' | 'person' | 'files' | 'status';
  options?: { label: string; color: string }[];
}

export interface DatabaseRecord {
  id: string;
  values: Record<string, unknown>;
}

export interface Database {
  id: string;
  icon: string;
  title: string;
  fields: DatabaseField[];
  records: DatabaseRecord[];
  views: { id: string; name: string; type: 'table' | 'kanban' | 'calendar' | 'gallery' | 'list' | 'timeline' }[];
  activeView: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member' | 'guest';
  avatar: string;
  joinedAt: string;
}

export interface AuditLog {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
}

export interface Automation {
  id: string;
  name: string;
  trigger: string;
  action: string;
  enabled: boolean;
}

export interface Form {
  id: string;
  title: string;
  fields: { label: string; type: string; required: boolean }[];
  responses: number;
}

export interface Integration {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  description: string;
}

export interface Site {
  id: string;
  name: string;
  domain: string;
  published: boolean;
  pages: string[];
}

// ─── Helper ────────────────────────────────────────────────────────────────

let _uid = 1000;
export function uid(): string { return 'b' + (++_uid) + '_' + Math.random().toString(36).slice(2, 7); }

// ─── Initial Data ──────────────────────────────────────────────────────────

export const INITIAL_PAGES: Page[] = [
  {
    id: 'p1', icon: '🏠', title: 'Ana Sayfa', pinned: true, parentId: null,
    createdAt: '2026-01-15', updatedAt: '2026-04-30',
    blocks: [
      { id: 'b1', type: 'h1', content: 'Boktion\'a Hoş Geldiniz 🚀' },
      { id: 'b2', type: 'paragraph', content: 'Boktion, tüm notlarınızı, projelerinizi ve veritabanlarınızı tek bir yerde yönetmenizi sağlayan güçlü bir platformdur.' },
      { id: 'b3', type: 'callout', content: '💡 İpucu: Yeni bir blok eklemek için / tuşuna basın!', emoji: '💡' },
      { id: 'b4', type: 'h2', content: 'Hızlı Başlangıç' },
      { id: 'b5', type: 'bullet', content: 'Sol menüden sayfalar arasında gezinin' },
      { id: 'b6', type: 'bullet', content: 'Yeni sayfa eklemek için + butonunu kullanın' },
      { id: 'b7', type: 'bullet', content: 'Veritabanları ile projelerinizi yönetin' },
      { id: 'b8', type: 'divider', content: '' },
      { id: 'b9', type: 'h2', content: 'Özellikler' },
      { id: 'b10', type: 'todo', content: 'Zengin metin editörü', checked: true },
      { id: 'b11', type: 'todo', content: 'Veritabanı görünümleri', checked: true },
      { id: 'b12', type: 'todo', content: 'Arama (⌘K)', checked: true },
      { id: 'b13', type: 'todo', content: 'Koyu/Açık tema desteği', checked: true },
    ],
    children: [],
  },
  {
    id: 'p2', icon: '📝', title: 'Notlar', parentId: null,
    createdAt: '2026-02-10', updatedAt: '2026-04-28',
    blocks: [
      { id: 'b20', type: 'h1', content: 'Notlarım' },
      { id: 'b21', type: 'paragraph', content: 'Günlük notlarınızı burada tutabilirsiniz.' },
      { id: 'b22', type: 'h2', content: 'Toplantı Notları' },
      { id: 'b23', type: 'paragraph', content: 'Haftalık sprint toplantısı - Proje ilerlemesi değerlendirildi.' },
      { id: 'b24', type: 'quote', content: '"İyi bir plan bugün, mükemmel bir plandan yarın daha iyidir." — George S. Patton' },
    ],
    children: [],
  },
  {
    id: 'p3', icon: '🚀', title: 'Projeler', parentId: null,
    createdAt: '2026-03-01', updatedAt: '2026-04-25',
    blocks: [
      { id: 'b30', type: 'h1', content: 'Aktif Projeler' },
      { id: 'b31', type: 'paragraph', content: 'Devam eden projelerinizin listesi.' },
      { id: 'b32', type: 'h3', content: 'Boktion v2.0' },
      { id: 'b33', type: 'bullet', content: 'Veritabanı entegrasyonu' },
      { id: 'b34', type: 'bullet', content: 'Real-time işbirliği' },
      { id: 'b35', type: 'bullet', content: 'API geliştirme' },
      { id: 'b36', type: 'code', content: 'const boktion = {\n  version: "2.0",\n  status: "development"\n};', language: 'javascript' },
    ],
    children: [],
  },
  {
    id: 'p4', icon: '📔', title: 'Günlük', parentId: null,
    createdAt: '2026-04-01', updatedAt: '2026-04-30',
    blocks: [
      { id: 'b40', type: 'h1', content: 'Günlük' },
      { id: 'b41', type: 'h2', content: '30 Nisan 2026' },
      { id: 'b42', type: 'paragraph', content: 'Bugün Boktion projesinin ilk versiyonunu tamamladık!' },
      { id: 'b43', type: 'todo', content: 'Sunucuya deploy et', checked: false },
      { id: 'b44', type: 'todo', content: 'Veritabanı bağlantısını kur', checked: false },
      { id: 'b45', type: 'todo', content: 'Domain ayarlarını yap', checked: false },
    ],
    children: [],
  },
];

export const INITIAL_DATABASES: Database[] = [
  {
    id: 'db1', icon: '📊', title: 'Proje Takip',
    fields: [
      { id: 'f1', name: 'Görev', type: 'text' },
      { id: 'f2', name: 'Durum', type: 'select', options: [
        { label: 'Yapılacak', color: '#ef4444' },
        { label: 'Devam Ediyor', color: '#f59e0b' },
        { label: 'Tamamlandı', color: '#22c55e' },
        { label: 'İptal', color: '#6b7280' },
      ]},
      { id: 'f3', name: 'Öncelik', type: 'select', options: [
        { label: 'Düşük', color: '#3b82f6' },
        { label: 'Orta', color: '#f59e0b' },
        { label: 'Yüksek', color: '#ef4444' },
        { label: 'Kritik', color: '#dc2626' },
      ]},
      { id: 'f4', name: 'Atanan', type: 'person' },
      { id: 'f5', name: 'Tarih', type: 'date' },
    ],
    records: [
      { id: 'r1', values: { f1: 'Veritabanı şeması oluştur', f2: 'Tamamlandı', f3: 'Yüksek', f4: 'İbrahim', f5: '2026-04-20' } },
      { id: 'r2', values: { f1: 'Frontend bileşenlerini yaz', f2: 'Tamamlandı', f3: 'Yüksek', f4: 'İbrahim', f5: '2026-04-25' } },
      { id: 'r3', values: { f1: 'API endpoint\'lerini oluştur', f2: 'Devam Ediyor', f3: 'Orta', f4: 'İbrahim', f5: '2026-05-01' } },
      { id: 'r4', values: { f1: 'Arama özelliği', f2: 'Yapılacak', f3: 'Düşük', f4: '', f5: '2026-05-10' } },
      { id: 'r5', values: { f1: 'Deploy scriptleri', f2: 'Devam Ediyor', f3: 'Kritik', f4: 'İbrahim', f5: '2026-04-30' } },
    ],
    views: [
      { id: 'v1', name: 'Tablo', type: 'table' },
      { id: 'v2', name: 'Kanban', type: 'kanban' },
      { id: 'v3', name: 'Liste', type: 'list' },
    ],
    activeView: 'v1',
  },
];

export const INITIAL_MEMBERS: Member[] = [
  { id: 'm1', name: 'İbrahim', email: 'ibrahim@boktion.com', role: 'owner', avatar: '👨‍💻', joinedAt: '2026-01-01' },
  { id: 'm2', name: 'Misafir', email: 'guest@boktion.com', role: 'guest', avatar: '👤', joinedAt: '2026-04-15' },
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  { id: 'a1', user: 'İbrahim', action: 'Sayfa oluşturdu', target: 'Ana Sayfa', timestamp: '2026-04-30 14:30' },
  { id: 'a2', user: 'İbrahim', action: 'Veritabanı güncelledi', target: 'Proje Takip', timestamp: '2026-04-30 15:00' },
  { id: 'a3', user: 'İbrahim', action: 'Sayfa düzenledi', target: 'Notlar', timestamp: '2026-04-30 16:00' },
];

export const INITIAL_AUTOMATIONS: Automation[] = [
  { id: 'auto1', name: 'Yeni görev bildirimi', trigger: 'Kayıt oluşturulduğunda', action: 'E-posta gönder', enabled: true },
  { id: 'auto2', name: 'Otomatik arşivleme', trigger: 'Durum "Tamamlandı" olduğunda', action: '7 gün sonra arşivle', enabled: false },
];

export const INITIAL_FORMS: Form[] = [
  { id: 'form1', title: 'Geri Bildirim Formu', fields: [
    { label: 'İsim', type: 'text', required: true },
    { label: 'E-posta', type: 'email', required: true },
    { label: 'Mesaj', type: 'textarea', required: true },
  ], responses: 12 },
];

export const INITIAL_INTEGRATIONS: Integration[] = [
  { id: 'int1', name: 'Slack', icon: '💬', connected: false, description: 'Bildirimleri Slack kanalına gönder' },
  { id: 'int2', name: 'Google Drive', icon: '📁', connected: false, description: 'Dosyaları Google Drive ile senkronize et' },
  { id: 'int3', name: 'GitHub', icon: '🐙', connected: false, description: 'Commit ve PR bildirimlerini al' },
];
