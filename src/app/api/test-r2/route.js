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
        accountId: process.env.R2_ACCOUNT_ID ? process.env.R2_ACCOUNT_ID.substring(0, 4) + "..." + process.env.R2_ACCOUNT_ID.substring(process.env.R2_ACCOUNT_ID.length - 4) : "Missing",
        accessKeyId: process.env.R2_ACCESS_KEY_ID ? process.env.R2_ACCESS_KEY_ID.substring(0, 4) + "..." + process.env.R2_ACCESS_KEY_ID.substring(process.env.R2_ACCESS_KEY_ID.length - 4) : "Missing",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ? process.env.R2_SECRET_ACCESS_KEY.substring(0, 4) + "..." + process.env.R2_SECRET_ACCESS_KEY.substring(process.env.R2_SECRET_ACCESS_KEY.length - 4) : "Missing",
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
        accountId: process.env.R2_ACCOUNT_ID ? process.env.R2_ACCOUNT_ID.substring(0, 4) + "..." + process.env.R2_ACCOUNT_ID.substring(process.env.R2_ACCOUNT_ID.length - 4) : "Missing",
        accessKeyId: process.env.R2_ACCESS_KEY_ID ? process.env.R2_ACCESS_KEY_ID.substring(0, 4) + "..." + process.env.R2_ACCESS_KEY_ID.substring(process.env.R2_ACCESS_KEY_ID.length - 4) : "Missing",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ? process.env.R2_SECRET_ACCESS_KEY.substring(0, 4) + "..." + process.env.R2_SECRET_ACCESS_KEY.substring(process.env.R2_SECRET_ACCESS_KEY.length - 4) : "Missing",
        bucketName: process.env.R2_BUCKET_NAME || "sre-upnvjt (default)",
        publicUrl: process.env.R2_PUBLIC_URL || "default cdn",
      }
    }, { status: 500 });
  }
}
