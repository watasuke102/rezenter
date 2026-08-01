import {PresenterScreen} from '@/components/presenter/PresenterScreen';
import type {Metadata} from 'next';

export const metadata: Metadata = {
  title: 'Presenter',
};

type Props = {
  params: Promise<{id: string}>;
};

export default async function PresenterPage({params}: Props) {
  const {id} = await params;
  return <PresenterScreen sessionId={id} />;
}
