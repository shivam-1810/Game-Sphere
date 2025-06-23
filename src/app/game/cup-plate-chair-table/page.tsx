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
    const displayIcon = revealed ? (items.find(i => i.name === choice)?.icon ?? '🤔') : (hasChosen ? '✅' : '🤔');

    return (
        <Card className="shadow-xl">
            <CardHeader className="flex-row items-center justify-between pb-2">
                <CardTitle className="text-2xl font-headline font-semibold">{name}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-2">
                <p className={cn("text-5xl font-bold", isPlayer ? "text-primary" : "text-muted-foreground")}>{score}</p>
                <p className="text-4xl font-bold h-10">{displayIcon}</p>
            </CardContent>
        </Card>
    );
};

export default function CupPlateChairTablePage() {
  const router = useRouter();
  const [showBotConfirm, setShowBotConfirm] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);

  const [selections, setSelections] = useState<{ p1: string | null; p2: string | null; p3: string | null }>({ p1: null, p2: null, p3: null });
  const [score, setScore] = useState({ p1: 0, p2: 0, p3: 0 });
  const [roundResult, setRoundResult] = useState<string | null>(null);
  const [isRoundInProgress, setIsRoundInProgress] = useState(false);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [winner, setWinner] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRound = useCallback(() => {
    setIsRoundInProgress(true);
    setSelections({ p1: null, p2: null, p3: null });
    setRoundResult(null);
    setTimeLeft(ROUND_TIME);
    setRevealed(false);
  }, []);

  const initializeGame = useCallback(() => {
    setScore({ p1: 0, p2: 0, p3: 0 });
    setWinner(null);
    setShowBotConfirm(false);
    setGameStarted(true);
    startRound();
  }, [startRound]);

  const handlePlayerSelect = (itemName: string) => {
    if (!isRoundInProgress || selections.p1) return;
    setSelections(s => ({ ...s, p1: itemName }));
  };
  
  // Make bot selections when player chooses
  useEffect(() => {
      if (isRoundInProgress && selections.p1 && !selections.p2 && !selections.p3) {
          const remainingItems = items.filter(item => item.name !== selections.p1);

          for (let i = remainingItems.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [remainingItems[i], remainingItems[j]] = [remainingItems[j], remainingItems[i]];
          }

          const p2choice = remainingItems[0].name;
          const p3choice = remainingItems[1].name;
          
          setSelections(s => ({ ...s, p2: p2choice, p3: p3choice }));
      }
  }, [selections.p1, isRoundInProgress]);

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

      if (timeIsUp && !allPlayersSelected) {
          const available = [...items];
          for (let i = available.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [available[i], available[j]] = [available[j], available[i]];
          }
          
          let p1choice = selections.p1;
          if (!p1choice) {
            p1choice = available.pop()!.name;
          }
          
          const remainingForBots = available.filter(item => item.name !== p1choice);
          
          finalSelections = {
              p1: p1choice,
              p2: remainingForBots[0].name,
              p3: remainingForBots[1].name
          };
      }
      
      setSelections(finalSelections);
      setRevealed(true);
      setIsRoundInProgress(false);
      calculateScore(finalSelections.p1!, finalSelections.p2!, finalSelections.p3!);
    }
  }, [selections, timeLeft, isRoundInProgress, calculateScore]);

  if (!gameStarted) {
    return (
       <AlertDialog open={showBotConfirm}>
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
        {items.map((item) => (
          <Card
            key={item.name}
            onClick={() => handlePlayerSelect(item.name)}
            className={cn(
              "p-4 flex flex-col items-center justify-center gap-2 aspect-square transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:border-primary",
              !isRoundInProgress || !!selections.p1 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
              selections.p1 === item.name && 'border-4 border-primary ring-4 ring-primary/50'
            )}
          >
            <span className="text-6xl">{item.icon}</span>
            <p className="font-bold text-lg">{item.name}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
