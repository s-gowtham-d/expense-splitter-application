export enum SplitType {
  EQUAL = 'equal',
  PERCENTAGE = 'percentage',
  EXACT = 'exact',
}

export interface Member {
  id: string;
  name: string;
  email?: string;
}

export interface Group {
  id: string;
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
  paidBy: string;
  splitBetween: SplitDetail[];
  splitType: SplitType;
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
