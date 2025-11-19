import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palette, Check, X } from 'lucide-react';

interface StroopTestProps {
  onComplete: (score: number, maxScore: number, avgTime: number) => void;
}

const COLORS = [
  { name: 'RED', color: 'text-red-600', bgColor: 'bg-red-100' },
  { name: 'BLUE', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { name: 'GREEN', color: 'text-green-600', bgColor: 'bg-green-100' },
  { name: 'YELLOW', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  { name: 'PURPLE', color: 'text-purple-600', bgColor: 'bg-purple-100' },
];

const NUM_TRIALS = 15;

export default function StroopTest({ onComplete }: StroopTestProps) {
  const [phase, setPhase] = useState<'instructions' | 'test' | 'results'>('instructions');
  const [currentTrial, setCurrentTrial] = useState(0);
  const [trials, setTrials] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [startTime, setStartTime] = useState(0);

  useEffect(() => {
    // Generate trials
    const generatedTrials = [];
    for (let i = 0; i < NUM_TRIALS; i++) {
      const wordColor = COLORS[Math.floor(Math.random() * COLORS.length)];
      const displayColor = COLORS[Math.floor(Math.random() * COLORS.length)];
      generatedTrials.push({ word: wordColor.name, displayColor: displayColor });
    }
    setTrials(generatedTrials);
  }, []);

  const startTest = () => {
    setPhase('test');
    setStartTime(Date.now());
  };

  const handleAnswer = (selectedColor: string) => {
    const responseTime = Date.now() - startTime;
    const currentTrialData = trials[currentTrial];
    const isCorrect = selectedColor === currentTrialData.displayColor.name;

    setResults([...results, {
      trial: currentTrial + 1,
      correct: isCorrect,
      responseTime,
      word: currentTrialData.word,
      displayColor: currentTrialData.displayColor.name,
      userAnswer: selectedColor
    }]);

    if (currentTrial < NUM_TRIALS - 1) {
      setCurrentTrial(currentTrial + 1);
      setStartTime(Date.now());
    } else {
      setPhase('results');
    }
  };

  const handleComplete = () => {
    const correctCount = results.filter(r => r.correct).length;
    const avgTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
    onComplete(correctCount, NUM_TRIALS, avgTime);
  };

  if (phase === 'instructions') {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Palette className="h-6 w-6 text-orange-600" />
            Stroop Color Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h3 className="font-semibold text-orange-900 mb-2">Instructions:</h3>
            <ul className="list-disc list-inside space-y-2 text-orange-800">
              <li>You will see color words displayed in different colors</li>
              <li>Your task: Click the button matching the <strong>font color</strong>, not the word</li>
              <li>Example: If "RED" appears in blue text, click BLUE</li>
              <li>This tests attention and processing speed</li>
              <li>Respond as quickly and accurately as possible</li>
            </ul>
          </div>
          
          <div className="bg-slate-100 rounded-lg p-6 text-center">
            <p className="text-sm text-slate-600 mb-3">Example:</p>
            <div className="text-4xl font-bold text-blue-600 mb-3">RED</div>
            <p className="text-sm text-slate-700">
              The word says "RED" but the color is BLUE<br />
              So you should click <strong>BLUE</strong>
            </p>
          </div>
          
          <Button onClick={startTest} className="w-full bg-orange-600 hover:bg-orange-700">
            Start Test ({NUM_TRIALS} trials)
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (phase === 'test' && trials.length > 0) {
    const currentTrialData = trials[currentTrial];
    
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center">
            Trial {currentTrial + 1} of {NUM_TRIALS}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="flex items-center justify-center min-h-[200px] bg-slate-50 rounded-lg">
            <div className={`text-6xl font-bold ${currentTrialData.displayColor.color}`}>
              {currentTrialData.word}
            </div>
          </div>
          
          <div>
            <p className="text-center text-slate-600 mb-4">
              Click the color of the <strong>text</strong> (not the word):
            </p>
            <div className="grid grid-cols-5 gap-3">
              {COLORS.map((color) => (
                <Button
                  key={color.name}
                  onClick={() => handleAnswer(color.name)}
                  className={`${color.bgColor} ${color.color} hover:opacity-80 font-semibold`}
                  variant="outline"
                >
                  {color.name}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (phase === 'results') {
    const correctCount = results.filter(r => r.correct).length;
    const avgTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
    const accuracy = (correctCount / NUM_TRIALS) * 100;

    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{correctCount}/{NUM_TRIALS}</div>
              <p className="text-sm text-slate-600">Correct</p>
            </div>
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{avgTime.toFixed(0)}ms</div>
              <p className="text-sm text-slate-600">Avg Response Time</p>
            </div>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-900">
              <strong>Attention Score: {accuracy.toFixed(0)}%</strong>
              <br />
              {accuracy >= 90 ? 'Excellent attention and processing speed!' :
               accuracy >= 75 ? 'Good attention and processing speed.' :
               accuracy >= 60 ? 'Fair attention and processing speed.' :
               'Attention may need improvement. Consider consulting a healthcare professional.'}
            </p>
          </div>
          
          <div className="max-h-64 overflow-y-auto space-y-2">
            <h4 className="font-semibold text-slate-700">Trial Details:</h4>
            {results.map((result, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-2 rounded border ${
                  result.correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}
              >
                <span className="text-sm">
                  Trial {result.trial}: {result.word} in {result.displayColor}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">{result.responseTime}ms</span>
                  {result.correct ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-red-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <Button onClick={handleComplete} className="w-full bg-orange-600 hover:bg-orange-700">
            Continue to Next Test
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <div>Loading...</div>;
}
