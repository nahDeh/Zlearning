export interface MaterialMetadata {
  pageCount?: number;
  wordCount?: number;
  charCount?: number;
  title?: string;
  author?: string;
  error?: string;
}

export function parseMaterialMetadata(metadata: string | null): MaterialMetadata | null {
  if (!metadata) {
    return null;
  }

  try {
    return JSON.parse(metadata) as MaterialMetadata;
  } catch {
    return null;
  }
}

export function serializeMaterialMetadata(
  metadata: MaterialMetadata | null | undefined
): string | null {
  if (!metadata) {
    return null;
  }

  return JSON.stringify(metadata);
}
