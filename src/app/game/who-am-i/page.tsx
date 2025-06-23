'use client';

import { useFormState } from 'react-dom';
import { createWhoAmIChallenge, type WhoAmIFormState } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useState, useEffect } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from "@/hooks/use-toast"
import { Wand2 } from 'lucide-react';

export default function WhoAmIPage() {
  const initialState: WhoAmIFormState = { message: null, data: null, errors: {} };
  const [state, dispatch] = useFormState(createWhoAmIChallenge, initialState);
  const [numCharacters, setNumCharacters] = useState(5);
  const [numQuestions, setNumQuestions] = useState(5);
  const { toast } = useToast();

  useEffect(() => {
    if (state.message && state.message !== 'Game created successfully!') {
      toast({
        variant: "destructive",
        title: "Error",
        description: state.message,
      })
    }
  }, [state, toast]);

  if (state.data) {
    return (
      <div className="w-full max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary text-center mb-8">Who Am I? Challenge</h1>
        <Accordion type="single" collapsible className="w-full">
          {state.data.characters.map((char, index) => (
            <AccordionItem value={`item-${index}`} key={char.name}>
              <AccordionTrigger className="text-xl font-headline hover:no-underline">
                Character #{index + 1}: {char.name}
              </AccordionTrigger>
              <AccordionContent>
                <ul className="list-disc pl-5 space-y-2 text-base">
                  {char.questions.map((q, qIndex) => (
                    <li key={qIndex}>{q}</li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <div className="text-center mt-8">
            <form action={dispatch}>
                 {/* This is a trick to reset the form state by re-triggering the action with empty form data, effectively resetting it.
                 A better solution would be to wrap this in a component and unmount/remount it with a key. */}
                <Button type="submit">
                    <Wand2 className="mr-2 h-4 w-4" /> Create Another Game
                </Button>
            </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary text-center mb-4">Create a 'Who Am I?' Game</h1>
      <p className="text-muted-foreground text-center mb-8">Let our AI generate a fun and challenging game for you!</p>
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
              {state.errors?.theme && <p className="text-sm font-medium text-destructive">{state.errors.theme[0]}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <Select name="difficulty" defaultValue="medium">
                        <SelectTrigger id="difficulty">
                            <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
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
                    {state.errors?.ageRange && <p className="text-sm font-medium text-destructive">{state.errors.ageRange[0]}</p>}
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
