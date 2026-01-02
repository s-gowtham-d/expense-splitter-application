import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, UserPlus, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { api } from '@/api/client';
import { GroupWithDetails, Balance, Settlement, ExpenseCategory } from '@/types';

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<GroupWithDetails | null>(null);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [memberForm, setMemberForm] = useState({ name: '', email: '' });
  const [addingMember, setAddingMember] = useState(false);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [editExpenseOpen, setEditExpenseOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    paidBy: '',
    splitType: 'equal' as 'equal' | 'percentage' | 'exact',
    category: ExpenseCategory.OTHER,
    splitBetween: [] as string[],
    percentages: {} as Record<string, string>,
    exactAmounts: {} as Record<string, string>,
  });
  const [addingExpense, setAddingExpense] = useState(false);

  useEffect(() => {
    if (id) {
      loadGroupData();
    }
  }, [id]);

  const loadGroupData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [groupData, balancesData, settlementsData] = await Promise.all([
        api.groups.getById(id),
        api.groups.getBalances(id),
        api.groups.getSettlements(id),
      ]);

      setGroup(groupData);
      setBalances(balancesData.balances);
      setSettlements(settlementsData.settlements);
    } catch (error) {
      console.error('Failed to load group:', error);
      alert('Failed to load group details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.name.trim() || !id) return;

    try {
      setAddingMember(true);
      const result = await api.members.addToGroup(id, {
        name: memberForm.name,
        email: memberForm.email || undefined,
      });

      setGroup(prev => prev ? {
        ...prev,
        members: [...prev.members, result.member]
      } : null);

      setMemberForm({ name: '', email: '' });
      setAddMemberOpen(false);

      // Reload balances and settlements
      await loadGroupData();
    } catch (error) {
      console.error('Failed to add member:', error);
      alert('Failed to add member. Please try again.');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!id || !confirm('Are you sure you want to remove this member?')) return;

    try {
      await api.members.removeFromGroup(id, memberId);
      setGroup(prev => prev ? {
        ...prev,
        members: prev.members.filter(m => m.id !== memberId)
      } : null);

      // Reload balances and settlements
      await loadGroupData();
    } catch (error) {
      console.error('Failed to remove member:', error);
      alert('Failed to remove member. Please try again.');
    }
  };

  const handleToggleMemberForSplit = (memberId: string) => {
    setExpenseForm(prev => {
      const isSelected = prev.splitBetween.includes(memberId);
      const newSplitBetween = isSelected
        ? prev.splitBetween.filter(id => id !== memberId)
        : [...prev.splitBetween, memberId];

      return {
        ...prev,
        splitBetween: newSplitBetween,
      };
    });
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !expenseForm.description.trim() || !expenseForm.amount || !expenseForm.paidBy) {
      return;
    }

    if (expenseForm.splitBetween.length === 0) {
      alert('Please select at least one member to split the expense');
      return;
    }

    try {
      setAddingExpense(true);

      const amount = parseFloat(expenseForm.amount);

      // Build split details based on split type
      let splitDetails;
      if (expenseForm.splitType === 'equal') {
        splitDetails = expenseForm.splitBetween.map(memberId => ({
          memberId,
          amount: amount / expenseForm.splitBetween.length,
        }));
      } else if (expenseForm.splitType === 'percentage') {
        const totalPercentage = expenseForm.splitBetween.reduce(
          (sum, memberId) => sum + (parseFloat(expenseForm.percentages[memberId] || '0')),
          0
        );

        if (Math.abs(totalPercentage - 100) > 0.01) {
          alert('Percentages must add up to 100%');
          return;
        }

        splitDetails = expenseForm.splitBetween.map(memberId => ({
          memberId,
          amount: (amount * parseFloat(expenseForm.percentages[memberId] || '0')) / 100,
        }));
      } else {
        const totalAmount = expenseForm.splitBetween.reduce(
          (sum, memberId) => sum + (parseFloat(expenseForm.exactAmounts[memberId] || '0')),
          0
        );

        if (Math.abs(totalAmount - amount) > 0.01) {
          alert(`Exact amounts must add up to $${amount.toFixed(2)}`);
          return;
        }

        splitDetails = expenseForm.splitBetween.map(memberId => ({
          memberId,
          amount: parseFloat(expenseForm.exactAmounts[memberId] || '0'),
        }));
      }

      await api.expenses.create({
        groupId: id,
        description: expenseForm.description,
        amount,
        paidBy: expenseForm.paidBy,
        splitType: expenseForm.splitType,
        category: expenseForm.category,
        splitDetails,
      });

      setExpenseForm({
        description: '',
        amount: '',
        paidBy: '',
        splitType: 'equal',
        category: ExpenseCategory.OTHER,
        splitBetween: [],
        percentages: {},
        exactAmounts: {},
      });
      setAddExpenseOpen(false);

      // Reload group data
      await loadGroupData();
    } catch (error) {
      console.error('Failed to add expense:', error);
      alert('Failed to add expense. Please try again.');
    } finally {
      setAddingExpense(false);
    }
  };

  const handleEditExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !editingExpenseId || !expenseForm.description.trim() || !expenseForm.amount || !expenseForm.paidBy) {
      return;
    }

    if (expenseForm.splitBetween.length === 0) {
      alert('Please select at least one member to split the expense');
      return;
    }

    try {
      setAddingExpense(true);

      const amount = parseFloat(expenseForm.amount);

      // Build split details based on split type
      let splitDetails;
      if (expenseForm.splitType === 'equal') {
        splitDetails = expenseForm.splitBetween.map(memberId => ({
          memberId,
          amount: amount / expenseForm.splitBetween.length,
        }));
      } else if (expenseForm.splitType === 'percentage') {
        const totalPercentage = expenseForm.splitBetween.reduce(
          (sum, memberId) => sum + (parseFloat(expenseForm.percentages[memberId] || '0')),
          0
        );

        if (Math.abs(totalPercentage - 100) > 0.01) {
          alert('Percentages must add up to 100%');
          return;
        }

        splitDetails = expenseForm.splitBetween.map(memberId => ({
          memberId,
          amount: (amount * parseFloat(expenseForm.percentages[memberId] || '0')) / 100,
        }));
      } else {
        const totalAmount = expenseForm.splitBetween.reduce(
          (sum, memberId) => sum + (parseFloat(expenseForm.exactAmounts[memberId] || '0')),
          0
        );

        if (Math.abs(totalAmount - amount) > 0.01) {
          alert(`Exact amounts must add up to $${amount.toFixed(2)}`);
          return;
        }

        splitDetails = expenseForm.splitBetween.map(memberId => ({
          memberId,
          amount: parseFloat(expenseForm.exactAmounts[memberId] || '0'),
        }));
      }

      await api.expenses.update(editingExpenseId, {
        groupId: id,
        description: expenseForm.description,
        amount,
        paidBy: expenseForm.paidBy,
        splitType: expenseForm.splitType,
        category: expenseForm.category,
        splitDetails,
      });

      setExpenseForm({
        description: '',
        amount: '',
        paidBy: '',
        splitType: 'equal',
        category: ExpenseCategory.OTHER,
        splitBetween: [],
        percentages: {},
        exactAmounts: {},
      });
      setEditExpenseOpen(false);
      setEditingExpenseId(null);

      // Reload group data
      await loadGroupData();
    } catch (error) {
      console.error('Failed to update expense:', error);
      alert('Failed to update expense. Please try again.');
    } finally {
      setAddingExpense(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      await api.expenses.delete(expenseId);
      await loadGroupData();
    } catch (error) {
      console.error('Failed to delete expense:', error);
      alert('Failed to delete expense. Please try again.');
    }
  };

  const handleOpenEditExpense = (expense: any) => {
    // Populate form with expense data
    const percentages: Record<string, string> = {};
    const exactAmounts: Record<string, string> = {};

    expense.splitDetails.forEach((detail: any) => {
      if (expense.splitType === 'percentage') {
        percentages[detail.memberId] = ((detail.amount / expense.amount) * 100).toFixed(2);
      } else if (expense.splitType === 'exact') {
        exactAmounts[detail.memberId] = detail.amount.toFixed(2);
      }
    });

    setExpenseForm({
      description: expense.description,
      amount: expense.amount.toString(),
      paidBy: expense.paidBy,
      splitType: expense.splitType,
      category: expense.category || ExpenseCategory.OTHER,
      splitBetween: expense.splitDetails.map((d: any) => d.memberId),
      percentages,
      exactAmounts,
    });
    setEditingExpenseId(expense.id);
    setEditExpenseOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading group details...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Group not found</p>
          <Button onClick={() => navigate('/groups')}>Back to Groups</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate('/groups')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Groups
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{group.name}</h1>
          {group.description && (
            <p className="text-muted-foreground">{group.description}</p>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Members Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Members</CardTitle>
                <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form onSubmit={handleAddMember}>
                      <DialogHeader>
                        <DialogTitle>Add Member</DialogTitle>
                        <DialogDescription>
                          Add a new member to this group
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="member-name">Name *</Label>
                          <Input
                            id="member-name"
                            placeholder="John Doe"
                            value={memberForm.name}
                            onChange={(e) =>
                              setMemberForm({ ...memberForm, name: e.target.value })
                            }
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="member-email">Email</Label>
                          <Input
                            id="member-email"
                            type="email"
                            placeholder="john@example.com"
                            value={memberForm.email}
                            onChange={(e) =>
                              setMemberForm({ ...memberForm, email: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setAddMemberOpen(false)}
                          disabled={addingMember}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={addingMember}>
                          {addingMember ? 'Adding...' : 'Add Member'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {group.members.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No members yet
                </p>
              ) : (
                <div className="space-y-2">
                  {group.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 rounded hover:bg-accent"
                    >
                      <div>
                        <p className="font-medium text-sm">{member.name}</p>
                        {member.email && (
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Balances Section */}
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

          {/* Settlements Section */}
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
                        ${settlement.amount.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Expenses Section */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Expenses</CardTitle>
                <CardDescription>Track shared expenses</CardDescription>
              </div>
              <Dialog open={addExpenseOpen} onOpenChange={setAddExpenseOpen}>
                <DialogTrigger asChild>
                  <Button disabled={group.members.length === 0}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Expense
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <form onSubmit={handleAddExpense}>
                    <DialogHeader>
                      <DialogTitle>Add Expense</DialogTitle>
                      <DialogDescription>
                        Add a new expense and split it among members
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="expense-description">Description *</Label>
                        <Input
                          id="expense-description"
                          placeholder="Dinner at restaurant"
                          value={expenseForm.description}
                          onChange={(e) =>
                            setExpenseForm({ ...expenseForm, description: e.target.value })
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
                          value={expenseForm.amount}
                          onChange={(e) =>
                            setExpenseForm({ ...expenseForm, amount: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="expense-paidby">Paid By *</Label>
                        <Select
                          value={expenseForm.paidBy}
                          onValueChange={(value) =>
                            setExpenseForm({ ...expenseForm, paidBy: value })
                          }
                        >
                          <SelectTrigger id="expense-paidby">
                            <SelectValue placeholder="Select member" />
                          </SelectTrigger>
                          <SelectContent>
                            {group.members.map((member) => (
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
                          value={expenseForm.category}
                          onValueChange={(value: ExpenseCategory) =>
                            setExpenseForm({ ...expenseForm, category: value })
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
                          value={expenseForm.splitType}
                          onValueChange={(value: 'equal' | 'percentage' | 'exact') =>
                            setExpenseForm({ ...expenseForm, splitType: value })
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
                          {group.members.map((member) => {
                            const isSelected = expenseForm.splitBetween.includes(member.id);
                            return (
                              <div key={member.id} className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={`member-${member.id}`}
                                    checked={isSelected}
                                    onChange={() => handleToggleMemberForSplit(member.id)}
                                    className="h-4 w-4 rounded border-gray-300"
                                  />
                                  <Label
                                    htmlFor={`member-${member.id}`}
                                    className="font-normal cursor-pointer flex-1"
                                  >
                                    {member.name}
                                  </Label>
                                  {isSelected && expenseForm.splitType === 'percentage' && (
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      max="100"
                                      placeholder="%"
                                      className="w-20"
                                      value={expenseForm.percentages[member.id] || ''}
                                      onChange={(e) =>
                                        setExpenseForm({
                                          ...expenseForm,
                                          percentages: {
                                            ...expenseForm.percentages,
                                            [member.id]: e.target.value,
                                          },
                                        })
                                      }
                                    />
                                  )}
                                  {isSelected && expenseForm.splitType === 'exact' && (
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      placeholder="0.00"
                                      className="w-24"
                                      value={expenseForm.exactAmounts[member.id] || ''}
                                      onChange={(e) =>
                                        setExpenseForm({
                                          ...expenseForm,
                                          exactAmounts: {
                                            ...expenseForm.exactAmounts,
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
                        onClick={() => setAddExpenseOpen(false)}
                        disabled={addingExpense}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={addingExpense}>
                        {addingExpense ? 'Adding...' : 'Add Expense'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
              <Dialog open={editExpenseOpen} onOpenChange={setEditExpenseOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <form onSubmit={handleEditExpense}>
                    <DialogHeader>
                      <DialogTitle>Edit Expense</DialogTitle>
                      <DialogDescription>
                        Update the expense details
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-expense-description">Description *</Label>
                        <Input
                          id="edit-expense-description"
                          placeholder="Dinner at restaurant"
                          value={expenseForm.description}
                          onChange={(e) =>
                            setExpenseForm({ ...expenseForm, description: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-expense-amount">Amount *</Label>
                        <Input
                          id="edit-expense-amount"
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="0.00"
                          value={expenseForm.amount}
                          onChange={(e) =>
                            setExpenseForm({ ...expenseForm, amount: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-expense-paidby">Paid By *</Label>
                        <Select
                          value={expenseForm.paidBy}
                          onValueChange={(value) =>
                            setExpenseForm({ ...expenseForm, paidBy: value })
                          }
                        >
                          <SelectTrigger id="edit-expense-paidby">
                            <SelectValue placeholder="Select member" />
                          </SelectTrigger>
                          <SelectContent>
                            {group.members.map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                {member.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-expense-category">Category *</Label>
                        <Select
                          value={expenseForm.category}
                          onValueChange={(value: ExpenseCategory) =>
                            setExpenseForm({ ...expenseForm, category: value })
                          }
                        >
                          <SelectTrigger id="edit-expense-category">
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
                          value={expenseForm.splitType}
                          onValueChange={(value: 'equal' | 'percentage' | 'exact') =>
                            setExpenseForm({ ...expenseForm, splitType: value })
                          }
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="equal" id="edit-split-equal" />
                            <Label htmlFor="edit-split-equal" className="font-normal cursor-pointer">
                              Equal - Split equally among selected members
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="percentage" id="edit-split-percentage" />
                            <Label htmlFor="edit-split-percentage" className="font-normal cursor-pointer">
                              Percentage - Split by custom percentages
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="exact" id="edit-split-exact" />
                            <Label htmlFor="edit-split-exact" className="font-normal cursor-pointer">
                              Exact - Specify exact amounts for each member
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                      <div className="grid gap-2">
                        <Label>Split Between * (Select members)</Label>
                        <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                          {group.members.map((member) => {
                            const isSelected = expenseForm.splitBetween.includes(member.id);
                            return (
                              <div key={member.id} className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={`edit-member-${member.id}`}
                                    checked={isSelected}
                                    onChange={() => handleToggleMemberForSplit(member.id)}
                                    className="h-4 w-4 rounded border-gray-300"
                                  />
                                  <Label
                                    htmlFor={`edit-member-${member.id}`}
                                    className="font-normal cursor-pointer flex-1"
                                  >
                                    {member.name}
                                  </Label>
                                  {isSelected && expenseForm.splitType === 'percentage' && (
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      max="100"
                                      placeholder="%"
                                      className="w-20"
                                      value={expenseForm.percentages[member.id] || ''}
                                      onChange={(e) =>
                                        setExpenseForm({
                                          ...expenseForm,
                                          percentages: {
                                            ...expenseForm.percentages,
                                            [member.id]: e.target.value,
                                          },
                                        })
                                      }
                                    />
                                  )}
                                  {isSelected && expenseForm.splitType === 'exact' && (
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      placeholder="0.00"
                                      className="w-24"
                                      value={expenseForm.exactAmounts[member.id] || ''}
                                      onChange={(e) =>
                                        setExpenseForm({
                                          ...expenseForm,
                                          exactAmounts: {
                                            ...expenseForm.exactAmounts,
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
                        onClick={() => {
                          setEditExpenseOpen(false);
                          setEditingExpenseId(null);
                        }}
                        disabled={addingExpense}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={addingExpense}>
                        {addingExpense ? 'Updating...' : 'Update Expense'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {group.expenses.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-2">No expenses yet</p>
                <p className="text-sm text-muted-foreground">
                  {group.members.length === 0
                    ? 'Add members first to start tracking expenses'
                    : 'Click "Add Expense" to get started'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {group.expenses.map((expense) => {
                  const payer = group.members.find(m => m.id === expense.paidBy);
                  return (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
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
                        <p className="text-lg font-bold">${expense.amount.toFixed(2)}</p>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenEditExpense(expense)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteExpense(expense.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
