import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Navbar } from '@/components/Navbar';
import { MembersCard } from '@/components/group/MembersCard';
import { BalancesCard } from '@/components/group/BalancesCard';
import { SettlementsCard } from '@/components/group/SettlementsCard';
import { ExpensesCard } from '@/components/expenses/ExpensesCard';
import { useGroupStore } from '@/store/useGroupStore';

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const {
    group,
    balances,
    settlements,
    loading,
    fetchGroupData,
    updateGroup,
    deleteGroup,
    addMember,
    removeMember,
    addExpense,
    updateExpense,
    deleteExpense,
    clearGroup,
  } = useGroupStore();

  useEffect(() => {
    if (id) {
      fetchGroupData(id);
    }
    return () => clearGroup();
  }, [id, fetchGroupData, clearGroup]);

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name,
        description: group.description || '',
      });
    }
  }, [group]);

  const handleAddMember = async (data: { name: string; email?: string }) => {
    if (!id) return;
    await addMember(id, data);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!id) return;
    await removeMember(id, memberId);
  };

  const handleAddExpense = async (expenseData: any) => {
    if (!id) return;
    await addExpense({ ...expenseData, groupId: id });
  };

  const handleUpdateExpense = async (expenseId: string, expenseData: any) => {
    if (!id) return;
    await updateExpense(expenseId, { ...expenseData, groupId: id });
  };

  const handleDeleteExpense = async (expenseId: string) => {
    await deleteExpense(expenseId);
  };

  const handleEditGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !formData.name.trim()) return;

    try {
      setUpdating(true);
      await updateGroup(id, {
        name: formData.name,
        description: formData.description || undefined,
      });
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update group:', error);
      alert('Failed to update group. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!id) return;

    try {
      setDeleting(true);
      await deleteGroup(id);
      navigate('/groups');
    } catch (error) {
      console.error('Failed to delete group:', error);
      alert('Failed to delete group. Please try again.');
      setDeleting(false);
    }
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
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-start mb-8">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => navigate('/groups')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Groups
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Group
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDeleteDialogOpen(true)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Group
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{group.name}</h1>
          {group.description && (
            <p className="text-muted-foreground">{group.description}</p>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <MembersCard
            members={group.members}
            onAddMember={handleAddMember}
            onRemoveMember={handleRemoveMember}
          />
          <BalancesCard balances={balances} />
          <SettlementsCard settlements={settlements} />
        </div>

        <ExpensesCard
          expenses={group.expenses}
          members={group.members}
          groupName={group.name}
          onAddExpense={handleAddExpense}
          onUpdateExpense={handleUpdateExpense}
          onDeleteExpense={handleDeleteExpense}
        />
      </div>

      {/* Edit Group Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <form onSubmit={handleEditGroup}>
            <DialogHeader>
              <DialogTitle>Edit Group</DialogTitle>
              <DialogDescription>
                Update the group name or description
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={updating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updating}>
                {updating ? 'Updating...' : 'Update Group'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Group Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the group "{group.name}" and all its expenses.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete Group'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
