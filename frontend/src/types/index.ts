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

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Member {
  id: string;
  name: string;
  email?: string;
}

export interface Group {
  id: string;
  userId: string;
  name: string;
  description?: string;
  members: string[];
  createdAt: string;
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
  paidBy: string;
  paidByName?: string;
  splitBetween: SplitDetail[];
  splitType: SplitType;
  category: ExpenseCategory;
  date: string;
}

export interface Balance {
  memberId: string;
  memberName: string;
  balance: number;
}

export interface Settlement {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
}

export interface GroupWithDetails {
  id: string;
  name: string;
  description?: string;
  members: Member[];
  expenses: Expense[];
  createdAt: string;
}
