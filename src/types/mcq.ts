export interface Choice {
  id: string;
  question_id: string;
  choice_text: string;
  is_correct: boolean;
  explanation: string | null;
  sort_order: number;
  created_at: string;
}

export interface Question {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  question_body: string;
  allow_multiple_answers: boolean;
  tags: string[];
  overall_explanation: string | null;
  raw_markdown: string;
  created_at: string;
  updated_at: string;
}

export interface QuestionWithChoices extends Question {
  choices: Choice[];
}

export interface ParsedChoice {
  text: string;
  isCorrect: boolean;
  explanation: string | null;
}

export interface ParsedMcq {
  title: string;
  slug: string;
  tags: string[];
  questionBody: string;
  choices: ParsedChoice[];
  overallExplanation: string | null;
  allowMultipleAnswers: boolean;
}

export interface McqExportEnvelope {
  version: "1.0";
  exported_at: string;
  question_count: number;
  questions: McqExportQuestion[];
}

export interface McqExportQuestion {
  id: string;
  title: string;
  slug: string;
  question_body: string;
  allow_multiple_answers: boolean;
  tags: string[];
  overall_explanation: string | null;
  choices: McqExportChoice[];
  created_at: string;
  updated_at: string;
}

export interface McqExportChoice {
  choice_text: string;
  is_correct: boolean;
  explanation: string | null;
  sort_order: number;
}
