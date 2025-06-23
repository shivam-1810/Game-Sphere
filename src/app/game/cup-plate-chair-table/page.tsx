'use client'

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Dices, Shuffle } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { name: 'Cup', icon: '☕️' },
  { name: 'Plate', icon: '🍽️' },
  { name: 'Chair', icon: '🪑' },
  { name: 'Table', icon: '🛋️' },
];

export default function CupPlateChairTablePage() {
  const [player1Selection, setPlayer1Selection] = useState<string | null>(null);
  const [player2Selection, setPlayer2Selection] = useState<string | null>(null);
  const [score, setScore] = useState({ player1: 0, player2: 0 });
  const [roundResult, setRoundResult] = useState<string | null>(null);

  const handlePlayer1Select = (item: string) => {
    if (!player1Selection) {
      setPlayer1Selection(item);
      // AI or mock player 2 selection
      const p2choice = items[Math.floor(Math.random() * items.length)].name;
      setPlayer2Selection(p2choice);
      calculateScore(item, p2choice);
    }
  };

  const calculateScore = (p1: string, p2: string) => {
    let newScore = { ...score };
    let resultMessage = "";
    if (p1 === p2) {
      newScore.player1 += 1;
      resultMessage = `You both chose ${p1}. You win a point!`;
    } else {
      newScore.player2 += 1;
      resultMessage = `You chose ${p1}, opponent chose ${p2}. Opponent wins a point.`;
    }
    setScore(newScore);
    setRoundResult(resultMessage);
  };
  
  const nextRound = () => {
    setPlayer1Selection(null);
    setPlayer2Selection(null);
    setRoundResult(null);
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-4xl">
      <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary text-center">Cup-Plate-Chair-Table</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        <Card className="shadow-xl">
            <CardContent className="p-6 flex flex-col items-center gap-4">
                <h2 className="text-2xl font-headline font-semibold">Your Score</h2>
                <p className="text-5xl font-bold text-primary">{score.player1}</p>
            </CardContent>
        </Card>
        <Card className="shadow-xl">
            <CardContent className="p-6 flex flex-col items-center gap-4">
                <h2 className="text-2xl font-headline font-semibold">Opponent's Score</h2>
                <p className="text-5xl font-bold text-muted-foreground">{score.player2}</p>
            </CardContent>
        </Card>
      </div>

      {roundResult && (
        <Card className="w-full bg-accent/20 border-accent shadow-lg text-center p-4">
          <p className="font-semibold">{roundResult}</p>
          <Button onClick={nextRound} className="mt-4">
            <Shuffle className="mr-2 h-4 w-4"/> Next Round
          </Button>
        </Card>
      )}

      {!player1Selection && <p className="text-lg text-muted-foreground">Choose an item to start the round!</p>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
        {items.map((item) => (
          <Card
            key={item.name}
            onClick={() => handlePlayer1Select(item.name)}
            className={cn(
              "p-4 flex flex-col items-center justify-center gap-2 aspect-square transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:border-primary",
              player1Selection ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
              player1Selection === item.name && 'border-4 border-primary ring-4 ring-primary/50'
            )}
          >
            <span className="text-6xl">{item.icon}</span>
            <p className="font-bold text-lg">{item.name}</p>
          </Card>
        ))}
      </div>
      
      {player2Selection && (
        <div className='text-center'>
            <p className='text-lg'>Opponent chose:</p>
            <p className='text-4xl font-bold'>{player2Selection}</p>
        </div>
      )}

    </div>
  );
}
