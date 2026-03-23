import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export interface BaselineStackProps extends cdk.StackProps {}

/**
 * Baseline stack deployed to each workload account (staging, prod).
 * Sets up the GitHub Actions OIDC provider and deploy role.
 * Deployed by assuming OrganizationAccountAccessRole in each account.
 */
export class BaselineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BaselineStackProps) {
    super(scope, id, props);

    const provider = new iam.OpenIdConnectProvider(
      this,
      "GitHubOIDCProvider",
      {
        url: "https://token.actions.githubusercontent.com",
        clientIds: ["sts.amazonaws.com"],
      },
    );

    new iam.Role(this, "GitHubActionsRole", {
      roleName: "GitHubActionsRole",
      assumedBy: new iam.WebIdentityPrincipal(
        provider.openIdConnectProviderArn,
        {
          StringEquals: {
            "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          },
          StringLike: {
            "token.actions.githubusercontent.com:sub":
              "repo:chaiyilin/nextjs-dashboard:*",
          },
        },
      ),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("AdministratorAccess"),
      ],
    });
  }
}
