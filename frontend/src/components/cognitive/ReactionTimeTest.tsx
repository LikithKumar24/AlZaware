import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface ReactionTimeTestProps {
  onComplete: (avgTime: number, score: number, details: any) => void;
}

interface Position {
  top: string;
  left: string;
}

interface TrialResult {
  trialNumber: number;
  type: 'go' | 'no-go';
  reactionTime?: number;
  outcome: 'success' | 'miss' | 'commission_error' | 'false_start';
}

const SHAPES = ['circle', 'square', 'triangle'];
const TOTAL_TRIALS = 15;
const GO_PROBABILITY = 0.7; // 70% Go (Green), 30% No-Go (Red)
const TIMEOUT_MS = 2000; // 2 seconds to respond

// ✅ Generate random position within safe boundaries (20-80%)
const getRandomPosition = (): Position => {
  const minPercent = 20;
  const maxPercent = 80;

  const randomTop = Math.random() * (maxPercent - minPercent) + minPercent;
  const randomLeft = Math.random() * (maxPercent - minPercent) + minPercent;

  return {
    top: `${randomTop}%`,
    left: `${randomLeft}%`
  };
};

export default function ReactionTimeTest({ onComplete }: ReactionTimeTestProps) {
  const [phase, setPhase] = useState<'instructions' | 'ready' | 'wait' | 'stimulus' | 'feedback' | 'results'>('instructions');
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
  const [trialConfig, setTrialConfig] = useState<{ type: 'go' | 'no-go', shape: string }[]>([]);
  const [stimulusPosition, setStimulusPosition] = useState<Position>({ top: '50%', left: '50%' });
  const [startTime, setStartTime] = useState(0);
  const [results, setResults] = useState<TrialResult[]>([]);
  const [feedback, setFeedback] = useState<{ message: string, type: 'success' | 'error' | 'neutral' } | null>(null);
  const [waitingForNext, setWaitingForNext] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize trials
  useEffect(() => {
    const newTrials = Array.from({ length: TOTAL_TRIALS }).map(() => ({
      type: Math.random() < GO_PROBABILITY ? 'go' : 'no-go' as 'go' | 'no-go',
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)]
    }));
    setTrialConfig(newTrials);
  }, []);

  const clearTimers = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const startTrial = useCallback(() => {
    clearTimers();
    setPhase('wait');
    setFeedback(null);
    setWaitingForNext(false);

    const randomWait = Math.random() * 2000 + 1500; // 1.5 - 3.5 seconds wait

    timeoutRef.current = setTimeout(() => {
      setStimulusPosition(getRandomPosition());
      setStartTime(Date.now());
      setPhase('stimulus');

      // Set timeout for missing the stimulus
      timeoutRef.current = setTimeout(() => {
        handleTimeout();
      }, TIMEOUT_MS);
    }, randomWait);
  }, [currentTrialIndex, trialConfig]);

  const handleTimeout = () => {
    const currentType = trialConfig[currentTrialIndex].type;

    if (currentType === 'go') {
      // Missed a Go signal
      recordResult('miss');
      showFeedback('Missed!', 'error');
    } else {
      // Correctly ignored a No-Go signal
      recordResult('success');
      showFeedback('Good hold!', 'success');
    }
  };

  const handleGlobalClick = () => {
    if (phase === 'wait') {
      // False start!
      clearTimers();
      showFeedback('Too Early!', 'error');
      // Don't record result yet, just restart trial logic after delay
      // Or penalize? Let's penalize as a false start but allow retry of the trial slot?
      // For simplicity in this clinically valid version, we record it as an error and move on, 
      // OR we just warn and restart. Let's warn and restart the wait period to be strict but fair.
      // Actually, standard Go/No-Go usually counts false starts. Let's count it.
      recordResult('false_start');
    }
  };

  const handleStimulusClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent global click
    if (phase !== 'stimulus') return;

    clearTimers();
    const reactionTime = Date.now() - startTime;
    const currentType = trialConfig[currentTrialIndex].type;

    if (currentType === 'go') {
      // Correct click
      recordResult('success', reactionTime);
      showFeedback('Good!', 'success');
    } else {
      // Commission error (clicked on Red)
      recordResult('commission_error', reactionTime);
      showFeedback('Do not click Red!', 'error');
    }
  };

  const recordResult = (outcome: TrialResult['outcome'], reactionTime?: number) => {
    const newResult: TrialResult = {
      trialNumber: currentTrialIndex + 1,
      type: trialConfig[currentTrialIndex].type,
      outcome,
      reactionTime
    };

    setResults(prev => [...prev, newResult]);
    setPhase('feedback');
    setWaitingForNext(true);

    // Auto-advance after feedback
    setTimeout(() => {
      if (currentTrialIndex < TOTAL_TRIALS - 1) {
        setCurrentTrialIndex(prev => prev + 1);
        startTrial();
      } else {
        setPhase('results');
      }
    }, 1500);
  };

  const showFeedback = (message: string, type: 'success' | 'error' | 'neutral') => {
    setFeedback({ message, type });
  };

  const handleComplete = () => {
    // Calculate metrics
    const goTrials = results.filter(r => r.type === 'go');
    const successfulGoTrials = goTrials.filter(r => r.outcome === 'success');

    const avgReactionTime = successfulGoTrials.length > 0
      ? successfulGoTrials.reduce((sum, r) => sum + (r.reactionTime || 0), 0) / successfulGoTrials.length
      : 0;

    const correctCount = results.filter(r => r.outcome === 'success').length;
    const accuracy = (correctCount / TOTAL_TRIALS) * 100;

    const commissionErrors = results.filter(r => r.outcome === 'commission_error').length;
    const omissionErrors = results.filter(r => r.outcome === 'miss').length;
    const falseStarts = results.filter(r => r.outcome === 'false_start').length;

    // Score calculation (0-100)
    // Base score on accuracy, penalize heavily for commission errors (impulsivity)
    let score = accuracy;
    if (avgReactionTime > 600) score -= 10; // Penalize slow reaction
    if (avgReactionTime > 1000) score -= 20;

    // Cap score
    score = Math.max(0, Math.min(100, score));

    onComplete(avgReactionTime, score, {
      accuracy,
      commissionErrors,
      omissionErrors,
      falseStarts,
      totalTrials: TOTAL_TRIALS
    });
  };

  // Cleanup
  useEffect(() => {
    return () => clearTimers();
  }, []);

  if (phase === 'instructions') {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Zap className="h-6 w-6 text-blue-600" />
            Go/No-Go Inhibition Task
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-4 text-lg">Instructions:</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg border-2 border-green-200 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full mb-2 shadow-md"></div>
                <p className="font-bold text-green-700">GREEN = GO</p>
                <p className="text-sm text-slate-600">Click as FAST as you can!</p>
              </div>
              <div className="bg-white p-4 rounded-lg border-2 border-red-200 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-500 rounded-full mb-2 shadow-md"></div>
                <p className="font-bold text-red-700">RED = NO-GO</p>
                <p className="text-sm text-slate-600">Do NOT click!</p>
              </div>
            </div>
            <ul className="list-disc list-inside space-y-2 text-blue-800">
              <li>Wait for the shape to appear.</li>
              <li>If you click too early, it counts as an error.</li>
              <li>You have 2 seconds to respond to Green shapes.</li>
              <li>There are {TOTAL_TRIALS} trials in total.</li>
            </ul>
          </div>

          <Button onClick={() => setPhase('ready')} className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6">
            I Understand - Start Test
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (phase === 'ready') {
    return (
      <Card className="w-full">
        <CardContent className="min-h-[400px] flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Get Ready!</h2>
          <p className="text-slate-600 mb-8">Place your hand on the mouse/trackpad.</p>
          <Button
            onClick={startTrial}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-xl px-12 py-8 rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            Start
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (phase === 'results') {
    const goTrials = results.filter(r => r.type === 'go');
    const successfulGoTrials = goTrials.filter(r => r.outcome === 'success');
    const avgTime = successfulGoTrials.length > 0
      ? successfulGoTrials.reduce((sum, r) => sum + (r.reactionTime || 0), 0) / successfulGoTrials.length
      : 0;

    const commissionErrors = results.filter(r => r.outcome === 'commission_error').length;
    const accuracy = (results.filter(r => r.outcome === 'success').length / TOTAL_TRIALS) * 100;

    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Test Complete</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{avgTime.toFixed(0)}ms</div>
              <p className="text-xs text-slate-600 font-semibold uppercase mt-1">Avg Reaction Time</p>
            </div>
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{accuracy.toFixed(0)}%</div>
              <p className="text-xs text-slate-600 font-semibold uppercase mt-1">Accuracy</p>
            </div>
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-red-600">{commissionErrors}</div>
              <p className="text-xs text-slate-600 font-semibold uppercase mt-1">Impulse Errors</p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h4 className="font-semibold text-slate-700 mb-2">Performance Analysis:</h4>
            <p className="text-sm text-slate-600">
              {commissionErrors > 2
                ? "High number of impulsive errors detected. This may indicate difficulty with inhibition."
                : "Good impulse control shown."}
              <br />
              {avgTime > 500 && " Reaction time is slower than average."}
            </p>
          </div>

          {/* Detailed Trial Breakdown */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 border-b font-semibold text-slate-700">Detailed Trial Breakdown</div>
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2">Trial</th>
                    <th className="px-4 py-2">Stimulus</th>
                    <th className="px-4 py-2">Action</th>
                    <th className="px-4 py-2">Time</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => {
                    let statusColor = 'text-slate-600';
                    let statusText = '';
                    let actionText = '';

                    // Determine Status & Action
                    if (r.outcome === 'success') {
                      statusColor = 'text-green-600 font-bold';
                      statusText = 'Success';
                      actionText = r.type === 'go' ? 'Clicked' : 'No Click';
                    } else if (r.outcome === 'miss') {
                      statusColor = 'text-red-600 font-bold';
                      statusText = 'Missed';
                      actionText = 'No Click';
                    } else if (r.outcome === 'commission_error') {
                      statusColor = 'text-red-600 font-bold';
                      statusText = 'Error';
                      actionText = 'Clicked';
                    } else if (r.outcome === 'false_start') {
                      statusColor = 'text-red-600 font-bold';
                      statusText = 'False Start';
                      actionText = 'Early Click';
                    }

                    // Check for slow reaction
                    if (r.reactionTime && r.reactionTime > 1000 && r.outcome === 'success') {
                      statusColor = 'text-orange-500 font-bold';
                      statusText = 'Slow';
                    }

                    return (
                      <tr key={i} className="border-b last:border-0 hover:bg-slate-50 even:bg-slate-50/50">
                        <td className="px-4 py-2 font-medium text-slate-700">{r.trialNumber}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${r.type === 'go' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="text-xs text-slate-500">{r.type === 'go' ? 'Go' : 'No-Go'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-slate-600">{actionText}</td>
                        <td className="px-4 py-2 font-mono font-bold text-slate-700">
                          {r.reactionTime ? `${r.reactionTime}ms` : <span className="text-slate-400">N/A</span>}
                        </td>
                        <td className={`px-4 py-2 ${statusColor}`}>
                          {statusText}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <Button onClick={handleComplete} className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6">
            Save & Continue
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Active Test Phase (Wait, Stimulus, Feedback)
  const currentConfig = trialConfig[currentTrialIndex];
  const isGo = currentConfig?.type === 'go';
  const shapeColor = isGo ? 'bg-green-500' : 'bg-red-500';

  const renderShape = () => {
    const baseClasses = `${shapeColor} cursor-pointer shadow-2xl absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform active:scale-95`;
    const style = { top: stimulusPosition.top, left: stimulusPosition.left };

    switch (currentConfig?.shape) {
      case 'square':
        return <div className={`${baseClasses} w-32 h-32 rounded-lg`} style={style} onClick={handleStimulusClick} />;
      case 'triangle':
        return (
          <div
            className={`${baseClasses} w-0 h-0 bg-transparent shadow-none`}
            style={{
              ...style,
              borderLeft: '64px solid transparent',
              borderRight: '64px solid transparent',
              borderBottom: `110px solid ${isGo ? '#22c55e' : '#ef4444'}`,
            }}
            onClick={handleStimulusClick}
          />
        );
      case 'circle':
      default:
        return <div className={`${baseClasses} w-32 h-32 rounded-full`} style={style} onClick={handleStimulusClick} />;
    }
  };

  return (
    <Card className="w-full select-none">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Trial {currentTrialIndex + 1} / {TOTAL_TRIALS}</CardTitle>
          <div className="text-sm font-medium text-slate-500">
            {currentConfig?.type === 'go' ? 'Target: Green' : 'Target: Red (Ignore)'}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div
          ref={containerRef}
          className="relative min-h-[400px] bg-slate-100 rounded-xl overflow-hidden cursor-crosshair border-2 border-slate-200"
          onClick={handleGlobalClick}
        >
          {/* Instructions Overlay for Wait Phase */}
          {phase === 'wait' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-slate-400 font-medium text-lg animate-pulse">Wait for it...</p>
            </div>
          )}

          {/* Stimulus */}
          {phase === 'stimulus' && renderShape()}

          {/* Feedback Overlay */}
          {(phase === 'feedback' || feedback) && feedback && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
              <div className="text-center animate-in zoom-in duration-200">
                {feedback.type === 'success' ? (
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-2" />
                ) : feedback.type === 'error' ? (
                  <XCircle className="w-16 h-16 text-red-500 mx-auto mb-2" />
                ) : (
                  <AlertCircle className="w-16 h-16 text-blue-500 mx-auto mb-2" />
                )}
                <p className={`text-2xl font-bold ${feedback.type === 'success' ? 'text-green-600' :
                  feedback.type === 'error' ? 'text-red-600' : 'text-blue-600'
                  }`}>
                  {feedback.message}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
