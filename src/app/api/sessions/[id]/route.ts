import {NextResponse} from 'next/server';
import fs from 'node:fs/promises';
import {getSessionRepository} from '@/lib/repository';
import {toClientSession} from '@/lib/session-json';
import {publishSessionUpdate} from '@/lib/session-events';
import type {SessionRecord} from '@/lib/types';

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

export async function PATCH(request: Request, {params}: Params) {
  const {id} = await params;
  const payload = (await request.json()) as {
    disableScaleResetOnPageChange?: boolean;
    viewerSettings?: NonNullable<SessionRecord['viewerSettings']>;
  };

  if (typeof payload.disableScaleResetOnPageChange !== 'boolean' && payload.viewerSettings === undefined) {
    return NextResponse.json(
      {error: 'Invalid payload'},
      {status: 400},
    );
  }

  let updated = false;

  if (typeof payload.disableScaleResetOnPageChange === 'boolean') {
    if (repo.setDisableScaleResetOnPageChange(
      id,
      payload.disableScaleResetOnPageChange,
    )) {
      updated = true;
    }
  }

  if (payload.viewerSettings) {
    if (repo.setViewerSettings(id, payload.viewerSettings)) {
      updated = true;
    }
  }

  if (!updated) {
    return NextResponse.json({error: 'Session not found'}, {status: 404});
  }

  const sessionWithNotes = repo.findById(id);
  if (!sessionWithNotes) {
    return NextResponse.json({error: 'Session not found'}, {status: 404});
  }

  const session = toClientSession(sessionWithNotes);
  publishSessionUpdate(id, session);
  return NextResponse.json({session});
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
