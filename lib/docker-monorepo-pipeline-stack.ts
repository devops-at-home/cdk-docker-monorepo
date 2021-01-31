import { readdirSync } from "fs";
import * as cdk from "@aws-cdk/core";
import * as iam from "@aws-cdk/aws-iam";
import * as ssm from "@aws-cdk/aws-ssm";
import * as pipelines from "@aws-cdk/pipelines";
import * as codebuild from "@aws-cdk/aws-codebuild";
import * as codepipeline from "@aws-cdk/aws-codepipeline";
import * as codepipeline_actions from "@aws-cdk/aws-codepipeline-actions";
import { ECR } from "./constructs/ecr";

export class DockerMonorepoPipelineStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const subdirectory = "src";
    const sourceArtifact = new codepipeline.Artifact("Source");
    const cloudAssemblyArtifact = new codepipeline.Artifact("Cloudformation");

    const dockerBuild = new codebuild.PipelineProject(this, "DockerBuild", {
      environment: {
        buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_3,
        privileged: true,
      },
      buildSpec: codebuild.BuildSpec.fromSourceFilename(
        `${subdirectory}/.ci/buildspec.yml`
      ),
      cache: codebuild.Cache.local(
        codebuild.LocalCacheMode.DOCKER_LAYER,
        codebuild.LocalCacheMode.CUSTOM
      ), // investigate implementing s3 caching
    });

    this.__roleAccessParams(dockerBuild.role!, [
      "/docker/build/token",
      "/docker/build/user",
      "/codebuild/state/docker-monorepo/prev-git-sha",
    ]);

    const repoNames = this.__getFolders(subdirectory);
    const ecr = new ECR(this, "EcrRepos", repoNames, dockerBuild.role!);

    const connectionParam = "/codebuild/connections/github-devops-at-home";
    const connectionArn = ssm.StringParameter.valueForStringParameter(
      this,
      connectionParam
    );

    const pipeline = new pipelines.CdkPipeline(this, "DockerMonorepoPipeline", {
      pipelineName: "DockerMonorepo",
      cloudAssemblyArtifact,

      sourceAction: new codepipeline_actions.BitBucketSourceAction({
        actionName: "GitHubDevOpsAtHome",
        output: sourceArtifact,
        owner: "devops-at-home",
        branch: "master",
        repo: "cdk-docker-monorepo",
        connectionArn: connectionArn,
      }),

      synthAction: pipelines.SimpleSynthAction.standardNpmSynth({
        sourceArtifact,
        cloudAssemblyArtifact,
        installCommand: "npm install",
        buildCommand: "npm run build",
        rolePolicyStatements: [
          new iam.PolicyStatement({
            actions: [
              "codestar-connections:GetIndividualAccessToken",
              "codestar-connections:GetHost",
              "codestar-connections:UseConnection",
              "codestar-connections:StartOAuthHandshake",
              "codestar-connections:GetInstallationUrl",
              "codestar-connections:GetConnection",
              "codestar-connections:StartAppRegistrationHandshake",
              "codestar-connections:PassConnection",
              "codestar-connections:RegisterAppCode",
            ],
            resources: [connectionArn],
            effect: iam.Effect.ALLOW,
          }),
          new iam.PolicyStatement({
            actions: [
              "codestar-connections:ListTagsForResource",
              "codestar-connections:ListInstallationTargets",
              "codestar-connections:ListHosts",
              "codestar-connections:ListConnections",
            ],
            resources: ["*"],
            effect: iam.Effect.ALLOW,
          }),
        ],
      }),
    });

    pipeline.addStage("Docker");
    pipeline.stage("Docker").addAction(
      new codepipeline_actions.CodeBuildAction({
        actionName: "PublishContainers",
        project: dockerBuild,
        input: sourceArtifact,
        environmentVariables: {
          ACCOUNT_ID: {
            value: cdk.Aws.ACCOUNT_ID,
            type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
          },
          REGION: {
            value: cdk.Aws.REGION,
            type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
          },
        },
      })
    );

    // Escape hatch to modify the specific Stage Properties
    // See https://github.com/mohanrajendran/aws-cdk/commit/abec4973ad7cbc61b9fbe33bc1602f14511f47cd
    // And https://github.com/aws/aws-cdk/issues/12236
    const cfnPipeline = pipeline.codePipeline.node
      .defaultChild as codepipeline.CfnPipeline;
    cfnPipeline.addPropertyOverride(
      "Stages.0.Actions.0.Configuration.OutputArtifactFormat",
      "CODEBUILD_CLONE_REF"
    );
  }

  private __getFolders = (folderName: string): string[] => {
    const fileList = readdirSync(`${__dirname}/../${folderName}`);
    const outputList: string[] = [];

    for (let idx in fileList) {
      const fileName = fileList[idx];
      if (fileName[0] !== ".") {
        outputList.push(fileName);
      }
    }
    return outputList;
  };

  private __roleAccessParams = (role: iam.IRole, params: string[]) => {
    for (let idx in params) {
      const param = params[idx];
      ssm.StringParameter.fromStringParameterName(
        this,
        `SystemParamAccess-${param}`,
        param
      ).grantRead(role);
    }
  };
}
