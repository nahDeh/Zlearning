import fs from "fs";
import path from "path";

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

interface PdfJsTextItem {
  str: string;
  transform: number[];
  hasEOL?: boolean;
}

interface PdfJsTextContent {
  items: Array<PdfJsTextItem | { str?: never }>;
}

interface PdfJsPage {
  getTextContent(): Promise<PdfJsTextContent>;
  cleanup(): void;
}

interface PdfJsMetadata {
  info?: {
    Title?: string;
    Author?: string;
  };
}

interface PdfJsDocument {
  numPages: number;
  getMetadata(): Promise<PdfJsMetadata>;
  getPage(pageNumber: number): Promise<PdfJsPage>;
  destroy(): Promise<void>;
}

interface PdfJsLoadingTask {
  promise: Promise<PdfJsDocument>;
  destroy(): Promise<void>;
}

interface PdfJsModule {
  getDocument(options: {
    data: Uint8Array;
    useWorkerFetch?: boolean;
    isOffscreenCanvasSupported?: boolean;
    isImageDecoderSupported?: boolean;
    disableFontFace?: boolean;
    disableWorker?: boolean;
  }): PdfJsLoadingTask;
}

let cachedPdfJs: PdfJsModule | null = null;

async function loadPdfJs(): Promise<PdfJsModule> {
  if (cachedPdfJs) {
    return cachedPdfJs;
  }

  // Next.js bundles server code with webpack; importing `pdfjs-dist` normally can break at runtime.
  // This forces a native Node.js dynamic import at runtime (no webpack wrapping).
  const dynamicImport = new Function(
    "specifier",
    "return import(specifier)"
  ) as (specifier: string) => Promise<unknown>;

  cachedPdfJs = (await dynamicImport(
    "pdfjs-dist/legacy/build/pdf.mjs"
  )) as PdfJsModule;

  return cachedPdfJs;
}

export async function parseFile(
  filePath: string,
  fileType: SupportedFileType
): Promise<ParseResult> {
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

function extractTextFromPdfItems(items: PdfJsTextContent["items"]): string {
  const parts: string[] = [];
  let previousY: number | null = null;

  for (const item of items) {
    if (!("str" in item) || typeof item.str !== "string") {
      continue;
    }

    const currentY =
      Array.isArray(item.transform) && item.transform.length > 5
        ? item.transform[5]
        : null;

    if (parts.length > 0) {
      if (
        currentY !== null &&
        previousY !== null &&
        Math.abs(currentY - previousY) > 2
      ) {
        parts.push("\n");
      } else if (!parts[parts.length - 1]?.endsWith("\n")) {
        parts.push(" ");
      }
    }

    parts.push(item.str);

    if (item.hasEOL) {
      parts.push("\n");
    }

    previousY = currentY;
  }

  return parts
    .join("")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function extractPdfData(dataBuffer: Buffer): Promise<{
  text: string;
  pageCount?: number;
  title?: string;
  author?: string;
}> {
  const pdfjs = await loadPdfJs();

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(dataBuffer),
    useWorkerFetch: false,
    isOffscreenCanvasSupported: false,
    isImageDecoderSupported: false,
    disableFontFace: true,
    disableWorker: true,
  });

  let document: PdfJsDocument | null = null;

  try {
    document = await loadingTask.promise;
    const metadata = await document.getMetadata();
    const pageTexts: string[] = [];

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
      const page = await document.getPage(pageNumber);

      try {
        const textContent = await page.getTextContent();
        const pageText = extractTextFromPdfItems(textContent.items);

        if (pageText) {
          pageTexts.push(pageText);
        }
      } finally {
        page.cleanup();
      }
    }

    return {
      text: pageTexts.join("\n\n").trim(),
      pageCount: document.numPages,
      title: metadata.info?.Title || undefined,
      author: metadata.info?.Author || undefined,
    };
  } finally {
    if (document) {
      await document.destroy();
    } else {
      await loadingTask.destroy();
    }
  }
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
    console.error("PDF parse error:", { filePath, error });
    return {
      success: false,
      text: "",
      error: `PDF 解析失败: ${
        error instanceof Error ? error.message : "未知错误"
      }`,
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

        void processChapters();
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
      error: `EPUB 解析失败: ${
        error instanceof Error ? error.message : "未知错误"
      }`,
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
  return path.extname(filename).toLowerCase().slice(1);
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
