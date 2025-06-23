import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

type GameCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  colorClass: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
};

export function GameCard({ icon: Icon, title, description, href, colorClass, onClick }: GameCardProps) {
  const content = (
    <>
      Play Now <ArrowRight className="ml-2 h-4 w-4" />
    </>
  );

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      e.preventDefault();
      onClick(e);
    }
  };

  return (
    <Card className="group flex flex-col overflow-hidden rounded-xl shadow-lg transition-all hover:shadow-2xl hover:-translate-y-1">
      <CardHeader className="flex-grow">
        <div className="flex items-center gap-4">
          <div className={`rounded-lg p-3 ${colorClass}`}>
            <Icon className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className='flex-1'>
            <CardTitle className="font-headline text-xl">{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex justify-end">
        <Button asChild className="font-bold bg-accent text-accent-foreground hover:bg-accent/90">
          <Link href={href} onClick={onClick ? handleButtonClick as any : undefined}>
            {content}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
