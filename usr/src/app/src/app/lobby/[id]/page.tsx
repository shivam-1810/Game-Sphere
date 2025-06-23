'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GameCard } from '@/components/game-card';
import { Badge } from '@/components/ui/badge';
import { Share2, Users, Keyboard, Ticket, HelpCircle, Puzzle, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

type Game = {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
  playerCount: number;
};

const games: Game[] = [
  {
    title: 'Typing Speed Race',
    description: 'Test your typing skills against the clock.',
    icon: Keyboard,
    href: '/game/typing-test',
    color: 'bg-green-500',
    playerCount: 2,
  },
  {
    title: 'Bingo',
    description: 'A classic game of chance. First to shout Bingo wins!',
    icon: Ticket,
    href: '/game/bingo',
    color: 'bg-blue-500',
    playerCount: 2,
  },
  {
    title: 'Who Am I?',
    description: 'Guess the secret character with AI-generated questions.',
    icon: HelpCircle,
    href: '/game/who-am-i',
    color: 'bg-yellow-500',
    playerCount: 2,
  },
  {
    title: 'Cup-Plate-Chair-Table',
    description: 'A unique pairing game of strategy and luck.',
    icon: Puzzle,
    href: '/game/cup-plate-chair-table',
    color: 'bg-red-500',
    playerCount: 3,
  },
];

type Player = {
  name: string;
  isYou?: boolean;
  isBot?: boolean;
};

export default function LobbyPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const roomCode = params.id;

  const [players, setPlayers] = useState<Player[]>([]);
  const [showPlayerSelect, setShowPlayerSelect] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [selectedOpponent, setSelectedOpponent] = useState<string | null>(null);
  
  // In a real app, player list would come from a real-time service.
  // Here, we simulate a room with you and two bots for demonstration.
  useEffect(() => {
    const playerName = localStorage.getItem('playerName') || 'You';
    setPlayers([
      { name: playerName, isYou: true },
      { name: 'CoolBot', isBot: true },
      { name: 'SmartBot', isBot: true },
    ]);
  }, []);

  const handleGameSelect = (game: Game) => {
    const isMultiplayer = players.length > 1;

    if (isMultiplayer && game.playerCount < players.length) {
      setSelectedGame(game);
      setShowPlayerSelect(true);
    } else {
      router.push(`${game.href}?roomId=${roomCode}`);
    }
  };

  const handleOpponentSelectAndPlay = () => {
    if (!selectedGame || !selectedOpponent) return;
    // In a real app, you would pass opponent info to the game state.
    // For now, we'll just navigate.
    router.push(`${selectedGame.href}?roomId=${roomCode}&opponent=${selectedOpponent}`);
    setShowPlayerSelect(false);
  };

  const otherPlayers = players.filter(p => !p.isYou);

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8">
      <header className="mb-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-headline font-bold text-primary">Game Lobby</h1>
            <p className="text-muted-foreground">You are in room:</p>
          </div>
          <Card className="p-2 sm:p-4 shadow-lg bg-primary/10">
            <div className="flex items-center gap-4">
              <span className="text-2xl sm:text-4xl font-mono font-bold tracking-widest text-primary">{roomCode}</span>
              <Button size="sm" variant="outline" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Share2 className="mr-2 h-4 w-4" />
                Share Code
              </Button>
            </div>
          </Card>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-headline font-semibold mb-4">Choose a Game</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {games.map((game) => (
              <GameCard
                key={game.title}
                title={game.title}
                description={game.description}
                icon={game.icon}
                href={`${game.href}?roomId=${roomCode}`}
                colorClass={game.color}
                onClick={() => handleGameSelect(game)}
              />
            ))}
          </div>
        </div>

        <aside>
          <Card className="shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <Users />
                Players
                <Badge variant="secondary" className="ml-auto">{players.length}/3</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {players.map((player, index) => (
                  <li key={index} className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={`https://placehold.co/100x100?text=${player.name.charAt(0)}`} alt={player.name} data-ai-hint="person face" />
                      <AvatarFallback>{player.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{player.name}</span>
                    {player.isYou && <Badge className="ml-auto bg-primary text-primary-foreground">You</Badge>}
                    {player.isBot && <Badge variant="outline" className="ml-auto">Bot</Badge>}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </aside>
      </main>

      <AlertDialog open={showPlayerSelect} onOpenChange={setShowPlayerSelect}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Choose Your Opponent</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedGame?.title} is a 2-player game. Please choose one player to compete against.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <RadioGroup onValueChange={setSelectedOpponent} defaultValue={selectedOpponent}>
              <div className="space-y-2">
                {otherPlayers.map(player => (
                  <div key={player.name} className="flex items-center space-x-2">
                    <RadioGroupItem value={player.name} id={player.name} />
                    <Label htmlFor={player.name} className="font-normal flex items-center gap-2">
                       <Avatar className="h-6 w-6">
                         <AvatarImage src={`https://placehold.co/100x100?text=${player.name.charAt(0)}`} alt={player.name} data-ai-hint="person face" />
                         <AvatarFallback>{player.name.substring(0,1)}</AvatarFallback>
                       </Avatar>
                       {player.name}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleOpponentSelectAndPlay} disabled={!selectedOpponent}>
              <UserCheck className="mr-2 h-4 w-4" /> Play
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
