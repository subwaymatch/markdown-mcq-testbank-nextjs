export type McqOption = {
  text: string;
  explanation?: string;
  correct: boolean;
};

export type ParsedMcq = {
  question: string;
  options: McqOption[];
  generalExplanation?: string;
};

const optionPattern = /^- \[(x| )\]\s+(.+?)(?:\s*::\s*(.+))?$/i;
const explanationHeaderPattern = /^(---\s*|#{2,}\s*explanation\s*:?$|explanation\s*:)/i;

export function parseMcqMarkdown(markdown: string): ParsedMcq {
  const lines = markdown.split(/\r?\n/);
  const options: McqOption[] = [];
  const questionLines: string[] = [];
  const explanationLines: string[] = [];
  let inExplanation = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (explanationHeaderPattern.test(trimmed)) {
      inExplanation = true;
      continue;
    }

    const optionMatch = trimmed.match(optionPattern);
    if (optionMatch) {
      const [, checked, optionText, optionExplanation] = optionMatch;
      options.push({
        text: optionText.trim(),
        explanation: optionExplanation?.trim(),
        correct: checked.toLowerCase() === "x",
      });
      continue;
    }

    if (inExplanation) {
      explanationLines.push(line);
    } else if (trimmed.length > 0 || questionLines.length > 0) {
      questionLines.push(line);
    }
  }

  const question = questionLines
    .join("\n")
    .replace(/^#+\s*/, "")
    .trim();

  const generalExplanation = explanationLines.join("\n").trim() || undefined;

  return {
    question,
    options,
    generalExplanation,
  };
}

export type McqJsonRecord = {
  id?: string;
  title: string;
  slug?: string;
  content: string;
};

export function parseMcqJson(raw: string): McqJsonRecord[] {
  const data = JSON.parse(raw) as McqJsonRecord | McqJsonRecord[];
  const list = Array.isArray(data) ? data : [data];
  return list.map((entry) => {
    if (!entry.title || !entry.content) {
      throw new Error("Each MCQ must include title and content fields.");
    }
    return entry;
  });
}

export function toMcqJson(records: McqJsonRecord[]) {
  return JSON.stringify(records, null, 2);
}
