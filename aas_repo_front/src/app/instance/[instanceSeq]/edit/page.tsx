import { getInstance } from "@/api";
import InstanceFormClient from "@/components/feature/instance/InstanceFormClient";

interface Props {
  params: Promise<{ instanceSeq: string }>;
}

export default async function Page({ params }: Props) {
  const { instanceSeq } = await params;
  const instance = await getInstance({ instance_seq: instanceSeq });

  return (
    <>
      {instance != null && <InstanceFormClient mode="edit" instance={instance} />}
    </>
  );
}
