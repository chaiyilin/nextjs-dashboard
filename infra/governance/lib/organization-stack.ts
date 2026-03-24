import * as cdk from "aws-cdk-lib";
import * as organizations from "aws-cdk-lib/aws-organizations";
import * as cr from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";

export interface OrganizationStackProps extends cdk.StackProps {}

export class OrganizationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: OrganizationStackProps) {
    super(scope, id, props);

    // Dynamically fetch the organization root ID via the Organizations API
    const listRoots = new cr.AwsCustomResource(this, "ListRoots", {
      onCreate: {
        service: "Organizations",
        action: "listRoots",
        parameters: {},
        physicalResourceId: cr.PhysicalResourceId.of("ListRoots"),
      },
      onUpdate: {
        service: "Organizations",
        action: "listRoots",
        parameters: {},
        physicalResourceId: cr.PhysicalResourceId.of("ListRoots"),
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
    });

    const rootId = listRoots.getResponseField("Roots.0.Id");

    // --- Organizational Units ---
    const dashboardOu = new organizations.CfnOrganizationalUnit(
      this,
      "dashboard",
      {
        name: "dashboard",
        parentId: rootId,
      },
    );

    const makeAccount = (id: string, emailDescription: string) =>
      new organizations.CfnAccount(this, id, {
        accountName: id,
        email: new cdk.CfnParameter(this, `${id}Email`, {
          type: "String",
          description: emailDescription,
        }).valueAsString,
        parentIds: [dashboardOu.attrId],
      });

    makeAccount("Staging", "Email address for the staging AWS account");
    makeAccount("Prod", "Email address for the production AWS account");
  }
}
