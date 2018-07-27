import { getType } from 'mime';
import { streamS3Object } from './S3Client';
import { isSupportedInputMime, createPipe } from './pipes';
import { getTransformer } from './Sharp';

export const handle = (
  event: any,
  context: any,
  cb: (err: any | null, response?: any) => void
) => {
  if (event.pathParameters == null || event.pathParameters.proxy == null) {
    return cb(null, { statusCode: 400 });
  }

  const key = event.pathParameters.proxy as string;
  const bucket = process.env.BUCKET!;
  const inputStream = streamS3Object(key, bucket, cb);
  const inputMime = getType(key);

  inputStream.once('readable', async () => {
    if (!isSupportedInputMime(inputMime)) {
      console.error(`Unsupported image ${key}`);
      return cb(null, { statusCode: 500 });
    }

    if (inputMime === 'image/svg+xml' && !event.queryStringParameters) {
      let body = '';
      await inputStream.on('data', data => {
        body = data.toString();
      });
      const response = {
        statusCode: 200,
        headers: { 'Content-Type': inputMime },
        body: body,
        isBase64Encoded: false
      };
      return cb(null, response);
    }

    const { transformer, mime } = createPipe(
      event.queryStringParameters || {},
      inputMime,
      getTransformer()
    );

    try {
      const image = await inputStream.pipe(transformer).toBuffer();

      const response = {
        statusCode: 200,
        headers: { 'Content-Type': mime },
        body: image.toString('base64'),
        isBase64Encoded: true
      };

      cb(null, response);
    } catch (e) {
      console.error(`Exception while transforming ${key}`);
      console.error(e);
      cb(null, { statusCode: 500 });
    }
  });
};
