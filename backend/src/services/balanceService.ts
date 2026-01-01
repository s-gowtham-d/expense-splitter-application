import { dataStore } from '../models';
import { Balance, Settlement } from '../types';
import { AppError } from '../middleware/errorHandler';

export const calculateGroupBalances = (groupId: string): Balance[] => {
  const group = dataStore.getGroup(groupId);
  if (!group) {
    throw new AppError(404, 'Group not found');
  }

  const expenses = dataStore.getExpensesByGroupId(groupId);
  const members = dataStore.getMembersByIds(group.members);

  // Initialize balances for all members
  const balanceMap = new Map<string, number>();
  members.forEach(member => {
    balanceMap.set(member.id, 0);
  });

  // Calculate balances
  expenses.forEach(expense => {
    // Add amount paid to payer's balance
    const currentPayerBalance = balanceMap.get(expense.paidBy) || 0;
    balanceMap.set(expense.paidBy, currentPayerBalance + expense.amount);

    // Subtract split amounts from each member
    expense.splitBetween.forEach(split => {
      const currentBalance = balanceMap.get(split.memberId) || 0;
      balanceMap.set(split.memberId, currentBalance - split.amount);
    });
  });

  // Convert to Balance array
  return members.map(member => ({
    memberId: member.id,
    memberName: member.name,
    balance: Math.round((balanceMap.get(member.id) || 0) * 100) / 100,
  }));
};

export const calculateSettlements = (groupId: string): Settlement[] => {
  const balances = calculateGroupBalances(groupId);

  // Separate debtors and creditors
  const debtors = balances.filter(b => b.balance < 0).map(b => ({
    ...b,
    balance: Math.abs(b.balance),
  }));
  const creditors = balances.filter(b => b.balance > 0);

  const settlements: Settlement[] = [];

  // Create copies to manipulate
  const debtorsCopy = [...debtors];
  const creditorsCopy = [...creditors];

  // Greedy algorithm to minimize transactions
  while (debtorsCopy.length > 0 && creditorsCopy.length > 0) {
    const debtor = debtorsCopy[0];
    const creditor = creditorsCopy[0];

    const settleAmount = Math.min(debtor.balance, creditor.balance);

    settlements.push({
      from: debtor.memberId,
      fromName: debtor.memberName,
      to: creditor.memberId,
      toName: creditor.memberName,
      amount: Math.round(settleAmount * 100) / 100,
    });

    debtor.balance -= settleAmount;
    creditor.balance -= settleAmount;

    if (debtor.balance < 0.01) {
      debtorsCopy.shift();
    }
    if (creditor.balance < 0.01) {
      creditorsCopy.shift();
    }
  }

  return settlements;
};
