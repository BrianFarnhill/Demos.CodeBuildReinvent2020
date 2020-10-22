import * as cdk from '@aws-cdk/core';
import * as codebuild from '@aws-cdk/aws-codebuild';
import * as stepfunctions from '@aws-cdk/aws-stepfunctions';
import * as tasks from '@aws-cdk/aws-stepfunctions-tasks';
import * as iam from '@aws-cdk/aws-iam';

interface RawBuildTask {
    Parameters: {
        [key: string]: string
    }
}

export default function(construct: cdk.Construct, project: codebuild.Project) {

    const endTask = new stepfunctions.Pass(construct, "Skip Build");

    const buildTask = new tasks.CodeBuildStartBuild(construct, "RunBuildTemplate", {
        project,
        resultPath: "$.BuildResult",
        integrationPattern: stepfunctions.IntegrationPattern.RUN_JOB
    });
    

    const rawBuildTask = buildTask.toStateJson() as RawBuildTask;
    rawBuildTask.Parameters["SourceVersion.$"] = "States.Format('{}^\\{{}\\}', $.detail.referenceFullName, $.detail.commitId)";
    
    const buildTaskWithSource = new stepfunctions.CustomState(construct, "CI Build", {
        stateJson: rawBuildTask
    });    

    const checkBranch = new stepfunctions.Choice(construct, "CheckBranch", {})
        .when(stepfunctions.Condition.stringMatches('$.detail.referenceName', 'feature-*'), buildTaskWithSource)
        .otherwise(endTask);

    const definition = checkBranch;

    const sm = new stepfunctions.StateMachine(construct, "CiBuild", {
        definition
    });

    sm.addToRolePolicy(new iam.PolicyStatement({
        actions: [
            "codebuild:BatchGetBuilds",
            "codebuild:BatchGetReports",
            "codebuild:StartBuild",
            "codebuild:StopBuild",
        ],
        resources: [
            project.projectArn
        ]
    }))

    sm.addToRolePolicy(new iam.PolicyStatement({
        actions: [
            "events:DescribeRule",
            "events:PutRule",
            "events:PutTargets",
        ],
        resources: [
            `arn:${cdk.Aws.PARTITION}:events:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:rule/StepFunctionsGetEventForCodeBuildStartBuildRule`
        ]
    }))

    return sm;
}
