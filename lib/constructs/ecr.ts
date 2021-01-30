import * as cdk from "@aws-cdk/core";
import * as ecr from "@aws-cdk/aws-ecr";
import * as iam from "@aws-cdk/aws-iam";

export class ECR extends cdk.Construct {
  public repos: { [key: string]: ecr.Repository } = {};
  private dockerRole: iam.IRole;
  constructor(
    scope: cdk.Construct,
    id: string,
    nameArray: string[],
    dockerRole: iam.IRole
  ) {
    super(scope, id);

    this.dockerRole = dockerRole;

    for (let idx in nameArray) {
      this.__createRepo(nameArray[idx]);
    }
  }
  private __createRepo = (name: string) => {
    this.repos[name] = new ecr.Repository(this, `EcrRepo-${name}`, {
      repositoryName: name,
      imageScanOnPush: true,
      lifecycleRules: [{ maxImageCount: 5 }],
    });
    this.repos[name].grantPullPush(this.dockerRole);
  };
}
