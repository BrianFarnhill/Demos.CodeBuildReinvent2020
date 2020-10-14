import * as cdk from '@aws-cdk/core';
import * as codebuild from '@aws-cdk/aws-codebuild';
import * as stepfunctions from '@aws-cdk/aws-stepfunctions';
import * as tasks from '@aws-cdk/aws-stepfunctions-tasks';

export default function(construct: cdk.Construct, project: codebuild.Project) {

    const buildTask = new tasks.CodeBuildStartBuild(construct, "RunBuild", {
        project,
        resultPath: "$.BuildResult",
        integrationPattern: stepfunctions.IntegrationPattern.RUN_JOB
    })

    const endState = new stepfunctions.Succeed(construct, "Finished");

    const notifyOfFailure = new stepfunctions.Wait(construct, "DemoWait", {
        time: stepfunctions.WaitTime.duration(cdk.Duration.seconds(5))
    })

    const checkBuildSuccess = new stepfunctions.Choice(construct, "CheckBuildSuccess", {
        inputPath: "$.BuildResult.Build.BuildStatus"
    })
        .when(stepfunctions.Condition.stringEquals('$', 'SUCCEEDED'), endState)
        .otherwise(notifyOfFailure.next(endState));

    const definition = buildTask.next(checkBuildSuccess);

    new stepfunctions.StateMachine(construct, "CiBuild", {
        definition
    });
}
