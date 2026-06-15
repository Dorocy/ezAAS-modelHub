import dynamic from "next/dynamic";

const DistributeReviewLoader = dynamic(
  () => import("@/components/feature/distribute/DistributeReviewLoader")
);

interface Props {
  params: Promise<{ modelType: string; targetSeq: string }>;
}

export default async function Page({ params }: Props) {
  const { modelType, targetSeq } = await params;
  const ty = modelType === "submodel" ? "submodel" : "aasmodel";
  return <DistributeReviewLoader modelType={ty} targetSeq={targetSeq} />;
}
