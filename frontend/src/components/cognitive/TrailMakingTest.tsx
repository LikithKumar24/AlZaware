import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Check, X } from 'lucide-react';

interface TrailMakingTestProps {
  onComplete: (time: number, errors: number, score: number) => void;
}

const NUM_CIRCLES = 12;

export default function TrailMakingTest({ onComplete }: TrailMakingTestProps) {
  const [phase, setPhase] = useState<'instructions' | 'test' | 'results'>('instructions');
  const [circles, setCircles] = useState<any[]>([]);
  const [currentTarget, setCurrentTarget] = useState(1);
  const [startTime, setStartTime] = useState(0);
  const [completionTime, setCompletionTime] = useState(0);
  const [errors, setErrors] = useState(0);
  const [clickedCircles, setClickedCircles] = useState<number[]>([]);

  useEffect(() => {
    generateCircles();
  }, []);

  const generateCircles = () => {
    const newCircles = [];
    const usedPositions: any[] = [];

    for (let i = 1; i <= NUM_CIRCLES; i++) {
      let x, y, tooClose;

      do {
        x = Math.random() * 80 + 5; // 5-85% of container width
        y = Math.random() * 80 + 5; // 5-85% of container height

        // Check if too close to existing circles
        tooClose = usedPositions.some(pos => {
          const distance = Math.sqrt(Math.pow(pos.x - x, 2) + Math.pow(pos.y - y, 2));
          return distance < 12; // Minimum distance
        });
      } while (tooClose);

      usedPositions.push({ x, y });
      newCircles.push({ number: i, x, y });
    }

    setCircles(newCircles);
  };

  const startTest = () => {
    setPhase('test');
    setStartTime(Date.now());
    setCurrentTarget(1);
    setErrors(0);
    setClickedCircles([]);
  };

  const handleCircleClick = (number: number) => {
    if (number === currentTarget) {
      setClickedCircles([...clickedCircles, number]);

      if (number === NUM_CIRCLES) {
        const time = Date.now() - startTime;
        setCompletionTime(time);
        setPhase('results');
      } else {
        setCurrentTarget(currentTarget + 1);
      }
    } else {
      setErrors(errors + 1);
    }
  };

  const handleComplete = () => {
    const timeInSeconds = completionTime / 1000;

    // Scoring Logic
    // Target Time: 25s. Penalty: 2pts per second over.
    const timePenalty = Math.max(0, (timeInSeconds - 25) * 2);

    // Error Penalty: 10pts per error.
    const errorPenalty = errors * 10;

    // Calculate Final Score
    const rawScore = 100 - timePenalty - errorPenalty;
    const finalScore = Math.max(0, Math.min(100, Math.round(rawScore)));

    onComplete(completionTime, errors, finalScore);
  };

  if (phase === 'instructions') {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Target className="h-6 w-6 text-indigo-600" />
            Trail Making Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <h3 className="font-semibold text-indigo-900 mb-2">Instructions:</h3>
            <ul className="list-disc list-inside space-y-2 text-indigo-800">
              <li>Click the numbered circles in order from 1 to {NUM_CIRCLES}</li>
              <li>Complete the trail as quickly and accurately as possible</li>
              <li>Incorrect clicks will be counted as errors</li>
              <li>This tests executive function and visual attention</li>
            </ul>
          </div>

          <div className="bg-slate-100 rounded-lg p-4 text-center">
            <p className="text-sm text-slate-700 mb-2">Example sequence:</p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">1</div>
              <span className="text-2xl">→</span>
              <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">2</div>
              <span className="text-2xl">→</span>
              <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">3</div>
              <span className="text-2xl">→</span>
              <span className="text-xl">...</span>
            </div>
          </div>

          <Button onClick={startTest} className="w-full bg-indigo-600 hover:bg-indigo-700">
            Start Test
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (phase === 'test') {
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);

    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Connect: {currentTarget} of {NUM_CIRCLES}</CardTitle>
            <div className="text-right">
              <div className="text-2xl font-bold text-indigo-600">{elapsedTime}s</div>
              <div className="text-sm text-red-600">Errors: {errors}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative w-full h-[500px] bg-gradient-to-br from-slate-50 to-indigo-50 rounded-lg border-2 border-indigo-200 overflow-hidden">
            {/* Draw lines between clicked circles */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {clickedCircles.slice(0, -1).map((num, index) => {
                const start = circles.find(c => c.number === num);
                const end = circles.find(c => c.number === clickedCircles[index + 1]);
                if (!start || !end) return null;

                return (
                  <line
                    key={`line-${num}`}
                    x1={`${start.x}%`}
                    y1={`${start.y}%`}
                    x2={`${end.x}%`}
                    y2={`${end.y}%`}
                    stroke="#4f46e5"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                );
              })}
            </svg>

            {/* Circles */}
            {circles.map((circle) => {
              const isClicked = clickedCircles.includes(circle.number);
              const isCurrent = circle.number === currentTarget;
              const isNext = circle.number === currentTarget + 1;

              return (
                <button
                  key={circle.number}
                  onClick={() => handleCircleClick(circle.number)}
                  disabled={isClicked}
                  className={`absolute w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold transition-all duration-200 transform hover:scale-110 ${isClicked
                      ? 'bg-green-500 text-white border-4 border-green-600 cursor-default'
                      : isCurrent
                        ? 'bg-yellow-400 text-slate-900 border-4 border-yellow-600 animate-pulse shadow-lg'
                        : isNext
                          ? 'bg-blue-400 text-white border-4 border-blue-600 shadow-md'
                          : 'bg-white text-slate-700 border-4 border-slate-300 hover:border-indigo-400'
                    }`}
                  style={{
                    left: `${circle.x}%`,
                    top: `${circle.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  {circle.number}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (phase === 'results') {
    const timeInSeconds = (completionTime / 1000).toFixed(2);
    const timeVal = completionTime / 1000;

    // Recalculate for display
    const timePenalty = Math.max(0, (timeVal - 25) * 2);
    const errorPenalty = errors * 10;
    const rawScore = 100 - timePenalty - errorPenalty;
    const finalScore = Math.max(0, Math.min(100, Math.round(rawScore)));

    const performanceLevel =
      finalScore >= 90 ? 'Excellent' :
        finalScore >= 75 ? 'Good' :
          finalScore >= 60 ? 'Fair' :
            'Needs Improvement';

    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{timeInSeconds}s</div>
              <p className="text-xs text-slate-600">Time</p>
            </div>
            <div className={`border-2 rounded-lg p-4 text-center ${errors === 0 ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
              }`}>
              <div className={`text-2xl font-bold ${errors === 0 ? 'text-green-600' : 'text-red-600'}`}>
                {errors}
              </div>
              <p className="text-xs text-slate-600">Errors</p>
            </div>
            <div className="bg-indigo-50 border-2 border-indigo-300 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-indigo-600">{finalScore}</div>
              <p className="text-xs text-slate-600">Score</p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h4 className="font-semibold text-slate-700 mb-2">Score Breakdown:</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Base Score:</span>
                <span>100</span>
              </div>
              {timePenalty > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Time Penalty ({'>'}25s):</span>
                  <span>-{Math.round(timePenalty)}</span>
                </div>
              )}
              {errorPenalty > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Error Penalty ({errors}x):</span>
                  <span>-{errorPenalty}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-800 border-t pt-1 mt-1">
                <span>Final Score:</span>
                <span>{finalScore}</span>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <p className="text-sm text-indigo-900">
              <strong>Performance: {performanceLevel}</strong>
              <br />
              {performanceLevel === 'Excellent' ? 'Outstanding visual scanning and executive control!' :
                performanceLevel === 'Good' ? 'Good visual attention and task-switching ability.' :
                  performanceLevel === 'Fair' ? 'Fair executive function with room for improvement.' :
                    'Executive function may need attention. Consider consulting a healthcare professional.'}
            </p>
          </div>

          <Button onClick={handleComplete} className="w-full bg-indigo-600 hover:bg-indigo-700">
            Complete All Tests
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <div>Loading...</div>;
}
