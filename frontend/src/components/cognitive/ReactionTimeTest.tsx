import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';

interface ReactionTimeTestProps {
  onComplete: (avgTime: number, score: number) => void;
}

interface Position {
  top: string;
  left: string;
}

const COLORS = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
const SHAPES = ['circle', 'square', 'triangle'];
const NUM_TRIALS = 12;

// ✅ Generate random position within safe boundaries
const getRandomPosition = (): Position => {
  // Use percentages for responsive positioning
  // Keep shape within 20-80% of container to avoid edges
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
  const [phase, setPhase] = useState<'instructions' | 'ready' | 'wait' | 'click' | 'results'>('instructions');
  const [trial, setTrial] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [currentShape, setCurrentShape] = useState('circle');
  const [currentColor, setCurrentColor] = useState('bg-blue-500');
  const [stimulusPosition, setStimulusPosition] = useState<Position>({ top: '50%', left: '50%' });
  const [waitTime, setWaitTime] = useState(0);
  const [tooSoon, setTooSoon] = useState(false);

  const startTrial = () => {
    setTooSoon(false);
    setPhase('wait');
    const randomWait = Math.random() * 3000 + 1000; // 1-4 seconds
    setWaitTime(randomWait);
    
    setTimeout(() => {
      setCurrentShape(SHAPES[Math.floor(Math.random() * SHAPES.length)]);
      setCurrentColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
      // ✅ Generate new random position for this trial
      setStimulusPosition(getRandomPosition());
      setStartTime(Date.now());
      setPhase('click');
    }, randomWait);
  };

  const handleClick = () => {
    if (phase === 'wait') {
      setTooSoon(true);
      setTimeout(() => startTrial(), 1000);
      return;
    }
    
    if (phase === 'click') {
      const reactionTime = Date.now() - startTime;
      setReactionTimes([...reactionTimes, reactionTime]);
      
      if (trial < NUM_TRIALS - 1) {
        setTrial(trial + 1);
        setPhase('ready');
      } else {
        setPhase('results');
      }
    }
  };

  const handleComplete = () => {
    const avgTime = reactionTimes.reduce((sum, time) => sum + time, 0) / reactionTimes.length;
    const score = Math.max(0, 100 - (avgTime - 200) / 5); // Score based on reaction time
    onComplete(avgTime, Math.min(100, Math.max(0, score)));
  };

  if (phase === 'instructions') {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Zap className="h-6 w-6 text-yellow-600" />
            Reaction Time Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">Instructions:</h3>
            <ul className="list-disc list-inside space-y-2 text-yellow-800">
              <li>Click the shape as soon as it appears on screen</li>
              <li>Wait for the "Wait..." message to disappear first</li>
              <li>Don't click too early or the trial restarts</li>
              <li>Complete {NUM_TRIALS} trials</li>
              <li>This tests processing speed and attention</li>
            </ul>
          </div>
          
          <Button onClick={() => { setPhase('ready'); }} className="w-full bg-yellow-600 hover:bg-yellow-700">
            Start Test
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (phase === 'ready') {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center">
            Trial {trial + 1} of {NUM_TRIALS}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center min-h-[400px]">
            <Button 
              onClick={startTrial} 
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-xl px-8 py-6"
            >
              Ready - Click to Start
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (phase === 'wait') {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center">
            Trial {trial + 1} of {NUM_TRIALS}
          </CardTitle>
        </CardHeader>
        <CardContent onClick={handleClick}>
          <div className="flex flex-col items-center justify-center min-h-[400px] bg-slate-100 rounded-lg cursor-pointer">
            {tooSoon ? (
              <div className="text-3xl font-bold text-red-600 animate-pulse">
                Too Soon! Wait for the shape...
              </div>
            ) : (
              <div className="text-3xl font-bold text-slate-600 animate-pulse">
                Wait...
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (phase === 'click') {
    const renderShape = () => {
      const baseClasses = `${currentColor} cursor-pointer hover:scale-110 transition-transform shadow-2xl absolute`;
      // ✅ Apply random position with transform to center the shape at the position
      const positionStyle = {
        top: stimulusPosition.top,
        left: stimulusPosition.left,
        transform: 'translate(-50%, -50%)', // Center the shape at the random position
      };
      
      switch (currentShape) {
        case 'circle':
          return <div className={`${baseClasses} w-32 h-32 rounded-full`} style={positionStyle} />;
        case 'square':
          return <div className={`${baseClasses} w-32 h-32 rounded-lg`} style={positionStyle} />;
        case 'triangle':
          return (
            <div 
              className={`${baseClasses} w-0 h-0`}
              style={{
                ...positionStyle,
                borderLeft: '64px solid transparent',
                borderRight: '64px solid transparent',
                borderBottom: '110px solid currentColor',
              }}
            />
          );
        default:
          return <div className={`${baseClasses} w-32 h-32 rounded-full`} style={positionStyle} />;
      }
    };

    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center">
            Trial {trial + 1} of {NUM_TRIALS}
          </CardTitle>
          <p className="text-center text-lg font-bold text-green-600">CLICK NOW!</p>
        </CardHeader>
        <CardContent onClick={handleClick}>
          <div className="relative min-h-[400px] bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg cursor-pointer overflow-hidden">
            {renderShape()}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (phase === 'results') {
    const avgTime = reactionTimes.reduce((sum, time) => sum + time, 0) / reactionTimes.length;
    const bestTime = Math.min(...reactionTimes);
    const worstTime = Math.max(...reactionTimes);
    
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{bestTime.toFixed(0)}ms</div>
              <p className="text-xs text-slate-600">Best Time</p>
            </div>
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{avgTime.toFixed(0)}ms</div>
              <p className="text-xs text-slate-600">Average Time</p>
            </div>
            <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{worstTime.toFixed(0)}ms</div>
              <p className="text-xs text-slate-600">Slowest Time</p>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-900">
              <strong>Processing Speed Assessment:</strong>
              <br />
              {avgTime < 250 ? 'Excellent reaction time - very fast processing!' :
               avgTime < 350 ? 'Good reaction time - normal processing speed.' :
               avgTime < 500 ? 'Fair reaction time - slightly slower processing.' :
               'Slower reaction time detected. Consider consulting a healthcare professional.'}
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-700">Individual Trial Times:</h4>
            <div className="grid grid-cols-4 gap-2">
              {reactionTimes.map((time, index) => (
                <div
                  key={index}
                  className={`p-2 rounded text-center text-sm font-semibold ${
                    time === bestTime ? 'bg-green-100 text-green-700' :
                    time === worstTime ? 'bg-red-100 text-red-700' :
                    'bg-slate-100 text-slate-700'
                  }`}
                >
                  {time.toFixed(0)}ms
                </div>
              ))}
            </div>
          </div>
          
          <Button onClick={handleComplete} className="w-full bg-yellow-600 hover:bg-yellow-700">
            Continue to Next Test
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <div>Loading...</div>;
}
