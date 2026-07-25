import {NextResponse} from 'next/server';
import {getSessionRepository} from '@/lib/repository';
import {publishCurrentSession} from '@/lib/session-update';

const repo = getSessionRepository();

type Params = {params: Promise<{id: string}>};

export async function POST(request: Request, {params}: Params) {
  const {id} = await params;
  const payload = (await request.json()) as {
    action?: 'next' | 'prev' | 'set';
    page?: number;
    resetScale?: boolean;
  };
  const options =
    typeof payload.resetScale === 'boolean'
      ? {resetScale: payload.resetScale}
      : undefined;

  let session = null;
  if (payload.action === 'prev') {
    session = repo.prevPage(id, options);
  } else if (payload.action === 'set') {
    session = repo.setPage(id, Number(payload.page ?? 0), options);
  } else {
    session = repo.nextPage(id, options);
  }

  if (!session) {
    return NextResponse.json({error: 'Session not found'}, {status: 404});
  }

  publishCurrentSession(repo, id);

  return NextResponse.json({session});
}
