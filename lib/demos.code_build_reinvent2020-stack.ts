import * as cdk from '@aws-cdk/core';
import * as codebuild from '@aws-cdk/aws-codebuild';
import * as codecommit from '@aws-cdk/aws-codecommit';
import * as s3assets from '@aws-cdk/aws-s3-assets';
import * as iam from '@aws-cdk/aws-iam';
import * as targets from '@aws-cdk/aws-events-targets';
import * as chatbot from '@aws-cdk/aws-chatbot';
import * as notifications from '@aws-cdk/aws-codestarnotifications';
import dotenv = require("dotenv");
import ciBuild from './cibuild';

export class DemosCodeBuildReinvent2020Stack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    dotenv.config();

    const demoCode = new s3assets.Asset(this, "DemoCode", {
      path: 'demorepo'
    })

    const repo = new codecommit.Repository(this, "DemoRepo", {
      repositoryName: 'reInvent2020CodeBuildDemo',
      description: 'A demo repo that is used to demonstrate new features of CodeBuild'
    });

    const rawRepo = repo.node.defaultChild as codecommit.CfnRepository;
    rawRepo.code = { s3: { bucket: demoCode.s3BucketName, key: demoCode.s3ObjectKey } };

    const buildProject = new codebuild.Project(this, "DemoBuild", {
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_4_0,
        computeType: codebuild.ComputeType.MEDIUM,
      },
      source: codebuild.Source.codeCommit({ repository: repo }),
    });

    buildProject.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        "ssmmessages:CreateControlChannel",
        "ssmmessages:CreateDataChannel",
        "ssmmessages:OpenControlChannel",
        "ssmmessages:OpenDataChannel"
      ],
      effect: iam.Effect.ALLOW,
      resources: ["*"]
    }));

    const sm = ciBuild(this, buildProject);

    repo.onCommit("OnCommit", {
      target: new targets.SfnStateMachine(sm)
    });

    if (process.env.SLACK_ARN !== undefined) {

      new notifications.CfnNotificationRule(this, "FailedCIBuildNotifications", {
        name: "FailedDemoBuilds",
        resource: buildProject.projectArn,
        detailType: 'FULL',
        eventTypeIds: ['codebuild-project-build-state-failed'],
        targets: [{
          targetAddress: process.env.SLACK_ARN,
          targetType: 'AWSChatbotSlack'
        }],
      });
      
    } else if (process.env.SLACK_WORKSPACE_ID !== undefined && process.env.SLACK_CHANNEL_ID) {
      
      const chatChannel = new chatbot.SlackChannelConfiguration(this, "SlackNotifications", {
        slackChannelConfigurationName: 'DemoBuildNotifications',
        slackChannelId: process.env.SLACK_CHANNEL_ID,
        slackWorkspaceId: process.env.SLACK_WORKSPACE_ID
      });

      new notifications.CfnNotificationRule(this, "BuildFailNotifications", {
        name: "FailedDemoBuilds",
        resource: buildProject.projectArn,
        detailType: 'FULL',
        eventTypeIds: ['codebuild-project-build-state-failed'],
        targets: [{
          targetAddress: chatChannel.slackChannelConfigurationArn,
          targetType: 'AWSChatbotSlack'
        }],
      });
    }
  }
}
