import db from '../config/database';
import { Group, Member, Expense, SplitType } from '../types';

class DataStore {
  // Group operations
  createGroup(group: Group): Group {
    const stmt = db.prepare(`
      INSERT INTO groups (id, name, description, created_at)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(group.id, group.name, group.description || null, group.createdAt.toISOString());
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
      INSERT INTO expenses (id, group_id, description, amount, paid_by, split_type, date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      expense.id,
      expense.groupId,
      expense.description,
      expense.amount,
      expense.paidBy,
      expense.splitType,
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
    const row = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id) as any;
    if (!row) return undefined;

    const splits = db
      .prepare('SELECT * FROM split_details WHERE expense_id = ?')
      .all(id) as any[];

    return {
      id: row.id,
      groupId: row.group_id,
      description: row.description,
      amount: row.amount,
      paidBy: row.paid_by,
      splitType: row.split_type as SplitType,
      splitBetween: splits.map(s => ({
        memberId: s.member_id,
        amount: s.amount,
      })),
      date: new Date(row.date),
    };
  }

  getAllExpenses(): Expense[] {
    const rows = db.prepare('SELECT * FROM expenses ORDER BY date DESC').all() as any[];
    return rows.map(row => {
      const splits = db
        .prepare('SELECT * FROM split_details WHERE expense_id = ?')
        .all(row.id) as any[];

      return {
        id: row.id,
        groupId: row.group_id,
        description: row.description,
        amount: row.amount,
        paidBy: row.paid_by,
        splitType: row.split_type as SplitType,
        splitBetween: splits.map(s => ({
          memberId: s.member_id,
          amount: s.amount,
        })),
        date: new Date(row.date),
      };
    });
  }

  getExpensesByGroupId(groupId: string): Expense[] {
    const rows = db
      .prepare('SELECT * FROM expenses WHERE group_id = ? ORDER BY date DESC')
      .all(groupId) as any[];

    return rows.map(row => {
      const splits = db
        .prepare('SELECT * FROM split_details WHERE expense_id = ?')
        .all(row.id) as any[];

      return {
        id: row.id,
        groupId: row.group_id,
        description: row.description,
        amount: row.amount,
        paidBy: row.paid_by,
        splitType: row.split_type as SplitType,
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
          paid_by = COALESCE(?, paid_by),
          split_type = COALESCE(?, split_type),
          date = COALESCE(?, date)
      WHERE id = ?
    `);

    stmt.run(
      updates.description || null,
      updates.amount || null,
      updates.paidBy || null,
      updates.splitType || null,
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
}

export const dataStore = new DataStore();
