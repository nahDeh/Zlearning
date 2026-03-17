function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type CodeBlock = {
  placeholder: string;
  html: string;
};

type InlineReplacement = {
  placeholder: string;
  html: string;
};

export type MarkdownHeading = {
  id: string;
  text: string;
  level: number;
};

function stripInlineMarkdown(text: string): string {
  return (text ?? "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

function slugifyHeading(text: string): string {
  const normalized = (text ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    // Keep a-z/0-9, hyphen, and common CJK ideographs. Avoid unicode property escapes so
    // this works even when TS target is left at default.
    .replace(/[^a-z0-9\u4e00-\u9fff-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || "section";
}

function createUniqueHeadingId(rawHeadingText: string, used: Record<string, number>): string {
  const base = slugifyHeading(stripInlineMarkdown(rawHeadingText));
  const count = used[base] ?? 0;
  used[base] = count + 1;
  return count === 0 ? base : `${base}-${count + 1}`;
}

function renderInline(markdown: string): string {
  // Escape raw HTML first to avoid script injection, then apply a few markdown transforms.
  let text = escapeHtml(markdown);

  const inlineCodes: InlineReplacement[] = [];
  text = text.replace(/`([^`]+)`/g, (_match, code: string) => {
    const placeholder = `@@INLINE_CODE_${inlineCodes.length}@@`;
    inlineCodes.push({
      placeholder,
      html: `<code class="bg-slate-800/60 px-1.5 py-0.5 rounded text-sm font-mono text-slate-100">${escapeHtml(
        code
      )}</code>`,
    });
    return placeholder;
  });

  text = text.replace(
    /\*\*(.*?)\*\*/g,
    '<strong class="font-semibold text-slate-50">$1</strong>'
  );
  text = text.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

  for (const inline of inlineCodes) {
    text = text.replace(inline.placeholder, inline.html);
  }

  return text;
}

/**
 * Minimal markdown -> HTML converter for AI-generated lesson content.
 *
 * Why not a full markdown library?
 * This project currently avoids extra deps; we generate a safe subset and escape raw HTML to
 * reduce XSS risk when rendering user/AI content.
 */
export function markdownToHtml(markdown: string): string {
  const normalized = (markdown ?? "").replace(/\r\n/g, "\n");
  const codeBlocks: CodeBlock[] = [];
  const headingIds: Record<string, number> = {};

  // Extract fenced code blocks first so later inline replacements don't touch code content.
  const withoutCodeBlocks = normalized.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    (_match, lang: string, code: string) => {
      const placeholder = `@@CODE_BLOCK_${codeBlocks.length}@@`;
      const language = typeof lang === "string" ? lang.trim() : "";
      const escapedCode = escapeHtml(code).replace(/\n+$/, "");

      codeBlocks.push({
        placeholder,
        html: `<pre class="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto my-4 border border-slate-700"><code class="text-sm font-mono${
          language ? ` language-${language}` : ""
        }">${escapedCode}</code></pre>`,
      });

      return placeholder;
    }
  );

  const output: string[] = [];
  let paragraphLines: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (paragraphLines.length === 0) {
      return;
    }

    const text = paragraphLines.join(" ").trim();
    if (text) {
      output.push(
        `<p class="my-3 leading-relaxed text-slate-200">${renderInline(text)}</p>`
      );
    }
    paragraphLines = [];
  };

  const flushList = () => {
    if (!listType) {
      return;
    }

    const tag = listType;
    const listClass =
      listType === "ul" ? "list-disc" : "list-decimal";

    output.push(
      `<${tag} class="my-3 pl-6 space-y-1 ${listClass} text-slate-200">${listItems.join(
        ""
      )}</${tag}>`
    );

    listType = null;
    listItems = [];
  };

  const emitCodeBlock = (index: number) => {
    const block = codeBlocks[index];
    if (!block) {
      return;
    }
    flushParagraph();
    flushList();
    output.push(block.html);
  };

  const lines = withoutCodeBlocks.split("\n");

  for (const originalLine of lines) {
    const line = originalLine.replace(/\s+$/, "");

    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    // Code block placeholders can appear alone or inline. Treat them as block-level.
    let rest = line;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const match = rest.match(/@@CODE_BLOCK_(\d+)@@/);
      if (!match || match.index === undefined) {
        break;
      }

      const before = rest.slice(0, match.index).trim();
      const index = Number(match[1]);
      const after = rest.slice(match.index + match[0].length).trim();

      if (before) {
        paragraphLines.push(before);
      }

      emitCodeBlock(index);
      rest = after;
    }

    if (!rest.trim()) {
      continue;
    }

    const headingMatch = rest.match(/^(#{1,4})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();

      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      const id = createUniqueHeadingId(text, headingIds);

      const headingByLevel: Record<number, string> = {
        1: 'text-2xl font-bold mt-8 mb-4 text-white',
        2: 'text-xl font-bold mt-8 mb-3 text-white',
        3: 'text-lg font-semibold mt-6 mb-2 text-white',
        4: 'text-base font-semibold mt-6 mb-2 text-white',
      };

      const classes = headingByLevel[level] ?? headingByLevel[3];
      output.push(
        `<h${level} id="${id}" class="${classes} scroll-mt-24">${renderInline(
          text
        )}</h${level}>`
      );
      continue;
    }

    const unorderedMatch = rest.match(/^\s*[-*]\s+(.*)$/);
    const orderedMatch = rest.match(/^\s*\d+\.\s+(.*)$/);

    if (unorderedMatch || orderedMatch) {
      flushParagraph();

      const nextType: "ul" | "ol" = orderedMatch ? "ol" : "ul";
      const itemText = (orderedMatch?.[1] ?? unorderedMatch?.[1] ?? "").trim();

      if (listType && listType !== nextType) {
        flushList();
      }

      listType = nextType;
      listItems.push(`<li class="leading-relaxed">${renderInline(itemText)}</li>`);
      continue;
    }

    paragraphLines.push(rest.trim());
  }

  flushParagraph();
  flushList();

  return output.join("\n");
}

export function extractMarkdownHeadings(markdown: string): MarkdownHeading[] {
  const normalized = (markdown ?? "").replace(/\r\n/g, "\n");
  const withoutCodeBlocks = normalized.replace(/```[\s\S]*?```/g, "");
  const used: Record<string, number> = {};

  const headings: MarkdownHeading[] = [];

  for (const rawLine of withoutCodeBlocks.split("\n")) {
    const line = rawLine.replace(/\s+$/, "");
    const headingMatch = line.match(/^(#{1,4})\s+(.*)$/);
    if (!headingMatch) {
      continue;
    }

    const level = headingMatch[1].length;
    const text = stripInlineMarkdown(headingMatch[2].trim());
    if (!text) {
      continue;
    }

    headings.push({
      id: createUniqueHeadingId(text, used),
      text,
      level,
    });
  }

  return headings;
}
