import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Member, ExpenseCategory, Expense } from '@/types';

interface ExpenseFormData {
  description: string;
  amount: string;
  paidBy: string;
  splitType: 'equal' | 'percentage' | 'exact';
  category: ExpenseCategory;
  splitBetween: string[];
  percentages: Record<string, string>;
  exactAmounts: Record<string, string>;
}

interface ExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: Member[];
  expense?: Expense | null;
  onSubmit: (formData: ExpenseFormData) => Promise<void>;
  mode: 'add' | 'edit';
}

export function ExpenseFormDialog({
  open,
  onOpenChange,
  members,
  expense,
  onSubmit,
  mode,
}: ExpenseFormDialogProps) {
  const [formData, setFormData] = useState<ExpenseFormData>({
    description: '',
    amount: '',
    paidBy: '',
    splitType: 'equal',
    category: ExpenseCategory.OTHER,
    splitBetween: [],
    percentages: {},
    exactAmounts: {},
  });
  const [submitting, setSubmitting] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (expense && mode === 'edit') {
      const percentages: Record<string, string> = {};
      const exactAmounts: Record<string, string> = {};

      expense.splitBetween.forEach((detail) => {
        if (expense.splitType === 'percentage') {
          percentages[detail.memberId] = ((detail.amount / expense.amount) * 100).toFixed(2);
        } else if (expense.splitType === 'exact') {
          exactAmounts[detail.memberId] = detail.amount.toFixed(2);
        }
      });

      setFormData({
        description: expense.description,
        amount: expense.amount.toString(),
        paidBy: expense.paidBy,
        splitType: expense.splitType as 'equal' | 'percentage' | 'exact',
        category: expense.category || ExpenseCategory.OTHER,
        splitBetween: expense.splitBetween.map((d) => d.memberId),
        percentages,
        exactAmounts,
      });
    }
  }, [expense, mode]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFormData({
        description: '',
        amount: '',
        paidBy: '',
        splitType: 'equal',
        category: ExpenseCategory.OTHER,
        splitBetween: [],
        percentages: {},
        exactAmounts: {},
      });
    }
  }, [open]);

  const handleToggleMember = (memberId: string) => {
    setFormData((prev) => {
      const isSelected = prev.splitBetween.includes(memberId);
      return {
        ...prev,
        splitBetween: isSelected
          ? prev.splitBetween.filter((id) => id !== memberId)
          : [...prev.splitBetween, memberId],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim() || !formData.amount || !formData.paidBy) {
      return;
    }

    if (formData.splitBetween.length === 0) {
      alert('Please select at least one member to split the expense');
      return;
    }

    // Validate percentages
    if (formData.splitType === 'percentage') {
      const totalPercentage = formData.splitBetween.reduce(
        (sum, memberId) => sum + (parseFloat(formData.percentages[memberId] || '0')),
        0
      );
      if (Math.abs(totalPercentage - 100) > 0.01) {
        alert('Percentages must add up to 100%');
        return;
      }
    }

    // Validate exact amounts
    if (formData.splitType === 'exact') {
      const totalAmount = formData.splitBetween.reduce(
        (sum, memberId) => sum + (parseFloat(formData.exactAmounts[memberId] || '0')),
        0
      );
      if (Math.abs(totalAmount - parseFloat(formData.amount)) > 0.01) {
        alert(`Exact amounts must add up to $${parseFloat(formData.amount).toFixed(2)}`);
        return;
      }
    }

    try {
      setSubmitting(true);
      await onSubmit(formData);
      onOpenChange(false);
    } catch (error) {
      alert(`Failed to ${mode} expense. Please try again.`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{mode === 'add' ? 'Add Expense' : 'Edit Expense'}</DialogTitle>
            <DialogDescription>
              {mode === 'add'
                ? 'Add a new expense and split it among members'
                : 'Update the expense details'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="expense-description">Description *</Label>
              <Input
                id="expense-description"
                placeholder="Dinner at restaurant"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expense-amount">Amount *</Label>
              <Input
                id="expense-amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expense-paidby">Paid By *</Label>
              <Select
                value={formData.paidBy}
                onValueChange={(value) =>
                  setFormData({ ...formData, paidBy: value })
                }
              >
                <SelectTrigger id="expense-paidby">
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expense-category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value: ExpenseCategory) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger id="expense-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ExpenseCategory.FOOD}>Food</SelectItem>
                  <SelectItem value={ExpenseCategory.TRAVEL}>Travel</SelectItem>
                  <SelectItem value={ExpenseCategory.UTILITIES}>Utilities</SelectItem>
                  <SelectItem value={ExpenseCategory.ENTERTAINMENT}>Entertainment</SelectItem>
                  <SelectItem value={ExpenseCategory.ACCOMMODATION}>Accommodation</SelectItem>
                  <SelectItem value={ExpenseCategory.SHOPPING}>Shopping</SelectItem>
                  <SelectItem value={ExpenseCategory.OTHER}>Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Split Type *</Label>
              <RadioGroup
                value={formData.splitType}
                onValueChange={(value: 'equal' | 'percentage' | 'exact') =>
                  setFormData({ ...formData, splitType: value })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="equal" id="split-equal" />
                  <Label htmlFor="split-equal" className="font-normal cursor-pointer">
                    Equal - Split equally among selected members
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="percentage" id="split-percentage" />
                  <Label htmlFor="split-percentage" className="font-normal cursor-pointer">
                    Percentage - Split by custom percentages
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="exact" id="split-exact" />
                  <Label htmlFor="split-exact" className="font-normal cursor-pointer">
                    Exact - Specify exact amounts for each member
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div className="grid gap-2">
              <Label>Split Between * (Select members)</Label>
              <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                {members.map((member) => {
                  const isSelected = formData.splitBetween.includes(member.id);
                  return (
                    <div key={member.id} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`member-${member.id}`}
                          checked={isSelected}
                          onChange={() => handleToggleMember(member.id)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label
                          htmlFor={`member-${member.id}`}
                          className="font-normal cursor-pointer flex-1"
                        >
                          {member.name}
                        </Label>
                        {isSelected && formData.splitType === 'percentage' && (
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            placeholder="%"
                            className="w-20"
                            value={formData.percentages[member.id] || ''}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                percentages: {
                                  ...formData.percentages,
                                  [member.id]: e.target.value,
                                },
                              })
                            }
                          />
                        )}
                        {isSelected && formData.splitType === 'exact' && (
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className="w-24"
                            value={formData.exactAmounts[member.id] || ''}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                exactAmounts: {
                                  ...formData.exactAmounts,
                                  [member.id]: e.target.value,
                                },
                              })
                            }
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? (mode === 'add' ? 'Adding...' : 'Updating...')
                : (mode === 'add' ? 'Add Expense' : 'Update Expense')
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
