import 'server-only';

import {SqliteSessionRepository} from '@/lib/repository/sqlite-session-repository';

let repository: SqliteSessionRepository | null = null;

export function getSessionRepository() {
  if (!repository) {
    repository = new SqliteSessionRepository();
  }
  return repository;
}
