import {ControllerScreen} from '@/components/controller/ControllerScreen';
import type {Metadata} from 'next';

export const metadata: Metadata = {
  title: 'Controller',
};

type Props = {
  params: Promise<{id: string}>;
};

export default async function ControllerPage({params}: Props) {
  const {id} = await params;
  return <ControllerScreen sessionId={id} />;
}
