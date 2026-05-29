import ModelDetailView from "@/components/feature/model/ModelDetailView";

export default async function AASModelDetailPage({
  params,
}: {
  params: Promise<{ modelSeq: string }>;
}) {
  const { modelSeq } = await params;
  return <ModelDetailView modelType="aasmodel" modelSeq={modelSeq} />;
}
