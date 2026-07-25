import 'server-only';

import type {SessionRepository} from '@/lib/repository/session-repository';
import {SqliteSessionRepository} from '@/lib/repository/sqlite-session-repository';

let repository: SessionRepository | null = null;

export function getSessionRepository(): SessionRepository {
  if (!repository) {
    repository = new SqliteSessionRepository();
  }
  return repository;
}
