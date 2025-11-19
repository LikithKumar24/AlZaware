import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Brain, Check, X } from 'lucide-react';

interface MemoryRecallTestProps {
  onComplete: (score: number, maxScore: number) => void;
}

// ✅ LARGE WORD BANK - 100 diverse words for random selection
const WORD_BANK = [
  'ELEPHANT', 'PIANO', 'GARDEN', 'MOUNTAIN', 'BUTTERFLY',
  'OCEAN', 'TELESCOPE', 'LIBRARY', 'RAINBOW', 'COMPASS',
  'DIAMOND', 'VOLCANO', 'CATHEDRAL', 'ANCHOR', 'LIGHTHOUSE',
  'PENGUIN', 'SAXOPHONE', 'MEADOW', 'CANYON', 'DRAGONFLY',
  'GLACIER', 'MICROSCOPE', 'MUSEUM', 'SUNSET', 'BINOCULARS',
  'EMERALD', 'AVALANCHE', 'PYRAMID', 'HARBOR', 'FORTRESS',
  'DOLPHIN', 'VIOLIN', 'ORCHARD', 'SUMMIT', 'FIREFLY',
  'WATERFALL', 'STETHOSCOPE', 'GALLERY', 'HORIZON', 'SEXTANT',
  'SAPPHIRE', 'EARTHQUAKE', 'TEMPLE', 'BEACON', 'CASTLE',
  'LEOPARD', 'TRUMPET', 'PRAIRIE', 'VALLEY', 'HONEYBEE',
  'RIVER', 'BAROMETER', 'ARCHIVE', 'SUNRISE', 'TELESCOPE',
  'RUBY', 'TORNADO', 'MONASTERY', 'LIGHTHOUSE', 'CITADEL',
  'TIGER', 'CLARINET', 'SAVANNA', 'PLATEAU', 'LADYBUG',
  'DESERT', 'THERMOMETER', 'SANCTUARY', 'TWILIGHT', 'PERISCOPE',
  'PEARL', 'HURRICANE', 'PAGODA', 'WATCHTOWER', 'BASTION',
  'CHEETAH', 'FLUTE', 'TUNDRA', 'RIDGE', 'CRICKET',
  'FOREST', 'CHRONOMETER', 'OBSERVATORY', 'DAWN', 'QUADRANT',
  'OPAL', 'BLIZZARD', 'SHRINE', 'TURRET', 'RAMPART',
  'PANTHER', 'OBOE', 'JUNGLE', 'PEAK', 'GRASSHOPPER',
  'SWAMP', 'ALTIMETER', 'PLANETARIUM', 'DUSK', 'ASTROLABE'
];

const WORDS_TO_DISPLAY = 10;
const DISPLAY_TIME = 10000; // 10 seconds

// ✅ Fisher-Yates Shuffle Algorithm for true randomization
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ✅ Get random words from the word bank
function getRandomWords(count: number): string[] {
  const shuffled = shuffleArray(WORD_BANK);
  return shuffled.slice(0, count);
}

export default function MemoryRecallTest({ onComplete }: MemoryRecallTestProps) {
  const [phase, setPhase] = useState<'instructions' | 'memorize' | 'distraction' | 'recall' | 'results'>('instructions');
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [userRecall, setUserRecall] = useState<string[]>(Array(WORDS_TO_DISPLAY).fill(''));
  const [timeLeft, setTimeLeft] = useState(10);
  const [score, setScore] = useState(0);

  // ✅ Generate new random words when component mounts
  useEffect(() => {
    const newWords = getRandomWords(WORDS_TO_DISPLAY);
    setSelectedWords(newWords);
    console.log('🔀 Memory Test - Generated new random words:', newWords);
  }, []);

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
      word.trim().toUpperCase() === selectedWords[index]
    ).length;
    setScore(correctAnswers);
    setPhase('results');
  };

  const handleComplete = () => {
    onComplete(score, selectedWords.length);
  };

  // Wait for words to be generated
  if (selectedWords.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 text-center">
          <Brain className="h-12 w-12 text-purple-600 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-600">Preparing test...</p>
        </CardContent>
      </Card>
    );
  }

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
              <li>You will see {WORDS_TO_DISPLAY} words displayed for 10 seconds</li>
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
            {selectedWords.map((word, index) => (
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
            {score} / {selectedWords.length}
          </div>
          <p className="text-slate-600">Words Remembered Correctly</p>
        </div>
        
        <div className="space-y-2">
          {selectedWords.map((word, index) => {
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
            <strong>Memory Score: {((score / selectedWords.length) * 100).toFixed(0)}%</strong>
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
