import {NextResponse} from 'next/server';
import {getSessionRepository} from '@/lib/repository';

const repo = getSessionRepository();

type Params = {params: Promise<{id: string}>};

export async function POST(request: Request, {params}: Params) {
  const {id} = await params;
  const payload = (await request.json()) as {x?: number; y?: number};

  const x = Number(payload.x ?? 0);
  const y = Number(payload.y ?? 0);
  const session = repo.updatePointer(id, x, y);

  if (!session) {
    return NextResponse.json({error: 'Session not found'}, {status: 404});
  }

  return NextResponse.json({session});
}
