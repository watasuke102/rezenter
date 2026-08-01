import type {Metadata} from 'next';
import {getSessionRepository} from '@/lib/repository';

const repo = getSessionRepository();

type Props = {
  children: React.ReactNode;
  params: Promise<{id: string}>;
};

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {id} = await params;
  const session = repo.findById(id);
  if (!session) {
    return {};
  }

  return {
    title: {
      default: `${session.title} - Rezenter`,
      template: `[%s] ${session.title} - Rezenter`,
    },
  };
}

export default function SessionLayout({children}: Props) {
  return children;
}
