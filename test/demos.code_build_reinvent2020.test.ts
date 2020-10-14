import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as DemosCodeBuildReinvent2020 from '../lib/demos.code_build_reinvent2020-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new DemosCodeBuildReinvent2020.DemosCodeBuildReinvent2020Stack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
