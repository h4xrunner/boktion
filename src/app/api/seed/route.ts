import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

// Default workspace & user IDs (sabit — auth olmadan tek kullanıcı)
const DEFAULT_WORKSPACE_ID = '00000000-0000-0000-0000-000000000001';
const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000002';

export async function GET() {
  try {
    // Check if workspace already exists
    const existing = await queryOne('SELECT id FROM workspaces WHERE id = $1', [DEFAULT_WORKSPACE_ID]);
    if (existing) {
      return NextResponse.json({ message: 'Already seeded', seeded: false });
    }

    // Create default workspace
    await query(
      `INSERT INTO workspaces (id, name, slug, plan) VALUES ($1, $2, $3, $4)`,
      [DEFAULT_WORKSPACE_ID, 'Boktion', 'boktion', 'free']
    );

    // Create default user
    await query(
      `INSERT INTO users (id, email, name, avatar_url) VALUES ($1, $2, $3, $4)`,
      [DEFAULT_USER_ID, 'admin@boktion.local', 'İbrahim', '👨‍💻']
    );

    // Add user as workspace owner
    await query(
      `INSERT INTO workspace_members (workspace_id, user_id, role, joined_at) VALUES ($1, $2, $3, now())`,
      [DEFAULT_WORKSPACE_ID, DEFAULT_USER_ID, 'owner']
    );

    // Create Ana Sayfa
    const pageResult = await query<{ id: string }>(
      `INSERT INTO pages (workspace_id, created_by, title, icon, is_pinned, sort_order) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [DEFAULT_WORKSPACE_ID, DEFAULT_USER_ID, 'Ana Sayfa', '🏠', true, 0]
    );
    const pageId = pageResult[0].id;

    // Create initial blocks for Ana Sayfa
    const blocks = [
      { type: 'h1', content: { text: "Boktion'a Hoş Geldiniz 🚀" }, sort: 0 },
      { type: 'paragraph', content: { text: 'Boktion, tüm notlarınızı, projelerinizi ve veritabanlarınızı tek bir yerde yönetmenizi sağlayan güçlü bir platformdur.' }, sort: 1 },
      { type: 'callout', content: { text: '💡 İpucu: Yeni bir blok eklemek için / tuşuna basın!', emoji: '💡' }, sort: 2 },
      { type: 'h2', content: { text: 'Hızlı Başlangıç' }, sort: 3 },
      { type: 'bullet', content: { text: 'Sol menüden sayfalar arasında gezinin' }, sort: 4 },
      { type: 'bullet', content: { text: 'Yeni sayfa eklemek için + butonunu kullanın' }, sort: 5 },
      { type: 'bullet', content: { text: 'Veritabanları ile projelerinizi yönetin' }, sort: 6 },
      { type: 'divider', content: { text: '' }, sort: 7 },
      { type: 'h2', content: { text: 'Özellikler' }, sort: 8 },
      { type: 'todo', content: { text: 'Zengin metin editörü', checked: true }, sort: 9 },
      { type: 'todo', content: { text: 'Veritabanı görünümleri', checked: true }, sort: 10 },
      { type: 'todo', content: { text: 'Arama (⌘K)', checked: true }, sort: 11 },
      { type: 'todo', content: { text: 'Koyu/Açık tema desteği', checked: true }, sort: 12 },
    ];

    for (const b of blocks) {
      await query(
        `INSERT INTO blocks (page_id, type, content, sort_order, created_by) VALUES ($1, $2, $3, $4, $5)`,
        [pageId, b.type, JSON.stringify(b.content), b.sort, DEFAULT_USER_ID]
      );
    }

    // Create a second page: Notlar
    const notlarResult = await query<{ id: string }>(
      `INSERT INTO pages (workspace_id, created_by, title, icon, sort_order) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [DEFAULT_WORKSPACE_ID, DEFAULT_USER_ID, 'Notlar', '📝', 1]
    );
    const notlarId = notlarResult[0].id;

    await query(
      `INSERT INTO blocks (page_id, type, content, sort_order, created_by) VALUES ($1, $2, $3, $4, $5)`,
      [notlarId, 'h1', JSON.stringify({ text: 'Notlarım' }), 0, DEFAULT_USER_ID]
    );
    await query(
      `INSERT INTO blocks (page_id, type, content, sort_order, created_by) VALUES ($1, $2, $3, $4, $5)`,
      [notlarId, 'paragraph', JSON.stringify({ text: 'Günlük notlarınızı burada tutabilirsiniz.' }), 1, DEFAULT_USER_ID]
    );

    return NextResponse.json({ message: 'Seed completed!', seeded: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Seed error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
