import { randomUUID } from "node:crypto";
import { mkdir, open, rename, rm } from "node:fs/promises";
import path from "node:path";
import multer, { type MulterError } from "multer";

export const MAX_ADMIN_IMAGE_COUNT = 8;
export const MAX_ADMIN_IMAGE_BYTES = 12 * 1024 * 1024;

const supportedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const configuredUploadDirectory = process.env["LINKUPS_UPLOAD_DIR"]?.trim();
const defaultUploadDirectory =
  process.env["NODE_ENV"] === "production" ? "uploads" : ".linkups-uploads";

export const linkupsUploadDirectory = path.resolve(
  process.cwd(),
  configuredUploadDirectory || defaultUploadDirectory,
);
const stagingDirectory = path.join(linkupsUploadDirectory, ".staging");

export class UnsupportedImageTypeError extends Error {
  constructor() {
    super("Upload a JPEG, PNG, or WebP image.");
    this.name = "UnsupportedImageTypeError";
  }
}

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    void mkdir(stagingDirectory, { recursive: true })
      .then(() => callback(null, stagingDirectory))
      .catch((error: unknown) => {
        callback(
          error instanceof Error ? error : new Error("Could not prepare uploads."),
          stagingDirectory,
        );
      });
  },
  filename: (_req, _file, callback) => {
    callback(null, `${randomUUID()}.upload`);
  },
});

export const parseAdminImageUpload = multer({
  storage,
  limits: {
    fileSize: MAX_ADMIN_IMAGE_BYTES,
    files: MAX_ADMIN_IMAGE_COUNT,
  },
  fileFilter: (_req, file, callback) => {
    if (!supportedMimeTypes.has(file.mimetype)) {
      callback(new UnsupportedImageTypeError());
      return;
    }
    callback(null, true);
  },
}).array("images", MAX_ADMIN_IMAGE_COUNT);

async function imageExtension(filePath: string): Promise<string | null> {
  const handle = await open(filePath, "r");
  try {
    const signature = Buffer.alloc(12);
    const { bytesRead } = await handle.read(
      signature,
      0,
      signature.length,
      0,
    );
    if (
      bytesRead >= 3 &&
      signature[0] === 0xff &&
      signature[1] === 0xd8 &&
      signature[2] === 0xff
    ) {
      return "jpg";
    }
    if (
      bytesRead >= 8 &&
      signature.subarray(0, 8).equals(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      )
    ) {
      return "png";
    }
    if (
      bytesRead >= 12 &&
      signature.toString("ascii", 0, 4) === "RIFF" &&
      signature.toString("ascii", 8, 12) === "WEBP"
    ) {
      return "webp";
    }
    return null;
  } finally {
    await handle.close();
  }
}

export async function publishAdminImages(
  files: Express.Multer.File[],
): Promise<string[]> {
  await mkdir(linkupsUploadDirectory, { recursive: true });
  const publishedPaths: string[] = [];
  const finalPaths: string[] = [];

  try {
    for (const file of files) {
      const extension = await imageExtension(file.path);
      if (!extension) throw new UnsupportedImageTypeError();

      const filename = `${randomUUID()}.${extension}`;
      const destination = path.join(linkupsUploadDirectory, filename);
      await rename(file.path, destination);
      finalPaths.push(destination);
      publishedPaths.push(`/api/uploads/${filename}`);
    }
    return publishedPaths;
  } catch (error) {
    await Promise.all([
      ...files.map((file) => rm(file.path, { force: true })),
      ...finalPaths.map((filePath) => rm(filePath, { force: true })),
    ]);
    throw error;
  }
}

export function isMulterError(error: unknown): error is MulterError {
  return error instanceof multer.MulterError;
}
