import 'server-only';

import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { getEnvValue, hasEnvValue } from './env';

function getClient() {
  const accountId = getEnvValue('R2_ACCOUNT_ID', 'CLOUDFLARE_ACCOUNT_ID');
  const accessKeyId = getEnvValue('R2_ACCESS_KEY_ID', 'CLOUDFLARE_R2_ACCESS_KEY_ID');
  const secretAccessKey = getEnvValue('R2_SECRET_ACCESS_KEY', 'CLOUDFLARE_R2_SECRET_ACCESS_KEY');

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export function isR2Configured() {
  return (
    hasEnvValue('R2_ACCOUNT_ID', 'CLOUDFLARE_ACCOUNT_ID') &&
    hasEnvValue('R2_ACCESS_KEY_ID', 'CLOUDFLARE_R2_ACCESS_KEY_ID') &&
    hasEnvValue('R2_SECRET_ACCESS_KEY', 'CLOUDFLARE_R2_SECRET_ACCESS_KEY') &&
    hasEnvValue('R2_BUCKET', 'CLOUDFLARE_R2_BUCKET_NAME')
  );
}

export async function createAttachmentUploadUrl(filename: string, contentType: string) {
  return createScopedUploadUrl('attachments', filename, contentType);
}

export async function createAvatarUploadUrl(filename: string, contentType: string) {
  return createScopedUploadUrl('avatars', filename, contentType);
}

async function createScopedUploadUrl(scope: 'attachments' | 'avatars', filename: string, contentType: string) {
  const client = getClient();
  const bucket = getEnvValue('R2_BUCKET', 'CLOUDFLARE_R2_BUCKET_NAME');

  if (!client || !bucket) {
    return null;
  }

  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '-');
  const key = `${scope}/${Date.now()}-${safeName}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 60 * 5 });

  return {
    key,
    uploadUrl,
    publicUrl: getAttachmentPublicUrl(key),
  };
}

export function getAttachmentPublicUrl(key: string) {
  const publicBaseUrl = getEnvValue('R2_PUBLIC_BASE_URL', 'CLOUDFLARE_R2_PUBLIC_BASE_URL');

  return publicBaseUrl
    ? `${publicBaseUrl.replace(/\/$/, '')}/${key}`
    : null;
}

export async function deleteAttachmentObject(key: string) {
  const client = getClient();
  const bucket = getEnvValue('R2_BUCKET', 'CLOUDFLARE_R2_BUCKET_NAME');

  if (!client || !bucket) {
    return false;
  }

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );

  return true;
}
