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
        <div className={styles.info}>
          <strong>Session ID</strong>
          <span>{session.id}</span>
          <strong>Source type</strong>
          <span>{session.sourceType}</span>
          <strong>Current page</strong>
          <span>{session.currentPage + 1}</span>
          <strong>Notes count</strong>
          <span>{session.notes.length}</span>
        </div>
        <div className={styles.links}>
          <Link className={styles.link} href={`/session/${session.id}/viewer`}>
            Viewer
          </Link>
          <Link
            className={styles.link}
            href={`/session/${session.id}/presenter`}
          >
            Presenter
          </Link>
          <Link
            className={styles.link}
            href={`/session/${session.id}/controller`}
          >
            Controller
          </Link>
        </div>
      </section>

      <NoteImportForm sessionId={session.id} />
    </main>
  );
}
