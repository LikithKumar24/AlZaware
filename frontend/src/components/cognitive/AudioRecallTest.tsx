import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, Volume2, Check, X, RotateCcw, Loader2 } from 'lucide-react';

interface AudioRecallTestProps {
  onComplete: (score: number, maxScore: number, details: any) => void;
}

interface TestSentence {
  text: string;
  difficulty: 'short' | 'medium' | 'long';
}

const TEST_SENTENCES: TestSentence[] = [
  { text: 'The quick brown fox jumps over the lazy dog.', difficulty: 'short' },
  { text: 'A journey of a thousand miles begins with a single step.', difficulty: 'short' },
  { text: 'In the middle of difficulty lies opportunity for growth and learning.', difficulty: 'medium' },
  { text: 'The greatest glory in living lies not in never falling, but in rising every time we fall.', difficulty: 'medium' },
  { text: 'Believe you can and you are halfway there, success comes to those who persevere.', difficulty: 'long' },
];

export default function AudioRecallTest({ onComplete }: AudioRecallTestProps) {
  const [phase, setPhase] = useState<'instructions' | 'listen' | 'record' | 'results' | 'summary'>('instructions');
  const [currentRound, setCurrentRound] = useState(0);
  const [currentSentence, setCurrentSentence] = useState<TestSentence | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [similarityScore, setSimilarityScore] = useState(0);
  const [roundResults, setRoundResults] = useState<any[]>([]);
  const [browserSupport, setBrowserSupport] = useState({ speech: true, recognition: true });
  const [errorMessage, setErrorMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('checking');
  const [isListening, setIsListening] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const transcriptRef = useRef<string>('');
  const stopTimerRef = useRef<any>(null);
  const speechDetectedRef = useRef<boolean>(false);
  const currentSentenceRef = useRef<string>('');

  useEffect(() => {
    // Check browser support
    const hasSpeechSynthesis = 'speechSynthesis' in window;
    const hasSpeechRecognition = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    
    console.log('🔍 Browser support check:', { hasSpeechSynthesis, hasSpeechRecognition });
    console.log('🔒 Protocol:', window.location.protocol);
    
    setBrowserSupport({
      speech: hasSpeechSynthesis,
      recognition: hasSpeechRecognition
    });

    // Check microphone permission
    const checkMicPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('🎙️ Microphone access granted');
        setMicPermission('granted');
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.error('❌ Microphone access denied:', error);
        setMicPermission('denied');
      }
    };

    checkMicPermission();

    // Initialize recognition only once
    if (hasSpeechRecognition && !recognitionRef.current) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      // Configure recognition for optimal capture
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.maxAlternatives = 1;

      recognitionRef.current.onstart = () => {
        console.log('🎤 Recognition started');
        setIsListening(true);
        setErrorMessage('');
        transcriptRef.current = '';
        speechDetectedRef.current = false;
      };

      recognitionRef.current.onspeechstart = () => {
        console.log('🗣️ Speech detected');
        speechDetectedRef.current = true;
      };

      recognitionRef.current.onresult = (event: any) => {
        console.log('📝 Recognition result received, results count:', event.results.length);
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
            console.log('✅ Final transcript chunk:', transcript);
          } else {
            interimTranscript += transcript;
            console.log('⏳ Interim transcript:', transcript);
          }
        }

        // Always update with latest transcript (prioritize final, fallback to interim)
        if (finalTranscript) {
          transcriptRef.current = (transcriptRef.current + ' ' + finalTranscript).trim();
          console.log('💾 Accumulated final transcript:', transcriptRef.current);
        } else if (interimTranscript && !transcriptRef.current) {
          transcriptRef.current = interimTranscript.trim();
          console.log('💬 Using interim transcript:', transcriptRef.current);
        }
      };

      recognitionRef.current.onspeechend = () => {
        console.log('🛑 Speech ended event fired, speech detected:', speechDetectedRef.current);
        
        // CRITICAL FIX: Only stop if speech was actually detected
        // This prevents Chrome's false-positive speechend from stopping recognition prematurely
        if (!speechDetectedRef.current) {
          console.log('⚠️ Ignoring false speechend - no speech detected yet');
          return;
        }
        
        // Give extra time for final results to come through after speech ends
        console.log('⏱️ Speech ended, waiting 2 seconds for final results...');
        setTimeout(() => {
          if (recognitionRef.current && isListening) {
            try {
              console.log('⏹️ Stopping recognition after speechend delay');
              recognitionRef.current.stop();
            } catch (e) {
              console.error('Error stopping on speechend:', e);
            }
          }
        }, 2000);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('⚠️ Speech recognition error:', event.error);
        setIsListening(false);
        
        if (event.error === 'no-speech') {
          setIsRecording(false);
          setErrorMessage('No speech detected. Please speak clearly and try again.');
        } else if (event.error === 'aborted') {
          console.log('⚠️ Recognition aborted');
          // Don't show error for aborted - this is usually intentional
        } else if (event.error === 'not-allowed') {
          setIsRecording(false);
          setMicPermission('denied');
          setErrorMessage('Microphone access denied. Please allow microphone permissions in browser settings.');
        } else if (event.error === 'audio-capture') {
          setIsRecording(false);
          setErrorMessage('Could not capture audio. Please check your microphone and try again.');
        } else {
          setIsRecording(false);
          setErrorMessage(`Recognition error: ${event.error}. Please try again.`);
        }
      };

      recognitionRef.current.onend = () => {
        console.log('🏁 Recognition ended');
        setIsListening(false);
        
        // Clear any pending stop timer
        if (stopTimerRef.current) {
          clearTimeout(stopTimerRef.current);
          stopTimerRef.current = null;
        }
        
        const finalText = transcriptRef.current.trim();
        console.log('📄 Final text from ref:', finalText);
        
        if (finalText) {
          console.log('💾 Processing transcript:', finalText);
          setSpokenText(finalText);
          setIsRecording(false);
          setRetryCount(0);
          
          // Process with the transcript - we'll get the original from state in the callback
          setTimeout(() => {
            // Use a small delay to ensure state is settled
            handleTextComparisonWrapper(finalText);
          }, 100);
        } else {
          console.log('❌ No transcript captured');
          setIsRecording(false);
          setErrorMessage('Could not capture speech. Please try again.');
        }
      };
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (stopTimerRef.current) {
        clearTimeout(stopTimerRef.current);
      }
    };
  }, []); // Run once on mount

  const selectRandomSentence = () => {
    const randomIndex = Math.floor(Math.random() * TEST_SENTENCES.length);
    const selected = TEST_SENTENCES[randomIndex];
    console.log('🎯 Selected sentence:', selected.text.substring(0, 50) + '...');
    setCurrentSentence(selected);
    // CRITICAL FIX: Store in ref to ensure it's available during async operations
    currentSentenceRef.current = selected.text;
    console.log('✅ Stored sentence in ref:', currentSentenceRef.current.substring(0, 30) + '...');
    return selected;
  };

  const handlePlaySentence = () => {
    if (!currentSentence || !browserSupport.speech) return;

    setIsPlaying(true);
    const utterance = new SpeechSynthesisUtterance(currentSentence.text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => {
      setIsPlaying(false);
      setPhase('record');
    };

    speechSynthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handleStartRecording = () => {
    if (!browserSupport.recognition) {
      setErrorMessage('Speech recognition not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (micPermission === 'denied') {
      setErrorMessage('Microphone access denied. Please allow microphone permissions in browser settings.');
      return;
    }

    if (!recognitionRef.current) {
      setErrorMessage('Speech recognition not initialized. Please refresh the page.');
      return;
    }

    // CRITICAL FIX: Ensure we have a sentence to compare against before starting recording
    // Check both state and ref
    const sentenceText = currentSentence?.text || currentSentenceRef.current;
    
    if (!sentenceText) {
      console.error('❌ No sentence selected for recording');
      console.error('State:', currentSentence);
      console.error('Ref:', currentSentenceRef.current);
      setErrorMessage('System error: No sentence available. Please refresh and try again.');
      return;
    }

    // Update ref to ensure it's current
    currentSentenceRef.current = sentenceText;
    console.log('✅ Starting recording with sentence:', sentenceText.substring(0, 30) + '...');
    console.log('✅ Ref updated to:', currentSentenceRef.current.substring(0, 30) + '...');

    setIsRecording(true);
    setSpokenText('');
    setErrorMessage('');
    transcriptRef.current = '';
    speechDetectedRef.current = false;
    
    console.log('🎬 Starting recording with 1.5s delay...');
    
    // Add 1.5s delay before starting recognition to allow mic warm-up
    setTimeout(() => {
      try {
        if (recognitionRef.current) {
          // Ensure recognition is stopped before starting
          try {
            recognitionRef.current.stop();
          } catch (e) {
            // Ignore if already stopped
          }
          
          // Wait a moment, then start
          setTimeout(() => {
            try {
              recognitionRef.current.start();
              console.log('▶️ Recognition start called');
              
              // Auto-stop after 10 seconds to ensure we capture the response
              // Clear any existing timer first
              if (stopTimerRef.current) {
                clearTimeout(stopTimerRef.current);
              }
              
              stopTimerRef.current = setTimeout(() => {
                if (recognitionRef.current) {
                  console.log('⏰ Auto-stopping after 10 seconds');
                  try {
                    recognitionRef.current.stop();
                  } catch (e) {
                    console.error('Error auto-stopping:', e);
                  }
                }
              }, 10000);
            } catch (startError: any) {
              console.error('❌ Error starting recognition:', startError);
              setIsRecording(false);
              setIsListening(false);
              if (startError.message && startError.message.includes('already started')) {
                setErrorMessage('Recognition already running. Please try again.');
              } else {
                setErrorMessage('Failed to start recording. Please try again.');
              }
            }
          }, 100);
        }
      } catch (error: any) {
        console.error('❌ Error in recording setup:', error);
        setIsRecording(false);
        setIsListening(false);
        setErrorMessage('Failed to start recording. Please try again.');
      }
    }, 1500);
  };

  const handleStopRecording = () => {
    console.log('⏹️ Stopping recording manually');
    
    // Clear auto-stop timer
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }
    }
    setIsRecording(false);
  };

  // Wrapper function that accesses currentSentence from ref at call time
  const handleTextComparisonWrapper = (spokenText: string) => {
    console.log('🔍 Wrapper called - checking current state');
    console.log('📝 Current sentence from ref:', currentSentenceRef.current || '(empty)');
    console.log('📝 Current sentence from state:', currentSentence?.text || '(null)');
    console.log('🗣️ Spoken text:', spokenText || '(empty)');
    
    // CRITICAL FIX: Use ref value instead of state to avoid timing issues
    const originalText = currentSentenceRef.current;
    
    if (!originalText) {
      console.error('❌ No original sentence in ref');
      console.error('State value:', currentSentence?.text || '(null)');
      setErrorMessage('System error: Missing original sentence. Please try again.');
      return;
    }
    
    if (!spokenText) {
      console.error('❌ No spoken text provided');
      setErrorMessage('Missing text for comparison. Please try again.');
      return;
    }
    
    console.log('✅ Both texts available, proceeding to comparison');
    console.log('🔹 Using ref sentence for comparison:', originalText.substring(0, 50) + '...');
    handleTextComparison(originalText, spokenText);
  };

  const handleTextComparison = async (original: string, spoken: string) => {
    // Defensive checks with detailed logging
    console.log('🔍 handleTextComparison called with:'); 
    console.log('  📄 Original:', original?.substring(0, 50) || '(empty)');
    console.log('  🗣️ Spoken:', spoken?.substring(0, 50) || '(empty)');
    console.log('  📌 Ref value:', currentSentenceRef.current?.substring(0, 50) || '(empty)');
    console.log('  📌 State value:', currentSentence?.text?.substring(0, 50) || '(null)');

    if (!original || !spoken) {
      console.error('❌ Missing text for comparison (via ref):', { original: !!original, spoken: !!spoken });
      setErrorMessage('Missing text for comparison. Please try again.');
      return;
    }

    setIsProcessing(true);
    console.log('🔄 Sending comparison request to backend...');
    
    try {
      const payload = {
        original: original,
        spoken: spoken
      };
      
      console.log('📤 Payload being sent:', payload);
      
      const response = await fetch('http://127.0.0.1:8000/compare-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Comparison result:', data);
      setSimilarityScore(data.similarityScore);
      setPhase('results');
    } catch (error) {
      console.error('❌ Error comparing text:', error);
      // Calculate a basic similarity score locally as fallback
      const similarity = calculateBasicSimilarity(original, spoken);
      console.log('🔄 Using fallback similarity calculation:', similarity);
      setSimilarityScore(similarity);
      setPhase('results');
    } finally {
      setIsProcessing(false);
    }
  };

  // Fallback similarity calculation (basic)
  const calculateBasicSimilarity = (str1: string, str2: string): number => {
    const words1 = str1.toLowerCase().split(/\s+/);
    const words2 = str2.toLowerCase().split(/\s+/);
    const matchCount = words1.filter(word => words2.includes(word)).length;
    const totalWords = Math.max(words1.length, words2.length);
    return totalWords > 0 ? (matchCount / totalWords) * 100 : 0;
  };

  const handleSaveRound = () => {
    const result = {
      round: currentRound + 1,
      originalText: currentSentence?.text || '',
      spokenText,
      similarityScore,
      correct: similarityScore >= 70
    };

    setRoundResults([...roundResults, result]);

    if (currentRound < 2) {
      // Move to next round
      setCurrentRound(currentRound + 1);
      setPhase('listen');
      setSpokenText('');
      setSimilarityScore(0);
      const newSentence = selectRandomSentence();
      console.log('➡️ Moving to round', currentRound + 2, 'with sentence:', newSentence?.text.substring(0, 50) + '...');
    } else {
      // All rounds complete
      setPhase('summary');
    }
  };

  const handleTryAgain = () => {
    setPhase('listen');
    setSpokenText('');
    setSimilarityScore(0);
    setErrorMessage('');
    setRetryCount(0);
    // Keep the same sentence for retry
    console.log('🔄 Retrying with same sentence:', currentSentence?.text.substring(0, 50) + '...');
  };

  const handleComplete = () => {
    const averageScore = roundResults.reduce((sum, r) => sum + r.similarityScore, 0) / roundResults.length;
    const correctCount = roundResults.filter(r => r.correct).length;
    
    onComplete(correctCount, 3, {
      averageScore,
      roundResults,
      totalRounds: 3
    });
  };

  const startTest = () => {
    const sentence = selectRandomSentence();
    console.log('🚀 Test started with sentence:', sentence?.text.substring(0, 50) + '...');
    console.log('✅ Ref value after selection:', currentSentenceRef.current.substring(0, 30) + '...');
    setPhase('listen');
    setCurrentRound(0);
    setRoundResults([]);
  };

  if (!browserSupport.speech || !browserSupport.recognition) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center text-2xl text-red-600">
            Browser Not Supported
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 text-center">
            <p className="text-red-800 mb-4">
              Your browser does not support the required features for this test.
            </p>
            <p className="text-sm text-red-700">
              {!browserSupport.speech && '• Speech Synthesis (Text-to-Speech) is not available.'}
            </p>
            <p className="text-sm text-red-700">
              {!browserSupport.recognition && '• Speech Recognition (Voice input) is not available.'}
            </p>
            <p className="text-sm text-red-600 mt-4">
              Please use Google Chrome, Microsoft Edge, or Safari for the best experience.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (phase === 'instructions') {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Mic className="h-6 w-6 text-pink-600" />
            Audio-Based Cognitive Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Microphone Status */}
          <div className={`${micPermission === 'granted' ? 'bg-green-50 border-green-300' : micPermission === 'denied' ? 'bg-red-50 border-red-300' : 'bg-yellow-50 border-yellow-300'} border-2 rounded-lg p-4`}>
            <p className={`text-sm font-semibold ${micPermission === 'granted' ? 'text-green-900' : micPermission === 'denied' ? 'text-red-900' : 'text-yellow-900'}`}>
              {micPermission === 'granted' && '✅ Microphone Active'}
              {micPermission === 'denied' && '❌ Microphone Access Denied'}
              {micPermission === 'checking' && '🔄 Checking microphone...'}
              {micPermission === 'prompt' && '⚠️ Microphone permission required'}
            </p>
            {micPermission === 'denied' && (
              <p className="text-xs text-red-800 mt-1">
                Please allow microphone access in your browser settings and refresh the page.
              </p>
            )}
          </div>

          <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
            <h3 className="font-semibold text-pink-900 mb-2">Instructions:</h3>
            <ul className="list-disc list-inside space-y-2 text-pink-800">
              <li>You will hear a sentence spoken aloud</li>
              <li>Listen carefully and try to remember it</li>
              <li>After listening, you will record yourself repeating the sentence</li>
              <li>Your spoken response will be compared to the original</li>
              <li>Complete 3 rounds of different sentences</li>
              <li>A score of 70% or higher is considered correct recall</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">What This Tests:</h4>
            <ul className="list-disc list-inside space-y-1 text-blue-800 text-sm">
              <li><strong>Auditory Memory:</strong> Ability to remember spoken information</li>
              <li><strong>Language Processing:</strong> Understanding and reproducing speech</li>
              <li><strong>Attention:</strong> Focus on auditory stimuli</li>
              <li><strong>Verbal Recall:</strong> Reproducing heard information accurately</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
            <p className="text-sm text-yellow-900">
              <strong>⚠️ Important:</strong> Please ensure your microphone is enabled and you are in a quiet environment.
              This test works best with Google Chrome or Microsoft Edge browsers.
            </p>
          </div>

          <Button 
            onClick={startTest} 
            className="w-full bg-pink-600 hover:bg-pink-700 text-white text-lg py-6"
            disabled={micPermission === 'denied'}
          >
            {micPermission === 'denied' ? 'Microphone Access Required' : 'Start Audio Test (3 Rounds)'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (phase === 'listen') {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center">
            Round {currentRound + 1} of 3 - Listen Carefully
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg p-8 text-center min-h-[300px] flex flex-col items-center justify-center">
            <Volume2 className={`h-24 w-24 text-pink-600 mb-6 ${isPlaying ? 'animate-pulse' : ''}`} />
            
            {!isPlaying && (
              <div className="space-y-4">
                <p className="text-lg text-slate-700 mb-4">
                  Click below to hear the sentence
                </p>
                <Button
                  onClick={handlePlaySentence}
                  className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-6 text-xl"
                  size="lg"
                >
                  <Volume2 className="mr-2 h-6 w-6" />
                  Play Sentence
                </Button>
              </div>
            )}

            {isPlaying && (
              <div className="text-center">
                <p className="text-2xl font-semibold text-pink-700 mb-4">
                  🔊 Listen carefully...
                </p>
                <p className="text-slate-600">
                  The recording will automatically move to the next step
                </p>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> Listen for key words and the sentence structure. You'll be asked to repeat it right after.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (phase === 'record') {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center">
            Round {currentRound + 1} of 3 - Your Turn
          </CardTitle>
          <p className="text-center text-slate-600">Now repeat what you heard</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* HTTPS Warning */}
          {window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
              <p className="text-sm text-yellow-900">
                ⚠️ <strong>Warning:</strong> Speech recognition may be unreliable without HTTPS.
              </p>
            </div>
          )}

          {/* Microphone Permission Warning */}
          {micPermission === 'denied' && (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
              <p className="text-sm text-red-900">
                🚫 <strong>Microphone Access Denied:</strong> Please allow microphone permissions in your browser settings and refresh the page.
              </p>
            </div>
          )}

          <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-lg p-8 text-center min-h-[300px] flex flex-col items-center justify-center">
            {!isRecording && !isProcessing && !spokenText && !errorMessage && (
              <>
                <Mic className="h-24 w-24 text-red-600 mb-6" />
                <p className="text-lg text-slate-700 mb-4">
                  Click the microphone to start recording
                </p>
                <Button
                  onClick={handleStartRecording}
                  className="bg-red-600 hover:bg-red-700 text-white px-8 py-6 text-xl"
                  size="lg"
                  disabled={micPermission === 'denied'}
                >
                  <Mic className="mr-2 h-6 w-6" />
                  Start Recording
                </Button>
              </>
            )}

            {isRecording && !isListening && (
              <>
                <Loader2 className="h-24 w-24 text-blue-600 animate-spin mb-6" />
                <p className="text-xl font-semibold text-blue-700">
                  Preparing microphone...
                </p>
                <p className="text-sm text-slate-600 mt-2">Please wait...</p>
              </>
            )}

            {isRecording && isListening && (
              <>
                <div className="relative">
                  <Mic className="h-24 w-24 text-red-600 animate-pulse" />
                  <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping" />
                </div>
                <p className="text-2xl font-semibold text-red-700 mt-6 mb-4">
                  🎤 Listening... Speak clearly
                </p>
                <p className="text-slate-600 mb-6">
                  Repeat the sentence you heard
                </p>
                {retryCount > 0 && (
                  <p className="text-orange-600 text-sm mb-4">
                    Retry attempt {retryCount} of 2
                  </p>
                )}
                <Button
                  onClick={handleStopRecording}
                  variant="outline"
                  className="border-red-600 text-red-600 hover:bg-red-50"
                >
                  Stop Recording
                </Button>
              </>
            )}

            {isProcessing && (
              <>
                <Loader2 className="h-24 w-24 text-blue-600 animate-spin" />
                <p className="text-xl font-semibold text-blue-700 mt-6">
                  Processing your response...
                </p>
              </>
            )}

            {errorMessage && (
              <>
                <X className="h-24 w-24 text-orange-600 mb-6" />
                <p className="text-lg font-semibold text-orange-700 mb-4">
                  {errorMessage}
                </p>
                <Button
                  onClick={() => {
                    setErrorMessage('');
                    setRetryCount(0);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </>
            )}
          </div>

          {spokenText && !isProcessing && !spokenText.startsWith('Error') && (
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
              <p className="text-sm text-green-800 font-semibold mb-2">✅ Your Response Captured:</p>
              <p className="text-green-900">{spokenText}</p>
            </div>
          )}

          {/* Browser compatibility notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              💡 <strong>Tip:</strong> For best results, use Google Chrome or Microsoft Edge. Ensure you are in a quiet environment.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (phase === 'results') {
    const isCorrect = similarityScore >= 70;
    
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Round {currentRound + 1} Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className={`${isCorrect ? 'bg-green-50 border-green-300' : 'bg-orange-50 border-orange-300'} border-2 rounded-lg p-6 text-center`}>
            <div className={`text-6xl font-bold ${isCorrect ? 'text-green-600' : 'text-orange-600'} mb-2`}>
              {similarityScore.toFixed(1)}%
            </div>
            <p className="text-lg font-semibold text-slate-700">Similarity Score</p>
            <div className="mt-4">
              {isCorrect ? (
                <div className="flex items-center justify-center gap-2 text-green-700">
                  <Check className="h-6 w-6" />
                  <span className="text-xl font-semibold">Correct Recall!</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-orange-700">
                  <X className="h-6 w-6" />
                  <span className="text-xl font-semibold">Partial/Incorrect Recall</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-900 mb-2">Original Sentence:</p>
              <p className="text-blue-800">{currentSentence?.text}</p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-purple-900 mb-2">Your Response:</p>
              <p className="text-purple-800">{spokenText}</p>
            </div>
          </div>

          <div className="bg-slate-100 rounded-lg p-4">
            <p className="text-sm text-slate-700">
              <strong>Performance:</strong> {isCorrect ? 'Excellent auditory memory and recall!' : 'Keep practicing to improve your auditory memory.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleTryAgain}
              variant="outline"
              className="border-slate-300 hover:bg-slate-50"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button
              onClick={handleSaveRound}
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              {currentRound < 2 ? 'Next Round' : 'View Summary'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (phase === 'summary') {
    const averageScore = roundResults.reduce((sum, r) => sum + r.similarityScore, 0) / roundResults.length;
    const correctCount = roundResults.filter(r => r.correct).length;
    const performance = averageScore >= 80 ? 'Excellent' : averageScore >= 70 ? 'Good' : averageScore >= 50 ? 'Fair' : 'Needs Improvement';
    const performanceColor = averageScore >= 80 ? 'green' : averageScore >= 70 ? 'blue' : averageScore >= 50 ? 'yellow' : 'red';

    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center text-3xl">
            Audio Test Complete!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className={`bg-${performanceColor}-50 border-2 border-${performanceColor}-300 rounded-xl p-6 text-center`}>
            <div className={`text-6xl font-bold text-${performanceColor}-600 mb-2`}>
              {averageScore.toFixed(1)}%
            </div>
            <div className="text-2xl font-semibold text-slate-700 mb-2">
              Average Recall Accuracy
            </div>
            <div className={`text-xl font-medium text-${performanceColor}-700`}>
              {performance} Performance
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{correctCount}/3</div>
              <p className="text-sm text-slate-600">Correct Recalls</p>
            </div>
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{roundResults.length}</div>
              <p className="text-sm text-slate-600">Rounds Completed</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-slate-700">Round Details:</h4>
            {roundResults.map((result, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                  result.correct ? 'bg-green-50 border-green-300' : 'bg-orange-50 border-orange-300'
                }`}
              >
                <div className="flex-1">
                  <span className="font-semibold text-slate-800">Round {result.round}</span>
                  <p className="text-xs text-slate-600 truncate max-w-md">{result.originalText}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${result.correct ? 'text-green-600' : 'text-orange-600'}`}>
                    {result.similarityScore.toFixed(0)}%
                  </span>
                  {result.correct ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <X className="h-5 w-5 text-orange-600" />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
            <p className="text-sm text-pink-900">
              <strong>Auditory Memory Assessment:</strong>
              <br />
              {averageScore >= 80 && 'Outstanding auditory memory and verbal recall! Your ability to process and reproduce spoken information is excellent.'}
              {averageScore >= 70 && averageScore < 80 && 'Good auditory memory. You can effectively process and recall spoken information.'}
              {averageScore >= 50 && averageScore < 70 && 'Fair auditory memory. Consider practicing active listening techniques to improve recall.'}
              {averageScore < 50 && 'Auditory memory may need attention. Regular practice with listening exercises could help improve recall abilities.'}
            </p>
          </div>

          <Button
            onClick={handleComplete}
            className="w-full bg-pink-600 hover:bg-pink-700 text-white text-lg py-6"
          >
            Save Results & Continue
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <div>Loading...</div>;
}
