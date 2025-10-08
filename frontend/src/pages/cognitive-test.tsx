import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { NextPage } from 'next';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';

const questions = [
  { type: 'naming', text: 'What is this animal?', imageUrl: 'https://placehold.co/200x200/orange/white?text=Lion', correctAnswer: 'lion' },
  { type: 'memory_registration', text: 'Please remember these five words: Face, Velvet, Church, Daisy, Red.' },
  { type: 'attention_digits', text: 'Repeat these numbers forward: 2, 1, 8, 5, 4.', correctAnswer: '21854' },
  { type: 'attention_subtraction', text: 'Starting from 100, subtract 7 five times.', correctAnswers: ['93', '86', '79', '72', '65'] },
  { type: 'memory_recall', text: 'What were the five words you were asked to remember?', correctAnswers: ['face', 'velvet', 'church', 'daisy', 'red'] },
  { type: 'orientation', text: 'What is today\'s date?', parts: ['Day', 'Month', 'Year'] },
  { type: 'naming', text: 'What is this animal?', imageUrl: 'https://placehold.co/200x200/blue/white?text=Rhino', correctAnswer: 'rhino' },
  { type: 'naming', text: 'What is this animal?', imageUrl: 'https://placehold.co/200x200/green/white?text=Camel', correctAnswer: 'camel' },
  { type: 'attention_digits', text: 'Repeat these numbers backward: 7, 4, 2.', correctAnswer: '247' },
  { type: 'sentence_repetition', text: 'Repeat this sentence: I only know that John is the one to help today.', correctAnswer: 'I only know that John is the one to help today.' },
];

const CognitiveTestPage: NextPage = () => {
  const { user, token } = useAuth();
  const router = useRouter();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [finalScore, setFinalScore] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [isTestComplete, setIsTestComplete] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const handleAnswerChange = (questionIndex, answer) => {
    setUserAnswers({ ...userAnswers, [questionIndex]: answer });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      calculateScore();
      setShowScore(true);
    }
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((question, index) => {
      const answer = userAnswers[index];
      if (!answer) return;

      switch (question.type) {
        case 'naming':
          if (answer.toLowerCase() === question.correctAnswer) score += 1;
          break;
        case 'attention_digits':
          if (answer === question.correctAnswer) score += 1;
          break;
        case 'attention_subtraction':
          const correctSubtractions = question.correctAnswers.filter((val, i) => val === answer[i]).length;
          score += correctSubtractions;
          break;
        case 'memory_recall':
          const correctRecalls = question.correctAnswers.filter(val => answer.includes(val)).length;
          score += correctRecalls;
          break;
        case 'orientation':
          // Simplified scoring
          if (answer.day && answer.month && answer.year) score += 3;
          break;
        case 'sentence_repetition':
            if (answer.toLowerCase() === question.correctAnswer.toLowerCase()) score += 2;
            break;
        default:
          break;
      }
    });
    setFinalScore(score);
  };

  const handleSaveResults = async () => {
    try {
      await axios.post(
        'http://127.0.0.1:8000/cognitive-tests/',
        {
          test_type: 'MoCA-like',
          score: finalScore,
          total_questions: 30,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setIsTestComplete(true);
    } catch (error) {
      console.error('Failed to save results', error);
    }
  };

  const renderQuestion = () => {
    const question = questions[currentQuestionIndex];
    const answer = userAnswers[currentQuestionIndex] || '';

    switch (question.type) {
      case 'naming':
        return (
          <div className="text-center">
            <p className="text-lg mb-4">{question.text}</p>
            <img src={question.imageUrl} alt="naming-task" className="mx-auto mb-4" />
            <Input
              type="text"
              value={answer}
              onChange={(e) => handleAnswerChange(currentQuestionIndex, e.target.value)}
            />
          </div>
        );
      case 'memory_recall':
        return (
          <div className="text-center">
            <p className="text-lg mb-4">{question.text}</p>
            <div className="grid grid-cols-1 gap-4">
              {[...Array(5)].map((_, i) => (
                <Input
                  key={i}
                  type="text"
                  value={answer[i] || ''}
                  onChange={(e) => {
                    const newAnswers = [...(answer || [])];
                    newAnswers[i] = e.target.value;
                    handleAnswerChange(currentQuestionIndex, newAnswers);
                  }}
                />
              ))}
            </div>
          </div>
        );
      case 'attention_digits':
      case 'sentence_repetition':
        return (
          <div className="text-center">
            <p className="text-lg mb-4">{question.text}</p>
            <Input
              type="text"
              value={answer}
              onChange={(e) => handleAnswerChange(currentQuestionIndex, e.target.value)}
            />
          </div>
        );
      case 'attention_subtraction':
        return (
            <div className="text-center">
              <p className="text-lg mb-4">{question.text}</p>
              <div className="grid grid-cols-1 gap-4">
                {[...Array(5)].map((_, i) => (
                  <Input
                    key={i}
                    type="text"
                    value={answer[i] || ''}
                    onChange={(e) => {
                      const newAnswers = [...(answer || [])];
                      newAnswers[i] = e.target.value;
                      handleAnswerChange(currentQuestionIndex, newAnswers);
                    }}
                  />
                ))}
              </div>
            </div>
          );
      case 'orientation':
        return (
          <div className="text-center">
            <p className="text-lg mb-4">{question.text}</p>
            <div className="grid grid-cols-3 gap-4">
              <Input type="text" placeholder="Day" onChange={(e) => handleAnswerChange(currentQuestionIndex, {...answer, day: e.target.value})} />
              <Input type="text" placeholder="Month" onChange={(e) => handleAnswerChange(currentQuestionIndex, {...answer, month: e.target.value})} />
              <Input type="text" placeholder="Year" onChange={(e) => handleAnswerChange(currentQuestionIndex, {...answer, year: e.target.value})} />
            </div>
          </div>
        );
      default:
        return <p className="text-lg text-center">{question.text}</p>;
    }
  };

  if (!user) {
    return null;
  }

  if (isTestComplete) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-2xl p-8 text-center">
          <CardTitle className="text-3xl font-bold mb-4">Cognitive Test Complete!</CardTitle>
          <CardContent>
            <p className="text-lg mb-2">Your final score is:</p>
            <p className="text-5xl font-bold mb-6">{finalScore} / 30</p>
            <p className="text-lg mb-6">Do you also have an MRI scan to analyze?</p>
            <div className="flex justify-center gap-4">
              <Link href="/assessment/mri-upload">
                <Button>Yes, Upload MRI</Button>
              </Link>
              <Link href="/results-history">
                <Button variant="secondary">No, Finish For Now</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">Cognitive Assessment</CardTitle>
          <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="mt-4" />
        </CardHeader>
        <CardContent>
          {showScore ? (
            <div className="text-center">
              <p className="text-lg mb-4">Your final score is:</p>
              <p className="text-4xl font-bold mb-4">{finalScore} / 30</p>
              <p className="text-lg mb-4">
                {finalScore >= 26
                  ? 'Your cognitive function appears to be within the normal range.'
                  : 'You may have some cognitive impairment. Please consult a healthcare professional.'}
              </p>
              <Button onClick={handleSaveResults}>Save and Continue</Button>
            </div>
          ) : (
            <div>
              {renderQuestion()}
              <Button onClick={handleNextQuestion} className="mt-4 w-full">
                {currentQuestionIndex < questions.length - 1 ? 'Next' : 'Finish Test'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CognitiveTestPage;
