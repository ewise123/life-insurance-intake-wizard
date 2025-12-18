import React, { useState, useEffect, useRef } from 'react';
import { getEligibleNodeIds, getNextNodeId, getNodeById, INITIAL_NODE_ID, STORAGE_KEY } from './constants';
import { AppState, AnswerRecord, FlowNode } from './types';
import { Button } from './components/Button';
import { Input } from './components/Input';
import { ProgressBar } from './components/ProgressBar';
import { ArrowLeft, Edit2, Phone, CheckCircle, RefreshCcw, ChevronDown, Search } from 'lucide-react';
import logoUrl from './logo.svg';

// --- Components defined inline for file constraints, organized logically ---

/**
 * Global header bar (outside the modal)
 */
const SiteHeader: React.FC = () => {
  const topLinks = ['Claims', 'Make a Payment', 'Contact Us'];
  const mainLinks = ['Life Insurance', 'Retirement', 'Learn', 'Additional Services', 'About Us'];

  return (
    <header className="w-full shadow-sm">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between">
          <div className="flex items-center h-full">
            <button className="h-full px-4 text-sm font-semibold text-white bg-brand-primary rounded-t-lg">
              Individual
            </button>
            <button className="h-full px-4 text-sm font-semibold text-brand-primary hover:text-brand-secondary transition-colors">
              Financial Professional
            </button>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-brand-primary">
            {topLinks.map((label) => (
              <a key={label} href="#" className="hover:text-brand-secondary">
                {label}
              </a>
            ))}
            <span className="h-5 w-px bg-gray-300" aria-hidden="true" />
            <button className="flex items-center gap-1 hover:text-brand-secondary">
              Log in <ChevronDown size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-brand-primary text-white">
        <div className="max-w-6xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="Protective logo" className="h-10 md:h-12 w-auto" />
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
            {mainLinks.map((label) => (
              <a key={label} href="#" className="flex items-center gap-1 hover:text-brand-highlight transition-colors">
                <span>{label}</span>
                <ChevronDown size={14} className="opacity-80" />
              </a>
            ))}
            <button className="hover:text-brand-highlight transition-colors flex items-center gap-1" aria-label="Search">
              <Search size={16} />
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

/**
 * Screen: The Wizard Modal
 */
const WizardScreen: React.FC<{
  node: FlowNode;
  prevAnswer: string;
  stepNumber: number;
  totalSteps: number;
  onNext: (answer: string) => void;
  onBack: () => void;
  canGoBack: boolean;
  onRestart: () => void;
}> = ({ node, prevAnswer, stepNumber, totalSteps, onNext, onBack, canGoBack, onRestart }) => {
  const [value, setValue] = useState(prevAnswer || '');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync state when node changes (handles clearing input or loading previous answer) and focus
  useEffect(() => {
    setValue(prevAnswer || '');
    setError('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [node.id, prevAnswer]);

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const isBoolean = node.answer_type === 'boolean';
  const isDate = node.answer_type === 'date';
  const isInteger = node.answer_type === 'integer';
  const isDecimal = node.answer_type === 'decimal';

  const validateAnswer = (input: string) => {
    const trimmed = input.trim();
    if (isBoolean) {
      return trimmed === 'Yes' || trimmed === 'No' ? '' : 'Please select Yes or No.';
    }
    if (!trimmed) return 'Please enter a response.';
    if (isInteger) {
      return /^-?\d+$/.test(trimmed) ? '' : 'Please enter a whole number.';
    }
    if (isDecimal) {
      return Number.isNaN(Number(trimmed)) ? 'Please enter a number.' : '';
    }
    if (isDate) {
      const timestamp = Date.parse(trimmed);
      return Number.isNaN(timestamp) ? 'Please enter a valid date.' : '';
    }
    return '';
  };

  const handleSubmit = () => {
    const validation = validateAnswer(value);
    if (validation) {
      setError(validation);
      return;
    }
    setError('');
    onNext(value.trim());
  };

  return (
    <div className="flex items-center justify-center p-4 min-h-[calc(100vh-180px)]">
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

        <ProgressBar current={stepNumber} total={totalSteps} />

        {/* Question Content */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-textSecondary mb-3">
            {node.section}
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-brand-text mb-4 leading-tight">
            {node.question}
          </h2>
        </div>

        {/* Input Area */}
        <div className="mb-10">
          {isBoolean ? (
            <div>
              <div className="flex flex-wrap gap-4">
                <Button
                  type="button"
                  variant={value === 'Yes' ? 'primary' : 'secondary'}
                  className="min-w-[120px]"
                  onClick={() => {
                    setValue('Yes');
                    setError('');
                  }}
                >
                  Yes
                </Button>
                <Button
                  type="button"
                  variant={value === 'No' ? 'primary' : 'secondary'}
                  className="min-w-[120px]"
                  onClick={() => {
                    setValue('No');
                    setError('');
                  }}
                >
                  No
                </Button>
              </div>
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            </div>
          ) : (
            <Input 
              ref={inputRef}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (error) setError('');
              }}
              onKeyDown={handleKeyDown}
              type={isDate ? 'date' : isInteger || isDecimal ? 'number' : 'text'}
              inputMode={isInteger ? 'numeric' : isDecimal ? 'decimal' : undefined}
              step={isInteger ? 1 : isDecimal ? 'any' : undefined}
              placeholder="Type your answer here..."
              autoComplete="off"
              error={error}
            />
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSubmit} 
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
    <div className="flex items-center justify-center p-4 min-h-[calc(100vh-180px)]">
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
                  <p className="text-xs font-bold text-brand-textSecondary uppercase tracking-wider mb-1">{record.section}</p>
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
    <div className="flex items-center justify-center p-4 min-h-[calc(100vh-180px)]">
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
    <div className="flex items-center justify-center p-4 min-h-[calc(100vh-180px)]">
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
    const currentNode = getNodeById(state.currentNodeId);
    if (!currentNode) {
      console.warn('Missing flow node for current ID.', state.currentNodeId);
      return;
    }

    const newAnswers: Record<string, AnswerRecord> = {
      ...state.answers,
      [state.currentNodeId]: {
        nodeId: state.currentNodeId,
        question: currentNode.question,
        answer: answerText,
        section: currentNode.section,
        answerType: currentNode.answer_type
      }
    };

    const eligibleIds = getEligibleNodeIds(newAnswers);
    const eligibleSet = new Set(eligibleIds);
    const filteredAnswers = Object.fromEntries(
      Object.entries(newAnswers).filter(([nodeId]) => eligibleSet.has(nodeId))
    ) as Record<string, AnswerRecord>;

    const nextId = getNextNodeId(state.currentNodeId, filteredAnswers);
    const nextHistory = [...state.history, state.currentNodeId].filter((nodeId) => eligibleSet.has(nodeId));

    if (!nextId) {
      setState(prev => ({
        ...prev,
        answers: filteredAnswers,
        history: nextHistory,
        view: 'REVIEW',
        unclearCount: 0
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      answers: filteredAnswers,
      history: nextHistory,
      currentNodeId: nextId,
      view: 'WIZARD',
      unclearCount: 0
    }));
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
    const allowedIds = new Set([...newHistory, targetNodeId]);
    const prunedAnswers = Object.fromEntries(
      Object.entries(state.answers).filter(([nodeId]) => allowedIds.has(nodeId))
    ) as Record<string, AnswerRecord>;

    setState(prev => ({
      ...prev,
      view: 'WIZARD',
      currentNodeId: targetNodeId,
      history: newHistory,
      answers: prunedAnswers,
      unclearCount: 0
    }));
  };

  const handleReviewSubmit = () => {
    setState(prev => ({ ...prev, view: 'THANK_YOU' }));
  };

  const eligibleNodeIds = getEligibleNodeIds(state.answers);
  const stepIndex = eligibleNodeIds.indexOf(state.currentNodeId);
  const stepNumber = stepIndex >= 0 ? stepIndex + 1 : state.history.length + 1;
  const totalSteps = Math.max(stepNumber, eligibleNodeIds.length);
  const currentNode = getNodeById(state.currentNodeId);

  const renderView = () => {
    switch (state.view) {
      case 'WIZARD':
        if (!currentNode) {
          return <div className="p-6 text-center text-red-600">Error: Missing question data</div>;
        }
        return (
          <WizardScreen 
            node={currentNode}
            prevAnswer={state.answers[state.currentNodeId]?.answer || ''}
            stepNumber={stepNumber}
            totalSteps={totalSteps}
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
        return <div className="p-6 text-center text-red-600">Error: Unknown state</div>;
    }
  };

  return (
    <div className="min-h-screen bg-brand-background">
      <SiteHeader />
      {renderView()}
    </div>
  );
};

export default App;
