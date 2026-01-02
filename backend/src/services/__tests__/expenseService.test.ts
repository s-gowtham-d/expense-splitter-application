import {
  createExpense,
  getExpenseById,
  getAllExpenses,
  updateExpense,
  deleteExpense,
} from '../expenseService';
import { dataStore } from '../../models';
import { CreateExpenseRequest, SplitType, ExpenseCategory } from '../../types';

jest.mock('../../models', () => ({
  dataStore: {
    getGroup: jest.fn(),
    memberExists: jest.fn(),
    createExpense: jest.fn(),
    getExpense: jest.fn(),
    getAllExpenses: jest.fn(),
    getExpensesByGroupId: jest.fn(),
    updateExpense: jest.fn(),
    deleteExpense: jest.fn(),
  },
}));

jest.mock('../../utils/idGenerator', () => ({
  generateId: jest.fn(() => 'generated-id'),
}));

describe('ExpenseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createExpense', () => {
    const mockGroup = {
      id: 'group1',
      name: 'Test Group',
      description: 'Test',
      members: ['member1', 'member2', 'member3'],
      createdAt: new Date(),
    };

    it('should create expense with equal split', () => {
      const request: CreateExpenseRequest = {
        groupId: 'group1',
        description: 'Dinner',
        amount: 90,
        paidBy: 'member1',
        splitType: SplitType.EQUAL,
        category: ExpenseCategory.FOOD,
      };

      (dataStore.getGroup as jest.Mock).mockReturnValue(mockGroup);
      (dataStore.memberExists as jest.Mock).mockReturnValue(true);
      (dataStore.createExpense as jest.Mock).mockImplementation((expense) => expense);

      const expense = createExpense(request);

      expect(expense.splitBetween).toHaveLength(3);
      expect(expense.splitBetween[0].amount).toBe(30);
      expect(expense.splitBetween[1].amount).toBe(30);
      expect(expense.splitBetween[2].amount).toBe(30);
      expect(dataStore.createExpense).toHaveBeenCalled();
    });

    it('should create expense with percentage split', () => {
      const request: CreateExpenseRequest = {
        groupId: 'group1',
        description: 'Dinner',
        amount: 100,
        paidBy: 'member1',
        splitType: SplitType.PERCENTAGE,
        category: ExpenseCategory.FOOD,
        splitBetween: [
          { memberId: 'member1', amount: 50 },
          { memberId: 'member2', amount: 30 },
          { memberId: 'member3', amount: 20 },
        ],
      };

      (dataStore.getGroup as jest.Mock).mockReturnValue(mockGroup);
      (dataStore.memberExists as jest.Mock).mockReturnValue(true);
      (dataStore.createExpense as jest.Mock).mockImplementation((expense) => expense);

      const expense = createExpense(request);

      expect(expense.splitBetween).toHaveLength(3);
      expect(expense.splitBetween[0].amount).toBe(50); // 50% of 100
      expect(expense.splitBetween[1].amount).toBe(30); // 30% of 100
      expect(expense.splitBetween[2].amount).toBe(20); // 20% of 100
    });

    it('should create expense with exact split', () => {
      const request: CreateExpenseRequest = {
        groupId: 'group1',
        description: 'Dinner',
        amount: 100,
        paidBy: 'member1',
        splitType: SplitType.EXACT,
        category: ExpenseCategory.FOOD,
        splitBetween: [
          { memberId: 'member1', amount: 40 },
          { memberId: 'member2', amount: 35 },
          { memberId: 'member3', amount: 25 },
        ],
      };

      (dataStore.getGroup as jest.Mock).mockReturnValue(mockGroup);
      (dataStore.memberExists as jest.Mock).mockReturnValue(true);
      (dataStore.createExpense as jest.Mock).mockImplementation((expense) => expense);

      const expense = createExpense(request);

      expect(expense.splitBetween).toHaveLength(3);
      expect(expense.splitBetween[0].amount).toBe(40);
      expect(expense.splitBetween[1].amount).toBe(35);
      expect(expense.splitBetween[2].amount).toBe(25);
    });

    it('should throw error if percentages do not sum to 100', () => {
      const request: CreateExpenseRequest = {
        groupId: 'group1',
        description: 'Dinner',
        amount: 100,
        paidBy: 'member1',
        splitType: SplitType.PERCENTAGE,
        category: ExpenseCategory.FOOD,
        splitBetween: [
          { memberId: 'member1', amount: 50 },
          { memberId: 'member2', amount: 40 }, // Total = 90, not 100
        ],
      };

      (dataStore.getGroup as jest.Mock).mockReturnValue(mockGroup);
      (dataStore.memberExists as jest.Mock).mockReturnValue(true);

      expect(() => createExpense(request)).toThrow('Percentages must sum to 100');
    });

    it('should throw error if exact amounts do not sum to total', () => {
      const request: CreateExpenseRequest = {
        groupId: 'group1',
        description: 'Dinner',
        amount: 100,
        paidBy: 'member1',
        splitType: SplitType.EXACT,
        category: ExpenseCategory.FOOD,
        splitBetween: [
          { memberId: 'member1', amount: 40 },
          { memberId: 'member2', amount: 40 }, // Total = 80, not 100
        ],
      };

      (dataStore.getGroup as jest.Mock).mockReturnValue(mockGroup);
      (dataStore.memberExists as jest.Mock).mockReturnValue(true);

      expect(() => createExpense(request)).toThrow('Split amounts must sum to total expense amount');
    });

    it('should throw error if group not found', () => {
      const request: CreateExpenseRequest = {
        groupId: 'nonexistent',
        description: 'Dinner',
        amount: 100,
        paidBy: 'member1',
        splitType: SplitType.EQUAL,
        category: ExpenseCategory.FOOD,
      };

      (dataStore.getGroup as jest.Mock).mockReturnValue(null);

      expect(() => createExpense(request)).toThrow('Group not found');
    });

    it('should throw error if payer not in group', () => {
      const request: CreateExpenseRequest = {
        groupId: 'group1',
        description: 'Dinner',
        amount: 100,
        paidBy: 'member999',
        splitType: SplitType.EQUAL,
        category: ExpenseCategory.FOOD,
      };

      (dataStore.getGroup as jest.Mock).mockReturnValue(mockGroup);
      (dataStore.memberExists as jest.Mock).mockReturnValue(true);

      expect(() => createExpense(request)).toThrow('Payer must be a member of the group');
    });

    it('should set default category to OTHER if not provided', () => {
      const request: CreateExpenseRequest = {
        groupId: 'group1',
        description: 'Dinner',
        amount: 90,
        paidBy: 'member1',
        splitType: SplitType.EQUAL,
      };

      (dataStore.getGroup as jest.Mock).mockReturnValue(mockGroup);
      (dataStore.memberExists as jest.Mock).mockReturnValue(true);
      (dataStore.createExpense as jest.Mock).mockImplementation((expense) => expense);

      const expense = createExpense(request);

      expect(expense.category).toBe(ExpenseCategory.OTHER);
    });
  });

  describe('getExpenseById', () => {
    it('should return expense if found', () => {
      const mockExpense = {
        id: 'expense1',
        groupId: 'group1',
        description: 'Dinner',
        amount: 100,
        paidBy: 'member1',
        splitType: SplitType.EQUAL,
        splitBetween: [],
        category: ExpenseCategory.FOOD,
        date: new Date(),
      };

      (dataStore.getExpense as jest.Mock).mockReturnValue(mockExpense);

      const expense = getExpenseById('expense1');

      expect(expense).toEqual(mockExpense);
    });

    it('should throw error if expense not found', () => {
      (dataStore.getExpense as jest.Mock).mockReturnValue(null);

      expect(() => getExpenseById('nonexistent')).toThrow('Expense not found');
    });
  });

  describe('getAllExpenses', () => {
    it('should return all expenses when no groupId provided', () => {
      const mockExpenses = [
        { id: 'expense1', groupId: 'group1' },
        { id: 'expense2', groupId: 'group2' },
      ];

      (dataStore.getAllExpenses as jest.Mock).mockReturnValue(mockExpenses);

      const expenses = getAllExpenses();

      expect(expenses).toEqual(mockExpenses);
      expect(dataStore.getAllExpenses).toHaveBeenCalled();
    });

    it('should return expenses for specific group when groupId provided', () => {
      const mockExpenses = [{ id: 'expense1', groupId: 'group1' }];

      (dataStore.getExpensesByGroupId as jest.Mock).mockReturnValue(mockExpenses);

      const expenses = getAllExpenses('group1');

      expect(expenses).toEqual(mockExpenses);
      expect(dataStore.getExpensesByGroupId).toHaveBeenCalledWith('group1');
    });
  });

  describe('updateExpense', () => {
    const mockGroup = {
      id: 'group1',
      name: 'Test Group',
      description: 'Test',
      members: ['member1', 'member2', 'member3'],
      createdAt: new Date(),
    };

    const mockExpense = {
      id: 'expense1',
      groupId: 'group1',
      description: 'Old Description',
      amount: 90,
      paidBy: 'member1',
      splitType: SplitType.EQUAL,
      splitBetween: [
        { memberId: 'member1', amount: 30 },
        { memberId: 'member2', amount: 30 },
        { memberId: 'member3', amount: 30 },
      ],
      category: ExpenseCategory.FOOD,
      date: new Date(),
    };

    it('should update expense successfully', () => {
      const updateData = {
        description: 'New Description',
        amount: 120,
      };

      (dataStore.getExpense as jest.Mock).mockReturnValue(mockExpense);
      (dataStore.getGroup as jest.Mock).mockReturnValue(mockGroup);
      (dataStore.updateExpense as jest.Mock).mockReturnValue({
        ...mockExpense,
        ...updateData,
        splitBetween: [
          { memberId: 'member1', amount: 40 },
          { memberId: 'member2', amount: 40 },
          { memberId: 'member3', amount: 40 },
        ],
      });

      const updated = updateExpense('expense1', updateData);

      expect(updated.description).toBe('New Description');
      expect(updated.amount).toBe(120);
    });

    it('should throw error if expense not found', () => {
      (dataStore.getExpense as jest.Mock).mockReturnValue(null);

      expect(() => updateExpense('nonexistent', {})).toThrow('Expense not found');
    });
  });

  describe('deleteExpense', () => {
    it('should delete expense successfully', () => {
      const mockExpense = {
        id: 'expense1',
        groupId: 'group1',
        description: 'Dinner',
        amount: 100,
        paidBy: 'member1',
        splitType: SplitType.EQUAL,
        splitBetween: [],
        category: ExpenseCategory.FOOD,
        date: new Date(),
      };

      (dataStore.getExpense as jest.Mock).mockReturnValue(mockExpense);
      (dataStore.deleteExpense as jest.Mock).mockReturnValue(true);

      expect(() => deleteExpense('expense1')).not.toThrow();
      expect(dataStore.deleteExpense).toHaveBeenCalledWith('expense1');
    });

    it('should throw error if expense not found', () => {
      (dataStore.getExpense as jest.Mock).mockReturnValue(null);

      expect(() => deleteExpense('nonexistent')).toThrow('Expense not found');
    });
  });
});
