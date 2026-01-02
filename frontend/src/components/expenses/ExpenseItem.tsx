import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Expense, Member } from '@/types';
import { formatCurrency } from '@/lib/currency';

interface ExpenseItemProps {
  expense: Expense;
  members: Member[];
  onEdit: (expense: Expense) => void;
  onDelete: (expenseId: string) => void;
}

export function ExpenseItem({ expense, members, onEdit, onDelete }: ExpenseItemProps) {
  const payer = members.find(m => m.id === expense.paidBy);

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex-1">
        <p className="font-medium">{expense.description}</p>
        <p className="text-sm text-muted-foreground">
          Paid by {payer?.name || 'Unknown'} • {expense.splitType} • {expense.category}
        </p>
        <p className="text-xs text-muted-foreground">
          {new Date(expense.date).toLocaleDateString()}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <p className="text-lg font-bold">{formatCurrency(expense.amount, expense.currency)}</p>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(expense)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(expense.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  );
}
