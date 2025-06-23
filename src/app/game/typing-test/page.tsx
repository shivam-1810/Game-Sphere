'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { RefreshCw, Timer, User, Bot } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

const sampleText = "The quick brown fox jumps over the lazy dog. This sentence contains all the letters of the alphabet. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump. Sphinx of black quartz, judge my vow. The five boxing wizards jump quickly."

const GAME_DURATION = 60; // seconds

const getHighlightedText = (textToHighlight: string, typedText: string) => {
    return textToHighlight.split('').map((char, index) => {
        let color = 'text-muted-foreground/50';
        if (index < typedText.length) {
            color = char === typedText[index] ? 'text-foreground' : 'text-destructive';
        }
        return <span key={index} className={color}>{char}</span>;
    });
};

export default function TypingTestPage() {
  const [typedText, setTypedText] = useState('');
  const [opponentTypedText, setOpponentTypedText] = useState('');
  
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [isFinished, setIsFinished] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [opponentWpm, setOpponentWpm] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const opponentTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const opponentTargetWpm = useMemo(() => Math.floor(Math.random() * 30) + 40, []); // 40-70 WPM

  const resetGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (opponentTimerRef.current) clearInterval(opponentTimerRef.current);
    setIsStarted(false);
    setIsFinished(false);
    setTimeLeft(GAME_DURATION);
    setTypedText('');
    setOpponentTypedText('');
    setWpm(0);
    setAccuracy(0);
    setOpponentWpm(0);
    if (inputRef.current) {
        inputRef.current.focus();
    }
  };
  
  useEffect(() => {
    // Cleanup timers on unmount
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (opponentTimerRef.current) clearInterval(opponentTimerRef.current);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isFinished) return;
    
    if (!isStarted) {
      setIsStarted(true);
      // Main game timer
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Opponent simulation timer
      const charsPerSecond = (opponentTargetWpm * 5) / 60;
      opponentTimerRef.current = setInterval(() => {
        setOpponentTypedText(prev => {
            const newLength = prev.length + Math.floor(charsPerSecond * (Math.random() * 0.5 + 0.75));
            if (newLength >= sampleText.length) {
                clearInterval(opponentTimerRef.current!);
                return sampleText;
            }
            return sampleText.substring(0, newLength);
        });
      }, 1000);
    }
    
    setTypedText(e.target.value);
  };

  const calculateResults = () => {
    const elapsedMinutes = GAME_DURATION / 60;

    // Player results
    if (elapsedMinutes > 0) {
      setWpm(Math.round( (typedText.length / 5) / elapsedMinutes ));
    }
    let correctChars = 0;
    typedText.split('').forEach((char, i) => {
      if(sampleText[i] && char === sampleText[i]) {
        correctChars++;
      }
    });
    setAccuracy(Math.round((correctChars / typedText.length) * 100) || 0);

    // Opponent results
    if (elapsedMinutes > 0) {
        setOpponentWpm(Math.round( (opponentTypedText.length / 5) / elapsedMinutes ));
    }
  };

  useEffect(() => {
    if (isFinished) {
      if (opponentTimerRef.current) clearInterval(opponentTimerRef.current);
      calculateResults();
    }
  }, [isFinished, typedText, opponentTypedText]);

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-4xl">
      <h1 className="text-5xl font-headline font-bold text-primary">Typing Speed Race</h1>
      
      <Card className="w-full shadow-xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="font-headline text-3xl">Race against the clock!</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 font-mono text-xl">
                <Timer className="text-primary"/>
                <span>{timeLeft}s</span>
              </div>
              <Button variant="outline" size="icon" onClick={resetGame}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <div className='flex items-center gap-2 mb-2'>
                <User className="h-5 w-5 text-primary"/>
                <h3 className='font-semibold'>You</h3>
              </div>
              <Progress value={(typedText.length / sampleText.length) * 100} className="mb-2 h-2" />
              <Card className="p-4 mb-4 bg-secondary/50 font-mono text-sm leading-relaxed tracking-wider h-24 overflow-hidden">
                  {getHighlightedText(sampleText, typedText)}
              </Card>
              <Input
                ref={inputRef}
                type="text"
                placeholder={isStarted ? "" : "Start typing to begin the race..."}
                value={typedText}
                onChange={handleInputChange}
                disabled={isFinished}
                className="w-full font-mono tracking-wider"
              />
            </div>
            <div>
              <div className='flex items-center gap-2 mb-2'>
                  <Bot className="h-5 w-5 text-muted-foreground"/>
                  <h3 className='font-semibold'>Opponent</h3>
              </div>
              <Progress value={(opponentTypedText.length / sampleText.length) * 100} className="mb-2 h-2" />
               <Card className="p-4 mb-4 bg-secondary/50 font-mono text-sm leading-relaxed tracking-wider h-24 overflow-hidden">
                  {getHighlightedText(sampleText, opponentTypedText)}
              </Card>
              <Input
                type="text"
                value={opponentTypedText.substring(0, typedText.length)}
                disabled
                className="w-full font-mono tracking-wider"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {isFinished && (
        <Card className="w-full shadow-xl bg-accent/20 border-accent">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-center">Results</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-center">
            <div className='border-r'>
              <h4 className='font-bold mb-2'>Your Stats</h4>
              <div className='flex justify-around'>
                <div>
                  <p className="text-4xl font-bold text-primary">{wpm}</p>
                  <p className="text-muted-foreground">WPM</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-primary">{accuracy}%</p>
                  <p className="text-muted-foreground">Accuracy</p>
                </div>
              </div>
            </div>
            <div>
              <h4 className='font-bold mb-2'>Opponent's Stats</h4>
               <div className='flex justify-around'>
                <div>
                  <p className="text-4xl font-bold text-muted-foreground">{opponentWpm}</p>
                  <p className="text-muted-foreground">WPM</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
