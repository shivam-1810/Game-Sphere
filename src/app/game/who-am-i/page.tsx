'use client';

import { createWhoAmIChallenge, type WhoAmIFormState } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useState, useEffect, useCallback, useActionState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Wand2, User, Bot, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogCancel } from '@/components/ui/alert-dialog';
import type { GenerateWhoAmIContentOutput } from '@/ai/flows/generate-who-am-i-content';
import { Progress } from '@/components/ui/progress';

type GameState = 'confirm' | 'setup' | 'playing' | 'round-over' | 'game-over';

export default function WhoAmIPage() {
  const router = useRouter();
  const { toast } = useToast();

  // Game state
  const [gameState, setGameState] = useState<GameState>('confirm');
  const [gameData, setGameData] = useState<GenerateWhoAmIContentOutput | null>(null);
  const [currentCharacterIndex, setCurrentCharacterIndex] = useState(0);
  const [revealedClues, setRevealedClues] = useState<string[]>([]);
  const [scores, setScores] = useState({ player: 0, opponent: 0 });
  const [guess, setGuess] = useState('');
  const [roundWinner, setRoundWinner] = useState<'player' | 'opponent' | 'none' | null>(null);
  
  // Form state
  const initialState: WhoAmIFormState = { message: null, data: null, errors: {} };
  const [formState, dispatch] = useActionState(createWhoAmIChallenge, initialState);
  const [numCharacters, setNumCharacters] = useState(5);
  const [numQuestions, setNumQuestions] = useState(5);

  const character = gameData?.characters[currentCharacterIndex];

  // Handle form submission result
  useEffect(() => {
    if (formState.message && formState.data) {
      setGameData(formState.data);
      setGameState('playing');
    } else if (formState.message && formState.message !== 'Game created successfully!') {
       toast({
        variant: "destructive",
        title: "Error Creating Game",
        description: formState.message,
      });
    }
  }, [formState, toast]);
  
  const handleGuess = useCallback((guesser: 'player' | 'opponent') => {
    if (!character || gameState !== 'playing') return;
    
    const isCorrect = (guesser === 'player' ? guess : character.name).trim().toLowerCase() === character.name.toLowerCase();

    if (isCorrect) {
      setRoundWinner(guesser);
      setScores(s => ({...s, [guesser]: s[guesser] + 1}));
    } else {
      if(guesser === 'player') {
         toast({ title: "Incorrect!", description: "That's not the right answer. Try again."});
         setGuess('');
         // If player is wrong, opponent gets an immediate chance.
         setTimeout(() => handleGuess('opponent'), 1000);
         return; // Prevent state transition until opponent guesses
      }
      setRoundWinner('none'); // No one guessed correctly in the end
    }
    setGameState('round-over');
  }, [character, guess, gameState, toast]);

  // Reveal clues one by one
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState === 'playing' && character) {
      setRevealedClues([character.questions[0]]);
      interval = setInterval(() => {
        setRevealedClues(prev => {
          if (prev.length < character.questions.length) {
            return [...prev, character.questions[prev.length]];
          }
          clearInterval(interval);
          if(gameState === 'playing') { // If no one has guessed by the end
            setRoundWinner('none');
            setGameState('round-over');
          }
          return prev;
        });
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [gameState, character]);

  
  // Bot guessing logic
  useEffect(() => {
    if (gameState === 'playing' && revealedClues.length > 2) {
       // Bot has a chance to guess, increasing with more clues
       const guessChance = revealedClues.length / (character?.questions.length ?? 5);
       if (Math.random() < guessChance * 0.3) { // 30% of the chance
          handleGuess('opponent');
       }
    }
  }, [gameState, revealedClues, character, handleGuess]);


  const nextRound = () => {
    if (!gameData) return;
    setGuess('');
    setRoundWinner(null);
    if (currentCharacterIndex < gameData.characters.length - 1) {
      setCurrentCharacterIndex(i => i + 1);
      setGameState('playing');
    } else {
      setGameState('game-over');
    }
  };

  const resetGame = () => {
    // This is a soft reset to go back to the setup screen.
    // We need to clear the form state for a true reset. A trick is to dispatch with no data.
    dispatch(new FormData()); 
    setGameState('setup');
    setGameData(null);
    setCurrentCharacterIndex(0);
    setScores({ player: 0, opponent: 0 });
    setRevealedClues([]);
    setRoundWinner(null);
    setGuess('');
  };
  
  // ---- RENDER LOGIC ----
  
  if (gameState === 'confirm') {
     return (
       <AlertDialog open={true}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Play Who Am I?</AlertDialogTitle>
            <AlertDialogDescription>
              This game requires 2 players. Since you're the only one here, would you like to play against a bot?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
                <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" /> Go Back</Button>
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => setGameState('setup')}>Play with Bot</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  if (gameState === 'setup') {
    return (
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary text-center mb-4">Create a 'Who Am I?' Game</h1>
        <p className="text-muted-foreground text-center mb-8">Let our AI generate a fun and challenging game for you and a bot!</p>
        <form action={dispatch}>
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline">Game Settings</CardTitle>
              <CardDescription>Customize the game to your liking.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Input id="theme" name="theme" placeholder="e.g., Famous Scientists, Cartoon Characters" required />
                {formState.errors?.theme && <p className="text-sm font-medium text-destructive">{formState.errors.theme[0]}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                      <Label htmlFor="difficulty">Difficulty</Label>
                      <Select name="difficulty" defaultValue="medium">
                          <SelectTrigger id="difficulty"><SelectValue placeholder="Select difficulty" /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="easy">Easy</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="hard">Hard</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="ageRange">Target Age Range</Label>
                      <Input id="ageRange" name="ageRange" placeholder="e.g., 8-12 years old" required/>
                      {formState.errors?.ageRange && <p className="text-sm font-medium text-destructive">{formState.errors.ageRange[0]}</p>}
                  </div>
              </div>
              <div className="space-y-2">
                <Label>Number of Characters: {numCharacters}</Label>
                <Slider name="numCharacters" defaultValue={[5]} min={3} max={10} step={1} onValueChange={(value) => setNumCharacters(value[0])}/>
              </div>
              <div className="space-y-2">
                <Label>Questions per Character: {numQuestions}</Label>
                <Slider name="numQuestionsPerCharacter" defaultValue={[5]} min={3} max={10} step={1} onValueChange={(value) => setNumQuestions(value[0])} />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full text-lg font-bold" size="lg">
                <Wand2 className="mr-2 h-5 w-5"/>
                Generate Game
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    );
  }

  if (gameState === 'game-over') {
    const playerWon = scores.player > scores.opponent;
    const isTie = scores.player === scores.opponent;
    return (
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-4xl font-headline">{isTie ? "It's a Draw!" : playerWon ? "Congratulations!" : "Better Luck Next Time!"}</CardTitle>
          <CardDescription>
            {isTie ? "You both tied!" : playerWon ? "You won the game!" : "The bot won the game."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-2xl">Final Score</p>
          <div className="flex justify-around text-3xl font-bold">
            <div className="text-primary">You: {scores.player}</div>
            <div className="text-muted-foreground">Bot: {scores.opponent}</div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={resetGame} className="w-full">Play Again</Button>
        </CardFooter>
      </Card>
    );
  }
  
  if (gameData && character) {
    return (
       <div className="w-full max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary text-center mb-2">Who Am I? Race</h1>
        <p className="text-center text-muted-foreground mb-6">Round {currentCharacterIndex + 1} of {gameData.characters.length}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="flex items-center justify-center p-4">
                <div className="text-center">
                    <User className="mx-auto h-8 w-8 text-primary mb-2" />
                    <p className="text-xl font-bold">You</p>
                    <p className="text-3xl font-headline text-primary">{scores.player}</p>
                </div>
            </Card>
            <Card className="flex items-center justify-center p-4 text-center text-lg font-semibold">
                Guess the character based on the clues below!
            </Card>
            <Card className="flex items-center justify-center p-4">
                <div className="text-center">
                    <Bot className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-xl font-bold">Opponent</p>
                    <p className="text-3xl font-headline text-muted-foreground">{scores.opponent}</p>
                </div>
            </Card>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
              <CardTitle className="font-headline text-2xl">Clues</CardTitle>
              <Progress value={gameState === 'playing' ? (revealedClues.length / character.questions.length * 100) : 100} />
          </CardHeader>
          <CardContent>
              <ul className="list-disc pl-5 space-y-2 text-base min-h-[160px]">
                {revealedClues.map((clue, index) => (
                  <li key={index} className="animate-in fade-in duration-500">{clue}</li>
                ))}
              </ul>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-2">
            {gameState === 'playing' && (
              <>
                <Input 
                  placeholder="Type your guess here..." 
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGuess('player')}
                  disabled={gameState !== 'playing'}
                />
                <Button onClick={() => handleGuess('player')} disabled={!guess || gameState !== 'playing'} className="w-full sm:w-auto">Guess</Button>
              </>
            )}
            {gameState === 'round-over' && (
                <div className="text-center w-full space-y-2 p-4">
                    <p className="text-lg font-semibold">The character was: <span className="text-accent">{character.name}</span></p>
                    {roundWinner === 'player' && <p className="text-primary font-bold">You guessed correctly!</p>}
                    {roundWinner === 'opponent' && <p className="text-destructive font-bold">The bot guessed it first!</p>}
                    {roundWinner === 'none' && <p className="text-muted-foreground font-bold">Nobody guessed correctly this round.</p>}
                    <Button onClick={nextRound} className="w-full sm:w-auto">Next Round</Button>
                </div>
            )}
          </CardFooter>
        </Card>
      </div>
    )
  }

  return <div>Loading Game...</div>;
}
