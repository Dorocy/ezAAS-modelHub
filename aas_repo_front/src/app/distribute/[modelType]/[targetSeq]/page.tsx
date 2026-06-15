import dynamic from "next/dynamic";

const DistributeDetailView = dynamic(
  () => import("@/components/feature/distribute/DistributeDetailView")
);

interface Props {
  params: Promise<{ modelType: string; targetSeq: string }>;
}

export default async function Page({ params }: Props) {
  const { modelType, targetSeq } = await params;
  const ty = modelType === "submodel" ? "submodel" : "aasmodel";
  return <DistributeDetailView modelType={ty} targetSeq={targetSeq} />;
}
