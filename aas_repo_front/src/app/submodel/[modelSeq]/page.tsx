import ModelDetailView from "@/components/feature/model/ModelDetailView";

export default async function SubmodelDetailPage({
  params,
}: {
  params: Promise<{ modelSeq: string }>;
}) {
  const { modelSeq } = await params;
  return <ModelDetailView modelType="submodel" modelSeq={modelSeq} />;
}
