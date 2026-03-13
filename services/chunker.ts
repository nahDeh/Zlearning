export interface ChunkOptions {
  maxChunkSize: number;
  overlapSize: number;
  respectSentenceBoundary: boolean;
}

export interface TextChunk {
  text: string;
  startIndex: number;
  endIndex: number;
  metadata?: Record<string, unknown>;
}

const DEFAULT_OPTIONS: ChunkOptions = {
  maxChunkSize: 1000,
  overlapSize: 100,
  respectSentenceBoundary: true,
};

export function splitTextIntoChunks(text: string, options: Partial<ChunkOptions> = {}): TextChunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const chunks: TextChunk[] = [];

  if (!text || text.trim().length === 0) {
    return chunks;
  }

  if (text.length <= opts.maxChunkSize) {
    chunks.push({
      text: text.trim(),
      startIndex: 0,
      endIndex: text.length,
    });
    return chunks;
  }

  let currentIndex = 0;

  while (currentIndex < text.length) {
    let endIndex = currentIndex + opts.maxChunkSize;

    if (endIndex >= text.length) {
      chunks.push({
        text: text.slice(currentIndex).trim(),
        startIndex: currentIndex,
        endIndex: text.length,
      });
      break;
    }

    if (opts.respectSentenceBoundary) {
      const boundaryIndex = findSentenceBoundary(text, endIndex);
      if (boundaryIndex > currentIndex) {
        endIndex = boundaryIndex;
      }
    }

    const chunkText = text.slice(currentIndex, endIndex).trim();

    if (chunkText.length > 0) {
      chunks.push({
        text: chunkText,
        startIndex: currentIndex,
        endIndex: endIndex,
      });
    }

    currentIndex = endIndex - opts.overlapSize;
    if (currentIndex <= chunks[chunks.length - 1]?.startIndex) {
      currentIndex = endIndex;
    }
  }

  return chunks;
}

function findSentenceBoundary(text: string, maxIndex: number): number {
  const searchStart = Math.max(0, maxIndex - 200);
  const searchText = text.slice(searchStart, maxIndex);

  const boundaries = [
    searchText.lastIndexOf("。"),
    searchText.lastIndexOf("！"),
    searchText.lastIndexOf("？"),
    searchText.lastIndexOf("."),
    searchText.lastIndexOf("!"),
    searchText.lastIndexOf("?"),
    searchText.lastIndexOf("\n"),
    searchText.lastIndexOf("\n\n"),
  ];

  const validBoundaries = boundaries.filter((b) => b !== -1);

  if (validBoundaries.length > 0) {
    const bestBoundary = Math.max(...validBoundaries);
    return searchStart + bestBoundary + 1;
  }

  const spaceIndex = searchText.lastIndexOf(" ");
  if (spaceIndex !== -1) {
    return searchStart + spaceIndex + 1;
  }

  return maxIndex;
}

export function mergeSmallChunks(chunks: TextChunk[], minSize: number = 200): TextChunk[] {
  if (chunks.length <= 1) return chunks;

  const merged: TextChunk[] = [];
  let currentChunk: TextChunk | null = null;

  for (const chunk of chunks) {
    if (!currentChunk) {
      currentChunk = { ...chunk };
      continue;
    }

    if (currentChunk.text.length < minSize) {
      currentChunk = {
        text: currentChunk.text + "\n" + chunk.text,
        startIndex: currentChunk.startIndex,
        endIndex: chunk.endIndex,
      };
    } else {
      merged.push(currentChunk);
      currentChunk = { ...chunk };
    }
  }

  if (currentChunk) {
    merged.push(currentChunk);
  }

  return merged;
}

export function getChunkStats(chunks: TextChunk[]): {
  totalChunks: number;
  avgChunkSize: number;
  minChunkSize: number;
  maxChunkSize: number;
} {
  if (chunks.length === 0) {
    return {
      totalChunks: 0,
      avgChunkSize: 0,
      minChunkSize: 0,
      maxChunkSize: 0,
    };
  }

  const sizes = chunks.map((c) => c.text.length);
  return {
    totalChunks: chunks.length,
    avgChunkSize: Math.round(sizes.reduce((a, b) => a + b, 0) / sizes.length),
    minChunkSize: Math.min(...sizes),
    maxChunkSize: Math.max(...sizes),
  };
}
