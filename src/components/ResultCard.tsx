import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ResultCardProps } from '@/types/resume';

export function ResultCard({ title, value }: ResultCardProps) {
  return (
    <Card className="h-full transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-72 overflow-auto">
        <p className="whitespace-pre-wrap break-words text-base font-medium leading-7 text-foreground sm:text-lg">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
