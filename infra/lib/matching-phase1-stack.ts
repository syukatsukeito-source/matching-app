import * as path from 'path';
import { RemovalPolicy, Stack, StackProps, CfnOutput, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';

export class MatchingPhase1Stack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const userPool = new cognito.UserPool(this, 'UserPool', {
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      preventUserExistenceErrors: true,
    });

    const photoBucket = new s3.Bucket(this, 'ProfilePhotoBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const ensureMeFunction = new lambda.Function(this, 'EnsureMeFunction', {
      runtime: lambda.Runtime.PROVIDED_AL2023,
      architecture: lambda.Architecture.ARM_64,
      handler: 'bootstrap',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/dist/ensure-me')),
      environment: {
        USERS_TABLE_NAME: usersTable.tableName,
      },
    });

    usersTable.grantReadWriteData(ensureMeFunction);

    // 読み取り専用Lambda: Query.me 用
    const getMeFunction = new lambda.Function(this, 'GetMeFunction', {
      runtime: lambda.Runtime.PROVIDED_AL2023,
      architecture: lambda.Architecture.ARM_64,
      handler: 'bootstrap',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/dist/get-me')),
      environment: {
        USERS_TABLE_NAME: usersTable.tableName,
      },
    });

    usersTable.grantReadData(getMeFunction); // 読み取り権限のみ

    // プロフィール更新Lambda
    const updateProfileFunction = new lambda.Function(this, 'UpdateProfileFunction', {
      runtime: lambda.Runtime.PROVIDED_AL2023,
      architecture: lambda.Architecture.ARM_64,
      handler: 'bootstrap',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/dist/update-profile')),
      environment: {
        USERS_TABLE_NAME: usersTable.tableName,
      },
    });

    usersTable.grantReadWriteData(updateProfileFunction);

    const api = new appsync.GraphqlApi(this, 'GraphqlApi', {
      name: 'matching-phase1-api',
      definition: appsync.Definition.fromFile(path.join(__dirname, '../../api/schema.graphql')),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.USER_POOL,
          userPoolConfig: { userPool }, // ← 身分証確認（Cognito）
        },
      },
      xrayEnabled: true,
    });

    // Mutation.ensureMe → 書き込み用Lambda
    const ensureMeDataSource = api.addLambdaDataSource('EnsureMeDataSource', ensureMeFunction);
    ensureMeDataSource.createResolver('EnsureMeResolver', {
      typeName: 'Mutation',
      fieldName: 'ensureMe',
    });

    // Query.me → 読み取り専用Lambda
    const getMeDataSource = api.addLambdaDataSource('GetMeDataSource', getMeFunction);
    getMeDataSource.createResolver('MeResolver', {
      typeName: 'Query',
      fieldName: 'me',
    });

    // Mutation.updateMyProfile → プロフィール更新Lambda
    const updateProfileDataSource = api.addLambdaDataSource('UpdateProfileDataSource', updateProfileFunction);
    updateProfileDataSource.createResolver('UpdateMyProfileResolver', {
      typeName: 'Mutation',
      fieldName: 'updateMyProfile',
    });

    // Frontend hosting with S3 + CloudFront
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      }),
      publicReadAccess: true,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: '404.html',
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(websiteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: Duration.minutes(5),
        },
      ],
    });

    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../../apps/web/out'))],
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    new CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId });
    new CfnOutput(this, 'UserPoolClientId', { value: userPoolClient.userPoolClientId });
    new CfnOutput(this, 'GraphqlUrl', { value: api.graphqlUrl });
    new CfnOutput(this, 'GraphqlApiId', { value: api.apiId });
    new CfnOutput(this, 'UsersTableName', { value: usersTable.tableName });
    new CfnOutput(this, 'PhotoBucketName', { value: photoBucket.bucketName });
    new CfnOutput(this, 'WebsiteUrl', { value: `https://${distribution.distributionDomainName}` });
    new CfnOutput(this, 'WebsiteBucketName', { value: websiteBucket.bucketName });
  }
}
