import { awscdk } from 'projen';
import { DockerMonorepoProps } from './src/constructs/docker-monorepo';

export const context: DockerMonorepoProps = {
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
  },
  gitignore: ['.idea'],
  context,
});
project.synth();
