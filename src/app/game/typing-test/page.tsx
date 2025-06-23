'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { RefreshCw, Timer } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

const sampleText = "The quick brown fox jumps over the lazy dog. This sentence contains all the letters of the alphabet. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump. Sphinx of black quartz, judge my vow. The five boxing wizards jump quickly."

const GAME_DURATION = 60; // seconds

export default function TypingTestPage() {
  const [typedText, setTypedText] = useState('');
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [isFinished, setIsFinished] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [isStarted, setIsStarted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const resetGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsStarted(false);
    setIsFinished(false);
    setTimeLeft(GAME_DURATION);
    setTypedText('');
    setWpm(0);
    setAccuracy(100);
  };
  
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isFinished) return;
    
    if (!isStarted) {
      setIsStarted(true);
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
    }
    
    setTypedText(e.target.value);
  };

  useEffect(() => {
    if (isFinished) {
      calculateResults();
    }
  }, [isFinished]);
  
  const calculateResults = () => {
    const words = typedText.trim().split(/\s+/);
    const correctWords = words.filter((word, i) => word === sampleText.split(' ')[i]);
    
    const minutes = (GAME_DURATION - timeLeft) / 60;
    if (minutes > 0) {
      const grossWpm = typedText.length / 5 / minutes;
      setWpm(Math.round(grossWpm));
    }

    let correctChars = 0;
    typedText.split('').forEach((char, i) => {
      if(char === sampleText[i]) {
        correctChars++;
      }
    });
    setAccuracy(Math.round((correctChars / typedText.length) * 100) || 0);
  };

  const getHighlightedText = () => {
    return sampleText.split('').map((char, index) => {
      let color = 'text-muted-foreground/50';
      if (index < typedText.length) {
        color = char === typedText[index] ? 'text-foreground' : 'text-destructive';
      }
      return <span key={index} className={color}>{char}</span>;
    });
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-4xl">
      <h1 className="text-5xl font-headline font-bold text-primary">Typing Speed Test</h1>
      
      <Card className="w-full shadow-xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="font-headline text-3xl">Test your speed</CardTitle>
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
          <Progress value={(GAME_DURATION - timeLeft) / GAME_DURATION * 100} className="mb-4" />
          <Card className="p-4 mb-4 bg-secondary/50">
            <p className="text-lg font-mono leading-relaxed tracking-wider h-32 overflow-hidden">
                {getHighlightedText()}
            </p>
          </Card>
          
          <Input
            ref={inputRef}
            type="text"
            placeholder={isStarted ? "" : "Start typing here to begin..."}
            value={typedText}
            onChange={handleInputChange}
            disabled={isFinished}
            className="w-full text-lg font-mono tracking-wider"
          />
        </CardContent>
      </Card>
      
      {isFinished && (
        <Card className="w-full shadow-xl bg-accent/20 border-accent">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-center">Results</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-around text-center">
            <div>
              <p className="text-4xl font-bold text-primary">{wpm}</p>
              <p className="text-muted-foreground">WPM</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary">{accuracy}%</p>
              <p className="text-muted-foreground">Accuracy</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
