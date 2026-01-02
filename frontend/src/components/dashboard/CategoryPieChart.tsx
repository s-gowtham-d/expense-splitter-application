import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Expense, ExpenseCategory } from '@/types';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface CategoryPieChartProps {
  expenses: Expense[];
}

const COLORS = {
  [ExpenseCategory.FOOD]: '#FF6384',
  [ExpenseCategory.TRAVEL]: '#36A2EB',
  [ExpenseCategory.UTILITIES]: '#FFCE56',
  [ExpenseCategory.ENTERTAINMENT]: '#4BC0C0',
  [ExpenseCategory.ACCOMMODATION]: '#9966FF',
  [ExpenseCategory.SHOPPING]: '#FF9F40',
  [ExpenseCategory.OTHER]: '#C9CBCF',
};

export function CategoryPieChart({ expenses }: CategoryPieChartProps) {
  // Aggregate expenses by category
  const categoryData = expenses.reduce((acc, expense) => {
    const category = expense.category;
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += expense.amount;
    return acc;
  }, {} as Record<ExpenseCategory, number>);

  const chartData = Object.entries(categoryData).map(([category, amount]) => ({
    name: category.charAt(0).toUpperCase() + category.slice(1),
    value: Math.round(amount * 100) / 100,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending by Category</CardTitle>
        <CardDescription>
          Distribution of expenses across categories
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[entry.name.toLowerCase() as ExpenseCategory] || COLORS.other}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
