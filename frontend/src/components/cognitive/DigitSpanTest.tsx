import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Hash, Check, X } from 'lucide-react';

interface DigitSpanTestProps {
  onComplete: (score: number, maxScore: number) => void;
}

export default function DigitSpanTest({ onComplete }: DigitSpanTestProps) {
  const [phase, setPhase] = useState<'instructions' | 'forward' | 'backward' | 'results'>('instructions');
  const [currentLevel, setCurrentLevel] = useState(3); // actual level
  const [inputLength, setInputLength] = useState(3);  // FIXED: expected digits
  const [currentSequence, setCurrentSequence] = useState<number[]>([]);
  const [userInput, setUserInput] = useState('');
  const [showSequence, setShowSequence] = useState(false);
  const [forwardScore, setForwardScore] = useState(0);
  const [backwardScore, setBackwardScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateSequence = (length: number) => {
    const sequence = [];
    for (let i = 0; i < length; i++) {
      sequence.push(Math.floor(Math.random() * 9) + 1);
    }
    return sequence;
  };

  const startForward = () => {
    setPhase('forward');
    setCurrentLevel(3);
    setInputLength(3);
    setAttempts(0);
    showNextSequence(3);
  };

  const startBackward = () => {
    setPhase('backward');
    setCurrentLevel(3);
    setInputLength(3);
    setAttempts(0);
    showNextSequence(3);
  };

  const showNextSequence = (level?: number) => {
    const lvl = level ?? currentLevel;

    const sequence = generateSequence(lvl);
    setCurrentSequence(sequence);

    // FIX: Correct inputLength always matches the displayed sequence
    setInputLength(lvl);

    setShowSequence(true);
    setUserInput('');

    // Hide sequence automatically
    setTimeout(() => {
      setShowSequence(false);
    }, 2000 + lvl * 500);
  };

  const handleSubmit = () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const correctSequence =
        phase === 'forward'
          ? currentSequence.join('')
          : [...currentSequence].reverse().join('');

      const isCorrect = userInput === correctSequence;

      setResults(prev => [
        ...prev,
        {
          phase,
          level: currentLevel,
          sequence: [...currentSequence],
          userAnswer: userInput,
          correct: isCorrect,
        },
      ]);

      if (isCorrect) {
        if (phase === 'forward') {
          setForwardScore(currentLevel);
        } else {
          setBackwardScore(currentLevel);
        }

        const nextLevel = currentLevel + 1;

        setCurrentLevel(nextLevel);

        // FIX: update expected input length ONLY when progressing
        setInputLength(nextLevel);

        setAttempts(0);

        setTimeout(() => {
          setIsSubmitting(false);
          showNextSequence(nextLevel);
        }, 300);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= 2) {
          if (phase === 'forward') {
            setTimeout(() => {
              setIsSubmitting(false);
              startBackward();
            }, 300);
          } else {
            setTimeout(() => {
              setIsSubmitting(false);
              setPhase('results');
            }, 300);
          }
        } else {
          setTimeout(() => {
            setIsSubmitting(false);
            showNextSequence(currentLevel); // retry same level
          }, 300);
        }
      }
    } catch (error) {
      console.error('DigitSpan error:', error);
      setIsSubmitting(false);
    }
  };

  // --- UI RENDERING ---

  if (phase === 'instructions') {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Hash className="h-6 w-6 text-blue-600" />
            Digit Span Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
            <ul className="list-disc list-inside space-y-2 text-blue-800">
              <li>You will see a sequence of numbers briefly</li>
              <li><strong>Forward:</strong> Repeat them in same order</li>
              <li><strong>Backward:</strong> Repeat them in reverse</li>
              <li>Sequence starts at 3 digits</li>
              <li>2 attempts per level</li>
            </ul>
          </div>

          <Button onClick={startForward} className="w-full bg-blue-600 hover:bg-blue-700">
            Start Test
          </Button>
        </CardContent>
      </Card>
    );
  }

  if ((phase === 'forward' || phase === 'backward') && !showSequence) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center">
            {phase === 'forward' ? 'Forward' : 'Backward'} - Level {currentLevel}
          </CardTitle>
          <p className="text-center text-sm text-slate-600">Attempt {attempts + 1} of 2</p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-slate-50 rounded-lg p-8 text-center">
            <p className="text-lg text-slate-700 mb-4">
              Enter the digits {phase === 'backward' ? 'in reverse order' : 'in the same order'}:
            </p>

            <Input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter digits"
              className="text-center text-2xl font-bold"
              maxLength={inputLength} // FIXED
              autoFocus
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={userInput.length !== inputLength || isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Processing...' : 'Submit Answer'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (showSequence) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center">
            {phase === 'forward' ? 'Forward' : 'Backward'} - Level {currentLevel}
          </CardTitle>
          <p className="text-center text-sm text-slate-600">Memorize this sequence</p>
        </CardHeader>

        <CardContent>
          <div className="flex items-center justify-center min-h-[300px] bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
            <div className="flex gap-6">
              {currentSequence.map((digit, index) => (
                <div
                  key={index}
                  className="bg-white border-4 border-blue-400 rounded-xl w-20 h-20 flex items-center justify-center text-4xl font-bold text-blue-600 shadow-lg animate-bounce"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {digit}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // --- Results Page ---
  if (phase === 'results') {
    const totalScore = forwardScore + backwardScore;
    const maxPossible = 16;

    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Results</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{forwardScore}</div>
              <p className="text-sm text-slate-600">Forward Span</p>
            </div>

            <div className="bg-indigo-50 border-2 border-indigo-300 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-indigo-600">{backwardScore}</div>
              <p className="text-sm text-slate-600">Backward Span</p>
            </div>
          </div>

          <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 text-center">
            <div className="text-4xl font-bold text-green-600">{totalScore}</div>
            <p className="text-sm text-slate-600">Total Digit Span Score</p>
          </div>

          <Button onClick={() => onComplete(totalScore, maxPossible)} className="w-full bg-blue-600 hover:bg-blue-700">
            Continue to Next Test
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <div>Loading...</div>;
}
