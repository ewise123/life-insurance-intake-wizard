import React, { useState, useEffect, useRef } from 'react';
import { KEYWORDS_AGENT, QUESTION_TREE, INITIAL_NODE_ID, STORAGE_KEY } from './constants';
import { AppState, ViewState, AnswerRecord } from './types';
import { Button } from './components/Button';
import { Input } from './components/Input';
import { ProgressBar } from './components/ProgressBar';
import { ArrowLeft, Edit2, Phone, CheckCircle, AlertCircle, RefreshCcw } from 'lucide-react';

// --- Components defined inline for file constraints, organized logically ---

/**
 * Screen: The Wizard Modal
 */
const WizardScreen: React.FC<{
  nodeId: string;
  prevAnswer: string;
  stepNumber: number;
  onNext: (answer: string) => void;
  onBack: () => void;
  canGoBack: boolean;
  onRestart: () => void;
}> = ({ nodeId, prevAnswer, stepNumber, onNext, onBack, canGoBack, onRestart }) => {
  const node = QUESTION_TREE[nodeId];
  const [value, setValue] = useState(prevAnswer || '');
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync state when node changes (handles clearing input or loading previous answer) and focus
  useEffect(() => {
    setValue(prevAnswer || '');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [nodeId, prevAnswer]);

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim()) {
      onNext(value);
    }
  };

  const totalStepsEst = 10; // Estimated for UI visualization

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-xl p-8 md:p-10 relative border-t-4 border-brand-primary">
        
        {/* Header / Nav */}
        <div className="flex justify-between items-center mb-6">
           {canGoBack ? (
             <button onClick={onBack} className="text-brand-textSecondary hover:text-brand-primary flex items-center gap-1 text-sm font-semibold transition-colors">
               <ArrowLeft size={16} /> Back
             </button>
           ) : <div />}
           <button onClick={onRestart} className="text-brand-textSecondary hover:text-brand-primary text-xs font-semibold uppercase tracking-wider">
             Start Over
           </button>
        </div>

        <ProgressBar current={stepNumber} total={totalStepsEst} />

        {/* Question Content */}
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-text mb-4 leading-tight">
            {node.question}
          </h2>
          {node.helperText && (
            <p className="text-brand-textSecondary text-lg">
              {node.helperText}
            </p>
          )}
        </div>

        {/* Input Area */}
        <div className="mb-10">
          <Input 
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={node.placeholder || "Type your answer here..."}
            autoComplete="off"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end">
          <Button 
            onClick={() => onNext(value)} 
            disabled={!value.trim()}
            className="w-full md:w-auto min-w-[140px]"
          >
            Next
          </Button>
        </div>

      </div>
    </div>
  );
};

/**
 * Screen: Review
 */
