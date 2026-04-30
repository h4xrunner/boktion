import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000002';

// ─── PUT /api/pages/[id]/blocks — Sayfanın bloklarını kaydet ─────────
// Tüm blokları sil ve yeniden oluştur (en basit yaklaşım)

interface BlockInput {
  id?: string;
  type: string;
  content: string;
  checked?: boolean;
  emoji?: string;
  language?: string;
  url?: string;
  rows?: string[][];
  open?: boolean;
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: pageId } = await params;
    const body = await request.json();
    const blocks: BlockInput[] = body.blocks;

    if (!Array.isArray(blocks)) {
      return NextResponse.json({ error: 'blocks array required' }, { status: 400 });
    }

    // Delete existing blocks for this page
    await query('DELETE FROM blocks WHERE page_id = $1', [pageId]);

    // Insert new blocks
    const insertedBlocks: { id: string; type: string; content: string }[] = [];
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      const contentJson = JSON.stringify({
        text: b.content || '',
        checked: b.checked,
        emoji: b.emoji,
        language: b.language,
        url: b.url,
        rows: b.rows,
      });

      const result = await query<{ id: string }>(
        `INSERT INTO blocks (page_id, type, content, sort_order, created_by)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [pageId, b.type, contentJson, i, DEFAULT_USER_ID]
      );

      insertedBlocks.push({ id: result[0].id, type: b.type, content: b.content });
    }

    // Update page's updated_at
    await query('UPDATE pages SET updated_at = now() WHERE id = $1', [pageId]);

    return NextResponse.json({ success: true, blocks: insertedBlocks });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('PUT /api/pages/[id]/blocks error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
