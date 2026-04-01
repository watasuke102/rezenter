import {ViewerScreen} from '@/components/viewer/ViewerScreen';
import {toClientSession} from '@/lib/session-json';
import {getSessionRepository} from '@/lib/repository';
import {notFound} from 'next/navigation';

const repo = getSessionRepository();

type Props = {
  params: Promise<{id: string}>;
};

export default async function ViewerPage({params}: Props) {
  const {id} = await params;
  const session = repo.findById(id);
  if (!session) {
    notFound();
  }

  return (
    <ViewerScreen sessionId={id} initialSession={toClientSession(session)} />
  );
}
