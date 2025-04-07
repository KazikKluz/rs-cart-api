import * as cdk from 'aws-cdk-lib';
import * as gateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../.env') });

export class LambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const ID = 'backend-cart';

    const cartLambda = new NodejsFunction(this, `${ID}-lambda`, {
      runtime: Runtime.NODEJS_20_X,
      handler: 'lambda.handler',
      entry: path.join(__dirname, '../../dist/lambda.js'),
      depsLockFilePath: path.join(__dirname, '../../package-lock.json'),
      bundling: {
        forceDockerBundling: true,
        nodeModules: [
          '@nestjs/core',
          '@nestjs/typeorm',
          'typeorm',
          'pg',
          '@nestjs/jwt',
          '@nestjs/passport',
          'passport-http',
        ],
        sourceMap: true,
      },
      environment: {
        DB_HOST: process.env.DB_HOST || '',
        DB_PORT: process.env.DB_PORT || '5432',
        DB_USERNAME: process.env.DB_USERNAME || 'default',
        DB_PASSWORD: process.env.DB_PASSWORD || 'default',
        DB_NAME: process.env.DB_NAME || 'default',
      },
      timeout: cdk.Duration.seconds(60),
      memorySize: 512,
    });

    const myGateway = new gateway.RestApi(this, 'Cart', {
      restApiName: 'Cart Service',
      defaultCorsPreflightOptions: {
        allowOrigins: ['https://d1rd20mvfwcq69.cloudfront.net'],
        allowMethods: gateway.Cors.ALL_METHODS,
        allowHeaders: [
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
          'Content-Type',
        ],
        allowCredentials: true,
      },
    });

    const cartIntegration = new gateway.LambdaIntegration(cartLambda);

    myGateway.root.addMethod('GET', cartIntegration);

    const resource = myGateway.root.addResource('api');
    const authResource = resource.addResource('auth');
    const loginResource = authResource.addResource('login');
    loginResource.addMethod('POST', cartIntegration);
    const registerResource = authResource.addResource('register');
    registerResource.addMethod('POST', cartIntegration);
    const profileResource = resource.addResource('profile');
    profileResource.addMethod('GET', cartIntegration);
    const cartResource = profileResource.addResource('cart');
    cartResource.addMethod('GET', cartIntegration);
    cartResource.addMethod('PUT', cartIntegration);
    cartResource.addMethod('DELETE', cartIntegration);
    const orderResource = cartResource.addResource('order');
    orderResource.addMethod('PUT', cartIntegration);
    orderResource.addMethod('GET', cartIntegration);
    const ordersResource = resource.addResource('orders');

    ordersResource.addMethod('GET', cartIntegration);
    ordersResource.addMethod('POST', cartIntegration);

    const orderIdResource = ordersResource.addResource('{id}');
    orderIdResource.addMethod('GET', cartIntegration);
    const historyResource = orderIdResource.addResource('history');
    historyResource.addMethod('GET', cartIntegration);
    const orderStatusResource = orderIdResource.addResource('status');
    orderStatusResource.addMethod('PUT', cartIntegration);

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
