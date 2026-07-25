import {NextResponse} from 'next/server';
import {getSessionRepository} from '@/lib/repository';
import {parseNotesJson} from '@/lib/notes';
import {publishSession} from '@/lib/session-update';

const repo = getSessionRepository();

type Params = {params: Promise<{id: string}>};

export async function POST(request: Request, {params}: Params) {
  try {
    const {id} = await params;
    const payload = (await request.json()) as {
      notes?: unknown;
      jsonText?: string;
    };

    let notes;
    if (typeof payload.jsonText === 'string') {
      notes = parseNotesJson(payload.jsonText);
    } else {
      notes = parseNotesJson(JSON.stringify(payload.notes ?? []));
    }

    repo.replaceNotes(id, notes);
    const session = repo.findById(id);
    if (!session) {
      return NextResponse.json({error: 'Session not found'}, {status: 404});
    }

    publishSession(session);

    return NextResponse.json({session});
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({error: message}, {status: 400});
  }
}
