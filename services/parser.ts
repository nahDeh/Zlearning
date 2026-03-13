import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

export type SupportedFileType = "txt" | "md" | "pdf" | "epub";

export interface ParseResult {
  success: boolean;
  text: string;
  error?: string;
  metadata?: {
    pageCount?: number;
    wordCount: number;
    charCount: number;
    title?: string;
    author?: string;
  };
}

export async function parseFile(filePath: string, fileType: SupportedFileType): Promise<ParseResult> {
  try {
    if (!fs.existsSync(filePath)) {
      return {
        success: false,
        text: "",
        error: "文件不存在",
      };
    }

    switch (fileType) {
      case "txt":
        return parseTxtFile(filePath);
      case "md":
        return parseMdFile(filePath);
      case "pdf":
        return await parsePdfFile(filePath);
      case "epub":
        return await parseEpubFile(filePath);
      default:
        return {
          success: false,
          text: "",
          error: `不支持的文件类型: ${fileType}`,
        };
    }
  } catch (error) {
    return {
      success: false,
      text: "",
      error: error instanceof Error ? error.message : "解析文件时发生未知错误",
    };
  }
}

function parseTxtFile(filePath: string): ParseResult {
  const content = fs.readFileSync(filePath, "utf-8");
  const wordCount = countWords(content);
  const charCount = content.length;

  return {
    success: true,
    text: content,
    metadata: {
      wordCount,
      charCount,
    },
  };
}

function parseMdFile(filePath: string): ParseResult {
  const content = fs.readFileSync(filePath, "utf-8");
  const wordCount = countWords(content);
  const charCount = content.length;

  return {
    success: true,
    text: content,
    metadata: {
      wordCount,
      charCount,
    },
  };
}

interface LegacyPdfParseResult {
  text: string;
  numpages?: number;
  info?: {
    Title?: string;
    Author?: string;
  };
}

interface PdfParseV2TextResult {
  text: string;
  total: number;
}

interface PdfParseV2InfoResult {
  total: number;
  info?: {
    Title?: string;
    Author?: string;
  };
}

interface PdfParseV2Instance {
  getText(): Promise<PdfParseV2TextResult>;
  getInfo(): Promise<PdfParseV2InfoResult>;
  destroy(): Promise<void>;
}

interface PdfParseV2Constructor {
  new (options: { data: Buffer }): PdfParseV2Instance;
  setWorker(workerPath?: string): string;
}

type LegacyPdfParseFunction = (dataBuffer: Buffer) => Promise<LegacyPdfParseResult>;

type PdfParseModule =
  | LegacyPdfParseFunction
  | {
      default?: LegacyPdfParseFunction;
      PDFParse?: PdfParseV2Constructor;
    };

let hasConfiguredPdfWorker = false;

function configurePdfWorker(PDFParse: PdfParseV2Constructor) {
  if (hasConfiguredPdfWorker) {
    return;
  }

  const currentWorker = PDFParse.setWorker();
  if (currentWorker && currentWorker !== "./pdf.worker.mjs") {
    hasConfiguredPdfWorker = true;
    return;
  }

  const workerPath = path.resolve(
    process.cwd(),
    "node_modules",
    "pdfjs-dist",
    "build",
    "pdf.worker.mjs"
  );

  if (!fs.existsSync(workerPath)) {
    hasConfiguredPdfWorker = true;
    return;
  }

  PDFParse.setWorker(pathToFileURL(workerPath).href);
  hasConfiguredPdfWorker = true;
}

async function extractPdfData(dataBuffer: Buffer): Promise<{
  text: string;
  pageCount?: number;
  title?: string;
  author?: string;
}> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParseModule = require("pdf-parse") as PdfParseModule;

  if (
    typeof pdfParseModule === "object" &&
    pdfParseModule !== null &&
    typeof pdfParseModule.PDFParse === "function"
  ) {
    configurePdfWorker(pdfParseModule.PDFParse);
    const parser = new pdfParseModule.PDFParse({ data: dataBuffer });

    try {
      const textResult = await parser.getText();
      const infoResult = await parser.getInfo();

      return {
        text: textResult.text,
        pageCount: infoResult.total || textResult.total,
        title: infoResult.info?.Title || undefined,
        author: infoResult.info?.Author || undefined,
      };
    } finally {
      await parser.destroy();
    }
  }

  const legacyParser =
    typeof pdfParseModule === "function"
      ? pdfParseModule
      : typeof pdfParseModule === "object" &&
          pdfParseModule !== null &&
          typeof pdfParseModule.default === "function"
        ? pdfParseModule.default
        : null;

  if (!legacyParser) {
    throw new Error("当前 pdf-parse 导出格式不受支持");
  }

  const legacyResult = await legacyParser(dataBuffer);

  return {
    text: legacyResult.text,
    pageCount: legacyResult.numpages,
    title: legacyResult.info?.Title || undefined,
    author: legacyResult.info?.Author || undefined,
  };
}

async function parsePdfFile(filePath: string): Promise<ParseResult> {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await extractPdfData(dataBuffer);

    const text = data.text;
    const wordCount = countWords(text);
    const charCount = text.length;

    return {
      success: true,
      text,
      metadata: {
        pageCount: data.pageCount,
        wordCount,
        charCount,
        title: data.title,
        author: data.author,
      },
    };
  } catch (error) {
    return {
      success: false,
      text: "",
      error: `PDF 解析失败: ${error instanceof Error ? error.message : "未知错误"}`,
    };
  }
}

async function parseEpubFile(filePath: string): Promise<ParseResult> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const EPub = require("epub2");
    const epub = new EPub(filePath);

    return new Promise((resolve) => {
      epub.on("end", () => {
        let fullText = "";
        let chapterCount = 0;

        const chapters = epub.flow;
        const processChapters = async () => {
          for (const chapter of chapters) {
            if (chapter.id) {
              try {
                const chapterContent = await new Promise<string>((res, rej) => {
                  epub.getChapter(chapter.id, (err: Error | null, text: string) => {
                    if (err) rej(err);
                    else res(text);
                  });
                });
                fullText += chapterContent + "\n\n";
                chapterCount++;
              } catch {
                // Skip failed chapters
              }
            }
          }

          const cleanText = stripHtml(fullText);
          const wordCount = countWords(cleanText);
          const charCount = cleanText.length;

          resolve({
            success: true,
            text: cleanText,
            metadata: {
              pageCount: chapterCount,
              wordCount,
              charCount,
              title: epub.metadata?.title || undefined,
              author: epub.metadata?.creator || undefined,
            },
          });
        };

        processChapters();
      });

      epub.on("error", (err: Error) => {
        resolve({
          success: false,
          text: "",
          error: `EPUB 解析失败: ${err.message}`,
        });
      });

      epub.parse();
    });
  } catch (error) {
    return {
      success: false,
      text: "",
      error: `EPUB 解析失败: ${error instanceof Error ? error.message : "未知错误"}`,
    };
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function countWords(text: string): number {
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
  return chineseChars + englishWords;
}

export function getFileExtension(filename: string): string {
  const ext = path.extname(filename).toLowerCase().slice(1);
  return ext;
}

export function isValidFileType(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ["txt", "md", "pdf", "epub"].includes(ext);
}

export function getFileType(filename: string): SupportedFileType | null {
  const ext = getFileExtension(filename);
  if (["txt", "md", "pdf", "epub"].includes(ext)) {
    return ext as SupportedFileType;
  }
  return null;
}
