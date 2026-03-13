import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

const GITHUB_ORG = "chaiyilin"; // TODO: set your GitHub org/username
const GITHUB_REPO = "nextjs-dashboard";

export class WebStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // --- Static assets bucket ---
    const assetsBucket = new s3.Bucket(this, "AssetsBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // --- Server Lambda (SSR) ---
    const serverFn = new lambda.Function(this, "ServerFn", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("../web/.open-next/server-function"),
      memorySize: 1024,
      timeout: cdk.Duration.seconds(30),
      environment: {
        DATABASE_URL: process.env.DATABASE_URL ?? "",
        POSTGRES_URL: process.env.POSTGRES_URL ?? "",
        PRISMA_DATABASE_URL: process.env.PRISMA_DATABASE_URL ?? "",
        AUTH_SECRET: process.env.AUTH_SECRET ?? "",
        NODE_ENV: "production",
        CACHE_BUCKET_NAME: assetsBucket.bucketName,
        CACHE_BUCKET_REGION: this.region,
      },
    });

    assetsBucket.grantReadWrite(serverFn);

    const serverFnUrl = serverFn.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    });

    // --- Image optimisation Lambda ---
    const imageFn = new lambda.Function(this, "ImageFn", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(
        "../web/.open-next/image-optimization-function",
      ),
      memorySize: 1536,
      timeout: cdk.Duration.seconds(25),
      environment: {
        BUCKET_NAME: assetsBucket.bucketName,
        BUCKET_KEY_PREFIX: "_assets",
      },
    });

    assetsBucket.grantRead(imageFn);

    const imageFnUrl = imageFn.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    });

    // --- CloudFront distribution ---
    const oac = new cloudfront.S3OriginAccessControl(this, "OAC");

    const distribution = new cloudfront.Distribution(this, "CDN", {
      defaultBehavior: {
        origin: new origins.FunctionUrlOrigin(serverFnUrl),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy:
          cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
      },
      additionalBehaviors: {
        "/_next/static/*": {
          origin: origins.S3BucketOrigin.withOriginAccessControl(assetsBucket, {
            originAccessControl: oac,
          }),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
        "/_next/image*": {
          origin: new origins.FunctionUrlOrigin(imageFnUrl),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          originRequestPolicy:
            cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        },
      },
    });

    // Upload pre-built static assets to S3
    new s3deploy.BucketDeployment(this, "AssetsDeployment", {
      sources: [s3deploy.Source.asset("../web/.open-next/assets")],
      destinationBucket: assetsBucket,
      distribution,
      distributionPaths: ["/_next/static/*"],
    });

    // --- GitHub Actions OIDC ---
    const provider = new iam.OpenIdConnectProvider(this, "GitHubOIDC", {
      url: "https://token.actions.githubusercontent.com",
      clientIds: ["sts.amazonaws.com"],
    });

    const deployRole = new iam.Role(this, "GitHubActionsRole", {
      assumedBy: new iam.WebIdentityPrincipal(
        provider.openIdConnectProviderArn,
        {
          StringEquals: {
            "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          },
          StringLike: {
            "token.actions.githubusercontent.com:sub": `repo:${GITHUB_ORG}/${GITHUB_REPO}:*`,
          },
        },
      ),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("AdministratorAccess"),
      ],
    });

    new cdk.CfnOutput(this, "SiteUrl", {
      value: `https://${distribution.distributionDomainName}`,
    });
    new cdk.CfnOutput(this, "GitHubActionsRoleArn", {
      value: deployRole.roleArn,
    });
  }
}
