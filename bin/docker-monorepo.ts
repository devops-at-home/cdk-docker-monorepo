#!/usr/bin/env node
import * as cdk from "@aws-cdk/core";
import { DockerMonorepoPipelineStack } from "../lib/docker-monorepo-pipeline-stack";
import { DockerMonorepoStage } from "../lib/docker-monorepo-stage";

const app = new cdk.App();

new DockerMonorepoPipelineStack(app, "DockerMonorepoPipeline");

// For manual deployments to play account only - run using npm run deploy:play
new DockerMonorepoStage(app, "DockerMonorepoPlay", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

app.synth();
