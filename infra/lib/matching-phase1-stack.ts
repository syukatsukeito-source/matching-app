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
import * as scheduler from 'aws-cdk-lib/aws-scheduler';
import * as iam from 'aws-cdk-lib/aws-iam';

export type MatchingPhase1StackProps = StackProps & {
  webAclArn?: string;
};

export class MatchingPhase1Stack extends Stack {
  constructor(scope: Construct, id: string, props?: MatchingPhase1StackProps) {
    super(scope, id, props);

    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const reactionsTable = new dynamodb.Table(this, 'ReactionsTable', {
      partitionKey: { name: 'fromUserId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'toUserId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Badges table
    const badgesTable = new dynamodb.Table(this, 'BadgesTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'badgeType', type: dynamodb.AttributeType.STRING },
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

    const photoDistribution = new cloudfront.Distribution(this, 'PhotoDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(photoBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      webAclId: props?.webAclArn,
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

    // 詳細プロフィール取得Lambda: Query.myProfile 用
    const myProfileFunction = new lambda.Function(this, 'MyProfileFunction', {
      runtime: lambda.Runtime.PROVIDED_AL2023,
      architecture: lambda.Architecture.ARM_64,
      handler: 'bootstrap',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/dist/my-profile')),
      environment: {
        USERS_TABLE_NAME: usersTable.tableName,
      },
    });

    usersTable.grantReadData(myProfileFunction); // 読み取り権限のみ

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

    // Query.myProfile → 詳細プロフィール取得Lambda
    const myProfileDataSource = api.addLambdaDataSource('MyProfileDataSource', myProfileFunction);
    myProfileDataSource.createResolver('MyProfileResolver', {
      typeName: 'Query',
      fieldName: 'myProfile',
    });

    // Mutation.updateMyProfile → プロフィール更新Lambda
    const updateProfileDataSource = api.addLambdaDataSource('UpdateProfileDataSource', updateProfileFunction);
    updateProfileDataSource.createResolver('UpdateMyProfileResolver', {
      typeName: 'Mutation',
      fieldName: 'updateMyProfile',
    });

    // Query.listPotentialMatches → マッチング候補取得Lambda
    const listPotentialMatchesFunction = new lambda.Function(this, 'ListPotentialMatchesFunction', {
      runtime: lambda.Runtime.PROVIDED_AL2023,
      architecture: lambda.Architecture.ARM_64,
      handler: 'bootstrap',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/dist/list-potential-matches')),
      environment: {
        USERS_TABLE_NAME: usersTable.tableName,
      },
    });
    usersTable.grantReadData(listPotentialMatchesFunction);

    const listMatchesDataSource = api.addLambdaDataSource('ListMatchesDataSource', listPotentialMatchesFunction);
    listMatchesDataSource.createResolver('ListPotentialMatchesResolver', {
      typeName: 'Query',
      fieldName: 'listPotentialMatches',
    });

    // Mutation.updateLocation → 位置情報更新Lambda
    const updateLocationFunction = new lambda.Function(this, 'UpdateLocationFunction', {
      runtime: lambda.Runtime.PROVIDED_AL2023,
      architecture: lambda.Architecture.ARM_64,
      handler: 'bootstrap',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/dist/update-location')),
      environment: {
        USERS_TABLE_NAME: usersTable.tableName,
      },
    });
    usersTable.grantReadWriteData(updateLocationFunction);

    const updateLocationDataSource = api.addLambdaDataSource('UpdateLocationDataSource', updateLocationFunction);
    updateLocationDataSource.createResolver('UpdateLocationResolver', {
      typeName: 'Mutation',
      fieldName: 'updateLocation',
    });

    // Mutation.getUploadUrl → S3 presigned URL生成Lambda
    const getUploadUrlFunction = new lambda.Function(this, 'GetUploadUrlFunction', {
      runtime: lambda.Runtime.PROVIDED_AL2023,
      architecture: lambda.Architecture.ARM_64,
      handler: 'bootstrap',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/dist/get-upload-url')),
      environment: {
        PHOTO_BUCKET_NAME: photoBucket.bucketName,
        CDN_URL: `https://${photoDistribution.distributionDomainName}`,
      },
    });
    photoBucket.grantPut(getUploadUrlFunction);

    const getUploadUrlDataSource = api.addLambdaDataSource('GetUploadUrlDataSource', getUploadUrlFunction);
    getUploadUrlDataSource.createResolver('GetUploadUrlResolver', {
      typeName: 'Mutation',
      fieldName: 'getUploadUrl',
    });

    const reactToUserFunction = new lambda.Function(this, 'ReactToUserFunction', {
      runtime: lambda.Runtime.PROVIDED_AL2023,
      architecture: lambda.Architecture.ARM_64,
      handler: 'bootstrap',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/dist/react-to-user')),
      environment: {
        REACTIONS_TABLE_NAME: reactionsTable.tableName,
      },
    });
    reactionsTable.grantReadWriteData(reactToUserFunction);

    const reactToUserDataSource = api.addLambdaDataSource('ReactToUserDataSource', reactToUserFunction);
    reactToUserDataSource.createResolver('ReactToUserResolver', {
      typeName: 'Mutation',
      fieldName: 'reactToUser',
    });

    // Badge grant Lambda (EventBridge Scheduler用)
    const grantBadgesFunction = new lambda.Function(this, 'GrantBadgesFunction', {
      runtime: lambda.Runtime.PROVIDED_AL2023,
      architecture: lambda.Architecture.ARM_64,
      handler: 'bootstrap',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/dist/grant-badges')),
      environment: {
        USERS_TABLE_NAME: usersTable.tableName,
        BADGES_TABLE_NAME: badgesTable.tableName,
      },
      timeout: Duration.minutes(5),
    });
    usersTable.grantReadData(grantBadgesFunction);
    badgesTable.grantWriteData(grantBadgesFunction);

    // EventBridge Scheduler: 毎日午前0時にバッジ付与
    const schedulerRole = new iam.Role(this, 'SchedulerRole', {
      assumedBy: new iam.ServicePrincipal('scheduler.amazonaws.com'),
    });
    grantBadgesFunction.grantInvoke(schedulerRole);

    new scheduler.CfnSchedule(this, 'DailyBadgeSchedule', {
      flexibleTimeWindow: { mode: 'OFF' },
      scheduleExpression: 'cron(0 0 * * ? *)', // 毎日午前0時 UTC
      target: {
        arn: grantBadgesFunction.functionArn,
        roleArn: schedulerRole.roleArn,
      },
    });

    new CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId });
    new CfnOutput(this, 'UserPoolClientId', { value: userPoolClient.userPoolClientId });
    new CfnOutput(this, 'GraphqlUrl', { value: api.graphqlUrl });
    new CfnOutput(this, 'GraphqlApiId', { value: api.apiId });
    new CfnOutput(this, 'UsersTableName', { value: usersTable.tableName });
    new CfnOutput(this, 'ReactionsTableName', { value: reactionsTable.tableName });
    new CfnOutput(this, 'BadgesTableName', { value: badgesTable.tableName });
    new CfnOutput(this, 'PhotoBucketName', { value: photoBucket.bucketName });
    new CfnOutput(this, 'PhotoCdnUrl', { value: `https://${photoDistribution.distributionDomainName}` });
    new CfnOutput(this, 'WebAclArn', { value: props?.webAclArn ?? 'not-configured' });
    new CfnOutput(this, 'FrontendHostingHint', {
      value: 'Deploy apps/web on Amplify Hosting WEB_COMPUTE and associate WebAclArn with the Amplify app.',
    });
  }
}
