import { Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { DockerMonorepo } from '../src/constructs/docker-monorepo';
import { context } from '../.projenrc';

test('Snapshot', () => {
  const stack = new Stack();

  new DockerMonorepo(stack, 'DockerMonorepo', context);

  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});
