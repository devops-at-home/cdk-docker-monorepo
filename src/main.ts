import { App, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import {
  DockerMonorepo,
  DockerMonorepoProps,
} from './constructs/docker-monorepo';

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    const dockerMonorepoProps: DockerMonorepoProps = this.node.tryGetContext(
      'dockerMonorepoProps'
    );
    new DockerMonorepo(this, 'DockerMonorepo', dockerMonorepoProps);
  }
}

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new MyStack(app, 'docker-monorepo-stack', { env });

app.synth();
