'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Timer, User, Bot, ArrowLeft } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogCancel } from '@/components/ui/alert-dialog'
import { useRouter } from 'next/navigation'

const sampleText = "The quick brown fox jumps over the lazy dog. This sentence contains all the letters of the alphabet. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump. Sphinx of black quartz, judge my vow. The five boxing wizards jump quickly."

const GAME_DURATION = 60; // seconds

const HighlightedText = ({ textToHighlight, typedText }: {textToHighlight: string, typedText: string}) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const typedIndex = typedText.length - 1;

    useEffect(() => {
        if (scrollRef.current) {
            const activeSpan = scrollRef.current.querySelector(`span[data-index="${typedIndex}"]`);
            if (activeSpan) {
                activeSpan.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
            }
        }
    }, [typedIndex]);

    return (
        <div ref={scrollRef} className="p-4 mb-4 bg-secondary/50 font-mono text-lg leading-relaxed tracking-wider h-32 overflow-y-auto rounded-md">
            {textToHighlight.split('').map((char, index) => {
                let color = 'text-muted-foreground/50';
                if (index < typedText.length) {
                    color = char === typedText[index] ? 'text-foreground' : 'text-destructive';
                }
                return <span key={index} data-index={index} className={color}>{char}</span>;
            })}
        </div>
    );
};

export default function TypingTestPage() {
  const router = useRouter();
  const [gameState, setGameState] = useState<'confirm' | 'playing'>('confirm');
  
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

  const calculateResults = useCallback(() => {
    const elapsedMinutes = (GAME_DURATION - timeLeft) / 60;
    if (elapsedMinutes <= 0) return;

    // Player results
    const wordsTyped = typedText.trim().split(/\s+/).length;
    setWpm(Math.round( wordsTyped / elapsedMinutes ));
    
    let correctChars = 0;
    typedText.split('').forEach((char, i) => {
      if(sampleText[i] && char === sampleText[i]) {
        correctChars++;
      }
    });
    setAccuracy(Math.round((correctChars / typedText.length) * 100) || 0);

    // Opponent results
    const opponentWordsTyped = opponentTypedText.trim().split(/\s+/).length;
    setOpponentWpm(Math.round( opponentWordsTyped / elapsedMinutes ));

  }, [typedText, opponentTypedText, timeLeft]);

  const startGame = useCallback(() => {
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
    setGameState('playing');
    if (inputRef.current) {
        inputRef.current.value = '';
        inputRef.current.focus();
    }
  }, []);
  
  useEffect(() => {
    // Cleanup timers on unmount
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (opponentTimerRef.current) clearInterval(opponentTimerRef.current);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const currentTypedText = e.target.value;
    if (isFinished || currentTypedText.length > sampleText.length) return;
    
    if (!isStarted && currentTypedText.length > 0) {
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
            const newLength = prev.length + Math.round(charsPerSecond * (Math.random() * 0.5 + 0.75));
            if (newLength >= sampleText.length) {
                clearInterval(opponentTimerRef.current!);
                return sampleText;
            }
            return sampleText.substring(0, newLength);
        });
      }, 1000);
    }
    
    setTypedText(currentTypedText);
  };

  useEffect(() => {
    if (isFinished) {
      if (opponentTimerRef.current) clearInterval(opponentTimerRef.current);
      calculateResults();
    }
  }, [isFinished, calculateResults]);

  useEffect(() => {
    if(timeLeft === 0 && !isFinished) {
      setIsFinished(true);
    }
  }, [timeLeft, isFinished]);

  if (gameState === 'confirm') {
    return (
       <AlertDialog open={true} onOpenChange={() => router.back()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start Typing Race?</AlertDialogTitle>
            <AlertDialogDescription>
              This game requires 2 players. Since you're the only one here, would you like to play against a bot?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
                <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" /> Go Back</Button>
            </AlertDialogCancel>
            <AlertDialogAction onClick={startGame}>Play with Bot</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-muted-foreground">The race ends when the timer hits zero. Type the text below as fast and accurately as you can.</p>
          
          <div className='flex flex-col gap-4'>
            <div className='flex items-center gap-2'>
              <User className="h-5 w-5 text-primary"/>
              <h3 className='font-semibold'>You</h3>
            </div>
            <Progress value={(typedText.length / sampleText.length) * 100} className="h-2" />
            
            <div className='flex items-center gap-2'>
                <Bot className="h-5 w-5 text-muted-foreground"/>
                <h3 className='font-semibold'>Opponent</h3>
            </div>
            <Progress value={(opponentTypedText.length / sampleText.length) * 100} className="h-2" />
          </div>

          <div className='mt-6'>
            <HighlightedText textToHighlight={sampleText} typedText={typedText} />
            <Input
              ref={inputRef}
              type="text"
              placeholder={!isStarted ? "Start typing to begin the race..." : ""}
              onChange={handleInputChange}
              disabled={isFinished}
              className="w-full font-mono tracking-wider text-lg p-4"
              autoFocus
            />
          </div>
        </CardContent>
      </Card>
      
      {isFinished && (
        <Card className="w-full shadow-xl bg-accent/20 border-accent">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-center">
                {wpm > opponentWpm ? "You Win!" : "You Lost!"}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
            <div className='md:border-r'>
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
                 <div>
                  <p className="text-4xl font-bold text-muted-foreground">~95%</p>
                  <p className="text-muted-foreground">Accuracy</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={startGame} className="w-full">Play Again</Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
