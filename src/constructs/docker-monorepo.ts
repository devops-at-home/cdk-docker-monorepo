import { Tags, RemovalPolicy, Aws } from 'aws-cdk-lib';
import {
  Repository,
  RepositoryEncryption,
  TagMutability,
} from 'aws-cdk-lib/aws-ecr';
import { IRole, PolicyDocument, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

import { GitHubActionsOidcProvider } from './gh-aws-oidc-connect-provider';
import { GitHubActionsRole } from './gh-aws-oidc-connect-role';

export type DockerMonorepoProps = {
  githubOrg: string;
  githubRepoName: string;
  ecrConfigs: ECRconfig[];
};

type ECRconfig = {
  repositoryName: string;
  maxImageCount: number;
};

export class DockerMonorepo extends Construct {
  public repos: Repository[];
  public role: IRole;
  constructor(scope: Construct, id: string, props: DockerMonorepoProps) {
    super(scope, id);

    const { githubOrg, githubRepoName, ecrConfigs } = props;
    const repository = `${githubOrg}/${githubRepoName}`;
    const { REGION, ACCOUNT_ID } = Aws;
    this.repos = [];

    // Configure OIDC and create the role
    this.role = new GitHubActionsRole(this, 'GitHubActionsRole', {
      provider: GitHubActionsOidcProvider.forAccount(),
      repository,
      inlinePolicies: {
        ecr: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ['ecr:GetAuthorizationToken'],
              resources: ['*'],
            }),
            new PolicyStatement({
              actions: [
                'ecr:ListImages',
                'ecr:BatchCheckLayerAvailability',
                'ecr:CompleteLayerUpload',
                'ecr:InitiateLayerUpload',
                'ecr:PutImage',
                'ecr:UploadLayerPart',
              ],
              resources: [`arn:aws:ecr:${REGION}:${ACCOUNT_ID}:repository/*`],
              conditions: {
                StringEquals: {
                  'aws:ResourceTag/githubRepo': repository,
                },
              },
            }),
          ],
        }),
      },
    });

    // Create repos with tags
    for (let config of ecrConfigs) {
      const { repositoryName, maxImageCount } = config;
      const repo = new Repository(this, `Repository-${repositoryName}`, {
        encryption: RepositoryEncryption.AES_256,
        imageScanOnPush: true,
        imageTagMutability: TagMutability.IMMUTABLE,
        repositoryName,
        removalPolicy: RemovalPolicy.DESTROY,
        lifecycleRules: [
          {
            maxImageCount,
          },
        ],
      });
      Tags.of(repo).add('githubRepo', repository);
      this.repos.push(repo);
    }
  }
}
