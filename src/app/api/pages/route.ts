import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

const DEFAULT_WORKSPACE_ID = '00000000-0000-0000-0000-000000000001';
const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000002';

// ─── GET /api/pages — Tüm sayfaları bloklarıyla getir ────────────────

interface PageRow {
  id: string;
  title: string;
  icon: string;
  is_pinned: boolean;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

interface BlockRow {
  id: string;
  page_id: string;
  type: string;
  content: { text?: string; emoji?: string; checked?: boolean; language?: string; url?: string; rows?: string[][] };
  sort_order: number;
}

export async function GET() {
  try {
    const pages = await query<PageRow>(
      `SELECT id, title, icon, is_pinned, parent_id, created_at, updated_at
       FROM pages
       WHERE workspace_id = $1 AND deleted_at IS NULL
       ORDER BY sort_order ASC, created_at ASC`,
      [DEFAULT_WORKSPACE_ID]
    );

    const blocks = await query<BlockRow>(
      `SELECT b.id, b.page_id, b.type, b.content, b.sort_order
       FROM blocks b
       JOIN pages p ON p.id = b.page_id
       WHERE p.workspace_id = $1 AND p.deleted_at IS NULL
       ORDER BY b.sort_order ASC`,
      [DEFAULT_WORKSPACE_ID]
    );

    // Group blocks by page_id
    const blocksByPage: Record<string, BlockRow[]> = {};
    for (const b of blocks) {
      if (!blocksByPage[b.page_id]) blocksByPage[b.page_id] = [];
      blocksByPage[b.page_id].push(b);
    }

    // Map to frontend format
    const result = pages.map(p => ({
      id: p.id,
      title: p.title,
      icon: p.icon || '📄',
      pinned: p.is_pinned,
      parentId: p.parent_id,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      children: [],
      blocks: (blocksByPage[p.id] || []).map(b => ({
        id: b.id,
        type: b.type,
        content: b.content?.text || '',
        checked: b.content?.checked,
        emoji: b.content?.emoji,
        language: b.content?.language,
        url: b.content?.url,
        rows: b.content?.rows,
      })),
    }));

    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('GET /api/pages error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── POST /api/pages — Yeni sayfa oluştur ────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, icon, parentId } = body;

    // Count existing pages for sort_order
    const countResult = await query<{ count: string }>('SELECT count(*) as count FROM pages WHERE workspace_id = $1 AND deleted_at IS NULL', [DEFAULT_WORKSPACE_ID]);
    const sortOrder = parseInt(countResult[0]?.count || '0');

    const result = await query<{ id: string; created_at: string; updated_at: string }>(
      `INSERT INTO pages (workspace_id, created_by, title, icon, parent_id, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, created_at, updated_at`,
      [DEFAULT_WORKSPACE_ID, DEFAULT_USER_ID, title || 'Yeni Sayfa', icon || '📄', parentId || null, sortOrder]
    );

    const page = result[0];

    // Create initial empty h1 block
    const blockResult = await query<{ id: string }>(
      `INSERT INTO blocks (page_id, type, content, sort_order, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [page.id, 'h1', JSON.stringify({ text: '' }), 0, DEFAULT_USER_ID]
    );

    return NextResponse.json({
      id: page.id,
      title: title || 'Yeni Sayfa',
      icon: icon || '📄',
      pinned: false,
      parentId: parentId || null,
      createdAt: page.created_at,
      updatedAt: page.updated_at,
      children: [],
      blocks: [{ id: blockResult[0].id, type: 'h1', content: '' }],
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('POST /api/pages error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
