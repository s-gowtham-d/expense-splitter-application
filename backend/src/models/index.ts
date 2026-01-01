import { Group, Member, Expense } from '../types';

// In-memory data storage
class DataStore {
  private groups: Map<string, Group> = new Map();
  private members: Map<string, Member> = new Map();
  private expenses: Map<string, Expense> = new Map();

  // Group operations
  createGroup(group: Group): Group {
    this.groups.set(group.id, group);
    return group;
  }

  getGroup(id: string): Group | undefined {
    return this.groups.get(id);
  }

  getAllGroups(): Group[] {
    return Array.from(this.groups.values());
  }

  updateGroup(id: string, updates: Partial<Group>): Group | undefined {
    const group = this.groups.get(id);
    if (!group) return undefined;

    const updatedGroup = { ...group, ...updates };
    this.groups.set(id, updatedGroup);
    return updatedGroup;
  }

  deleteGroup(id: string): boolean {
    return this.groups.delete(id);
  }

  // Member operations
  createMember(member: Member): Member {
    this.members.set(member.id, member);
    return member;
  }

  getMember(id: string): Member | undefined {
    return this.members.get(id);
  }

  getAllMembers(): Member[] {
    return Array.from(this.members.values());
  }

  getMembersByIds(ids: string[]): Member[] {
    return ids.map(id => this.members.get(id)).filter((m): m is Member => m !== undefined);
  }

  deleteMember(id: string): boolean {
    return this.members.delete(id);
  }

  // Expense operations
  createExpense(expense: Expense): Expense {
    this.expenses.set(expense.id, expense);
    return expense;
  }

  getExpense(id: string): Expense | undefined {
    return this.expenses.get(id);
  }

  getAllExpenses(): Expense[] {
    return Array.from(this.expenses.values());
  }

  getExpensesByGroupId(groupId: string): Expense[] {
    return Array.from(this.expenses.values()).filter(
      expense => expense.groupId === groupId
    );
  }

  updateExpense(id: string, updates: Partial<Expense>): Expense | undefined {
    const expense = this.expenses.get(id);
    if (!expense) return undefined;

    const updatedExpense = { ...expense, ...updates };
    this.expenses.set(id, updatedExpense);
    return updatedExpense;
  }

  deleteExpense(id: string): boolean {
    return this.expenses.delete(id);
  }

  deleteExpensesByGroupId(groupId: string): void {
    const expensesToDelete = this.getExpensesByGroupId(groupId);
    expensesToDelete.forEach(expense => this.expenses.delete(expense.id));
  }

  // Utility methods
  groupExists(id: string): boolean {
    return this.groups.has(id);
  }

  memberExists(id: string): boolean {
    return this.members.has(id);
  }

  expenseExists(id: string): boolean {
    return this.expenses.has(id);
  }
}

// Export singleton instance
export const dataStore = new DataStore();
