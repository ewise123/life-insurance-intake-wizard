export type AnswerType = 'boolean' | 'single_select' | 'text' | 'date' | 'integer' | 'decimal';

export interface FlowNode {
  id: string;
  section: string;
  type: 'gateway' | 'follow_on';
  question: string;
  answer_type: AnswerType;
  trigger?: string;
  added_for_underwriting: boolean;
  children?: string[];
}

export interface FlowDefinition {
  carrier: string;
  artifact_type: string;
  version: string;
  generated_at: string;
  notes?: string[];
  root_nodes: string[];
  nodes: FlowNode[];
  optional_rules?: Record<string, Array<Record<string, string>>>;
}

export interface AnswerRecord {
  nodeId: string;
  question: string;
  answer: string;
  section: string;
  answerType: AnswerType;
}

export type ViewState = 'WIZARD' | 'REVIEW' | 'AGENT_EXIT' | 'THANK_YOU';

export interface AppState {
  currentNodeId: string;
  answers: Record<string, AnswerRecord>; // Map nodeId -> Answer
  history: string[]; // Stack of nodeIds visited
  view: ViewState;
  unclearCount: number; // Track consecutive confusing answers
}
