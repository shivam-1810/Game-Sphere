'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogCancel } from '@/components/ui/alert-dialog'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User, Bot, Ticket, CheckSquare } from 'lucide-react'

const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O'];
const BINGO_WIN_COUNT = 5;

// Generate a Bingo card with numbers from 1-24
const generateBingoCard = () => {
  const numbers = Array.from({ length: 24 }, (_, i) => i + 1);
  // Fisher-Yates shuffle
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }

  const card: (number | string)[][] = []; // row-major card
  let numIndex = 0;
  for (let r = 0; r < 5; r++) {
    const row = [];
    for (let c = 0; c < 5; c++) {
      if (r === 2 && c === 2) {
        row.push("FREE");
      } else {
        row.push(numbers[numIndex++]);
      }
    }
    card.push(row);
  }
  return card;
};

// Count number of Bingos
const countBingos = (marked: boolean[][]) => {
  let count = 0;
  // Check rows
  for (let i = 0; i < 5; i++) {
    if (marked[i].every(Boolean)) count++;
  }
  // Check columns
  for (let i = 0; i < 5; i++) {
    if (marked.map(row => row[i]).every(Boolean)) count++;
  }
  // Check diagonals
  if ([0, 1, 2, 3, 4].map(i => marked[i][i]).every(Boolean)) count++;
  if ([0, 1, 2, 3, 4].map(i => marked[i][4 - i]).every(Boolean)) count++;
  
  return count;
};

