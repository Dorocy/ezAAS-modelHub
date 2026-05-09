// Thin client wrapper so Server Component pages can pass data to InstanceForm
// while keeping ssr:false to avoid Mantine SSR issues.
"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type InstanceForm from "./InstanceForm";

const InstanceFormDynamic = dynamic(() => import("./InstanceForm"), {
  ssr: false,
});

type Props = ComponentProps<typeof InstanceForm>;

export default function InstanceFormClient(props: Props) {
  return <InstanceFormDynamic {...props} />;
}
