'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O'];

const generateBingoCard = () => {
  const card: (number | string)[][] = [];
  for (let i = 0; i < 5; i++) {
    const column: number[] = [];
    const start = i * 15 + 1;
    const end = start + 14;
    while (column.length < 5) {
      const num = Math.floor(Math.random() * (end - start + 1)) + start;
      if (!column.includes(num)) {
        column.push(num);
      }
    }
    card.push(column);
  }
  // Transpose and set free space
  const transposed = card[0].map((_, colIndex) => card.map(row => row[colIndex]));
  transposed[2][2] = "FREE";
  return transposed;
};


export default function BingoPage() {
  const [card, setCard] = useState<(number | string)[][]>([]);
  const [marked, setMarked] = useState<boolean[][]>(
    Array(5).fill(null).map(() => Array(5).fill(false))
  );
  const [calledNumber, setCalledNumber] = useState<number | null>(null);

  useEffect(() => {
    const newCard = generateBingoCard();
    setCard(newCard);
    const newMarked = Array(5).fill(null).map(() => Array(5).fill(false));
    newMarked[2][2] = true; // Mark FREE space
    setMarked(newMarked);
  }, []);

  const toggleMark = (row: number, col: number) => {
    if (card[row][col] === "FREE") return;
    const newMarked = [...marked];
    newMarked[row][col] = !newMarked[row][col];
    setMarked(newMarked);
  };
  
  useEffect(() => {
    // Simulate calling numbers
    const interval = setInterval(() => {
      setCalledNumber(Math.floor(Math.random() * 75) + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!card.length) {
    return <div>Loading Bingo card...</div>;
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-4xl">
      <h1 className="text-5xl font-headline font-bold text-primary">Bingo</h1>
      <div className="flex flex-col md:flex-row items-start gap-8 w-full">
        <Card className="w-full md:w-auto shadow-xl">
          <CardHeader>
            <CardTitle className="text-center font-headline text-3xl">Your Card</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2">
              {BINGO_LETTERS.map(letter => (
                <div key={letter} className="flex items-center justify-center text-2xl font-bold font-headline text-primary">
                  {letter}
                </div>
              ))}
              {card.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <Button
                    key={`${rowIndex}-${colIndex}`}
                    variant="outline"
                    className={cn(
                      "h-16 w-16 text-xl font-bold rounded-lg border-2",
                      marked[rowIndex][colIndex] ? "bg-accent text-accent-foreground" : "bg-card"
                    )}
                    onClick={() => toggleMark(rowIndex, colIndex)}
                  >
                    {cell}
                  </Button>
                ))
              )}
            </div>
            <Button className="w-full mt-6 text-xl font-bold" size="lg">BINGO!</Button>
          </CardContent>
        </Card>
        <div className="flex-grow flex flex-col items-center gap-4">
            <Card className="p-4 text-center">
                <CardDescription>Number Called</CardDescription>
                <p className="text-6xl font-bold text-primary">{calledNumber ?? "--"}</p>
            </Card>
        </div>
      </div>
    </div>
  );
}
