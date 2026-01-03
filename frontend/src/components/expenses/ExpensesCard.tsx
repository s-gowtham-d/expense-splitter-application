import { useState } from 'react';
import { Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ExpenseFilters } from './ExpenseFilters';
import { ExpensesList } from './ExpensesList';
import { ExpenseFormDialog } from './ExpenseFormDialog';
import { Expense, Member, Currency } from '@/types';

interface ExpensesCardProps {
  expenses: Expense[];
  members: Member[];
  groupName: string;
  onAddExpense: (formData: any) => Promise<void>;
  onUpdateExpense: (expenseId: string, formData: any) => Promise<void>;
  onDeleteExpense: (expenseId: string) => Promise<void>;
}

export function ExpensesCard({
  expenses,
  members,
  groupName,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
}: ExpensesCardProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMember, setFilterMember] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const getFilteredExpenses = () => {
    return expenses.filter((expense) => {
      const matchesSearch =
        searchQuery === '' ||
        expense.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesMember =
        filterMember === 'all' ||
        expense.paidBy === filterMember ||
        expense.splitBetween.some((split) => split.memberId === filterMember);

      const matchesCategory =
        filterCategory === 'all' || expense.category === filterCategory;

      return matchesSearch && matchesMember && matchesCategory;
    });
  };

  const handleExportCSV = () => {
    const filteredExpenses = getFilteredExpenses();

    // CSV headers
    const headers = [
      'Date',
      'Description',
      'Amount',
      'Category',
      'Paid By',
      'Split Type',
      'Split Details',
    ];

    // CSV rows
    const rows = filteredExpenses.map((expense) => {
      const payer = members.find((m) => m.id === expense.paidBy);
      const splitDetails = expense.splitBetween
        .map((split) => {
          const member = members.find((m) => m.id === split.memberId);
          return `${member?.name}: ₹${split.amount.toFixed(2)}`;
        })
        .join('; ');

      return [
        new Date(expense.date).toLocaleDateString(),
        expense.description,
        `₹${expense.amount.toFixed(2)}`,
        expense.category,
        payer?.name || 'Unknown',
        expense.splitType,
        splitDetails,
      ];
    });

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `${groupName}-expenses-${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setEditDialogOpen(true);
  };

  const handleDelete = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    await onDeleteExpense(expenseId);
  };

  const handleAddSubmit = async (formData: any) => {
    const amount = parseFloat(formData.amount);
    let splitBetween;

    if (formData.splitType === 'equal') {
      // For equal split, send member IDs with placeholder amounts (backend will calculate)
      splitBetween = formData.splitBetween.map((memberId: string) => ({
        memberId,
        amount: 0, // Placeholder, backend will calculate
      }));
    } else if (formData.splitType === 'percentage') {
      // For percentage, send percentage values (not calculated amounts)
      splitBetween = formData.splitBetween.map((memberId: string) => ({
        memberId,
        amount: parseFloat(formData.percentages[memberId] || '0'),
      }));
    } else {
      // For exact, send exact amounts
      splitBetween = formData.splitBetween.map((memberId: string) => ({
        memberId,
        amount: parseFloat(formData.exactAmounts[memberId] || '0'),
      }));
    }

    await onAddExpense({
      description: formData.description,
      amount,
      currency: Currency.INR,
      paidBy: formData.paidBy,
      splitType: formData.splitType,
      category: formData.category,
      splitBetween,
    });
  };

  const handleEditSubmit = async (formData: any) => {
    if (!editingExpense) return;

    const amount = parseFloat(formData.amount);
    let splitBetween;

    if (formData.splitType === 'equal') {
      // For equal split, send member IDs with placeholder amounts (backend will calculate)
      splitBetween = formData.splitBetween.map((memberId: string) => ({
        memberId,
        amount: 0, // Placeholder, backend will calculate
      }));
    } else if (formData.splitType === 'percentage') {
      // For percentage, send percentage values (not calculated amounts)
      splitBetween = formData.splitBetween.map((memberId: string) => ({
        memberId,
        amount: parseFloat(formData.percentages[memberId] || '0'),
      }));
    } else {
      // For exact, send exact amounts
      splitBetween = formData.splitBetween.map((memberId: string) => ({
        memberId,
        amount: parseFloat(formData.exactAmounts[memberId] || '0'),
      }));
    }

    await onUpdateExpense(editingExpense.id, {
      description: formData.description,
      amount,
      currency: Currency.INR,
      paidBy: formData.paidBy,
      splitType: formData.splitType,
      category: formData.category,
      splitBetween,
    });
    setEditingExpense(null);
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Expenses</CardTitle>
            <CardDescription>Track shared expenses</CardDescription>
          </div>
          <div className="flex gap-2">
            {expenses.length > 0 && (
              <Button variant="outline" size="default" onClick={handleExportCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            )}
            <Button disabled={members.length === 0} onClick={() => setAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {expenses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-2">No expenses yet</p>
            <p className="text-sm text-muted-foreground">
              {members.length === 0
                ? 'Add members first to start tracking expenses'
                : 'Click "Add Expense" to get started'}
            </p>
          </div>
        ) : (
          <>
            <ExpenseFilters
              searchQuery={searchQuery}
              filterMember={filterMember}
              filterCategory={filterCategory}
              members={members}
              onSearchChange={setSearchQuery}
              onMemberFilterChange={setFilterMember}
              onCategoryFilterChange={setFilterCategory}
            />
            <ExpensesList
              expenses={getFilteredExpenses()}
              members={members}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </>
        )}
      </CardContent>

      <ExpenseFormDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        members={members}
        onSubmit={handleAddSubmit}
        mode="add"
      />

      <ExpenseFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        members={members}
        expense={editingExpense}
        onSubmit={handleEditSubmit}
        mode="edit"
      />
    </Card>
  );
}
