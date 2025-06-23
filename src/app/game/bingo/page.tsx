'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

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

const checkBingo = (marked: boolean[][]) => {
  // Check rows
  for (let i = 0; i < 5; i++) {
    if (marked[i].every(Boolean)) return true;
  }
  // Check columns
  for (let i = 0; i < 5; i++) {
    if (marked.map(row => row[i]).every(Boolean)) return true;
  }
  // Check diagonals
  if ([0, 1, 2, 3, 4].map(i => marked[i][i]).every(Boolean)) return true;
  if ([0, 1, 2, 3, 4].map(i => marked[i][4 - i]).every(Boolean)) return true;

  return false;
};

const BingoCard = ({ title, card, marked, onMark, isOpponent = false }: { title: string, card: (string | number)[][], marked: boolean[][], onMark?: (row: number, col: number) => void, isOpponent?: boolean }) => {
  if (!card.length) {
    return (
       <Card className="w-full md:w-[400px] shadow-xl">
         <CardHeader>
           <CardTitle className="text-center font-headline text-3xl">{title}</CardTitle>
         </CardHeader>
         <CardContent>
          <div className="flex items-center justify-center h-64">Loading card...</div>
         </CardContent>
       </Card>
    )
  }
  
  return (
    <Card className="w-full md:w-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-center font-headline text-3xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-2">
          {BINGO_LETTERS.map(letter => (
            <div key={letter} className="flex items-center justify-center text-2xl font-bold font-headline text-primary">
              {letter}
            </div>
          ))}
          {card.flat().map((cell, index) => {
              const rowIndex = Math.floor(index / 5);
              const colIndex = index % 5;
              return (
                <Button
                  key={`${rowIndex}-${colIndex}`}
                  variant="outline"
                  className={cn(
                    "h-16 w-16 text-xl font-bold rounded-lg border-2",
                    marked[rowIndex][colIndex] ? "bg-accent text-accent-foreground" : "bg-card",
                    isOpponent && "cursor-not-allowed"
                  )}
                  onClick={() => !isOpponent && onMark && onMark(rowIndex, colIndex)}
                  disabled={isOpponent}
                >
                  {cell}
                </Button>
              )
          })}
        </div>
        {!isOpponent && <Button className="w-full mt-6 text-xl font-bold" size="lg" onClick={() => onMark && onMark(-1,-1)}>BINGO!</Button>}
      </CardContent>
    </Card>
  )
}


export default function BingoPage() {
  const [playerCard, setPlayerCard] = useState<(number | string)[][]>([]);
  const [opponentCard, setOpponentCard] = useState<(number | string)[][]>([]);
  const [playerMarked, setPlayerMarked] = useState<boolean[][]>([]);
  const [opponentMarked, setOpponentMarked] = useState<boolean[][]>([]);
  
  const [calledNumbers, setCalledNumbers] = useState<number[]>([]);
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [isGameRunning, setIsGameRunning] = useState(true);

  const initializeGame = useCallback(() => {
    const newPlayerCard = generateBingoCard();
    const newOpponentCard = generateBingoCard();
    setPlayerCard(newPlayerCard);
    setOpponentCard(newOpponentCard);

    const initialMarked = Array(5).fill(null).map(() => Array(5).fill(false));
    initialMarked[2][2] = true;
    setPlayerMarked(JSON.parse(JSON.stringify(initialMarked)));
    setOpponentMarked(JSON.parse(JSON.stringify(initialMarked)));
    
    setCalledNumbers([]);
    setCurrentNumber(null);
    setWinner(null);
    setIsGameRunning(true);
  }, []);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  const handlePlayerBingo = () => {
      if (checkBingo(playerMarked)) {
          setWinner("You");
          setIsGameRunning(false);
      } else {
          alert("Not a valid Bingo yet!");
      }
  }

  const togglePlayerMark = (row: number, col: number) => {
    if (row === -1) { // Bingo button clicked
        handlePlayerBingo();
        return;
    }
    if (winner) return;
    if (playerCard[row][col] === "FREE") return;
    const newMarked = [...playerMarked];
    newMarked[row][col] = !newMarked[row][col];
    setPlayerMarked(newMarked);
  };
  
  useEffect(() => {
    if (!isGameRunning) return;

    const interval = setInterval(() => {
      let num;
      if (calledNumbers.length >= 75) {
        setIsGameRunning(false);
        return;
      }
      do {
        num = Math.floor(Math.random() * 75) + 1;
      } while (calledNumbers.includes(num));
      
      setCurrentNumber(num);
      setCalledNumbers(prev => [...prev, num]);

    }, 3000);
    return () => clearInterval(interval);
  }, [isGameRunning, calledNumbers]);

  useEffect(() => {
    if(currentNumber === null || winner) return;

    // Opponent marks their card
    const newOpponentMarked = [...opponentMarked];
    let changed = false;
    for(let r=0; r<5; r++) {
      for(let c=0; c<5; c++) {
        if(opponentCard[r] && opponentCard[r][c] === currentNumber) {
          newOpponentMarked[r][c] = true;
          changed = true;
          break;
        }
      }
      if (changed) break;
    }

    if(changed) {
      setOpponentMarked(newOpponentMarked);
      if(checkBingo(newOpponentMarked)) {
        setWinner("Opponent");
        setIsGameRunning(false);
      }
    }
  }, [currentNumber, opponentCard, opponentMarked, winner]);
  
  if (!playerCard.length || !opponentCard.length) {
    return <div>Setting up the game...</div>;
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-7xl">
      <h1 className="text-5xl font-headline font-bold text-primary">Bingo Battle</h1>
      
      <div className="flex flex-col lg:flex-row items-start justify-center gap-8 w-full">
        <BingoCard title="Your Card" card={playerCard} marked={playerMarked} onMark={togglePlayerMark} />
        
        <div className="flex-grow flex flex-col items-center gap-4 w-full lg:w-auto max-w-xs">
            <Card className="p-4 text-center w-full">
                <CardDescription>Number Called</CardDescription>
                <p className="text-6xl font-bold text-primary">{currentNumber ?? "--"}</p>
            </Card>
            <Card className="p-4 w-full">
              <CardDescription className="text-center mb-2">Called Numbers ({calledNumbers.length}/75)</CardDescription>
              <div className="flex flex-wrap gap-1 justify-center max-h-48 overflow-y-auto">
                {calledNumbers.sort((a,b) => a-b).map(n => <span key={n} className="font-mono p-1 text-center bg-secondary rounded text-xs w-8">{n}</span>)}
              </div>
            </Card>
        </div>

        <BingoCard title="Opponent's Card" card={opponentCard} marked={opponentMarked} isOpponent={true} />
      </div>

       <AlertDialog open={!!winner}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{winner === "You" ? "Congratulations, you got BINGO!" : "Better Luck Next Time!"}</AlertDialogTitle>
            <AlertDialogDescription>
              {winner === "You" ? "You won the game!" : "The opponent got Bingo first."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={initializeGame}>Play Again</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
