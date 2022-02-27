import { Construct } from 'constructs';
import { Aws } from 'aws-cdk-lib';
import { CfnOIDCProvider } from 'aws-cdk-lib/aws-iam';

// FROM: https://github.com/askulkarni2/cdk-gh-aws-oidc-connect/blob/main/src/provider.ts
/**
 * Represents a GitHub OIDC provider.
 */
export interface IGitHubActionsOidcProvider {
  /**
   * The ARN of the OIDC provider.
   */
  readonly providerArn: string;
}

/**
 * Defines an OIDC provider for GitHub workflows.
 *
 * Please note that only a single instance of this provider can be installed in
 * an AWS account.
 */
export class GitHubActionsOidcProvider
  extends Construct
  implements IGitHubActionsOidcProvider
{
  /**
   * The OIDC domain for GitHub.
   */
  public static readonly DOMAIN = 'token.actions.githubusercontent.com';

  /**
   * The OIDC domain thumbprint for GitHub.
   */
  public static readonly THUMBPRINT =
    '6938fd4d98bab03faadb97b34396831e3780aea1';

  /**
   * @param account The AWS account for which you want to obtain the OIDC
   * provider. If not specified, we will use the current account.
   *
   * @returns The singleton GitHub OIDC provider for an account.
   */
  public static forAccount(account?: string): IGitHubActionsOidcProvider {
    return {
      providerArn: arnForAccount(account),
    };
  }

  /**
   * The ARN of the OIDC provider.
   */
  public readonly providerArn: string;

  constructor(scope: Construct, id: string, clientIdList: string[]) {
    super(scope, id);

    const provider = new CfnOIDCProvider(scope, `${id}.GithubOidcProvider`, {
      url: `https://${GitHubActionsOidcProvider.DOMAIN}`,
      thumbprintList: [GitHubActionsOidcProvider.THUMBPRINT],
      clientIdList,
    });

    this.providerArn = provider.attrArn;
  }
}

function arnForAccount(account?: string): string {
  account = account ?? Aws.ACCOUNT_ID;
  return `arn:aws:iam::${account}:oidc-provider/${GitHubActionsOidcProvider.DOMAIN}`;
}
