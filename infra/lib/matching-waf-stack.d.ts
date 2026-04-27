import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
export declare class MatchingWafStack extends Stack {
    readonly webAclArn: string;
    constructor(scope: Construct, id: string, props?: StackProps);
}
