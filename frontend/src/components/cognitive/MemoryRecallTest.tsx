import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Brain, Check, X } from 'lucide-react';

interface MemoryRecallTestProps {
  onComplete: (score: number, maxScore: number) => void;
}

const WORD_LIST = [
  'ELEPHANT', 'PIANO', 'GARDEN', 'MOUNTAIN', 'BUTTERFLY',
  'OCEAN', 'TELESCOPE', 'LIBRARY', 'RAINBOW', 'COMPASS'
];

const DISPLAY_TIME = 10000; // 10 seconds

export default function MemoryRecallTest({ onComplete }: MemoryRecallTestProps) {
  const [phase, setPhase] = useState<'instructions' | 'memorize' | 'distraction' | 'recall' | 'results'>('instructions');
  const [userRecall, setUserRecall] = useState<string[]>(Array(10).fill(''));
  const [timeLeft, setTimeLeft] = useState(10);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (phase === 'memorize' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (phase === 'memorize' && timeLeft === 0) {
      setPhase('distraction');
      setTimeLeft(5);
    } else if (phase === 'distraction' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (phase === 'distraction' && timeLeft === 0) {
      setPhase('recall');
    }
  }, [phase, timeLeft]);

  const handleSubmit = () => {
    const correctAnswers = userRecall.filter((word, index) => 
      word.trim().toUpperCase() === WORD_LIST[index]
    ).length;
    setScore(correctAnswers);
    setPhase('results');
  };

  const handleComplete = () => {
    onComplete(score, WORD_LIST.length);
  };

  if (phase === 'instructions') {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Brain className="h-6 w-6 text-purple-600" />
            Memory Recall Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
            <ul className="list-disc list-inside space-y-2 text-blue-800">
              <li>You will see 10 words displayed for 10 seconds</li>
              <li>Try to memorize as many as possible</li>
              <li>After a brief distraction task, you'll recall them</li>
              <li>This tests your short-term memory capacity</li>
            </ul>
          </div>
          <Button onClick={() => {setPhase('memorize'); setTimeLeft(10);}} className="w-full bg-purple-600 hover:bg-purple-700">
            Start Test
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (phase === 'memorize') {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center">Memorize These Words</CardTitle>
          <p className="text-center text-lg font-bold text-purple-600">Time remaining: {timeLeft}s</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 p-6">
            {WORD_LIST.map((word, index) => (
              <div
                key={index}
                className="bg-gradient-to-r from-purple-100 to-blue-100 border-2 border-purple-300 rounded-lg p-6 text-center text-2xl font-bold text-purple-900 animate-pulse"
              >
                {word}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (phase === 'distraction') {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center">Quick Break</CardTitle>
          <p className="text-center text-slate-600">Count backwards from 20 to 1...</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <div className="text-6xl font-bold text-purple-600 animate-bounce">
              {20 - timeLeft}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (phase === 'recall') {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center">Recall the Words</CardTitle>
          <p className="text-center text-slate-600">Enter as many words as you can remember</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {userRecall.map((word, index) => (
              <Input
                key={index}
                placeholder={`Word ${index + 1}`}
                value={word}
                onChange={(e) => {
                  const newRecall = [...userRecall];
                  newRecall[index] = e.target.value;
                  setUserRecall(newRecall);
                }}
                className="text-center text-lg"
              />
            ))}
          </div>
          <Button onClick={handleSubmit} className="w-full bg-purple-600 hover:bg-purple-700">
            Submit Answers
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center text-2xl">Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className="text-5xl font-bold text-purple-600 mb-2">
            {score} / {WORD_LIST.length}
          </div>
          <p className="text-slate-600">Words Remembered Correctly</p>
        </div>
        
        <div className="space-y-2">
          {WORD_LIST.map((word, index) => {
            const isCorrect = userRecall[index].trim().toUpperCase() === word;
            return (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                  isCorrect ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
                }`}
              >
                <span className="font-semibold">{word}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">
                    Your answer: {userRecall[index] || '(blank)'}
                  </span>
                  {isCorrect ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <X className="h-5 w-5 text-red-600" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>Memory Score: {((score / WORD_LIST.length) * 100).toFixed(0)}%</strong>
            <br />
            {score >= 8 ? 'Excellent memory performance!' :
             score >= 6 ? 'Good memory performance.' :
             score >= 4 ? 'Fair memory performance.' :
             'Memory may need attention. Consider consulting a healthcare professional.'}
          </p>
        </div>
        
        <Button onClick={handleComplete} className="w-full bg-purple-600 hover:bg-purple-700">
          Continue to Next Test
        </Button>
      </CardContent>
    </Card>
  );
}
