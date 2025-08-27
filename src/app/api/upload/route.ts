import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { extractPdfPages } from "@/utils/pdfExtract";
import { pdfStore } from "@/app/api/chat/route";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    const safeName = file.name.replace(/[^a-z0-9.\-_]/gi, "_");
    const filePath = path.join(UPLOAD_DIR, safeName);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    console.log("Reading PDF from:", filePath);
    const pages = await extractPdfPages(filePath);
    console.log(`Extracted ${pages.length} pages from PDF.`);

    pdfStore[safeName] = { pages };

    return NextResponse.json({
      success: true,
      filename: safeName,
      numPages: pages.length,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Upload failed", details: String(err) },
      { status: 500 }
    );
  }
}
