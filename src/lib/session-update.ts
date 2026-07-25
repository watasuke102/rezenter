import 'server-only';

import type {ClientSession} from '@/lib/client-types';
import type {SessionRepository} from '@/lib/repository/session-repository';
import {publishSessionUpdate} from '@/lib/session-events';
import {toClientSession} from '@/lib/session-json';
import type {SessionWithNotes} from '@/lib/types';

export function publishSession(session: SessionWithNotes): ClientSession {
  const clientSession = toClientSession(session);
  publishSessionUpdate(session.id, clientSession);
  return clientSession;
}

export function publishCurrentSession(
  repository: SessionRepository,
  sessionId: string,
): ClientSession | null {
  const session = repository.findById(sessionId);
  if (!session) {
    return null;
  }

  return publishSession(session);
}
