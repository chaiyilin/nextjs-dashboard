#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { OrganizationStack } from "../lib/organization-stack";

const app = new cdk.App();

new OrganizationStack(app, "OrganizationStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: "us-east-1",
  },
});
