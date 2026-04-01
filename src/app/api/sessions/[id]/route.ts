import {NextResponse} from 'next/server';
import fs from 'node:fs/promises';
import {getSessionRepository} from '@/lib/repository';
import {toClientSession} from '@/lib/session-json';

const repo = getSessionRepository();

type Params = {params: Promise<{id: string}>};

export async function GET(_: Request, {params}: Params) {
  const {id} = await params;
  const session = repo.findById(id);
  if (!session) {
    return NextResponse.json({error: 'Session not found'}, {status: 404});
  }

  return NextResponse.json({session: toClientSession(session)});
}

export async function DELETE(_: Request, {params}: Params) {
  const {id} = await params;
  const session = repo.findById(id);
  if (!session) {
    return NextResponse.json({error: 'Session not found'}, {status: 404});
  }

  const deleted = repo.delete(id);
  if (!deleted) {
    return NextResponse.json(
      {error: 'Failed to delete session'},
      {status: 500},
    );
  }

  if (session.sourceType === 'upload' && session.pdfPath) {
    try {
      await fs.unlink(session.pdfPath);
    } catch {
      // Ignore file cleanup failures after DB deletion.
    }
  }

  return NextResponse.json({ok: true});
}
