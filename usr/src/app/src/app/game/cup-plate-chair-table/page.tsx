'use client'

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shuffle, Timer, User, Bot, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

const items = [
  { name: 'Cup', icon: '☕️' },
  { name: 'Plate', icon: '🍽️' },
  { name: 'Chair', icon: '🪑' },
  { name: 'Table', icon: '🛋️' },
];
const PAIRS = [['Cup', 'Plate'], ['Chair', 'Table']];

const ROUND_TIME = 5;
const WINNING_SCORE = 500;

const PlayerCard = ({ name, icon, score, choice, revealed, hasChosen, isPlayer = false }: { name: string, icon: React.ReactNode, score: number, choice: string | null, revealed: boolean, hasChosen: boolean, isPlayer?: boolean }) => {
    const displayIcon = revealed ? (items.find(i => i.name === choice)?.icon ?? '🤔') : (hasChosen ? <CheckCircle className="text-green-500 h-8 w-8" /> : '🤔');

    return (
        <Card className="shadow-xl">
            <CardHeader className="flex-row items-center justify-between pb-2">
                <CardTitle className="text-2xl font-headline font-semibold">{name}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-2">
                <p className={cn("text-5xl font-bold", isPlayer ? "text-primary" : "text-muted-foreground")}>{score}</p>
                <div className="text-4xl font-bold h-10 flex items-center justify-center">{displayIcon}</div>
            </CardContent>
        </Card>
    );
};

