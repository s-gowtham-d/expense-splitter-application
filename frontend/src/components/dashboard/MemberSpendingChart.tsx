import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Expense, Member } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface MemberSpendingChartProps {
  expenses: Expense[];
  members: Member[];
}

export function MemberSpendingChart({ expenses, members }: MemberSpendingChartProps) {
  // Aggregate expenses by member
  const memberSpending = expenses.reduce((acc, expense) => {
    const memberId = expense.paidBy;
    if (!acc[memberId]) {
      acc[memberId] = 0;
    }
    acc[memberId] += expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(memberSpending).map(([memberId, amount]) => {
    const member = members.find(m => m.id === memberId);
    return {
      name: member?.name || memberId.slice(0, 8),
      amount: Math.round(amount * 100) / 100,
    };
  });

  // Sort by amount descending
  chartData.sort((a, b) => b.amount - a.amount);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending by Member</CardTitle>
        <CardDescription>
          Total amount paid by each member
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="amount" fill="#8884d8" name="Amount Paid" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
