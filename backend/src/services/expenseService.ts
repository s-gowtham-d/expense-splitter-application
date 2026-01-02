import { dataStore } from '../models';
import { Expense, CreateExpenseRequest, UpdateExpenseRequest, SplitType, SplitDetail, ExpenseCategory, Currency } from '../types';
import { generateId } from '../utils/idGenerator';
import { AppError } from '../middleware/errorHandler';

const calculateSplitDetails = (
  amount: number,
  splitType: SplitType,
  groupMembers: string[],
  providedSplits?: SplitDetail[]
): SplitDetail[] => {
  switch (splitType) {
    case SplitType.EQUAL: {
      const splitAmount = amount / groupMembers.length;
      return groupMembers.map(memberId => ({
        memberId,
        amount: Math.round(splitAmount * 100) / 100, // Round to 2 decimals
      }));
    }

    case SplitType.PERCENTAGE: {
      if (!providedSplits || providedSplits.length === 0) {
        throw new AppError(400, 'Split details required for percentage split type');
      }

      // Validate percentages sum to 100
      const totalPercentage = providedSplits.reduce((sum, split) => sum + split.amount, 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        throw new AppError(400, 'Percentages must sum to 100');
      }

      return providedSplits.map(split => ({
        memberId: split.memberId,
        amount: Math.round((amount * split.amount) / 100 * 100) / 100,
      }));
    }

    case SplitType.EXACT: {
      if (!providedSplits || providedSplits.length === 0) {
        throw new AppError(400, 'Split details required for exact split type');
      }

      // Validate amounts sum to total
      const totalSplit = providedSplits.reduce((sum, split) => sum + split.amount, 0);
      if (Math.abs(totalSplit - amount) > 0.01) {
        throw new AppError(400, 'Split amounts must sum to total expense amount');
      }

      return providedSplits;
    }

    default:
      throw new AppError(400, 'Invalid split type');
  }
};

export const createExpense = (data: CreateExpenseRequest): Expense => {
  // Validate group exists
  const group = dataStore.getGroup(data.groupId);
  if (!group) {
    throw new AppError(404, 'Group not found');
  }

  // Validate paidBy member exists and is in the group
  if (!dataStore.memberExists(data.paidBy)) {
    throw new AppError(404, 'Payer member not found');
  }
  if (!group.members.includes(data.paidBy)) {
    throw new AppError(400, 'Payer must be a member of the group');
  }

  // Calculate split details
  // For equal split, use all group members if splitBetween not provided
  const membersToSplit = data.splitBetween && data.splitBetween.length > 0
    ? data.splitBetween.map(s => s.memberId)
    : group.members;

  const splitBetween = calculateSplitDetails(
    data.amount,
    data.splitType,
    membersToSplit,
    data.splitBetween
  );

  // Validate all split members are in the group
  for (const split of splitBetween) {
    if (!group.members.includes(split.memberId)) {
      throw new AppError(400, `Member ${split.memberId} is not in the group`);
    }
  }

  const expense: Expense = {
    id: generateId(),
    groupId: data.groupId,
    description: data.description,
    amount: data.amount,
    currency: data.currency || Currency.USD,
    paidBy: data.paidBy,
    splitType: data.splitType,
    splitBetween,
    category: data.category || ExpenseCategory.OTHER,
    date: data.date ? new Date(data.date) : new Date(),
  };

  return dataStore.createExpense(expense);
};

export const getExpenseById = (id: string): Expense => {
  const expense = dataStore.getExpense(id);
  if (!expense) {
    throw new AppError(404, 'Expense not found');
  }
  return expense;
};

export const getAllExpenses = (groupId?: string): Expense[] => {
  if (groupId) {
    return dataStore.getExpensesByGroupId(groupId);
  }
  return dataStore.getAllExpenses();
};

export const updateExpense = (id: string, data: UpdateExpenseRequest): Expense => {
  const expense = dataStore.getExpense(id);
  if (!expense) {
    throw new AppError(404, 'Expense not found');
  }

  const group = dataStore.getGroup(expense.groupId);
  if (!group) {
    throw new AppError(404, 'Group not found');
  }

  // If updating paidBy, validate
  if (data.paidBy && !group.members.includes(data.paidBy)) {
    throw new AppError(400, 'Payer must be a member of the group');
  }

  // If updating split details, recalculate
  let splitBetween = expense.splitBetween;
  if (data.splitType || data.splitBetween || data.amount) {
    const newAmount = data.amount || expense.amount;
    const newSplitType = data.splitType || expense.splitType;

    // Determine which members to split between
    const membersToSplit = data.splitBetween && data.splitBetween.length > 0
      ? data.splitBetween.map(s => s.memberId)
      : expense.splitBetween.map(s => s.memberId);

    splitBetween = calculateSplitDetails(
      newAmount,
      newSplitType,
      membersToSplit,
      data.splitBetween
    );
  }

  const updatedExpense = dataStore.updateExpense(id, {
    description: data.description,
    amount: data.amount,
    currency: data.currency,
    paidBy: data.paidBy,
    splitType: data.splitType,
    category: data.category,
    date: data.date ? new Date(data.date) : undefined,
    splitBetween,
  });

  if (!updatedExpense) {
    throw new AppError(500, 'Failed to update expense');
  }

  return updatedExpense;
};

export const deleteExpense = (id: string): void => {
  const expense = dataStore.getExpense(id);
  if (!expense) {
    throw new AppError(404, 'Expense not found');
  }

  const deleted = dataStore.deleteExpense(id);
  if (!deleted) {
    throw new AppError(500, 'Failed to delete expense');
  }
};
