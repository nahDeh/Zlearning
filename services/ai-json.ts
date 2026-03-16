function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function extractFencedBlock(text: string): string | null {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return match?.[1]?.trim() || null;
}

function extractBracketedJson(text: string): string | null {
  const candidates: Array<{ start: number; end: number }> = [];

  const objStart = text.indexOf("{");
  const objEnd = text.lastIndexOf("}");
  if (objStart !== -1 && objEnd !== -1 && objEnd > objStart) {
    candidates.push({ start: objStart, end: objEnd });
  }

  const arrStart = text.indexOf("[");
  const arrEnd = text.lastIndexOf("]");
  if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) {
    candidates.push({ start: arrStart, end: arrEnd });
  }

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((a, b) => a.start - b.start);
  const pick = candidates[0];
  return text.slice(pick.start, pick.end + 1).trim();
}

/**
 * AI models sometimes wrap JSON in markdown fences or add leading/trailing commentary.
 * This helper tries a few safe extraction strategies before giving up.
 */
export function parseJsonFromAi(raw: string): unknown | null {
  const text = stripBom(raw).trim();
  if (!text) {
    return null;
  }

  const attempts: string[] = [text];

  const fenced = extractFencedBlock(text);
  if (fenced) {
    attempts.push(fenced);
  }

  const bracketed = extractBracketedJson(text);
  if (bracketed) {
    attempts.push(bracketed);
  }

  for (const attempt of attempts) {
    try {
      return JSON.parse(attempt) as unknown;
    } catch {
      // keep trying
    }
  }

  return null;
}