// Player's Bingo Card component
const BingoCardDisplay = ({ title, card, marked, bingos, isPlayer, turn }: { title: string, card: (string | number)[][], marked: boolean[][], bingos: number, isPlayer: boolean, turn: boolean }) => {
  return (
    <Card className={cn("w-full md:w-auto shadow-xl transition-all", turn && "ring-4 ring-primary shadow-primary/50")}>
      <CardHeader>
        <CardTitle className="text-center font-headline text-2xl flex items-center justify-center gap-2">
            {isPlayer ? <User /> : <Bot />} {title}
        </CardTitle>
        <CardDescription className="text-center font-bold text-primary">Bingos: {bingos} / {BINGO_WIN_COUNT}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-1">
          {BINGO_LETTERS.map(letter => (
            <div key={letter} className="flex items-center justify-center text-xl font-bold font-headline text-primary">
              {letter}
            </div>
          ))}
          {card.flat().map((cell, index) => (
            <div
              key={index}
              className={cn(
                "h-14 w-14 text-lg font-bold rounded-lg border-2 flex items-center justify-center",
                marked[Math.floor(index / 5)][index % 5] ? "bg-accent text-accent-foreground" : "bg-card",
              )}
            >
              {cell}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Opponent's simplified card display
const OpponentCardDisplay = ({ turn, bingos, marked }: { turn: boolean, bingos: number, marked: boolean[][] }) => {
    return (
        <Card className={cn("w-full md:w-auto shadow-xl transition-all", turn && "ring-4 ring-primary shadow-primary/50")}>
            <CardHeader>
                <CardTitle className="text-center font-headline text-2xl flex items-center justify-center gap-2">
                    <Bot /> Opponent
                </CardTitle>
                <CardDescription className="text-center font-bold text-primary">Bingos: {bingos} / {BINGO_WIN_COUNT}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-5 gap-1">
                    {BINGO_LETTERS.map(letter => (
                        <div key={letter} className="flex items-center justify-center text-xl font-bold font-headline text-primary opacity-50">
                            {letter}
                        </div>
                    ))}
                    {Array.from({ length: 25 }).map((_, index) => {
                        const r = Math.floor(index / 5);
                        const c = index % 5;
                        const isMarked = marked[r][c];
                        const isFreeSpace = r === 2 && c === 2;
                        return (
                             <div
                                key={index}
                                className={cn(
                                    "h-14 w-14 rounded-lg border-2 flex items-center justify-center",
                                    isMarked ? "bg-secondary" : "bg-card/50"
                                )}
                             >
                                {isMarked && (isFreeSpace ? <span className="text-lg font-bold">FREE</span> : <CheckSquare className="h-8 w-8 text-secondary-foreground" />)}
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
            <CardContent className="grid grid-cols-8 sm:grid-cols-12 gap-1 p-2 md:p-6">
                {Array.from({length: 24}, (_, i) => i+1).map(num => {
                    const isCalled = calledNumbers.has(num);
                    return (
                        <Button
                            key={num}
                            variant={isCalled ? "secondary" : "outline"}
                            size="icon"
                            className="h-10 w-10 text-sm"
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
  const [gameState, setGameState] = useState<'confirm' | 'playing'>('confirm');

  // Game state
  const [playerCard, setPlayerCard] = useState<(number | string)[][]>([]);
  const [opponentCard, setOpponentCard] = useState<(number | string)[][]>([]);
  const [playerMarked, setPlayerMarked] = useState<boolean[][]>([]);
  const [opponentMarked, setOpponentMarked] = useState<boolean[][]>([]);
  const [playerBingos, setPlayerBingos] = useState(0);
  const [opponentBingos, setOpponentBingos] = useState(0);
  
  const [calledNumbers, setCalledNumbers] = useState<Set<number>>(new Set());
  const [lastCalled, setLastCalled] = useState<number | null>(null);
  const [turn, setTurn] = useState<'player' | 'opponent'>('player');
  const [winner, setWinner] = useState<string | null>(null);

  const initializeGame = useCallback(() => {
    const pCard = generateBingoCard();
    const oCard = generateBingoCard();
    setPlayerCard(pCard);
    setOpponentCard(oCard);

    const initialMarked = Array(5).fill(null).map(() => Array(5).fill(false));
    initialMarked[2][2] = true; // Free space
    
    const pMarked = JSON.parse(JSON.stringify(initialMarked));
    const oMarked = JSON.parse(JSON.stringify(initialMarked));
    setPlayerMarked(pMarked);
    setOpponentMarked(oMarked);
    
    setPlayerBingos(countBingos(pMarked));
    setOpponentBingos(countBingos(oMarked));

    setCalledNumbers(new Set());
    setLastCalled(null);
    setWinner(null);
    setTurn('player');
    setGameState('playing');
  }, []);

  const updateMarks = useCallback((num: number) => {
    let playerWon = false;
    let opponentWon = false;

    const newPlayerMarked = [...playerMarked];
    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            if(playerCard[r] && playerCard[r][c] === num) {
                newPlayerMarked[r][c] = true;
            }
        }
    }
    setPlayerMarked(newPlayerMarked);
    const pBingos = countBingos(newPlayerMarked);
    setPlayerBingos(pBingos);
    if (pBingos >= BINGO_WIN_COUNT) playerWon = true;

    const newOpponentMarked = [...opponentMarked];
    for (let r = 0; r < 5; r++) {
         for (let c = 0; c < 5; c++) {
            if(opponentCard[r] && opponentCard[r][c] === num) {
                newOpponentMarked[r][c] = true;
            }
        }
    }
    setOpponentMarked(newOpponentMarked);
    const oBingos = countBingos(newOpponentMarked);
    setOpponentBingos(oBingos);
    if(oBingos >= BINGO_WIN_COUNT) opponentWon = true;

    if (playerWon && opponentWon) setWinner("It's a Tie!");
    else if (playerWon) setWinner("You");
    else if (opponentWon) setWinner("Opponent");

  }, [playerCard, opponentCard, playerMarked, opponentMarked]);

  const handleCallNumber = (num: number) => {
    if (winner || turn !== 'player') return;

    const newCalled = new Set(calledNumbers).add(num);
    setCalledNumbers(newCalled);
    setLastCalled(num);
    updateMarks(num);
    setTurn('opponent');
  };

  // Opponent's turn logic
  useEffect(() => {
    if (turn === 'opponent' && !winner) {
        const timeout = setTimeout(() => {
            // Bot logic: pick a random uncalled number
            let bestNum: number | null = null;
            const availableNumbers: number[] = [];
            for (let i = 1; i <= 24; i++) {
              if (!calledNumbers.has(i)) {
                availableNumbers.push(i);
              }
            }

            if(availableNumbers.length > 0) {
                 bestNum = availableNumbers[Math.floor(Math.random() * availableNumbers.length)];
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

  if (gameState === 'confirm') {
    return (
      <AlertDialog open={true} onOpenChange={() => router.back()}>
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
        <BingoCardDisplay title="Your Card" card={playerCard} marked={playerMarked} bingos={playerBingos} isPlayer={true} turn={turn==='player'} />

        {/* Opponent's Side */}
        <OpponentCardDisplay turn={turn === 'opponent'} bingos={opponentBingos} marked={opponentMarked} />
      </div>

      <div className="w-full max-w-4xl">
        <CallingBoard onCall={handleCallNumber} calledNumbers={calledNumbers} disabled={turn !== 'player' || !!winner} />
      </div>

       <AlertDialog open={!!winner}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{winner === "You" ? `Congratulations, you got ${BINGO_WIN_COUNT} BINGOs!` : (winner === "Opponent" ? "Better Luck Next Time!" : "It's a Draw!")}</AlertDialogTitle>
            <AlertDialogDescription>
              {winner === "You" ? "You won the game!" : (winner === "Opponent" ? `The opponent got ${BINGO_WIN_COUNT} Bingos first.` : `You both got ${BINGO_WIN_COUNT} Bingos at the same time!`)}
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
