import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Users, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/api/client';
import { Expense, Member, Currency } from '@/types';
import { formatCurrency } from '@/lib/currency';
import { CategoryPieChart } from '@/components/dashboard/CategoryPieChart';
import { MemberSpendingChart } from '@/components/dashboard/MemberSpendingChart';
import { SpendingTrendChart } from '@/components/dashboard/SpendingTrendChart';

export default function DashboardPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const expensesData = await api.expenses.getAll();
      setExpenses(expensesData.expenses);

      // Get all unique members from expenses
      const uniqueMemberIds = new Set<string>();
      expensesData.expenses.forEach(expense => {
        uniqueMemberIds.add(expense.paidBy);
        expense.splitBetween.forEach((split: { memberId: string }) => uniqueMemberIds.add(split.memberId));
      });

      // For demo, we'll use member IDs as names (in real app, fetch from API)
      setMembers(
        Array.from(uniqueMemberIds).map(id => ({ id, name: `Member ${id.slice(0, 4)}` }))
      );
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const totalExpenses = expenses.length;
  const totalAmount = expenses.reduce((sum, exp) => {
    // Convert all to USD for total (simplified)
    return sum + exp.amount;
  }, 0);
  const uniqueMembers = new Set(expenses.map(e => e.paidBy)).size;
  const averageExpense = totalExpenses > 0 ? totalAmount / totalExpenses : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of all expenses and spending patterns
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalExpenses}</div>
              <p className="text-xs text-muted-foreground">
                Across all groups
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalAmount, Currency.USD)}
              </div>
              <p className="text-xs text-muted-foreground">
                Combined spending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueMembers}</div>
              <p className="text-xs text-muted-foreground">
                Participating in expenses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Expense</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(averageExpense, Currency.USD)}
              </div>
              <p className="text-xs text-muted-foreground">
                Per expense
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        {expenses.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Data Available</CardTitle>
              <CardDescription>
                Add some expenses to see visualizations and insights
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CategoryPieChart expenses={expenses} />
            <MemberSpendingChart expenses={expenses} members={members} />
            <div className="lg:col-span-2">
              <SpendingTrendChart expenses={expenses} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
