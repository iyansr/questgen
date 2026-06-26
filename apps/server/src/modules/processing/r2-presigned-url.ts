import { env } from '@questgen/env/server';
import { AwsClient } from 'aws4fetch';

import { getR2BucketName } from '@/shared/lib/ocr-mode';

export async function createR2PresignedGetUrl(
  fileKey: string,
  expiresInSeconds = 300,
): Promise<string> {
  const accountId = env.R2_ACCOUNT_ID;
  const accessKeyId = env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'R2 presign credentials missing (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)',
    );
  }

  const bucketName = getR2BucketName();
  const encodedKey = fileKey
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  const objectUrl = `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${encodedKey}?X-Amz-Expires=${expiresInSeconds}`;

  const client = new AwsClient({
    accessKeyId,
    secretAccessKey,
    service: 's3',
    region: 'auto',
  });

  const signed = await client.sign(new Request(objectUrl, { method: 'GET' }), {
    aws: { signQuery: true },
  });

  return signed.url.toString();
}
