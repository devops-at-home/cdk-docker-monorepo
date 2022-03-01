import { awscdk } from 'projen';
import { DockerMonorepoProps } from './src/constructs/docker-monorepo';

export const dockerMonorepoProps: DockerMonorepoProps = {
  ecrConfigs: [{ maxImageCount: 12, repositoryName: 'hello-kubernetes' }],
  githubOrg: 'devops-at-home',
  githubRepoName: 'docker-monorepo',
};

const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '2.14.0',
  defaultReleaseBranch: 'main',
  eslint: false,
  licensed: false,
  name: 'cdk-docker-monorepo',
  projenrcTs: true,
  github: false,
  gitignore: ['.idea'],
  context: { dockerMonorepoProps },
});

project.synth();
