import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MembersCard } from '@/components/group/MembersCard';
import { BalancesCard } from '@/components/group/BalancesCard';
import { SettlementsCard } from '@/components/group/SettlementsCard';
import { ExpensesCard } from '@/components/expenses/ExpensesCard';
import { useGroupStore } from '@/store/useGroupStore';

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    group,
    balances,
    settlements,
    loading,
    fetchGroupData,
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
    </div>
  );
}
