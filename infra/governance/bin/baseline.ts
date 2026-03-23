#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { BaselineStack } from "../lib/baseline-stack";

const app = new cdk.App();

const makeBaseline = (id: string, account: string) =>
  new BaselineStack(app, id, {
    env: { account, region: "us-east-1" },
  });

makeBaseline("BaselineStack-Staging", process.env.STAGING_ACCOUNT_ID!);
makeBaseline("BaselineStack-Prod", process.env.PROD_ACCOUNT_ID!);
