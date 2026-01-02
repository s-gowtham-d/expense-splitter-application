import { ExpenseItem } from './ExpenseItem';
import { Expense, Member } from '@/types';

interface ExpensesListProps {
  expenses: Expense[];
  members: Member[];
  onEdit: (expense: Expense) => void;
  onDelete: (expenseId: string) => void;
}

export function ExpensesList({ expenses, members, onEdit, onDelete }: ExpensesListProps) {
  if (expenses.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No expenses match your filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense) => (
        <ExpenseItem
          key={expense.id}
          expense={expense}
          members={members}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
