import { calculateGroupBalances, calculateSettlements } from '../balanceService';
import { dataStore } from '../../models';
import { Group, Member, Expense, SplitType, ExpenseCategory, Currency } from '../../types';

// Mock the dataStore
jest.mock('../../models', () => ({
  dataStore: {
    getGroup: jest.fn(),
    getMembersByIds: jest.fn(),
    getExpensesByGroupId: jest.fn(),
  },
}));

describe('BalanceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateGroupBalances', () => {
    it('should calculate balances correctly for equal split', () => {
      const groupId = 'group1';
      const members: Member[] = [
        { id: 'member1', name: 'Alice', email: 'alice@example.com' },
        { id: 'member2', name: 'Bob', email: 'bob@example.com' },
        { id: 'member3', name: 'Charlie', email: 'charlie@example.com' },
      ];
      const group: Group = {
        userId: "test-user",
        id: groupId,
        name: 'Test Group',
        description: 'Test',
        members: ['member1', 'member2', 'member3'],
        createdAt: new Date(),
      };
      const expenses: Expense[] = [
        {
          id: 'expense1',
          groupId,
          description: 'Dinner',
          amount: 90,
          paidBy: 'member1',
          splitType: SplitType.EQUAL,
          splitBetween: [
            { memberId: 'member1', amount: 30 },
            { memberId: 'member2', amount: 30 },
            { memberId: 'member3', amount: 30 },
          ],
          currency: Currency.USD,
          category: ExpenseCategory.FOOD,
          date: new Date(),
        },
      ];

      (dataStore.getGroup as jest.Mock).mockReturnValue(group);
      (dataStore.getMembersByIds as jest.Mock).mockReturnValue(members);
      (dataStore.getExpensesByGroupId as jest.Mock).mockReturnValue(expenses);

      const balances = calculateGroupBalances(groupId);

      expect(balances).toHaveLength(3);
      expect(balances.find(b => b.memberId === 'member1')?.balance).toBe(60); // paid 90, owes 30
      expect(balances.find(b => b.memberId === 'member2')?.balance).toBe(-30); // owes 30
      expect(balances.find(b => b.memberId === 'member3')?.balance).toBe(-30); // owes 30
    });

    it('should calculate balances correctly for multiple expenses', () => {
      const groupId = 'group1';
      const members: Member[] = [
        { id: 'member1', name: 'Alice', email: 'alice@example.com' },
        { id: 'member2', name: 'Bob', email: 'bob@example.com' },
      ];
      const group: Group = {
        userId: "test-user",
        id: groupId,
        name: 'Test Group',
        description: 'Test',
        members: ['member1', 'member2'],
        createdAt: new Date(),
      };
      const expenses: Expense[] = [
        {
          id: 'expense1',
          groupId,
          description: 'Lunch',
          amount: 50,
          paidBy: 'member1',
          splitType: SplitType.EQUAL,
          splitBetween: [
            { memberId: 'member1', amount: 25 },
            { memberId: 'member2', amount: 25 },
          ],
          currency: Currency.USD,
          category: ExpenseCategory.FOOD,
          date: new Date(),
        },
        {
          id: 'expense2',
          groupId,
          description: 'Dinner',
          amount: 60,
          paidBy: 'member2',
          splitType: SplitType.EQUAL,
          splitBetween: [
            { memberId: 'member1', amount: 30 },
            { memberId: 'member2', amount: 30 },
          ],
          currency: Currency.USD,
          category: ExpenseCategory.FOOD,
          date: new Date(),
        },
      ];

      (dataStore.getGroup as jest.Mock).mockReturnValue(group);
      (dataStore.getMembersByIds as jest.Mock).mockReturnValue(members);
      (dataStore.getExpensesByGroupId as jest.Mock).mockReturnValue(expenses);

      const balances = calculateGroupBalances(groupId);

      expect(balances).toHaveLength(2);
      // Alice: paid 50, owes 25+30=55, net = -5
      expect(balances.find(b => b.memberId === 'member1')?.balance).toBe(-5);
      // Bob: paid 60, owes 25+30=55, net = 5
      expect(balances.find(b => b.memberId === 'member2')?.balance).toBe(5);
    });

    it('should throw error if group not found', () => {
      (dataStore.getGroup as jest.Mock).mockReturnValue(null);

      expect(() => calculateGroupBalances('nonexistent')).toThrow('Group not found');
    });

    it('should handle percentage split correctly', () => {
      const groupId = 'group1';
      const members: Member[] = [
        { id: 'member1', name: 'Alice', email: 'alice@example.com' },
        { id: 'member2', name: 'Bob', email: 'bob@example.com' },
      ];
      const group: Group = {
        userId: "test-user",
        id: groupId,
        name: 'Test Group',
        description: 'Test',
        members: ['member1', 'member2'],
        createdAt: new Date(),
      };
      const expenses: Expense[] = [
        {
          id: 'expense1',
          groupId,
          description: 'Dinner',
          amount: 100,
          paidBy: 'member1',
          splitType: SplitType.PERCENTAGE,
          splitBetween: [
            { memberId: 'member1', amount: 60 }, // 60% = $60
            { memberId: 'member2', amount: 40 }, // 40% = $40
          ],
          currency: Currency.USD,
          category: ExpenseCategory.FOOD,
          date: new Date(),
        },
      ];

      (dataStore.getGroup as jest.Mock).mockReturnValue(group);
      (dataStore.getMembersByIds as jest.Mock).mockReturnValue(members);
      (dataStore.getExpensesByGroupId as jest.Mock).mockReturnValue(expenses);

      const balances = calculateGroupBalances(groupId);

      expect(balances.find(b => b.memberId === 'member1')?.balance).toBe(40); // paid 100, owes 60
      expect(balances.find(b => b.memberId === 'member2')?.balance).toBe(-40); // owes 40
    });
  });

  describe('calculateSettlements', () => {
    it('should calculate settlements for simple case', () => {
      const groupId = 'group1';
      const members: Member[] = [
        { id: 'member1', name: 'Alice', email: 'alice@example.com' },
        { id: 'member2', name: 'Bob', email: 'bob@example.com' },
      ];
      const group: Group = {
        userId: "test-user",
        id: groupId,
        name: 'Test Group',
        description: 'Test',
        members: ['member1', 'member2'],
        createdAt: new Date(),
      };
      const expenses: Expense[] = [
        {
          id: 'expense1',
          groupId,
          description: 'Dinner',
          amount: 100,
          paidBy: 'member1',
          splitType: SplitType.EQUAL,
          splitBetween: [
            { memberId: 'member1', amount: 50 },
            { memberId: 'member2', amount: 50 },
          ],
          currency: Currency.USD,
          category: ExpenseCategory.FOOD,
          date: new Date(),
        },
      ];

      (dataStore.getGroup as jest.Mock).mockReturnValue(group);
      (dataStore.getMembersByIds as jest.Mock).mockReturnValue(members);
      (dataStore.getExpensesByGroupId as jest.Mock).mockReturnValue(expenses);

      const settlements = calculateSettlements(groupId);

      expect(settlements).toHaveLength(1);
      expect(settlements[0]).toEqual({
        from: 'member2',
        fromName: 'Bob',
        to: 'member1',
        toName: 'Alice',
        amount: 50,
      });
    });

    it('should minimize number of transactions', () => {
      const groupId = 'group1';
      const members: Member[] = [
        { id: 'member1', name: 'Alice', email: 'alice@example.com' },
        { id: 'member2', name: 'Bob', email: 'bob@example.com' },
        { id: 'member3', name: 'Charlie', email: 'charlie@example.com' },
      ];
      const group: Group = {
        userId: "test-user",
        id: groupId,
        name: 'Test Group',
        description: 'Test',
        members: ['member1', 'member2', 'member3'],
        createdAt: new Date(),
      };
      const expenses: Expense[] = [
        {
          id: 'expense1',
          groupId,
          description: 'Dinner',
          amount: 90,
          paidBy: 'member1',
          splitType: SplitType.EQUAL,
          splitBetween: [
            { memberId: 'member1', amount: 30 },
            { memberId: 'member2', amount: 30 },
            { memberId: 'member3', amount: 30 },
          ],
          currency: Currency.USD,
          category: ExpenseCategory.FOOD,
          date: new Date(),
        },
      ];

      (dataStore.getGroup as jest.Mock).mockReturnValue(group);
      (dataStore.getMembersByIds as jest.Mock).mockReturnValue(members);
      (dataStore.getExpensesByGroupId as jest.Mock).mockReturnValue(expenses);

      const settlements = calculateSettlements(groupId);

      // Should have 2 settlements (Bob->Alice, Charlie->Alice)
      expect(settlements).toHaveLength(2);
      const totalSettled = settlements.reduce((sum, s) => sum + s.amount, 0);
      expect(totalSettled).toBe(60); // Total owed to Alice
    });

    it('should return empty array when all balances are zero', () => {
      const groupId = 'group1';
      const members: Member[] = [
        { id: 'member1', name: 'Alice', email: 'alice@example.com' },
        { id: 'member2', name: 'Bob', email: 'bob@example.com' },
      ];
      const group: Group = {
        userId: "test-user",
        id: groupId,
        name: 'Test Group',
        description: 'Test',
        members: ['member1', 'member2'],
        createdAt: new Date(),
      };
      const expenses: Expense[] = [];

      (dataStore.getGroup as jest.Mock).mockReturnValue(group);
      (dataStore.getMembersByIds as jest.Mock).mockReturnValue(members);
      (dataStore.getExpensesByGroupId as jest.Mock).mockReturnValue(expenses);

      const settlements = calculateSettlements(groupId);

      expect(settlements).toHaveLength(0);
    });
  });
});
