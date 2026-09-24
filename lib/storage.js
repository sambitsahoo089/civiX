import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { connectDB, mongoose } from "@/lib/db";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

const EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/avif": "avif",
};

/**
 * Persist an uploaded image file. Returns the URL to use for <img src>.
 * Three storage modes, chosen automatically:
 *   1. BLOB_READ_WRITE_TOKEN set → Vercel Blob (best for serverless deploys)
 *   2. GRIDFS via MongoDB        → used on Render/production (disk is ephemeral)
 *   3. public/uploads            → local dev only
 *
 * GridFS files are served from /api/files/<id> (see app/api/files/[id]/route.js),
 * so uploaded images survive every deploy.
 */
export async function saveImage(file, { dir = "public/uploads" } = {}) {
  if (!file || typeof file === "string") {
    throw new Error("No image file provided");
  }
  if (!file.type || !file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed");
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length === 0) throw new Error("The uploaded file is empty");
  if (bytes.length > MAX_BYTES) throw new Error("Image must be 5MB or smaller");

  const ext = EXTENSIONS[file.type] || "jpg";
  const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;

  // 1. Vercel Blob when configured.
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`uploads/${name}`, bytes, {
      access: "public",
      contentType: file.type,
    });
    return blob.url;
  }

  // 2. GridFS in production (Render's disk doesn't survive deploys).
  if (process.env.NODE_ENV === "production") {
    const conn = await connectDB();
    const bucket = new mongoose.mongo.GridFSBucket(conn.connection.db, {
      bucketName: "uploads",
    });
    const uploadStream = bucket.openUploadStream(name, {
      contentType: file.type,
      metadata: { originalName: file.name || name },
    });
    await new Promise((resolve, reject) => {
      uploadStream.end(bytes, (err) => (err ? reject(err) : resolve()));
    });
    return `/api/files/${uploadStream.id}`;
  }

  // 3. Local disk for development.
  await mkdir(path.join(/* turbopackIgnore: true */ process.cwd(), dir), { recursive: true });
  await writeFile(path.join(/* turbopackIgnore: true */ process.cwd(), dir, name), bytes);
  return `/${dir.replace(/^public\//, "")}/${name}`;
}
