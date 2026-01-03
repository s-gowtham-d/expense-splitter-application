import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Settlement } from '@/types';

interface SettlementsCardProps {
  settlements: Settlement[];
}

export function SettlementsCard({ settlements }: SettlementsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Settlements</CardTitle>
        <CardDescription>Suggested payments</CardDescription>
      </CardHeader>
      <CardContent>
        {settlements.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            All settled up!
          </p>
        ) : (
          <div className="space-y-3">
            {settlements.map((settlement, idx) => (
              <div key={idx} className="p-3 bg-accent rounded-lg">
                <p className="text-sm">
                  <span className="font-semibold">{settlement.fromName}</span>
                  {' pays '}
                  <span className="font-semibold">{settlement.toName}</span>
                </p>
                <p className="text-lg font-bold text-primary mt-1">
                  ₹{settlement.amount.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
