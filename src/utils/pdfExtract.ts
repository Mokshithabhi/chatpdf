import fs from "fs";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

export async function extractPdfPages(filePath: string): Promise<string[]> {
  try {
    const data = new Uint8Array(await fs.promises.readFile(filePath));
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    const numPages = pdf.numPages;
    const pages: string[] = [];
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map((item: any) => item.str).join(" ");
      pages.push(text);
    }
    console.log("pages", pages);
    return pages;
  } catch (err) {
    console.error("Failed to parse PDF:", err);
    // Fallback: return empty array or a message
    return ["Could not extract text from PDF."];
  }
}
