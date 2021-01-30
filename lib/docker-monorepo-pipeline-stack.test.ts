import { expect as expectCDK, haveResource, SynthUtils } from "@aws-cdk/assert";
import * as cdk from "@aws-cdk/core";
import { DockerMonorepoPipelineStack } from "./docker-monorepo-pipeline-stack";

test("Pipeline resources are created.", () => {
  const app = new cdk.App();

  // WHEN
  const stack = new DockerMonorepoPipelineStack(app, "MyTestStack");

  expectCDK(stack).to(haveResource("AWS::CodePipeline::Pipeline"));
  expectCDK(stack).to(haveResource("AWS::CodeBuild::Project"));
});
