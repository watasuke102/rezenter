import fs from 'node:fs/promises';
import path from 'node:path';
import {NextResponse} from 'next/server';
import {getDb} from '@/lib/db';

export const runtime = 'nodejs';

type FavoriteRow = {path: string};

export async function GET() {
  const favorites = getDb()
    .prepare(`SELECT path FROM favorite_paths ORDER BY created_at DESC`)
    .all() as FavoriteRow[];
  return NextResponse.json({favorites: favorites.map(item => item.path)});
}

export async function POST(request: Request) {
  const payload = (await request.json()) as {path?: string};
  if (!payload.path?.trim()) {
    return NextResponse.json({error: 'パスが必要です'}, {status: 400});
  }
  const favoritePath = path.resolve(payload.path);
  try {
    await fs.stat(favoritePath);
  } catch {
    return NextResponse.json({error: 'パスが存在しません'}, {status: 400});
  }
  getDb()
    .prepare(
      `INSERT INTO favorite_paths (path, created_at)
       VALUES (?, ?)
       ON CONFLICT(path) DO UPDATE SET created_at = excluded.created_at`,
    )
    .run(favoritePath, Date.now());
  return NextResponse.json({path: favoritePath}, {status: 201});
}

export async function DELETE(request: Request) {
  const payload = (await request.json()) as {path?: string};
  if (!payload.path?.trim()) {
    return NextResponse.json({error: 'パスが必要です'}, {status: 400});
  }
  getDb()
    .prepare(`DELETE FROM favorite_paths WHERE path = ?`)
    .run(path.resolve(payload.path));
  return NextResponse.json({ok: true});
}
