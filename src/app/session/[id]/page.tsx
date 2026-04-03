import Link from 'next/link';
import {notFound} from 'next/navigation';
import {NoteImportForm} from '@/components/session/NoteImportForm';
import * as styles from '@/app/session/[id]/page.css';
import {getSessionRepository} from '@/lib/repository';

const repo = getSessionRepository();

type Props = {
  params: Promise<{id: string}>;
};

export default async function SessionPage({params}: Props) {
  const {id} = await params;
  const session = repo.findById(id);
  if (!session) {
    notFound();
  }

  return (
    <main className={styles.page}>
      <section className={styles.box}>
        <h1>{session.title}</h1>
        <p>Session ID: {session.id}</p>
        <p>Source type: {session.sourceType}</p>
        <p>Current page: {session.currentPage + 1}</p>
        <p>Notes count: {session.notes.length}</p>
      </section>

      <section className={styles.box}>
        <h2>画面リンク</h2>
        <div className={styles.links}>
          <Link className={styles.link} href={`/session/${session.id}/viewer`}>
            Viewer を開く
          </Link>
          <Link
            className={styles.link}
            href={`/session/${session.id}/presenter`}
          >
            Presenter を開く
          </Link>
          <Link
            className={styles.link}
            href={`/session/${session.id}/controller`}
          >
            Controller を開く
          </Link>
        </div>
      </section>

      <NoteImportForm sessionId={session.id} />
    </main>
  );
}
