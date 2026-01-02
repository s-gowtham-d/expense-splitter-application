import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Balance } from '@/types';

interface BalancesCardProps {
  balances: Balance[];
}

export function BalancesCard({ balances }: BalancesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Balances</CardTitle>
        <CardDescription>Who owes whom</CardDescription>
      </CardHeader>
      <CardContent>
        {balances.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No expenses yet
          </p>
        ) : (
          <div className="space-y-2">
            {balances.map((balance) => (
              <div
                key={balance.memberId}
                className="flex items-center justify-between p-2 rounded"
              >
                <p className="font-medium text-sm">{balance.memberName}</p>
                <p
                  className={`text-sm font-semibold ${
                    balance.balance > 0
                      ? 'text-green-600'
                      : balance.balance < 0
                      ? 'text-red-600'
                      : 'text-muted-foreground'
                  }`}
                >
                  ${Math.abs(balance.balance).toFixed(2)}
                  {balance.balance > 0 && ' gets back'}
                  {balance.balance < 0 && ' owes'}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
