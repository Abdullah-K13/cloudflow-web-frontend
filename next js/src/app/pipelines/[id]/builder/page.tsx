"use client";

import WorkplaceClient from "@/components/workplace-client";
import { use, Suspense } from "react";

function PipelineBuilderContent({ id }: { id: string }) {
  return <WorkplaceClient pipelineId={id} key={id} />
}

export default function PipelineBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <Suspense fallback={<div className="flex h-screen"><div className="w-64 bg-gray-200 animate-pulse"></div><div className="flex-1 bg-white animate-pulse"></div></div>}>
      <PipelineBuilderContent id={id} />
    </Suspense>
  );
}

