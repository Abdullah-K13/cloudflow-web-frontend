import type { Metadata } from "next";
import ObservabilityClient, { Deployment } from "@/src/app/components/observability-client";

export const metadata: Metadata = {
  title: "Observability",
  description: "Environments, deployments, statuses, and quick drill-downs",
};

// TODO: replace with a real action (e.g., getDeployments())
async function getDeployments(): Promise<Deployment[]> {
  const now = Date.now();
  const hours = (n: number) => 1000 * 60 * 60 * n;

  return [
    {
      id: "dep_1029",
      pipelineId: "pipe_aws_api",
      pipelineName: "AWS Serverless API",
      env: "dev",
      cloud: "AWS",
      region: "us-east-1",
      status: "deployed",
      startedAt: new Date(now - hours(3)).toISOString(),
      durationSec: 145,
      commit: "c1a2b3",
    },
    {
      id: "dep_1028",
      pipelineId: "pipe_data_lake",
      pipelineName: "Data Lake",
      env: "staging",
      cloud: "AWS",
      region: "eu-west-1",
      status: "failed",
      startedAt: new Date(now - hours(8)).toISOString(),
      durationSec: 87,
      commit: "f9e8d7",
    },
    {
      id: "dep_1027",
      pipelineId: "pipe_k8s_ms",
      pipelineName: "K8s Microservices",
      env: "prod",
      cloud: "GCP",
      region: "europe-west4",
      status: "deploying",
      startedAt: new Date(now - hours(1)).toISOString(),
      durationSec: 0,
      commit: "9ab42d",
    },
    {
      id: "dep_1026",
      pipelineId: "pipe_kafka",
      pipelineName: "Event Streaming",
      env: "dev",
      cloud: "AWS",
      region: "ap-south-1",
      status: "ready",
      startedAt: new Date(now - hours(26)).toISOString(),
      durationSec: 12,
      commit: "77fa1c",
    },
  ];
}

export default async function ObservabilityPage() {
  const deployments = await getDeployments();

  return (
    <main className="min-h-screen bg-white pl-16">
      <div className="mx-auto w-full max-w-7xl p-6">
        <ObservabilityClient initialData={deployments} />
      </div>
    </main>
  );
}
