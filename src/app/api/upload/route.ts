import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function POST(req: NextRequest) {
  let filePath: string | undefined = undefined;
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    if (!fs.existsSync(UPLOAD_DIR))
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });

    function getFileHash(buffer: Buffer) {
      return crypto.createHash("sha256").update(buffer).digest("hex");
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const hash = getFileHash(buffer);
    const safeName = `${hash}_${file.name.replace(/[^a-z0-9.\-_]/gi, "_")}`;
    filePath = path.join(UPLOAD_DIR, safeName);
    fs.writeFileSync(filePath, buffer);

    const { url } = await put(safeName, buffer, {
      access: "public",
      contentType: file.type,
      allowOverwrite: true,
    });

    return NextResponse.json({
      success: true,
      filename: safeName,
      url,
    });
  } catch (err) {
    console.error(err);
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return NextResponse.json(
      { error: "Upload failed", details: String(err) },
      { status: 500 }
    );
  }
}
