/**
 * UploadThing FileRouter for Arch.
 *
 * Defines the permitted file types, sizes, and counts for each
 * upload route. Middleware runs server-side and can reject
 * unauthenticated requests before any file is accepted.
 *
 * Docs: https://docs.uploadthing.com/file-routes
 * CF Workers integration: https://docs.uploadthing.com/backend-adapters/fetch#cloudflare-workers
 */

import { createUploadthing, type FileRouter } from "uploadthing/server";
import { createAuth, type Env } from "../auth";

const f = createUploadthing();

/**
 * Build the file router with access to the Worker env.
 *
 * The router must be constructed per-request in a CF Worker because
 * the env (including UPLOADTHING_TOKEN) is not available at module
 * initialisation time.
 */
export function buildFileRouter(env: Env): FileRouter {
  return {
    /**
     * Profile avatar uploads.
     * Accepts images up to 5 MB.
     */
    profileAvatar: f({
      image: {
        maxFileSize: "4MB",
        maxFileCount: 1,
      },
    })
      .middleware(async ({ req }) => {
        const auth = createAuth(env);
        const session = await auth.api.getSession({ headers: req.headers });

        if (!session?.user) {
          throw new Error("Unauthorised");
        }

        return { userId: session.user.id };
      })
      .onUploadComplete(({ metadata, file }) => {
        // The profile route's POST /upload handler stores the URL in D1
        // directly after calling UTApi.uploadFiles(), so this callback
        // is intentionally minimal.
        return { userId: metadata.userId, url: file.url };
      }),

    /**
     * Profile resume / CV uploads.
     * Accepts PDF or Word documents up to 10 MB.
     */
    profileResume: f({
      "application/pdf": { maxFileSize: "8MB", maxFileCount: 1 },
      "application/msword": { maxFileSize: "8MB", maxFileCount: 1 },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        { maxFileSize: "8MB", maxFileCount: 1 },
    })
      .middleware(async ({ req }) => {
        const auth = createAuth(env);
        const session = await auth.api.getSession({ headers: req.headers });

        if (!session?.user) {
          throw new Error("Unauthorised");
        }

        return { userId: session.user.id };
      })
      .onUploadComplete(({ metadata, file }) => {
        return { userId: metadata.userId, url: file.url };
      }),
  } satisfies FileRouter;
}

export type ArchFileRouter = ReturnType<typeof buildFileRouter>;
