import matter from "gray-matter";
import type { ParsedChoice, ParsedMcq } from "@/types/mcq";
import { generateSlug } from "./slug";

const CHOICE_CORRECT_RE = /^- \[o\]\s+(.+)$/;
const CHOICE_PLAIN_RE = /^- (.+)$/;
const BLOCKQUOTE_RE = /^\s+>\s?(.*)$/;
const CONTINUATION_RE = /^\s{2,}(.+)$/;

interface ChoiceBuilder {
  textLines: string[];
  isCorrect: boolean;
  explanationLines: string[];
}

export function parseMcqMarkdown(raw: string): ParsedMcq {
  let frontmatter: Record<string, unknown> = {};
  let content = raw;
  try {
    const parsed = matter(raw);
    frontmatter = parsed.data;
    content = parsed.content;
  } catch {
    // Invalid YAML frontmatter — treat the entire input as content
  }

  const title = (typeof frontmatter.title === "string" && frontmatter.title.trim())
    ? frontmatter.title.trim()
    : "Untitled";

  let tags: string[] = [];
  if (Array.isArray(frontmatter.tags)) {
    tags = frontmatter.tags.map((t: unknown) => String(t).trim()).filter(Boolean);
  }

  const slug = generateSlug(title);
  const lines = content.split("\n");

  // Find all choice line indices
  const choiceIndices: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (CHOICE_CORRECT_RE.test(lines[i]) || CHOICE_PLAIN_RE.test(lines[i])) {
      choiceIndices.push(i);
    }
  }

  // Find the contiguous block of choices that contains at least one [o]
  let choiceBlockStart = -1;
  let choiceBlockEnd = -1;

  if (choiceIndices.length > 0) {
    // Group consecutive choice indices into blocks
    const blocks: number[][] = [];
    let currentBlock: number[] = [choiceIndices[0]];

    for (let i = 1; i < choiceIndices.length; i++) {
      // Check if this choice is "contiguous" with the previous one
      // (only blank lines, blockquotes, or continuation lines between them)
      const prevChoiceIdx = choiceIndices[i - 1];
      const currChoiceIdx = choiceIndices[i];
      let isContiguous = true;

      for (let j = prevChoiceIdx + 1; j < currChoiceIdx; j++) {
        const line = lines[j];
        if (
          line.trim() === "" ||
          BLOCKQUOTE_RE.test(line) ||
          CONTINUATION_RE.test(line)
        ) {
          continue;
        }
        isContiguous = false;
        break;
      }

      if (isContiguous) {
        currentBlock.push(currChoiceIdx);
      } else {
        blocks.push(currentBlock);
        currentBlock = [currChoiceIdx];
      }
    }
    blocks.push(currentBlock);

    // Find the block that contains at least one [o] marker
    for (const block of blocks) {
      const hasCorrect = block.some((idx) => CHOICE_CORRECT_RE.test(lines[idx]));
      if (hasCorrect) {
        choiceBlockStart = block[0];
        // Find the end of the block (last choice + its continuation/explanation lines)
        const lastChoiceIdx = block[block.length - 1];
        choiceBlockEnd = lastChoiceIdx + 1;
        for (let j = lastChoiceIdx + 1; j < lines.length; j++) {
          if (
            BLOCKQUOTE_RE.test(lines[j]) ||
            CONTINUATION_RE.test(lines[j]) ||
            lines[j].trim() === ""
          ) {
            choiceBlockEnd = j + 1;
          } else {
            break;
          }
        }
        // Trim trailing blank lines from the block end
        while (
          choiceBlockEnd > choiceBlockStart &&
          lines[choiceBlockEnd - 1]?.trim() === ""
        ) {
          choiceBlockEnd--;
        }
        break;
      }
    }
  }

  // Parse the three zones
  let questionBody = "";
  const choices: ParsedChoice[] = [];
  let overallExplanation: string | null = null;

  if (choiceBlockStart === -1) {
    // No choices found
    questionBody = content.trim();
  } else {
    // Zone 1: question body (before choices block)
    questionBody = lines.slice(0, choiceBlockStart).join("\n").trim();

    // Zone 2: parse choices
    const choiceBuilders: ChoiceBuilder[] = [];
    let currentChoice: ChoiceBuilder | null = null;

    for (let i = choiceBlockStart; i < choiceBlockEnd; i++) {
      const line = lines[i];
      const correctMatch = line.match(CHOICE_CORRECT_RE);
      const plainMatch = line.match(CHOICE_PLAIN_RE);

      if (correctMatch) {
        currentChoice = {
          textLines: [correctMatch[1]],
          isCorrect: true,
          explanationLines: [],
        };
        choiceBuilders.push(currentChoice);
      } else if (plainMatch && !BLOCKQUOTE_RE.test(line) && !CONTINUATION_RE.test(line)) {
        currentChoice = {
          textLines: [plainMatch[1]],
          isCorrect: false,
          explanationLines: [],
        };
        choiceBuilders.push(currentChoice);
      } else if (currentChoice) {
        const bqMatch = line.match(BLOCKQUOTE_RE);
        const contMatch = line.match(CONTINUATION_RE);
        if (bqMatch) {
          currentChoice.explanationLines.push(bqMatch[1]);
        } else if (contMatch && !bqMatch) {
          currentChoice.textLines.push(contMatch[1]);
        }
      }
    }

    for (const cb of choiceBuilders) {
      choices.push({
        text: cb.textLines.join("\n"),
        isCorrect: cb.isCorrect,
        explanation: cb.explanationLines.length > 0
          ? cb.explanationLines.join("\n").trim()
          : null,
      });
    }

    // Zone 3: overall explanation (after choices block)
    const afterChoices = lines.slice(choiceBlockEnd).join("\n").trim();
    overallExplanation = afterChoices || null;
  }

  const correctCount = choices.filter((c) => c.isCorrect).length;

  return {
    title,
    slug,
    tags,
    questionBody,
    choices,
    overallExplanation,
    allowMultipleAnswers: correctCount > 1,
  };
}
