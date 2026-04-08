import {NextResponse} from 'next/server';
import {getSessionRepository} from '@/lib/repository';
import {toClientSession} from '@/lib/session-json';
import {publishSessionUpdate} from '@/lib/session-events';

const repo = getSessionRepository();

type Params = {params: Promise<{id: string}>};

export async function POST(request: Request, {params}: Params) {
  const {id} = await params;
  const payload = (await request.json()) as {
    scaleMultiplier?: number;
    offsetDeltaX?: number;
    offsetDeltaY?: number;
  };

  const session = repo.updateViewerTransform(
    id,
    Number(payload.scaleMultiplier ?? 1),
    Number(payload.offsetDeltaX ?? 0),
    Number(payload.offsetDeltaY ?? 0),
  );

  if (!session) {
    return NextResponse.json({error: 'Session not found'}, {status: 404});
  }

  const sessionWithNotes = repo.findById(id);
  if (sessionWithNotes) {
    publishSessionUpdate(id, toClientSession(sessionWithNotes));
  }

  return NextResponse.json({session});
}
