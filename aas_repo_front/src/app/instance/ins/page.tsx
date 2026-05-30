"use client";
import dynamic from "next/dynamic";

const InstanceForm = dynamic(
  () => import("@/components/feature/instance/InstanceForm"),
  { ssr: false }
);

export default function Page() {
  return <InstanceForm mode="create" />;
}
