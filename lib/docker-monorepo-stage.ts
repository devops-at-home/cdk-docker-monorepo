import * as cdk from "@aws-cdk/core";
import { DockerMonorepoPipelineStack } from "./docker-monorepo-pipeline-stack";
import { Stage, StageProps } from "@aws-cdk/core";

export class DockerMonorepoStage extends Stage {
  constructor(scope: cdk.Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    new DockerMonorepoPipelineStack(this, "DockerMonorepoPipelineStack");
  }
}
