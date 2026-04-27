#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { MatchingPhase1Stack } from '../lib/matching-phase1-stack';
import { MatchingWafStack } from '../lib/matching-waf-stack';

const app = new cdk.App();
const account = process.env.AWS_ACCOUNT_ID;
const region = process.env.AWS_REGION ?? 'ap-northeast-1';

const wafStack = new MatchingWafStack(app, 'MatchingWafStack', {
  env: {
    account,
    region: 'us-east-1',
  },
  crossRegionReferences: true,
});

new MatchingPhase1Stack(app, 'MatchingPhase1Stack', {
  env: {
    account,
    region,
  },
  crossRegionReferences: true,
  webAclArn: wafStack.webAclArn,
});

