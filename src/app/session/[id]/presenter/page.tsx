import {PresenterScreen} from '@/components/presenter/PresenterScreen';

type Props = {
  params: Promise<{id: string}>;
};

export default async function PresenterPage({params}: Props) {
  const {id} = await params;
  return <PresenterScreen sessionId={id} />;
}
