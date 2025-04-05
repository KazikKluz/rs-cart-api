import { Handler, Context, Callback } from 'aws-lambda';
import bootstrap from './controller';

export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  const server = await bootstrap();
  return server(event, context, callback);
};
