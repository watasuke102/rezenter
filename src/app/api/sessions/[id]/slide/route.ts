import {NextResponse} from 'next/server';
import {getSessionRepository} from '@/lib/repository';

const repo = getSessionRepository();

type Params = {params: Promise<{id: string}>};

export async function POST(request: Request, {params}: Params) {
  const {id} = await params;
  const payload = (await request.json()) as {
    action?: 'next' | 'prev' | 'set';
    page?: number;
  };

  let session = null;
  if (payload.action === 'prev') {
    session = repo.prevPage(id);
  } else if (payload.action === 'set') {
    session = repo.setPage(id, Number(payload.page ?? 0));
  } else {
    session = repo.nextPage(id);
  }

  if (!session) {
    return NextResponse.json({error: 'Session not found'}, {status: 404});
  }

  return NextResponse.json({session});
}