export default function CupPlateChairTablePage() {
  const router = useRouter();
  const [gameState, setGameState] = useState<'confirm' | 'playing'>('confirm');

  const [selections, setSelections] = useState<{ p1: string | null; p2: string | null; p3: string | null }>({ p1: null, p2: null, p3: null });
  const [score, setScore] = useState({ p1: 0, p2: 0, p3: 0 });
  const [roundResult, setRoundResult] = useState<string | null>(null);
  const [isRoundInProgress, setIsRoundInProgress] = useState(false);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [winner, setWinner] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [availableItems, setAvailableItems] = useState(items);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRound = useCallback(() => {
    setIsRoundInProgress(true);
    setSelections({ p1: null, p2: null, p3: null });
    setRoundResult(null);
    setTimeLeft(ROUND_TIME);
    setRevealed(false);
    setAvailableItems(items);
  }, []);

  const initializeGame = useCallback(() => {
    setScore({ p1: 0, p2: 0, p3: 0 });
    setWinner(null);
    setGameState('playing');
    startRound();
  }, [startRound]);

  const handlePlayerSelect = (itemName: string) => {
    if (!isRoundInProgress || selections.p1 || !availableItems.find(i => i.name === itemName)) return;
    setSelections(s => ({ ...s, p1: itemName }));
    setAvailableItems(prev => prev.filter(i => i.name !== itemName));
  };
  
  // Make bot selections when player chooses or as time passes
  useEffect(() => {
      if (isRoundInProgress && selections.p1 && (!selections.p2 || !selections.p3)) {
          const makeBotChoice = (bot: 'p2' | 'p3') => {
              if (selections[bot]) return;

              const botRemainingItems = items.filter(item => 
                  item.name !== selections.p1 && 
                  item.name !== selections.p2 &&
                  item.name !== selections.p3
              );
              
              if(botRemainingItems.length > 0) {
                 const choice = botRemainingItems[Math.floor(Math.random() * botRemainingItems.length)].name;
                 setSelections(s => ({...s, [bot]: choice}));
                 setAvailableItems(prev => prev.filter(i => i.name !== choice));
              }
          }
          if(!selections.p2) setTimeout(() => makeBotChoice('p2'), 500);
          if(!selections.p3) setTimeout(() => makeBotChoice('p3'), 1000);
      }
  }, [selections.p1, selections.p2, selections.p3, isRoundInProgress]);

  // Round timer
  useEffect(() => {
    if (isRoundInProgress) {
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
    }
    return () => {
        if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isRoundInProgress]);

  const calculateScore = useCallback((p1: string, p2: string, p3: string) => {
    const choices = [p1, p2, p3];
    let roundScores = { p1: 0, p2: 0, p3: 0 };
    let resultMessages = [];

    const isPair = (a: string, b: string) => {
        return PAIRS.some(p => p.includes(a) && p.includes(b) && a !== b);
    }

    if(isPair(choices[0], choices[1])) { roundScores.p1 += 50; roundScores.p2 += 50; resultMessages.push("You and Opponent 1 made a pair!"); }
    if(isPair(choices[0], choices[2])) { roundScores.p1 += 50; roundScores.p3 += 50; resultMessages.push("You and Opponent 2 made a pair!"); }
    if(isPair(choices[1], choices[2])) { roundScores.p2 += 50; roundScores.p3 += 50; resultMessages.push("The opponents made a pair!"); }
    
    if(resultMessages.length === 0) {
        resultMessages.push("No pairs made. No points this round.");
    } else {
        if(roundScores.p1 === 0) resultMessages.push("You got no points.");
        if(roundScores.p2 === 0) resultMessages.push("Opponent 1 got no points.");
        if(roundScores.p3 === 0) resultMessages.push("Opponent 2 got no points.");
    }

    const newScore = {
        p1: score.p1 + roundScores.p1,
        p2: score.p2 + roundScores.p2,
        p3: score.p3 + roundScores.p3,
    };
    
    setScore(newScore);
    setRoundResult(resultMessages.join(' '));
    
    if (newScore.p1 >= WINNING_SCORE) setWinner("You");
    else if (newScore.p2 >= WINNING_SCORE) setWinner("Opponent 1");
    else if (newScore.p3 >= WINNING_SCORE) setWinner("Opponent 2");
  }, [score]);

  // End of round logic
  useEffect(() => {
    const allPlayersSelected = selections.p1 && selections.p2 && selections.p3;
    const timeIsUp = timeLeft <= 0;

    if (isRoundInProgress && (allPlayersSelected || timeIsUp)) {
      if (timerRef.current) clearInterval(timerRef.current);
      
      let finalSelections = { ...selections };
      let finalAvailableItems = [...availableItems];

      // Assign random cards if not all players selected in time
      if (!finalSelections.p1) {
          const choice = finalAvailableItems.pop()!.name;
          finalSelections.p1 = choice;
      }
       if (!finalSelections.p2) {
          const choice = finalAvailableItems.pop()!.name;
          finalSelections.p2 = choice;
      }
       if (!finalSelections.p3) {
          const choice = finalAvailableItems.pop()!.name;
          finalSelections.p3 = choice;
      }
      
      setSelections(finalSelections);
      setRevealed(true);
      setIsRoundInProgress(false);
      calculateScore(finalSelections.p1!, finalSelections.p2!, finalSelections.p3!);
    }
  }, [selections, timeLeft, isRoundInProgress, calculateScore, availableItems]);

  if (gameState === 'confirm') {
    return (
       <AlertDialog open={true} onOpenChange={() => router.back()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Play Cup-Plate-Chair-Table?</AlertDialogTitle>
            <AlertDialogDescription>
              This game requires 3 players. Since you're the only one here, would you like to play against two bots?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
                <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" /> Go Back</Button>
            </AlertDialogCancel>
            <AlertDialogAction onClick={initializeGame}>Play with Bots</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  if (winner) {
    return (
        <AlertDialog open={!!winner}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{winner === "You" ? "Victory!" : "Game Over"}</AlertDialogTitle>
                    <AlertDialogDescription>
                    {winner} won the game with a score of {
                        winner === 'You' ? score.p1 : winner === 'Opponent 1' ? score.p2 : score.p3
                    }!
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={initializeGame}>Play Again</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-5xl">
      <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary text-center">Cup-Plate-Chair-Table</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        <PlayerCard name="You" icon={<User className="h-6 w-6 text-primary"/>} score={score.p1} choice={selections.p1} revealed={revealed} hasChosen={!!selections.p1} isPlayer />
        <PlayerCard name="Opponent 1" icon={<Bot className="h-6 w-6 text-muted-foreground"/>} score={score.p2} choice={selections.p2} revealed={revealed} hasChosen={!!selections.p2} />
        <PlayerCard name="Opponent 2" icon={<Bot className="h-6 w-6 text-muted-foreground"/>} score={score.p3} choice={selections.p3} revealed={revealed} hasChosen={!!selections.p3} />
      </div>
      
      <Card className="w-full">
        <CardContent className="p-4 flex flex-col items-center gap-2">
            {!isRoundInProgress && roundResult ? (
                <>
                 <p className="font-semibold text-center">{roundResult}</p>
                 <Button onClick={startRound} className="mt-2" disabled={!!winner}>
                    <Shuffle className="mr-2 h-4 w-4"/> Next Round
                 </Button>
                </>
            ) : (
                <>
                <div className="flex items-center gap-2 font-mono text-lg">
                    <Timer className="text-primary"/>
                    <span>Time left: {timeLeft}s</span>
                </div>
                <Progress value={(timeLeft / ROUND_TIME) * 100} className="w-full h-2" />
                </>
            )}
        </CardContent>
      </Card>


      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
        {items.map((item) => {
          const isSelectedByPlayer = selections.p1 === item.name;
          const isAvailable = !!availableItems.find(i => i.name === item.name);
          const canSelect = isRoundInProgress && !selections.p1 && isAvailable;

          return (
             <Card
              key={item.name}
              onClick={() => handlePlayerSelect(item.name)}
              className={cn(
                "p-4 flex flex-col items-center justify-center gap-2 aspect-square transition-all duration-300 transform",
                canSelect && 'cursor-pointer hover:scale-105 hover:shadow-2xl hover:border-primary',
                !isAvailable && 'opacity-30',
                isSelectedByPlayer && 'border-4 border-primary ring-4 ring-primary/50'
              )}
            >
              <span className="text-6xl">{item.icon}</span>
              <p className="font-bold text-lg">{item.name}</p>
            </Card>
          )
        })}
      </div>
    </div>
  );
}
