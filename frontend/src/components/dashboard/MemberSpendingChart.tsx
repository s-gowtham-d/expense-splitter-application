import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Expense } from '@/types';
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
}

export function MemberSpendingChart({ expenses }: MemberSpendingChartProps) {
  // Aggregate expenses by member name
  const memberSpending = expenses.reduce((acc, expense) => {
    const memberName = expense.paidByName || 'Unknown';
    if (!acc[memberName]) {
      acc[memberName] = 0;
    }
    acc[memberName] += expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(memberSpending).map(([name, amount]) => ({
    name,
    amount: Math.round(amount * 100) / 100,
  }));

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
