import {ControllerScreen} from '@/components/controller/ControllerScreen';

type Props = {
  params: Promise<{id: string}>;
};

export default async function ControllerPage({params}: Props) {
  const {id} = await params;
  return <ControllerScreen sessionId={id} />;
}
