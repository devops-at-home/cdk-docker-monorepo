import { readdirSync } from "fs";
import * as cdk from "@aws-cdk/core";
import * as ssm from "@aws-cdk/aws-ssm";
import * as pipelines from "@aws-cdk/pipelines";
import * as codebuild from "@aws-cdk/aws-codebuild";
import * as codepipeline from "@aws-cdk/aws-codepipeline";
import * as codepipeline_actions from "@aws-cdk/aws-codepipeline-actions";
import * as secretsmanager from "@aws-cdk/aws-secretsmanager";
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
      ),
    });

    // Docker access token
    secretsmanager.Secret.fromSecretNameV2(
      this,
      "dockerToken",
      "/docker/build/accessToken"
    ).grantRead(dockerBuild.role!);

    // Docker user name
    ssm.StringParameter.fromStringParameterName(
      this,
      "DockerUserSystemParam",
      "/docker/build/user"
    ).grantRead(dockerBuild.role!);

    const repoNames = this.__getFolders(subdirectory);
    const ecr = new ECR(this, "EcrRepos", repoNames, dockerBuild.role!);

    const pipeline = new pipelines.CdkPipeline(this, "DockerMonorepoPipeline", {
      pipelineName: "DockerMonorepo",
      cloudAssemblyArtifact,

      sourceAction: new codepipeline_actions.GitHubSourceAction({
        actionName: "GitHub",
        output: sourceArtifact,
        oauthToken: cdk.SecretValue.secretsManager("/github/build/accessToken"),
        owner: "devops-at-home",
        branch: "master",
        repo: "cdk-docker-monorepo",
      }),

      synthAction: pipelines.SimpleSynthAction.standardNpmSynth({
        sourceArtifact,
        cloudAssemblyArtifact,
        installCommand: "npm install",
        buildCommand: "npm run build",
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
    const cfnPipeline = pipeline.node.defaultChild as codepipeline.CfnPipeline;
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
}
