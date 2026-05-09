import { getInstance, getInstanceDetail } from "@/api";
import InstanceFormClient from "@/components/feature/instance/InstanceFormClient";

interface Props {
  params: Promise<{ instanceSeq: string }>;
}

export default async function Page({ params }: Props) {
  const { instanceSeq } = await params;

  const instance = await getInstance({ instance_seq: instanceSeq });
  const instanceDetail = await getInstanceDetail({ instance_seq: instanceSeq });

  return (
    <>
      {instance != null && (
        <InstanceFormClient
          mode="view"
          instance={instance}
          combinedAAS={instanceDetail[0]?.metadata}
        />
      )}
    </>
  );
}
