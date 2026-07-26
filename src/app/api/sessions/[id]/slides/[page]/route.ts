import fs from 'node:fs/promises';
import path from 'node:path';
import {NextResponse} from 'next/server';
import {getSessionRepository} from '@/lib/repository';

const repo = getSessionRepository();
export const runtime = 'nodejs';

type Params = {params: Promise<{id: string; page: string}>};

export async function GET(_: Request, {params}: Params) {
  const {id, page: rawPage} = await params;
  const session = repo.findById(id);
  const page = Number(rawPage);

  if (!session || session.sourceType !== 'typst' || !session.svgDir) {
    return NextResponse.json({error: 'Typst session not found'}, {status: 404});
  }
  if (
    !Number.isInteger(page) ||
    page < 0 ||
    (session.totalPages !== null && page >= session.totalPages)
  ) {
    return NextResponse.json({error: 'SVG page not found'}, {status: 404});
  }

  try {
    const svg = await fs.readFile(
      path.join(session.svgDir, `page-${page + 1}.svg`),
      'utf8',
    );
    return new NextResponse(svg, {
      headers: {
        'content-type': 'image/svg+xml; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json({error: 'SVG page not found'}, {status: 404});
  }
}