const ReviewScreen: React.FC<{
  answers: Record<string, AnswerRecord>;
  history: string[];
  onSubmit: () => void;
  onEdit: (nodeId: string) => void;
}> = ({ answers, history, onSubmit, onEdit }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-xl p-8 md:p-10 border-t-4 border-brand-primary">
        <h2 className="text-3xl font-bold text-brand-text mb-2">Review your information</h2>
        <p className="text-brand-textSecondary mb-8">Please check your answers before submitting.</p>

        <div className="space-y-6 mb-10">
          {history.map((nodeId, idx) => {
            const record = answers[nodeId];
            if (!record) return null;
            return (
              <div key={nodeId} className="flex flex-col md:flex-row md:justify-between md:items-start py-4 border-b border-gray-100 group">
                <div className="flex-1 pr-4">
                  <p className="text-sm font-bold text-brand-textSecondary uppercase tracking-wider mb-1">Question {idx + 1}</p>
                  <p className="text-brand-text font-semibold mb-1">{record.question}</p>
                  <p className="text-brand-primary text-lg">{record.answer}</p>
                </div>
                <button 
                  onClick={() => onEdit(nodeId)}
                  className="mt-2 md:mt-0 text-brand-textSecondary hover:text-brand-primary flex items-center gap-1 text-sm font-semibold opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit2 size={14} /> Edit
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end">
          <Button onClick={onSubmit} className="w-full md:w-auto min-w-[200px]">
            Submit Application
          </Button>
        </div>
      </div>
    </div>
  );
};

/**
 * Screen: Agent Exit (Early Termination)
 */
const AgentExitScreen: React.FC<{ onFinish: () => void; onRestart: () => void }> = ({ onFinish, onRestart }) => {
  const [contactMethod, setContactMethod] = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl p-8 md:p-12 text-center border-t-4 border-brand-primary">
        <div className="w-16 h-16 bg-brand-highlight/30 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-primary">
          <Phone size={32} />
        </div>
        
        <h2 className="text-2xl md:text-3xl font-bold text-brand-text mb-4">
          Let's connect you with an expert
        </h2>
        
        <p className="text-lg text-brand-textSecondary mb-8 max-w-lg mx-auto">
          Based on your responses, the best way to get you accurate coverage is to speak directly with a licensed representative. This allows us to handle the details with care.
        </p>

        <div className="bg-brand-background rounded-lg p-6 mb-8 text-left">
          <label className="block text-sm font-bold text-brand-text mb-2">
            What is the best way and time to reach you?
          </label>
          <Input 
            placeholder="e.g., Phone in the evenings, or email me..." 
            value={contactMethod}
            onChange={(e) => setContactMethod(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-3">
          <Button onClick={onFinish} fullWidth>
            Request Callback
          </Button>
          <Button variant="ghost" onClick={onRestart}>
            Start Over
          </Button>
        </div>
      </div>
    </div>
  );
};

/**
 * Screen: Thank You
 */
const ThankYouScreen: React.FC<{ onRestart: () => void }> = ({ onRestart }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-xl p-8 md:p-12 text-center border-t-4 border-brand-primary">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
          <CheckCircle size={40} />
        </div>
        
        <h2 className="text-3xl font-bold text-brand-text mb-4">
          You're all set!
        </h2>
        
        <p className="text-brand-textSecondary mb-10 text-lg">
          We have received your information. A confirmation has been saved. We will be in touch shortly with your personalized options.
        </p>

        <Button onClick={onRestart} variant="secondary">
          <RefreshCcw size={16} className="mr-2 inline" /> Start New Intake
        </Button>
      </div>
    </div>
  );
};

// --- Main App Logic ---

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to load state", e);
      }
    }
    return {
      currentNodeId: INITIAL_NODE_ID,
      answers: {},
      history: [],
      view: 'WIZARD',
      unclearCount: 0
    };
  });

  // Persistence
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const handleNext = (answerText: string) => {
    const currentNode = QUESTION_TREE[state.currentNodeId];
    
    // Determine next step ID
    let nextId = '';
    try {
      nextId = currentNode.next(answerText);
    } catch (e) {
      console.warn("Error in node logic, defaulting to fallback or agent", e);
      nextId = 'AGENT'; // Fallback
    }

    // Logic: Handling Unclear Answers
    // For this demo, we assume the `next` function in constants.ts handles simple branching.
    // However, if the `next` function returns the SAME id (loop), we count it as unclear.
    // Or if we specifically route to a generic 'clarification' logic (not fully implemented in tree for brevity, assuming tree handles it).
    // Let's implement a "repeated answer" check or just trust the tree.
    // We will trust the tree's returned ID.

    let newUnclearCount = state.unclearCount;
    // Heuristic: if user input is very short and nextId is a clarification node? 
    // Simplified: The prompt says "User repeatedly gives unusable answers (e.g. 2 clarifications) -> Agent".
    // We'll simulate this: if the returned nextId contains "clarification", increment count.
    if (nextId.includes('clarification')) {
      newUnclearCount++;
    } else {
      newUnclearCount = 0;
    }

    if (newUnclearCount >= 2) {
      nextId = 'AGENT';
    }

    // Update State
    const newAnswers = {
      ...state.answers,
      [state.currentNodeId]: {
        nodeId: state.currentNodeId,
        question: currentNode.question,
        answer: answerText
      }
    };

    if (nextId === 'AGENT') {
      setState(prev => ({
        ...prev,
        answers: newAnswers,
        view: 'AGENT_EXIT',
        unclearCount: newUnclearCount
      }));
    } else if (nextId === 'REVIEW') {
      // Add current node to history before review so it shows up
      setState(prev => ({
        ...prev,
        answers: newAnswers,
        history: [...prev.history, prev.currentNodeId],
        view: 'REVIEW',
        unclearCount: 0
      }));
    } else {
      // Proceed to next wizard step
      setState(prev => ({
        ...prev,
        answers: newAnswers,
        history: [...prev.history, prev.currentNodeId],
        currentNodeId: nextId,
        unclearCount: newUnclearCount
      }));
    }
  };

  const handleBack = () => {
    if (state.history.length === 0) return;
    const newHistory = [...state.history];
    const prevNodeId = newHistory.pop();
    
    if (prevNodeId) {
      setState(prev => ({
        ...prev,
        history: newHistory,
        currentNodeId: prevNodeId,
        view: 'WIZARD' // Ensure we are back in wizard mode if coming from elsewhere (unlikely in this flow)
      }));
    }
  };

  const handleRestart = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState({
      currentNodeId: INITIAL_NODE_ID,
      answers: {},
      history: [],
      view: 'WIZARD',
      unclearCount: 0
    });
  };

  const handleEdit = (targetNodeId: string) => {
    // To edit, we must rewind history to that point to maintain decision tree integrity.
    // Find index of targetNode in history
    const targetIndex = state.history.indexOf(targetNodeId);
    if (targetIndex === -1 && targetNodeId !== state.currentNodeId) {
       // Should not happen normally if we only list history
       return;
    }
    
    // Slice history up to that point (exclusive of the target, because we are ABOUT to be AT the target)
    // Wait, if target is in history, we want to go back to it.
    // The history stack represents "past" steps. The "current" step is not in history.
    // So if we go to targetNodeId, the new history should be history.slice(0, targetIndex).
    const newHistory = state.history.slice(0, targetIndex);

    setState(prev => ({
      ...prev,
      view: 'WIZARD',
      currentNodeId: targetNodeId,
      history: newHistory
    }));
  };

  const handleReviewSubmit = () => {
    setState(prev => ({ ...prev, view: 'THANK_YOU' }));
  };

  // Render View Switcher
  switch (state.view) {
    case 'WIZARD':
      return (
        <WizardScreen 
          nodeId={state.currentNodeId}
          prevAnswer={state.answers[state.currentNodeId]?.answer || ''}
          stepNumber={state.history.length + 1}
          onNext={handleNext}
          onBack={handleBack}
          canGoBack={state.history.length > 0}
          onRestart={handleRestart}
        />
      );
    case 'REVIEW':
      return (
        <ReviewScreen 
          answers={state.answers}
          history={state.history}
          onSubmit={handleReviewSubmit}
          onEdit={handleEdit}
        />
      );
    case 'AGENT_EXIT':
      return (
        <AgentExitScreen 
          onFinish={() => setState(prev => ({ ...prev, view: 'THANK_YOU' }))} 
          onRestart={handleRestart}
        />
      );
    case 'THANK_YOU':
      return <ThankYouScreen onRestart={handleRestart} />;
    default:
      return <div>Error: Unknown state</div>;
  }
};

export default App;