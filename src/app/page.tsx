import Link from 'next/link';
import {CreateSessionForm} from '@/components/session/CreateSessionForm';
import * as styles from '@/components/session/home.css';
import {getSessionRepository} from '@/lib/repository';

const repo = getSessionRepository();

export default function Home() {
  const sessions = repo.list();

  return (
    <main className={styles.page}>
      <CreateSessionForm />

      <section className={styles.panel}>
        <h2>セッション一覧</h2>
        <div className={styles.sessions}>
          {sessions.length === 0 ? <p>まだセッションがありません。</p> : null}
          {sessions.map(session => (
            <Link
              key={session.id}
              href={`/session/${session.id}`}
              className={styles.sessionItem}
            >
              <strong>{session.title}</strong>
              <span>ID: {session.id}</span>
              <span>Page: {session.currentPage + 1}</span>
              <span>{new Date(session.createdAt).toLocaleString()}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
