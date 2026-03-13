import fs from "fs";
import path from "path";

export type SupportedFileType = "txt" | "md" | "pdf";

export interface ParseResult {
  success: boolean;
  text: string;
  error?: string;
  metadata?: {
    pageCount?: number;
    wordCount: number;
    charCount: number;
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
        return parsePdfFile(filePath);
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

function parsePdfFile(filePath: string): ParseResult {
  return {
    success: false,
    text: "",
    error: "PDF 解析功能暂未实现，请使用 txt 或 md 格式文件",
  };
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
  return ["txt", "md", "pdf"].includes(ext);
}

export function getFileType(filename: string): SupportedFileType | null {
  const ext = getFileExtension(filename);
  if (["txt", "md", "pdf"].includes(ext)) {
    return ext as SupportedFileType;
  }
  return null;
}
