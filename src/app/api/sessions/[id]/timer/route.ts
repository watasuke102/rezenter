import {NextResponse} from 'next/server';
import {getSessionRepository} from '@/lib/repository';
import {toClientSession} from '@/lib/session-json';
import {publishSessionUpdate} from '@/lib/session-events';

const repo = getSessionRepository();

type Params = {params: Promise<{id: string}>};

export async function POST(request: Request, {params}: Params) {
  const {id} = await params;
  const payload = (await request.json()) as {
    action?: 'start' | 'pause' | 'reset';
  };

  let session = null;
  if (payload.action === 'pause') {
    session = repo.setTimerRunning(id, false);
  } else if (payload.action === 'reset') {
    session = repo.resetTimer(id);
  } else {
    session = repo.setTimerRunning(id, true);
  }

  if (!session) {
    return NextResponse.json({error: 'Session not found'}, {status: 404});
  }

  const sessionWithNotes = repo.findById(id);
  if (sessionWithNotes) {
    publishSessionUpdate(id, toClientSession(sessionWithNotes));
  }

  return NextResponse.json({session});
}
