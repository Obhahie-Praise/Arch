/**
 * Storage service — thin wrapper around UTApi.
 *
 * Application code should call these helpers rather than
 * constructing UTApi instances directly. This keeps the
 * UploadThing dependency isolated to one place.
 *
 * UTApi docs: https://docs.uploadthing.com/api-reference/ut-api
 */

import { UTApi } from "uploadthing/server";

/**
 * Result returned after a successful upload.
 */
export interface UploadResult {
  /** The UploadThing file key (e.g. "abc123_avatar.png"). */
  key: string;
  /** The public URL to access the file (e.g. "https://utfs.io/f/<key>"). */
  url: string;
  /** Original filename as provided by the client. */
  name: string;
  /** File size in bytes. */
  size: number;
}

/**
 * Build a UTApi instance scoped to this request.
 *
 * Cloudflare Workers do not expose global process.env, so the token
 * must be passed explicitly from the Worker env object.
 */
function buildUTApi(token: string): UTApi {
  return new UTApi({
    token,
    // Remove the `cache` property from fetch init — CF Workers don't support it.
    fetch: (url, init) => {
      if (init && "cache" in init) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (init as any).cache;
      }
      return fetch(url, init);
    },
  });
}

/**
 * Upload a file to UploadThing from the Worker.
 *
 * @param token  The UPLOADTHING_TOKEN from env.
 * @param file   A File / Blob with a `.name` property.
 * @returns      Upload result with key, url, name and size.
 * @throws       If the upload fails or UploadThing returns an error.
 */
export async function uploadFile(
  token: string,
  file: File
): Promise<UploadResult> {
  const utapi = buildUTApi(token);
  const response = await utapi.uploadFiles(file);

  if (response.error) {
    throw new Error(
      `UploadThing upload failed: ${response.error.message} (${response.error.code})`
    );
  }

  return {
    key: response.data.key,
    url: response.data.url,
    name: response.data.name,
    size: response.data.size,
  };
}

/**
 * Delete a file from UploadThing by its file key.
 *
 * @param token    The UPLOADTHING_TOKEN from env.
 * @param fileKey  The UploadThing file key to delete.
 */
export async function deleteFile(
  token: string,
  fileKey: string
): Promise<void> {
  const utapi = buildUTApi(token);
  await utapi.deleteFiles(fileKey);
}
