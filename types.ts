export interface QuestionNode {
  id: string;
  question: string;
  helperText?: string;
  placeholder?: string;
  /**
   * Returns the ID of the next node based on the user's answer.
   * Return 'REVIEW' to finish, 'AGENT' to force agent exit, 
   * or a node ID to continue.
   */
  next: (answer: string) => string;
}

export interface AnswerRecord {
  nodeId: string;
  question: string;
  answer: string;
}

export type ViewState = 'WIZARD' | 'REVIEW' | 'AGENT_EXIT' | 'THANK_YOU';

export interface AppState {
  currentNodeId: string;
  answers: Record<string, AnswerRecord>; // Map nodeId -> Answer
  history: string[]; // Stack of nodeIds visited
  view: ViewState;
  unclearCount: number; // Track consecutive confusing answers
}
