"use client";

import useSWR from "swr";
import { getPublishedModel } from "@/api/index";
import DistributeReviewForm from "./DistributeReviewForm";
import { Skeleton } from "@/components/ui/skeleton";

type ModelType = "aasmodel" | "submodel";

function normalizeOne(res: any) {
  if (Array.isArray(res)) return res[0];
  if (Array.isArray(res?.data)) return res.data[0];
  if (Array.isArray(res?.list)) return res.list[0];
  return res?.data ?? res;
}

export default function DistributeReviewLoader({
  modelType,
  targetSeq,
}: {
  modelType: ModelType;
  targetSeq: string;
}) {
  const { data, isLoading } = useSWR(
    ["published-model", modelType, targetSeq],
    () => getPublishedModel({ modelType, target_seq: targetSeq })
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-screen-2xl w-full px-6 py-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[480px] w-full rounded-xl" />
      </div>
    );
  }

  const model = normalizeOne(data);

  return (
    <DistributeReviewForm
      mode="edit"
      initialModel={model}
      modelType={modelType}
      targetSeq={targetSeq}
    />
  );
}
