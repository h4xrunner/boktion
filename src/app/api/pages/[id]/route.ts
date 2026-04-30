import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// ─── PUT /api/pages/[id] — Sayfayı güncelle ─────────────────────────

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, icon, pinned } = body;

    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (title !== undefined) { sets.push(`title = $${idx++}`); values.push(title); }
    if (icon !== undefined) { sets.push(`icon = $${idx++}`); values.push(icon); }
    if (pinned !== undefined) { sets.push(`is_pinned = $${idx++}`); values.push(pinned); }

    if (sets.length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    values.push(id);
    await query(
      `UPDATE pages SET ${sets.join(', ')}, updated_at = now() WHERE id = $${idx}`,
      values
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('PUT /api/pages/[id] error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── DELETE /api/pages/[id] — Sayfayı sil (soft delete) ─────────────

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    await query(
      `UPDATE pages SET deleted_at = now() WHERE id = $1`,
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('DELETE /api/pages/[id] error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
