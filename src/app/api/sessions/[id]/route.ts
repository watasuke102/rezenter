import {NextResponse} from 'next/server';
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
