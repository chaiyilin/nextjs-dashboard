import * as cdk from "aws-cdk-lib";
import * as organizations from "aws-cdk-lib/aws-organizations";
import { Construct } from "constructs";

export interface OrganizationStackProps extends cdk.StackProps {}

export class OrganizationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: OrganizationStackProps) {
    super(scope, id, props);

    // Root OU ID is referenced via SSM or passed in; use the organization root
    const rootId = new cdk.CfnParameter(this, "OrganizationRootId", {
      type: "String",
      description: "The ID of the AWS Organizations root (r-xxxx)",
    });

    // --- Organizational Units ---
    const workloadsOu = new organizations.CfnOrganizationalUnit(
      this,
      "WorkloadsOU",
      {
        name: "WorkloadsOU",
        parentId: rootId.valueAsString,
      },
    );

    const makeAccount = (id: string, emailDescription: string) =>
      new organizations.CfnAccount(this, id, {
        accountName: id,
        email: new cdk.CfnParameter(this, `${id}Email`, {
          type: "String",
          description: emailDescription,
        }).valueAsString,
        parentIds: [workloadsOu.attrId],
      });

    makeAccount("StagingAccount", "Email address for the staging AWS account");
    makeAccount("ProdAccount", "Email address for the production AWS account");

  }
}
