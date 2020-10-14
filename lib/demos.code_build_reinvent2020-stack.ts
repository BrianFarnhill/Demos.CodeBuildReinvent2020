import * as cdk from '@aws-cdk/core';
import * as codebuild from '@aws-cdk/aws-codebuild';
import * as codecommit from '@aws-cdk/aws-codecommit';
import * as s3assets from '@aws-cdk/aws-s3-assets';
import ciBuild from './cibuild';

export class DemosCodeBuildReinvent2020Stack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

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
        computeType: codebuild.ComputeType.MEDIUM  
      },
      source: codebuild.Source.codeCommit({ repository: repo })
    });

    ciBuild(this, buildProject);
  }
}
