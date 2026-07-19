export interface ParsedDocument {
  text: string;
  parser: string;
}

function extension(fileName: string): string {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? (parts.pop() ?? "") : "";
}

export async function extractTextFromBuffer(buffer: Buffer, fileName: string): Promise<ParsedDocument> {
  const ext = extension(fileName);

  if (["txt", "md", "csv", "json", "log"].includes(ext)) {
    return { text: buffer.toString("utf-8"), parser: "text" };
  }

  if (ext === "docx") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return { text: result.value.trim(), parser: "docx" };
  }

  if (["xlsx", "xls"].includes(ext)) {
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const text = workbook.SheetNames.map((name) => {
      const sheet = workbook.Sheets[name];
      if (!sheet) return "";
      return `## ${name}\n${XLSX.utils.sheet_to_csv(sheet)}`;
    })
      .filter(Boolean)
      .join("\n\n");
    return { text: text.trim(), parser: "xlsx" };
  }

  if (ext === "pdf") {
    try {
      const pdfModule = await import("pdf-parse");
      const pdfParse =
        typeof pdfModule === "function"
          ? pdfModule
          : "default" in pdfModule && typeof pdfModule.default === "function"
            ? pdfModule.default
            : null;
      if (pdfParse) {
        const result = await pdfParse(buffer);
        const text = (result as { text?: string }).text?.trim() ?? "";
        if (text) return { text, parser: "pdf" };
      }
    } catch {
      // fall through to placeholder
    }
    return {
      text: `[PDF Document: ${fileName}] Text extraction requires OCR for scanned pages.`,
      parser: "pdf-ocr-placeholder"
    };
  }

  if (ext === "doc") {
    return {
      text: `[Legacy Word: ${fileName}] Please convert to .docx for full text indexing.`,
      parser: "doc-legacy"
    };
  }

  throw new Error(`Unsupported file type: .${ext || "unknown"}`);
}

export function inferKnowledgeType(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.includes("sop")) return "sop";
  if (lower.includes("wi") || lower.includes("instruction")) return "work-instruction";
  if (lower.includes("qc") || lower.includes("quality")) return "qc-standard";
  if (lower.includes("checklist")) return "checklist";
  if (lower.includes("training")) return "training";
  if (lower.includes("haccp") || lower.includes("ccp")) return "food-safety";
  return "manual";
}
