import {NextResponse} from 'next/server';
import fs from 'node:fs/promises';
import {getSessionRepository} from '@/lib/repository';

const repo = getSessionRepository();

type Params = {params: Promise<{id: string}>};

export async function GET(_: Request, {params}: Params) {
  const {id} = await params;
  const session = repo.findById(id);
  if (!session) {
    return NextResponse.json({error: 'Session not found'}, {status: 404});
  }

  if (session.sourceType === 'url' && session.pdfUrl) {
    try {
      const response = await fetch(session.pdfUrl, {cache: 'no-store'});
      if (!response.ok) {
        return NextResponse.json(
          {error: 'Failed to fetch source PDF'},
          {status: 400},
        );
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      return new NextResponse(buffer, {
        headers: {
          'content-type': 'application/pdf',
          'cache-control': 'no-store',
        },
      });
    } catch {
      return NextResponse.json(
        {error: 'Failed to fetch source PDF'},
        {status: 400},
      );
    }
  }

  if (!session.pdfPath) {
    return NextResponse.json(
      {error: 'PDF path is not available'},
      {status: 404},
    );
  }

  try {
    const buffer = await fs.readFile(session.pdfPath);
    return new NextResponse(buffer, {
      headers: {
        'content-type': 'application/pdf',
        'cache-control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json({error: 'PDF not found on disk'}, {status: 404});
  }
}
