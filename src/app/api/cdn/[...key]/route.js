import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { r2Client } from "@/lib/r2";

export async function GET(req, { params }) {
  try {
    const keyArray = params.key;
    if (!keyArray || keyArray.length === 0) {
      return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }

    const key = keyArray.join("/");
    const bucketName = process.env.R2_BUCKET_NAME || "sre-upnvjt";

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const response = await r2Client.send(command);
    const body = await response.Body.transformToByteArray();

    return new NextResponse(body, {
      headers: {
        "Content-Type": response.ContentType || "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error proxying image from R2:", error);
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }
}
