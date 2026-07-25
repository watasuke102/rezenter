import {NextResponse} from 'next/server';
import {getSessionRepository} from '@/lib/repository';
import {publishCurrentSession} from '@/lib/session-update';

const repo = getSessionRepository();

type Params = {params: Promise<{id: string}>};

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export async function POST(request: Request, {params}: Params) {
  const {id} = await params;
  const payload = (await request.json()) as {x?: number; y?: number};

  const current = repo.findById(id);
  if (!current) {
    return NextResponse.json({error: 'Session not found'}, {status: 404});
  }

  const rawX = Number(payload.x ?? 0);
  const rawY = Number(payload.y ?? 0);
  const deltaX = Number.isFinite(rawX) ? clamp(rawX, -1, 1) : 0;
  const deltaY = Number.isFinite(rawY) ? clamp(rawY, -1, 1) : 0;
  const x = clamp(current.pointerX + deltaX, -1, 1);
  const y = clamp(current.pointerY + deltaY, -1, 1);

  // Only update if coordinates actually changed
  if (x === current.pointerX && y === current.pointerY) {
    return NextResponse.json({session: current});
  }

  const session = repo.updatePointer(id, x, y);

  if (!session) {
    return NextResponse.json({error: 'Session not found'}, {status: 404});
  }

  publishCurrentSession(repo, id);

  return NextResponse.json({session});
}
