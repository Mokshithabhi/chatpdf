import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import crypto from "crypto";
import { pdfUrls } from "@/utils/langchainPdf";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    function getFileHash(buffer: Buffer) {
      return crypto.createHash("sha256").update(buffer).digest("hex");
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const hash = getFileHash(buffer);
    const safeName = `${hash}_${file.name.replace(/[^a-z0-9.\-_]/gi, "_")}`;

    const { url } = await put(safeName, buffer, {
      access: "public",
      contentType: file.type,
      allowOverwrite: true,
    });
    pdfUrls[safeName] = url;

    return NextResponse.json({
      success: true,
      filename: safeName,
      url,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Upload failed", details: String(err) },
      { status: 500 }
    );
  }
}
