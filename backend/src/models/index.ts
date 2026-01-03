import db from '../config/database';
import { User, Group, Member, Expense, SplitType } from '../types';

class DataStore {
  // User operations
  createUser(user: User): User {
    const stmt = db.prepare(`
      INSERT INTO users (id, email, name, password_hash, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(user.id, user.email, user.name, user.passwordHash, user.createdAt.toISOString());
    return user;
  }

  getUserByEmail(email: string): User | undefined {
    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (!row) return undefined;

    return {
      id: row.id,
      email: row.email,
      name: row.name,
      passwordHash: row.password_hash,
      createdAt: new Date(row.created_at),
    };
  }

  getUserById(id: string): User | undefined {
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
    if (!row) return undefined;

    return {
      id: row.id,
      email: row.email,
      name: row.name,
      passwordHash: row.password_hash,
      createdAt: new Date(row.created_at),
    };
  }

  userExists(email: string): boolean {
    const row = db.prepare('SELECT 1 FROM users WHERE email = ? LIMIT 1').get(email);
    return !!row;
  }

  // Group operations
  createGroup(group: Group): Group {
    const stmt = db.prepare(`
      INSERT INTO groups (id, user_id, name, description, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(group.id, group.userId, group.name, group.description || null, group.createdAt.toISOString());
    return group;
  }

  getGroup(id: string): Group | undefined {
    const row = db.prepare('SELECT * FROM groups WHERE id = ?').get(id) as any;
    if (!row) return undefined;

    const memberIds = db
      .prepare('SELECT member_id FROM group_members WHERE group_id = ?')
      .all(id) as any[];

    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description,
      members: memberIds.map(m => m.member_id),
      createdAt: new Date(row.created_at),
    };
  }

  getAllGroups(): Group[] {
    const rows = db.prepare('SELECT * FROM groups ORDER BY created_at DESC').all() as any[];
    return rows.map(row => {
      const memberIds = db
        .prepare('SELECT member_id FROM group_members WHERE group_id = ?')
        .all(row.id) as any[];

      return {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        description: row.description,
        members: memberIds.map(m => m.member_id),
        createdAt: new Date(row.created_at),
      };
    });
  }

  getGroupsByUserId(userId: string): Group[] {
    const rows = db.prepare('SELECT * FROM groups WHERE user_id = ? ORDER BY created_at DESC').all(userId) as any[];
    return rows.map(row => {
      const memberIds = db
        .prepare('SELECT member_id FROM group_members WHERE group_id = ?')
        .all(row.id) as any[];

      return {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        description: row.description,
        members: memberIds.map(m => m.member_id),
        createdAt: new Date(row.created_at),
      };
    });
  }

  updateGroup(id: string, updates: Partial<Group>): Group | undefined {
    const current = this.getGroup(id);
    if (!current) return undefined;

    if (updates.name !== undefined || updates.description !== undefined) {
      const stmt = db.prepare(`
        UPDATE groups
        SET name = COALESCE(?, name),
            description = COALESCE(?, description)
        WHERE id = ?
      `);
      stmt.run(updates.name || null, updates.description || null, id);
    }

    if (updates.members !== undefined) {
      db.prepare('DELETE FROM group_members WHERE group_id = ?').run(id);
      const stmt = db.prepare('INSERT INTO group_members (group_id, member_id) VALUES (?, ?)');
      for (const memberId of updates.members) {
        stmt.run(id, memberId);
      }
    }

    return this.getGroup(id);
  }

  deleteGroup(id: string): boolean {
    const result = db.prepare('DELETE FROM groups WHERE id = ?').run(id);
    return result.changes > 0;
  }

  // Member operations
  createMember(member: Member): Member {
    const stmt = db.prepare(`
      INSERT INTO members (id, name, email)
      VALUES (?, ?, ?)
    `);
    stmt.run(member.id, member.name, member.email || null);
    return member;
  }

  getMember(id: string): Member | undefined {
    const row = db.prepare('SELECT * FROM members WHERE id = ?').get(id) as any;
    if (!row) return undefined;

    return {
      id: row.id,
      name: row.name,
      email: row.email,
    };
  }

  getAllMembers(): Member[] {
    const rows = db.prepare('SELECT * FROM members').all() as any[];
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
    }));
  }

  getMembersByIds(ids: string[]): Member[] {
    if (ids.length === 0) return [];
    const placeholders = ids.map(() => '?').join(',');
    const rows = db
      .prepare(`SELECT * FROM members WHERE id IN (${placeholders})`)
      .all(...ids) as any[];

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
    }));
  }

  deleteMember(id: string): boolean {
    const result = db.prepare('DELETE FROM members WHERE id = ?').run(id);
    return result.changes > 0;
  }

  // Expense operations
  createExpense(expense: Expense): Expense {
    const stmt = db.prepare(`
      INSERT INTO expenses (id, group_id, description, amount, currency, paid_by, split_type, category, date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      expense.id,
      expense.groupId,
      expense.description,
      expense.amount,
      expense.currency,
      expense.paidBy,
      expense.splitType,
      expense.category,
      expense.date.toISOString()
    );

    const splitStmt = db.prepare(`
      INSERT INTO split_details (expense_id, member_id, amount)
      VALUES (?, ?, ?)
    `);
    for (const split of expense.splitBetween) {
      splitStmt.run(expense.id, split.memberId, split.amount);
    }

    return expense;
  }

  getExpense(id: string): Expense | undefined {
    const row = db.prepare(`
      SELECT e.*, m.name as paid_by_name
      FROM expenses e
      LEFT JOIN members m ON e.paid_by = m.id
      WHERE e.id = ?
    `).get(id) as any;
    if (!row) return undefined;

    const splits = db
      .prepare('SELECT * FROM split_details WHERE expense_id = ?')
      .all(id) as any[];

    return {
      id: row.id,
      groupId: row.group_id,
      description: row.description,
      amount: row.amount,
      currency: row.currency || 'USD',
      paidBy: row.paid_by,
      paidByName: row.paid_by_name,
      splitType: row.split_type as SplitType,
      category: row.category,
      splitBetween: splits.map(s => ({
        memberId: s.member_id,
        amount: s.amount,
      })),
      date: new Date(row.date),
    };
  }

  getAllExpenses(): Expense[] {
    const rows = db.prepare(`
      SELECT e.*, m.name as paid_by_name
      FROM expenses e
      LEFT JOIN members m ON e.paid_by = m.id
      ORDER BY e.date DESC
    `).all() as any[];
    return rows.map(row => {
      const splits = db
        .prepare('SELECT * FROM split_details WHERE expense_id = ?')
        .all(row.id) as any[];

      return {
        id: row.id,
        groupId: row.group_id,
        description: row.description,
        amount: row.amount,
        currency: row.currency || 'USD',
        paidBy: row.paid_by,
        paidByName: row.paid_by_name,
        splitType: row.split_type as SplitType,
        category: row.category,
        splitBetween: splits.map(s => ({
          memberId: s.member_id,
          amount: s.amount,
        })),
        date: new Date(row.date),
      };
    });
  }

  getExpensesByGroupId(groupId: string): Expense[] {
    const rows = db.prepare(`
      SELECT e.*, m.name as paid_by_name
      FROM expenses e
      LEFT JOIN members m ON e.paid_by = m.id
      WHERE e.group_id = ?
      ORDER BY e.date DESC
    `).all(groupId) as any[];

    return rows.map(row => {
      const splits = db
        .prepare('SELECT * FROM split_details WHERE expense_id = ?')
        .all(row.id) as any[];

      return {
        id: row.id,
        groupId: row.group_id,
        description: row.description,
        amount: row.amount,
        currency: row.currency || 'USD',
        paidBy: row.paid_by,
        paidByName: row.paid_by_name,
        splitType: row.split_type as SplitType,
        category: row.category,
        splitBetween: splits.map(s => ({
          memberId: s.member_id,
          amount: s.amount,
        })),
        date: new Date(row.date),
      };
    });
  }

  updateExpense(id: string, updates: Partial<Expense>): Expense | undefined {
    const current = this.getExpense(id);
    if (!current) return undefined;

    const stmt = db.prepare(`
      UPDATE expenses
      SET description = COALESCE(?, description),
          amount = COALESCE(?, amount),
          currency = COALESCE(?, currency),
          paid_by = COALESCE(?, paid_by),
          split_type = COALESCE(?, split_type),
          category = COALESCE(?, category),
          date = COALESCE(?, date)
      WHERE id = ?
    `);

    stmt.run(
      updates.description || null,
      updates.amount || null,
      updates.currency || null,
      updates.paidBy || null,
      updates.splitType || null,
      updates.category || null,
      updates.date ? new Date(updates.date).toISOString() : null,
      id
    );

    if (updates.splitBetween) {
      db.prepare('DELETE FROM split_details WHERE expense_id = ?').run(id);
      const splitStmt = db.prepare(`
        INSERT INTO split_details (expense_id, member_id, amount)
        VALUES (?, ?, ?)
      `);
      for (const split of updates.splitBetween) {
        splitStmt.run(id, split.memberId, split.amount);
      }
    }

    return this.getExpense(id);
  }

  deleteExpense(id: string): boolean {
    const result = db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
    return result.changes > 0;
  }

  deleteExpensesByGroupId(groupId: string): void {
    db.prepare('DELETE FROM expenses WHERE group_id = ?').run(groupId);
  }

  // Utility methods
  groupExists(id: string): boolean {
    const row = db.prepare('SELECT 1 FROM groups WHERE id = ? LIMIT 1').get(id);
    return !!row;
  }

  memberExists(id: string): boolean {
    const row = db.prepare('SELECT 1 FROM members WHERE id = ? LIMIT 1').get(id);
    return !!row;
  }

  expenseExists(id: string): boolean {
    const row = db.prepare('SELECT 1 FROM expenses WHERE id = ? LIMIT 1').get(id);
    return !!row;
  }

  // Group-Member relationship operations
  addMemberToGroup(groupId: string, memberId: string): void {
    const stmt = db.prepare('INSERT INTO group_members (group_id, member_id) VALUES (?, ?)');
    stmt.run(groupId, memberId);
  }

  removeMemberFromGroup(groupId: string, memberId: string): void {
    const stmt = db.prepare('DELETE FROM group_members WHERE group_id = ? AND member_id = ?');
    stmt.run(groupId, memberId);
  }

  // Test utility method to clear all data
  clearAll(): void {
    db.prepare('DELETE FROM split_details').run();
    db.prepare('DELETE FROM expenses').run();
    db.prepare('DELETE FROM group_members').run();
    db.prepare('DELETE FROM members').run();
    db.prepare('DELETE FROM groups').run();
    db.prepare('DELETE FROM users').run();
  }
}

export const dataStore = new DataStore();
