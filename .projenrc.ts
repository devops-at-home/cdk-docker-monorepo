import { awscdk } from 'projen';
import { DockerMonorepoProps } from './src/constructs/docker-monorepo';

export const dockerMonorepoProps: DockerMonorepoProps = {
  ecrConfigs: [{ maxImageCount: 10, repositoryName: 'hello-kubernetes' }],
  githubOrg: 'devops-at-home',
  githubRepoName: 'cdk-docker-monorepo',
};

const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '2.14.0',
  defaultReleaseBranch: 'main',
  eslint: false,
  licensed: false,
  name: 'cdk-docker-monorepo',
  projenrcTs: true,
  githubOptions: {
    mergify: false,
    // workflows: false,
    pullRequestLint: false,
  },
  buildWorkflow: true,
  mutableBuild: false,
  buildCommand: 'cd docker/hello-kubernetes && ./build.sh',
  buildWorkflowTriggers: {
    push: { branches: ['main'], paths: ['docker/**/VERSION'] },
  },
  workflowBootstrapSteps: [
    {
      name: 'Check Docker version',
      run: 'docker --version',
    },
  ],
  stale: false,
  depsUpgrade: false,
  gitignore: ['.idea'],
  context: { dockerMonorepoProps },
});

project.synth();
