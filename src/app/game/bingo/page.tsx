'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogCancel } from '@/components/ui/alert-dialog'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User, Bot } from 'lucide-react'

const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O'];

// Generate a classic Bingo card
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
  // Set free space
  card[2][2] = "FREE";
  return card;
};

// Check for Bingo
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

// Player's Bingo Card component
const BingoCard = ({ title, card, marked }: { title: string, card: (string | number)[][], marked: boolean[][] }) => {
  return (
    <Card className="w-full md:w-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-center font-headline text-2xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-1">
          {BINGO_LETTERS.map(letter => (
            <div key={letter} className="flex items-center justify-center text-xl font-bold font-headline text-primary">
              {letter}
            </div>
          ))}
          {card.map((col, colIndex) => (
             col.map((cell, rowIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={cn(
                    "h-14 w-14 text-lg font-bold rounded-lg border-2 flex items-center justify-center",
                    marked[rowIndex][colIndex] ? "bg-accent text-accent-foreground" : "bg-card",
                  )}
                >
                  {cell}
                </div>
              ))
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Opponent's simplified card display
const OpponentCardDisplay = ({ marked, turn }: { marked: boolean[][], turn: boolean }) => {
    return (
        <Card className={cn("w-full md:w-auto shadow-xl", turn && "ring-2 ring-primary")}>
            <CardHeader>
                <CardTitle className="text-center font-headline text-2xl flex items-center justify-center gap-2">
                    <Bot /> Opponent's Card
                </CardTitle>
            </CardHeader>
            <CardContent>
                 <div className="grid grid-cols-5 gap-1">
                    {Array.from({ length: 25 }).map((_, index) => {
                        const rowIndex = Math.floor(index / 5);
                        const colIndex = index % 5;
                        return (
                             <div
                                key={index}
                                className={cn(
                                    "h-14 w-14 rounded-lg border flex items-center justify-center",
                                    marked[rowIndex][colIndex] ? "bg-accent" : "bg-secondary/30"
                                )}
                             >
                                {marked[rowIndex][colIndex] && <div className="h-8 w-8 rounded-full bg-accent-foreground/50" />}
                             </div>
                        )
                    })}
                 </div>
            </CardContent>
        </Card>
    )
}

// Number calling board component
const CallingBoard = ({ onCall, calledNumbers, disabled }: { onCall: (num: number) => void, calledNumbers: Set<number>, disabled: boolean }) => {
    return (
        <Card className="flex-grow">
            <CardHeader>
                <CardTitle className="text-center">Call a Number</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-10 sm:grid-cols-15 md:grid-cols-15 gap-1">
                {Array.from({length: 75}, (_, i) => i+1).map(num => {
                    const isCalled = calledNumbers.has(num);
                    return (
                        <Button
                            key={num}
                            variant={isCalled ? "secondary" : "outline"}
                            size="icon"
                            className="h-9 w-9 text-xs"
                            onClick={() => onCall(num)}
                            disabled={disabled || isCalled}
                        >
                            {num}
                        </Button>
                    )
                })}
            </CardContent>
        </Card>
    )
}

export default function BingoPage() {
  const router = useRouter();
  const [showBotConfirm, setShowBotConfirm] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);

  // Game state
  const [playerCard, setPlayerCard] = useState<(number | string)[][]>([]);
  const [opponentCard, setOpponentCard] = useState<(number | string)[][]>([]);
  const [playerMarked, setPlayerMarked] = useState<boolean[][]>([]);
  const [opponentMarked, setOpponentMarked] = useState<boolean[][]>([]);
  
  const [calledNumbers, setCalledNumbers] = useState<Set<number>>(new Set());
  const [lastCalled, setLastCalled] = useState<number | null>(null);
  const [turn, setTurn] = useState<'player' | 'opponent'>('player');
  const [winner, setWinner] = useState<string | null>(null);

  const initializeGame = useCallback(() => {
    // Transpose cards so they are column-major for easier logic
    const transpose = (m: any[][]) => m[0].map((_, i) => m.map(row => row[i]));
    
    setPlayerCard(transpose(generateBingoCard()));
    setOpponentCard(transpose(generateBingoCard()));

    const initialMarked = Array(5).fill(null).map(() => Array(5).fill(false));
    initialMarked[2][2] = true; // Free space
    setPlayerMarked(JSON.parse(JSON.stringify(initialMarked)));
    setOpponentMarked(JSON.parse(JSON.stringify(initialMarked)));
    
    setCalledNumbers(new Set());
    setLastCalled(null);
    setWinner(null);
    setTurn('player');
    setGameStarted(true);
    setShowBotConfirm(false);
  }, []);

  const handleCallNumber = (num: number) => {
    if (winner || turn !== 'player') return;

    const newCalled = new Set(calledNumbers).add(num);
    setCalledNumbers(newCalled);
    setLastCalled(num);

    // Update marks for both players
    updateMarks(num);
    setTurn('opponent');
  };

  const updateMarks = useCallback((num: number) => {
    let playerWon = false;
    let opponentWon = false;

    const newPlayerMarked = [...playerMarked];
    for (let c = 0; c < 5; c++) {
        for (let r = 0; r < 5; r++) {
            if(playerCard[c] && playerCard[c][r] === num) {
                newPlayerMarked[r][c] = true;
            }
        }
    }
    setPlayerMarked(newPlayerMarked);
    if (checkBingo(newPlayerMarked)) playerWon = true;

    const newOpponentMarked = [...opponentMarked];
    for (let c = 0; c < 5; c++) {
         for (let r = 0; r < 5; r++) {
            if(opponentCard[c] && opponentCard[c][r] === num) {
                newOpponentMarked[r][c] = true;
            }
        }
    }
    setOpponentMarked(newOpponentMarked);
    if(checkBingo(newOpponentMarked)) opponentWon = true;

    if (playerWon && opponentWon) setWinner("It's a Tie!");
    else if (playerWon) setWinner("You");
    else if (opponentWon) setWinner("Opponent");

  }, [playerCard, opponentCard, playerMarked, opponentMarked]);

  // Opponent's turn logic
  useEffect(() => {
    if (turn === 'opponent' && !winner) {
        const timeout = setTimeout(() => {
            // Bot logic: find a number on its card that isn't called yet
            let bestNum: number | null = null;
            const availableNumbers: number[] = [];
            for (let c = 0; c < 5; c++) {
                for (let r = 0; r < 5; r++) {
                    const cell = opponentCard[c][r];
                    if (typeof cell === 'number' && !calledNumbers.has(cell)) {
                        availableNumbers.push(cell);
                    }
                }
            }

            if(availableNumbers.length > 0) {
                 bestNum = availableNumbers[Math.floor(Math.random() * availableNumbers.length)];
            } else {
                // No numbers left on card, pick a random uncalled number
                let randomNum;
                do {
                    randomNum = Math.floor(Math.random() * 75) + 1;
                } while (calledNumbers.has(randomNum))
                bestNum = randomNum;
            }

            if (bestNum) {
                const newCalled = new Set(calledNumbers).add(bestNum);
                setCalledNumbers(newCalled);
                setLastCalled(bestNum);
                updateMarks(bestNum);
            }
            setTurn('player');
        }, 1500);

        return () => clearTimeout(timeout);
    }
  }, [turn, winner, calledNumbers, opponentCard, updateMarks]);

  if (!gameStarted) {
    return (
      <AlertDialog open={showBotConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Play Bingo?</AlertDialogTitle>
            <AlertDialogDescription>
              This game requires 2 players. Since you're the only one here, would you like to play against a bot?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
                <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" /> Go Back</Button>
            </AlertDialogCancel>
            <AlertDialogAction onClick={initializeGame}>Play with Bot</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-7xl">
      <h1 className="text-5xl font-headline font-bold text-primary">Bingo Battle</h1>
      
      <div className="w-full flex justify-center">
        <Card className="p-4 text-center shadow-lg">
          <CardDescription>
            {winner ? `Game Over!` : `It's ${turn === 'player' ? 'Your' : "Opponent's"} Turn`}
          </CardDescription>
          <p className="text-4xl font-bold text-primary">Last Called: {lastCalled ?? '--'}</p>
        </Card>
      </div>

      <div className="flex flex-col lg:flex-row items-start justify-center gap-6 w-full">
        {/* Player's Side */}
        <div className={cn("flex flex-col items-center gap-4", turn === 'player' && "ring-2 ring-primary rounded-lg p-2")}>
            <BingoCard title="Your Card" card={playerCard} marked={playerMarked} />
        </div>

        {/* Opponent's Side */}
        <div className="flex flex-col items-center gap-4">
            <OpponentCardDisplay marked={opponentMarked} turn={turn === 'opponent'} />
        </div>
      </div>

      <div className="w-full max-w-4xl">
        <CallingBoard onCall={handleCallNumber} calledNumbers={calledNumbers} disabled={turn !== 'player' || !!winner} />
      </div>


       <AlertDialog open={!!winner}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{winner === "You" ? "Congratulations, you got BINGO!" : (winner === "Opponent" ? "Better Luck Next Time!" : "It's a Draw!")}</AlertDialogTitle>
            <AlertDialogDescription>
              {winner === "You" ? "You won the game!" : (winner === "Opponent" ? "The opponent got Bingo first." : "You both got Bingo at the same time!")}
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
