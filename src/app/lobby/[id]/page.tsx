import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GameCard } from '@/components/game-card';
import { Badge } from '@/components/ui/badge';
import { Share2, Users, Keyboard, Ticket, HelpCircle, Puzzle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const games = [
  {
    title: 'Typing Speed Test',
    description: 'Test your typing skills against the clock.',
    icon: Keyboard,
    href: '/game/typing-test',
    color: 'bg-green-500',
  },
  {
    title: 'Bingo',
    description: 'A classic game of chance. First to shout Bingo wins!',
    icon: Ticket,
    href: '/game/bingo',
    color: 'bg-blue-500',
  },
  {
    title: 'Who Am I?',
    description: 'Guess the secret character with AI-generated questions.',
    icon: HelpCircle,
    href: '/game/who-am-i',
    color: 'bg-yellow-500',
  },
  {
    title: 'Cup-Plate-Chair-Table',
    description: 'A unique pairing game of strategy and luck.',
    icon: Puzzle,
    href: '/game/cup-plate-chair-table',
    color: 'bg-red-500',
  },
];

const mockPlayers = [
  { name: 'Player One', avatar: 'https://placehold.co/100x100' },
  { name: 'Player Two', avatar: 'https://placehold.co/100x100' },
  { name: 'You', avatar: 'https://placehold.co/100x100' },
  { name: 'Player Four', avatar: 'https://placehold.co/100x100' },
];

export default function LobbyPage({ params }: { params: { id: string } }) {
  const roomCode = params.id;

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
                <Badge variant="secondary" className="ml-auto">{mockPlayers.length}/8</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {mockPlayers.map((player, index) => (
                  <li key={index} className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={player.avatar} alt={player.name} data-ai-hint="person face" />
                      <AvatarFallback>{player.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{player.name}</span>
                    {player.name === 'You' && <Badge className="ml-auto bg-primary text-primary-foreground">You</Badge>}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  );
}
