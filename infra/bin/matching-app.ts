#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { MatchingPhase1Stack } from '../lib/matching-phase1-stack';

const app = new cdk.App();

new MatchingPhase1Stack(app, 'MatchingPhase1Stack', {
  env: {
    account: process.env.AWS_ACCOUNT_ID,
    region: process.env.AWS_REGION ?? 'ap-northeast-1',
  },
});


