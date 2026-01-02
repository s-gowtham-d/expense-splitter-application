import { create } from 'zustand';
import { GroupWithDetails, Balance, Settlement } from '@/types';
import { api } from '@/api/client';

interface GroupState {
  group: GroupWithDetails | null;
  balances: Balance[];
  settlements: Settlement[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchGroupData: (groupId: string) => Promise<void>;
  addMember: (groupId: string, data: { name: string; email?: string }) => Promise<void>;
  removeMember: (groupId: string, memberId: string) => Promise<void>;
  addExpense: (expense: any) => Promise<void>;
  updateExpense: (expenseId: string, expense: any) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  clearGroup: () => void;
}

export const useGroupStore = create<GroupState>((set, get) => ({
  group: null,
  balances: [],
  settlements: [],
  loading: false,
  error: null,

  fetchGroupData: async (groupId: string) => {
    set({ loading: true, error: null });
    try {
      const [groupData, balancesData, settlementsData] = await Promise.all([
        api.groups.getById(groupId),
        api.groups.getBalances(groupId),
        api.groups.getSettlements(groupId),
      ]);

      set({
        group: groupData,
        balances: balancesData.balances,
        settlements: settlementsData.settlements,
        loading: false,
      });
    } catch (error) {
      console.error('Failed to load group:', error);
      set({ error: 'Failed to load group details', loading: false });
    }
  },

  addMember: async (groupId: string, data: { name: string; email?: string }) => {
    try {
      const result = await api.members.addToGroup(groupId, data);
      const { group } = get();

      if (group) {
        set({
          group: {
            ...group,
            members: [...group.members, result.member],
          },
        });
      }

      // Reload data
      await get().fetchGroupData(groupId);
    } catch (error) {
      console.error('Failed to add member:', error);
      throw error;
    }
  },

  removeMember: async (groupId: string, memberId: string) => {
    try {
      await api.members.removeFromGroup(groupId, memberId);
      const { group } = get();

      if (group) {
        set({
          group: {
            ...group,
            members: group.members.filter(m => m.id !== memberId),
          },
        });
      }

      // Reload data
      await get().fetchGroupData(groupId);
    } catch (error) {
      console.error('Failed to remove member:', error);
      throw error;
    }
  },

  addExpense: async (expense: any) => {
    try {
      await api.expenses.create(expense);
      // Reload data
      await get().fetchGroupData(expense.groupId);
    } catch (error) {
      console.error('Failed to add expense:', error);
      throw error;
    }
  },

  updateExpense: async (expenseId: string, expense: any) => {
    try {
      await api.expenses.update(expenseId, expense);
      // Reload data
      await get().fetchGroupData(expense.groupId);
    } catch (error) {
      console.error('Failed to update expense:', error);
      throw error;
    }
  },

  deleteExpense: async (expenseId: string) => {
    try {
      const { group } = get();
      await api.expenses.delete(expenseId);
      // Reload data if group exists
      if (group) {
        await get().fetchGroupData(group.id);
      }
    } catch (error) {
      console.error('Failed to delete expense:', error);
      throw error;
    }
  },

  clearGroup: () => {
    set({
      group: null,
      balances: [],
      settlements: [],
      loading: false,
      error: null,
    });
  },
}));
