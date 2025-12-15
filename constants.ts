import { QuestionNode } from './types';

// --- NLP / Normalization Helpers ---

const normalize = (str: string) => str.toLowerCase().trim();

const KEYWORDS_AGENT = ['agent', 'human', 'person', 'representative', 'call me', 'speak to someone'];
const KEYWORDS_HIGH_RISK = [
  'cancer', 'heart attack', 'stroke', 'hospital', 'severe', 'terminal', 
  'diabetes', 'dialysis', 'transplant', 'hiv', 'aids'
];
const KEYWORDS_HIGH_VALUE = ['2m', 'million', 'multi-million', '2,000,000', 'unlimited'];

const checkKeywords = (input: string, keywords: string[]) => {
  const norm = normalize(input);
  return keywords.some(kw => norm.includes(kw));
};

// Simple yes/no parser
const parseYesNo = (input: string): boolean | null => {
  const norm = normalize(input);
  if (['y', 'yes', 'yeah', 'yep', 'sure', 'ok'].some(w => norm.startsWith(w))) return true;
  if (['n', 'no', 'nope', 'nah', 'none'].some(w => norm.startsWith(w))) return false;
  return null;
};

// --- Question Tree Definition ---

export const QUESTION_TREE: Record<string, QuestionNode> = {
  start: {
    id: 'start',
    question: "Are you looking for coverage for yourself or someone else?",
    helperText: "Most people start by insuring themselves.",
    placeholder: "e.g., Myself, my spouse...",
    next: (ans) => {
      const norm = normalize(ans);
      if (checkKeywords(ans, KEYWORDS_AGENT)) return 'AGENT';
      // If it's for someone else, we might have different logic, but for this demo flow we merge back.
      return 'reason'; 
    }
  },
  reason: {
    id: 'reason',
    question: "What is your primary reason for seeking coverage?",
    helperText: "e.g., Mortgage protection, Income replacement, Leaving a legacy.",
    placeholder: "Type your reason...",
    next: (ans) => {
      if (checkKeywords(ans, KEYWORDS_AGENT)) return 'AGENT';
      return 'coverage_goal';
    }
  },
  coverage_goal: {
    id: 'coverage_goal',
    question: "Do you have a general coverage amount in mind?",
    helperText: "Low ($50k-$250k), Medium ($250k-$1M), or High ($1M+).",
    placeholder: "e.g., around 500k",
    next: (ans) => {
      if (checkKeywords(ans, KEYWORDS_HIGH_VALUE)) return 'AGENT'; // Trigger high value exit
      if (checkKeywords(ans, KEYWORDS_AGENT)) return 'AGENT';
      return 'timeline';
    }
  },
  timeline: {
    id: 'timeline',
    question: "How soon are you looking to have this policy in place?",
    helperText: "e.g., ASAP, within a month, just exploring.",
    next: (ans) => {
      if (checkKeywords(ans, KEYWORDS_AGENT)) return 'AGENT';
      return 'tobacco';
    }
  },
  tobacco: {
    id: 'tobacco',
    question: "Have you used any tobacco or nicotine products in the last 12 months?",
    helperText: "Includes cigarettes, vaping, cigars, chewing tobacco.",
    next: (ans) => {
      const isYes = parseYesNo(ans);
      if (isYes === null && !checkKeywords(ans, ['occasionally', 'rarely'])) return 'clarification_tobacco'; // Simple routing validation
      return 'health';
    }
  },
  clarification_tobacco: {
    id: 'clarification_tobacco',
    question: "Could you clarify your tobacco use?",
    helperText: "Please answer with 'Yes', 'No', or 'Occasionally'.",
    next: (ans) => {
       // If still garbage, the main loop logic will catch 'unclearCount' and send to agent
       return 'health';
    }
  },
  health: {
    id: 'health',
    question: "How would you describe your general health?",
    helperText: "Excellent, Good, Fair, or if you have specific conditions.",
    next: (ans) => {
      if (checkKeywords(ans, KEYWORDS_HIGH_RISK)) return 'AGENT';
      if (checkKeywords(ans, KEYWORDS_AGENT)) return 'AGENT';
      return 'existing_coverage';
    }
  },
  existing_coverage: {
    id: 'existing_coverage',
    question: "Do you currently have any life insurance coverage?",
    next: (ans) => {
      return 'medical_exam';
    }
  },
  medical_exam: {
    id: 'medical_exam',
    question: "Are you comfortable taking a free medical exam if required?",
    helperText: "Some policies require a nurse visit; others are no-exam.",
    next: (ans) => {
      if (checkKeywords(ans, KEYWORDS_AGENT)) return 'AGENT';
      return 'next_step_pref';
    }
  },
  next_step_pref: {
    id: 'next_step_pref',
    question: "What is your preferred next step?",
    helperText: "e.g., See estimated prices, Speak to an agent.",
    next: (ans) => {
      if (checkKeywords(ans, KEYWORDS_AGENT) || checkKeywords(ans, ['talk', 'speak', 'call'])) return 'AGENT';
      return 'REVIEW'; // End of flow
    }
  }
};

export const INITIAL_NODE_ID = 'start';
export const STORAGE_KEY = 'life_intake_state_v1';
export { KEYWORDS_AGENT, KEYWORDS_HIGH_RISK, KEYWORDS_HIGH_VALUE };
