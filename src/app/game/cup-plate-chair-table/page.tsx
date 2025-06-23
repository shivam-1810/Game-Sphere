'use client'

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shuffle, Timer, User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


const items = [
  { name: 'Cup', icon: '☕️' },
  { name: 'Plate', icon: '🍽️' },
  { name: 'Chair', icon: '🪑' },
  { name: 'Table', icon: '🛋️' },
];

const ROUND_TIME = 5;
const WINNING_SCORE = 500;

export default function CupPlateChairTablePage() {
  const [selections, setSelections] = useState<{ p1: string | null; p2: string | null; p3: string | null }>({ p1: null, p2: null, p3: null });
  const [score, setScore] = useState({ p1: 0, p2: 0, p3: 0 });
  const [roundResult, setRoundResult] = useState<string | null>(null);
  const [isRoundInProgress, setIsRoundInProgress] = useState(true);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [winner, setWinner] = useState<string | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRound = () => {
    setIsRoundInProgress(true);
    setSelections({ p1: null, p2: null, p3: null });
    setRoundResult(null);
    setTimeLeft(ROUND_TIME);
  }

  const handlePlayerSelect = (item: string) => {
    if (!isRoundInProgress || selections.p1) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const p2choice = items[Math.floor(Math.random() * items.length)].name;
    const p3choice = items[Math.floor(Math.random() * items.length)].name;

    setSelections({ p1: item, p2: p2choice, p3: p3choice });
    setIsRoundInProgress(false);
  };

  const calculateScore = (p1: string, p2: string, p3: string) => {
    const choices = [p1, p2, p3];
    const counts: { [key: string]: number } = {};
    choices.forEach(c => { counts[c] = (counts[c] || 0) + 1; });

    let newScore = { ...score };
    let resultMessage = "";

    const uniqueChoices = Object.keys(counts).length;

    if (uniqueChoices === 2) { // Two same, one different
        const [majorityItem] = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(e => e[0]);
        
        let pointWinnersNames: string[] = [];
        if (choices[0] === majorityItem) { newScore.p1 += 50; pointWinnersNames.push("You"); }
        if (choices[1] === majorityItem) { newScore.p2 += 50; pointWinnersNames.push("Opponent 1"); }
        if (choices[2] === majorityItem) { newScore.p3 += 50; pointWinnersNames.push("Opponent 2"); }
        
        resultMessage = `${pointWinnersNames.join(' and ')} win 50 points for matching with ${majorityItem}!`;
    } else { // All same (uniqueChoices === 1) or all different (uniqueChoices === 3)
        resultMessage = "It's a draw! No points awarded this round.";
    }
    
    setScore(newScore);
    setRoundResult(resultMessage);
    
    if (newScore.p1 >= WINNING_SCORE) setWinner("You");
    else if (newScore.p2 >= WINNING_SCORE) setWinner("Opponent 1");
    else if (newScore.p3 >= WINNING_SCORE) setWinner("Opponent 2");
  };

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

  useEffect(() => {
    if (timeLeft <= 0 && isRoundInProgress) {
        if (timerRef.current) clearInterval(timerRef.current);
        const p1choice = items[Math.floor(Math.random() * items.length)].name;
        handlePlayerSelect(p1choice);
    }
  }, [timeLeft, isRoundInProgress]);

  useEffect(() => {
    if (selections.p1 && selections.p2 && selections.p3) {
      calculateScore(selections.p1, selections.p2, selections.p3);
    }
  }, [selections]);

  const resetGame = () => {
    setScore({ p1: 0, p2: 0, p3: 0 });
    setWinner(null);
    startRound();
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
                    <AlertDialogAction onClick={resetGame}>Play Again</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-5xl">
      <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary text-center">Cup-Plate-Chair-Table</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        <Card className="shadow-xl">
            <CardHeader className="flex-row items-center justify-between pb-2">
                <CardTitle className="text-2xl font-headline font-semibold">You</CardTitle>
                <User className="h-6 w-6 text-primary"/>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-2">
                <p className="text-5xl font-bold text-primary">{score.p1}</p>
                <p className="text-2xl font-bold">{selections.p1 ? items.find(i => i.name === selections.p1)?.icon : '🤔'}</p>
            </CardContent>
        </Card>
        <Card className="shadow-xl">
             <CardHeader className="flex-row items-center justify-between pb-2">
                <CardTitle className="text-2xl font-headline font-semibold">Opponent 1</CardTitle>
                <Bot className="h-6 w-6 text-muted-foreground"/>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-2">
                <p className="text-5xl font-bold text-muted-foreground">{score.p2}</p>
                <p className="text-2xl font-bold">{selections.p2 ? items.find(i => i.name === selections.p2)?.icon : '🤔'}</p>
            </CardContent>
        </Card>
        <Card className="shadow-xl">
             <CardHeader className="flex-row items-center justify-between pb-2">
                <CardTitle className="text-2xl font-headline font-semibold">Opponent 2</CardTitle>
                <Bot className="h-6 w-6 text-muted-foreground"/>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-2">
                <p className="text-5xl font-bold text-muted-foreground">{score.p3}</p>
                <p className="text-2xl font-bold">{selections.p3 ? items.find(i => i.name === selections.p3)?.icon : '🤔'}</p>
            </CardContent>
        </Card>
      </div>
      
      <Card className="w-full">
        <CardContent className="p-4 flex flex-col items-center gap-2">
            {!isRoundInProgress && roundResult ? (
                <>
                 <p className="font-semibold text-center">{roundResult}</p>
                 <Button onClick={startRound} className="mt-2">
                    <Shuffle className="mr-2 h-4 w-4"/> Next Round
                 </Button>
                </>
            ) : (
                <>
                <div className="flex items-center gap-2 font-mono text-lg">
                    <Timer className="text-primary"/>
                    <span>Time left: {timeLeft}s</span>
                </div>
                <Progress value={timeLeft / ROUND_TIME * 100} className="w-full h-2" />
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
              !isRoundInProgress ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
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
