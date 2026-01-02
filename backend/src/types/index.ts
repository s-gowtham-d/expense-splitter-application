// Enums
export enum SplitType {
  EQUAL = 'equal',
  PERCENTAGE = 'percentage',
  EXACT = 'exact',
}

export enum ExpenseCategory {
  FOOD = 'food',
  TRAVEL = 'travel',
  UTILITIES = 'utilities',
  ENTERTAINMENT = 'entertainment',
  ACCOMMODATION = 'accommodation',
  SHOPPING = 'shopping',
  OTHER = 'other',
}

export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  INR = 'INR',
  JPY = 'JPY',
  AUD = 'AUD',
  CAD = 'CAD',
  CHF = 'CHF',
  CNY = 'CNY',
}

// Interfaces
export interface Member {
  id: string;
  name: string;
  email?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  members: string[]; // Array of member IDs
  createdAt: Date;
}

export interface SplitDetail {
  memberId: string;
  amount: number;
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  currency: Currency;
  paidBy: string; // Member ID
  splitBetween: SplitDetail[];
  splitType: SplitType;
  category: ExpenseCategory;
  date: Date;
}

export interface Balance {
  memberId: string;
  memberName: string;
  balance: number; // Positive means they are owed, negative means they owe
}

export interface Settlement {
  from: string; // Member ID
  fromName: string;
  to: string; // Member ID
  toName: string;
  amount: number;
}

// Request/Response types
export interface CreateGroupRequest {
  name: string;
  description?: string;
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
}

export interface AddMemberRequest {
  name: string;
  email?: string;
}

export interface CreateExpenseRequest {
  groupId: string;
  description: string;
  amount: number;
  currency?: Currency;
  paidBy: string;
  splitType: SplitType;
  splitBetween?: SplitDetail[]; // Required for percentage and exact types
  category?: ExpenseCategory;
  date?: string;
}

export interface UpdateExpenseRequest {
  description?: string;
  amount?: number;
  currency?: Currency;
  paidBy?: string;
  splitType?: SplitType;
  splitBetween?: SplitDetail[];
  category?: ExpenseCategory;
  date?: string;
}
