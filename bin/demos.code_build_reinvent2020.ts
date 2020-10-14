#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { DemosCodeBuildReinvent2020Stack } from '../lib/demos.code_build_reinvent2020-stack';

const app = new cdk.App();
new DemosCodeBuildReinvent2020Stack(app, 'DemosCodeBuildReinvent2020Stack');
