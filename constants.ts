import flowData from './data/flows/new-flow.json';
import { AnswerRecord, FlowDefinition, FlowNode } from './types';

export const STORAGE_KEY = 'life_intake_state_v2';

export const FLOW_DEFINITION = flowData as FlowDefinition;

const nodesById = new Map<string, FlowNode>();
FLOW_DEFINITION.nodes.forEach((node) => {
  nodesById.set(node.id, node);
});

const buildFlowOrder = () => {
  const ordered: string[] = [];
  const seen = new Set<string>();

  FLOW_DEFINITION.root_nodes.forEach((rootId) => {
    if (!seen.has(rootId)) {
      ordered.push(rootId);
      seen.add(rootId);
    }
    const rootNode = nodesById.get(rootId);
    rootNode?.children?.forEach((childId) => {
      if (!seen.has(childId)) {
        ordered.push(childId);
        seen.add(childId);
      }
    });
  });

  return ordered;
};

const FLOW_ORDER = buildFlowOrder();

export const getNodeById = (id: string) => nodesById.get(id);

export const getFlowOrder = () => FLOW_ORDER.slice();

const parseBoolean = (value: string) => {
  const normalized = value.trim().toLowerCase();
  if (['true', 'yes', 'y'].includes(normalized)) return true;
  if (['false', 'no', 'n'].includes(normalized)) return false;
  return null;
};

const parseLiteral = (raw: string) => {
  const trimmed = raw.trim();
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  const numeric = Number(trimmed);
  if (!Number.isNaN(numeric) && /^-?\d+(\.\d+)?$/.test(trimmed)) {
    return numeric;
  }
  return trimmed.replace(/^['"]|['"]$/g, '');
};

const parseAnswerValue = (node: FlowNode, answer: string) => {
  const trimmed = answer.trim();
  if (!trimmed) return null;

  switch (node.answer_type) {
    case 'boolean':
      return parseBoolean(trimmed);
    case 'integer': {
      const value = Number.parseInt(trimmed, 10);
      return Number.isNaN(value) ? null : value;
    }
    case 'decimal': {
      const value = Number.parseFloat(trimmed);
      return Number.isNaN(value) ? null : value;
    }
    case 'date':
      return trimmed;
    default:
      return trimmed;
  }
};

const getAnswerValue = (nodeId: string, answers: Record<string, AnswerRecord>) => {
  const record = answers[nodeId];
  if (!record) return null;
  const node = nodesById.get(nodeId);
  if (!node) return null;
  return parseAnswerValue(node, record.answer);
};

const evaluateClause = (clause: string, answers: Record<string, AnswerRecord>) => {
  const trimmed = clause.trim();
  if (!trimmed) return false;
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;

  const containsMatch = trimmed.match(/^(.+?)\s+CONTAINS\s+(.+)$/i);
  if (containsMatch) {
    const leftId = containsMatch[1].trim();
    const right = parseLiteral(containsMatch[2]);
    const leftValue = getAnswerValue(leftId, answers);
    if (leftValue === null || right === null) return false;
    return String(leftValue).toLowerCase().includes(String(right).toLowerCase());
  }

  const compareMatch = trimmed.match(/^(.+?)\s*(==|>=|<=|>|<)\s*(.+)$/);
  if (!compareMatch) return false;

  const leftId = compareMatch[1].trim();
  const operator = compareMatch[2];
  const rightLiteral = parseLiteral(compareMatch[3]);
  const leftValue = getAnswerValue(leftId, answers);

  if (leftValue === null) return false;

  const leftNumber = typeof leftValue === 'number' ? leftValue : Number(leftValue);
  const rightNumber = typeof rightLiteral === 'number' ? rightLiteral : Number(rightLiteral);

  const bothNumbers = !Number.isNaN(leftNumber) && !Number.isNaN(rightNumber);

  if (operator === '==') {
    return String(leftValue).toLowerCase() === String(rightLiteral).toLowerCase();
  }

  if (!bothNumbers) return false;

  switch (operator) {
    case '>':
      return leftNumber > rightNumber;
    case '>=':
      return leftNumber >= rightNumber;
    case '<':
      return leftNumber < rightNumber;
    case '<=':
      return leftNumber <= rightNumber;
    default:
      return false;
  }
};

export const evaluateTrigger = (trigger: string | undefined, answers: Record<string, AnswerRecord>) => {
  if (!trigger) return false;
  const trimmed = trigger.trim();
  if (!trimmed) return false;

  const orParts = trimmed.split(/\s+OR\s+/i);
  return orParts.some((part) => {
    const andParts = part.split(/\s+AND\s+/i);
    return andParts.every((clause) => evaluateClause(clause, answers));
  });
};

export const isNodeEligible = (node: FlowNode, answers: Record<string, AnswerRecord>) => {
  if (node.type === 'gateway') return true;
  return evaluateTrigger(node.trigger, answers);
};

export const getEligibleNodeIds = (answers: Record<string, AnswerRecord>) => {
  return FLOW_ORDER.filter((nodeId) => {
    const node = nodesById.get(nodeId);
    return node ? isNodeEligible(node, answers) : false;
  });
};

export const getNextNodeId = (currentId: string, answers: Record<string, AnswerRecord>) => {
  const currentIndex = FLOW_ORDER.indexOf(currentId);
  if (currentIndex === -1) return null;

  for (let idx = currentIndex + 1; idx < FLOW_ORDER.length; idx += 1) {
    const nextId = FLOW_ORDER[idx];
    const node = nodesById.get(nextId);
    if (node && isNodeEligible(node, answers)) {
      return nextId;
    }
  }

  return null;
};

export const INITIAL_NODE_ID = FLOW_DEFINITION.root_nodes[0] ?? '';
