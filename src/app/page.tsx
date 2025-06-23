'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Gamepad2 } from "lucide-react"
import { GameSphereLogo } from '@/components/icons'

// In a real app, you'd use a more robust ID generation method.
// We are using uuid here for demonstration purposes.
// The package `uuid` needs to be installed: `npm install uuid @types/uuid`
// Since I cannot install packages, I'll mock the function.
const generateRoomId = () => Math.random().toString(36).substring(2, 8).toUpperCase();


export default function Home() {
  const router = useRouter()
  const [playerName, setPlayerName] = useState('')
  const [roomCode, setRoomCode] = useState('')

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      alert("Please enter a player name.")
      return
    }
    const newRoomId = generateRoomId()
    // In a real app, you'd probably store player info in localStorage or context
    router.push(`/lobby/${newRoomId}`)
  }

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault()
    if (!playerName.trim() || !roomCode.trim()) {
      alert("Please enter a player name and a room code.")
      return
    }
    router.push(`/lobby/${roomCode}`)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-12 bg-gradient-to-br from-background to-secondary/50">
      <div className="flex flex-col items-center justify-center space-y-4 mb-12">
        <GameSphereLogo className="h-24 w-24 text-primary" />
        <h1 className="text-5xl md:text-6xl font-headline font-bold text-center tracking-tight text-primary">
          Welcome to GameSphere
        </h1>
        <p className="text-lg md:text-xl text-center text-muted-foreground max-w-2xl">
          Your portal to a universe of fun and games. Create a room, invite your friends, and let the games begin!
        </p>
      </div>

      <div className="w-full max-w-md">
        <Card className="mb-8 shadow-2xl rounded-xl border-2 border-primary/10">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Start a New Game</CardTitle>
            <CardDescription>Enter your name to get started.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name" className="text-primary font-semibold">Player Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., CaptainAwesome"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="text-base"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full font-bold text-lg" size="lg" onClick={handleCreateRoom} disabled={!playerName.trim()}>
              <Gamepad2 className="mr-2 h-5 w-5" />
              Create Room
            </Button>
          </CardFooter>
        </Card>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or
            </span>
          </div>
        </div>

        <form onSubmit={handleJoinRoom}>
          <Card className="mt-8 shadow-xl rounded-xl bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Join an Existing Room</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="room-code">Room Code</Label>
                  <Input
                    id="room-code"
                    placeholder="Enter 6-digit code"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    maxLength={6}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" variant="secondary" className="w-full" disabled={!playerName.trim() || !roomCode.trim()}>
                Join Room
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </main>
  );
}
