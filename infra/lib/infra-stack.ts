import * as cdk from 'aws-cdk-lib';
import * as gateway from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import { Runtime } from 'aws-cdk-lib/aws-lambda';

export class LambdaStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const ID = 'backend-cart';

    const cartLambda = new NodejsFunction(this, `${ID}-lambda`, {
      runtime: Runtime.NODEJS_20_X,
      handler: 'index.handler',
      entry: path.join(__dirname, '../../src/lambda/index.ts'),
      depsLockFilePath: path.join(__dirname, '../../package-lock.json'),
      bundling: {
        forceDockerBundling: true,
        externalModules: [
          'aws-sdk',
          'class-validator',
          'class-transformer',
          'cache-manager',
          '@nestjs/websockets/socket-module',
          '@nestjs/microservices/microservices-module',
          '@nestjs/microservices',
          '@nestjs/websockets',
        ],
      },
      environment: {
        DB_HOST: process.env.DB_HOST || '',
        DB_PORT: process.env.DB_PORT || '5432',
        DB_USERNAME: process.env.DB_USERNAME || 'default',
        DB_PASSWORD: process.env.DB_PASSWORD || 'default',
        DB_NAME: process.env.DB_NAME || 'default',
      },
    });

    const myGateway = new gateway.RestApi(this, 'Imports', {
      restApiName: 'Import Service',
      defaultCorsPreflightOptions: {
        allowOrigins: gateway.Cors.ALL_ORIGINS,
        allowMethods: gateway.Cors.ALL_METHODS,
        allowHeaders: [
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
          'Content-Type',
        ],
      },
    });

    const cartIntegration = new gateway.LambdaIntegration(cartLambda);

    myGateway.root.addMethod('GET', cartIntegration);

    const resource = myGateway.root.addResource('api');

    new cdk.CfnOutput(this, `${ID}-lambda-output`, {
      value: cartLambda.addFunctionUrl({
        authType: cdk.aws_lambda.FunctionUrlAuthType.NONE,
      }).url,
    });

    new cdk.CfnOutput(this, `${ID}-gateway`, {
      value: myGateway.url,
    });
  }
}
