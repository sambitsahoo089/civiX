import { NextResponse } from "next/server";
import { connectDB, mongoose } from "@/lib/db";

// Serves images uploaded to GridFS in production (see lib/storage.js).
export async function GET(_request, { params }) {
  const { id } = params;
  if (!id || !/^[a-f\d]{24}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid file id" }, { status: 400 });
  }

  try {
    const conn = await connectDB();
    const bucket = new mongoose.mongo.GridFSBucket(conn.connection.db, {
      bucketName: "uploads",
    });

    const files = await bucket.find({ _id: new mongoose.Types.ObjectId(id) }).toArray();
    if (!files.length) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const file = files[0];

    const stream = bucket.openDownloadStream(file._id);
    const chunks = [];
    await new Promise((resolve, reject) => {
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("end", resolve);
      stream.on("error", reject);
    });

    return new NextResponse(Buffer.concat(chunks), {
      headers: {
        "Content-Type": file.contentType || "application/octet-stream",
        "Content-Length": String(file.length),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to load file" },
      { status: 500 }
    );
  }
}
