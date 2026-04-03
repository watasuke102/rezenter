import {CreateSessionForm} from '@/components/session/CreateSessionForm';
import {SessionList} from '@/components/session/SessionList';
import * as styles from '@/app/page.css';
import {getSessionRepository} from '@/lib/repository';

const repo = getSessionRepository();

export default function Home() {
  const sessions = repo.list();

  return (
    <main className={styles.page}>
      <CreateSessionForm />

      <section className={styles.panel}>
        <h2>セッション一覧</h2>
        <SessionList sessions={sessions} />
      </section>
    </main>
  );
}
