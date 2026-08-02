import { extractText, getDocumentProxy } from "unpdf";

// Claude's PDF ingestion caps out at 100 pages. For documents over that limit we
// extract the text ourselves (no page-count restriction, just token limits) and
// feed it to Claude as plain text instead of giving up on the document entirely.
export async function extractPdfText(pdfBase64: string): Promise<string> {
  const buffer = Buffer.from(pdfBase64, "base64");
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}
