import { NextResponse } from "next/server";
import { uploadToR2 } from "@/lib/r2";

export async function GET() {
  try {
    const dummyBuffer = Buffer.from("Hello R2");
    const key = `test-${Date.now()}.txt`;
    const uploadResult = await uploadToR2(dummyBuffer, key, "text/plain");
    
    return NextResponse.json({
      success: true,
      message: "R2 connection successful!",
      key,
      uploadResult,
      config: {
        accountId: process.env.R2_ACCOUNT_ID ? "Loaded (length: " + process.env.R2_ACCOUNT_ID.length + ")" : "Missing",
        accessKeyId: process.env.R2_ACCESS_KEY_ID ? "Loaded (length: " + process.env.R2_ACCESS_KEY_ID.length + ")" : "Missing",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ? "Loaded (length: " + process.env.R2_SECRET_ACCESS_KEY.length + ")" : "Missing",
        bucketName: process.env.R2_BUCKET_NAME || "sre-upnvjt (default)",
        publicUrl: process.env.R2_PUBLIC_URL || "default cdn",
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      config: {
        accountId: process.env.R2_ACCOUNT_ID ? "Loaded (length: " + process.env.R2_ACCOUNT_ID.length + ")" : "Missing",
        accessKeyId: process.env.R2_ACCESS_KEY_ID ? "Loaded (length: " + process.env.R2_ACCESS_KEY_ID.length + ")" : "Missing",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ? "Loaded (length: " + process.env.R2_SECRET_ACCESS_KEY.length + ")" : "Missing",
        bucketName: process.env.R2_BUCKET_NAME || "sre-upnvjt (default)",
        publicUrl: process.env.R2_PUBLIC_URL || "default cdn",
      }
    }, { status: 500 });
  }
}
