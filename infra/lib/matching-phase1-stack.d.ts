import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
export type MatchingPhase1StackProps = StackProps & {
    webAclArn?: string;
};
export declare class MatchingPhase1Stack extends Stack {
    constructor(scope: Construct, id: string, props?: MatchingPhase1StackProps);
}
