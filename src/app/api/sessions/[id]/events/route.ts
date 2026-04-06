import {getSessionRepository} from '@/lib/repository';
import {toClientSession} from '@/lib/session-json';
import {subscribeSessionEvents} from '@/lib/session-events';

const repo = getSessionRepository();

type Params = {params: Promise<{id: string}>};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request, {params}: Params) {
  const {id} = await params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      let heartbeatId: ReturnType<typeof setInterval> | null = null;
      let unsubscribe = () => {};

      const onAbort = () => {
        close();
      };

      const close = () => {
        if (closed) {
          return;
        }
        closed = true;
        if (heartbeatId !== null) {
          clearInterval(heartbeatId);
        }
        unsubscribe();
        request.signal.removeEventListener('abort', onAbort);
        controller.close();
      };

      const send = (event: string, payload: unknown) => {
        if (closed) {
          return;
        }
        controller.enqueue(
          encoder.encode(
            `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`,
          ),
        );
      };

      const session = repo.findById(id);
      if (!session) {
        send('session.not-found', {id});
        close();
        return;
      }

      send('session.update', {session: toClientSession(session)});

      unsubscribe = subscribeSessionEvents(id, event => {
        send(event.type, {session: event.session});
      });

      heartbeatId = setInterval(() => {
        if (closed) {
          return;
        }
        controller.enqueue(encoder.encode(': keepalive\n\n'));
      }, 15000);

      request.signal.addEventListener('abort', onAbort);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
