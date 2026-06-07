"use client";
import dynamic from "next/dynamic";

const DistributeReviewForm = dynamic(
  () => import("@/components/feature/distribute/DistributeReviewForm"),
  { ssr: false }
);

export default function Page() {
  return <DistributeReviewForm mode="create" />;
}
