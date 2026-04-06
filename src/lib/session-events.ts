import type {ClientSession} from '@/lib/client-types';

export type SessionUpdateEvent = {
  type: 'session.update';
  session: ClientSession;
};

type SessionEvent = SessionUpdateEvent;
type Listener = (event: SessionEvent) => void;

type Store = Map<string, Set<Listener>>;

function getStore(): Store {
  const g = globalThis as typeof globalThis & {__rezenterSessionEvents?: Store};
  if (!g.__rezenterSessionEvents) {
    g.__rezenterSessionEvents = new Map();
  }
  return g.__rezenterSessionEvents;
}

export function publishSessionUpdate(
  sessionId: string,
  session: ClientSession,
) {
  const listeners = getStore().get(sessionId);
  if (!listeners || listeners.size === 0) {
    return;
  }

  const event: SessionEvent = {type: 'session.update', session};
  for (const listener of listeners) {
    listener(event);
  }
}

export function subscribeSessionEvents(sessionId: string, listener: Listener) {
  const store = getStore();
  let listeners = store.get(sessionId);
  if (!listeners) {
    listeners = new Set();
    store.set(sessionId, listeners);
  }
  listeners.add(listener);

  return () => {
    const current = store.get(sessionId);
    if (!current) {
      return;
    }
    current.delete(listener);
    if (current.size === 0) {
      store.delete(sessionId);
    }
  };
}
