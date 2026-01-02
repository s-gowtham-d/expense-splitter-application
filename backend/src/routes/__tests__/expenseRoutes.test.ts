import request from 'supertest';
import app from '../../app';
import { dataStore } from '../../models';

describe('Expense Routes Integration Tests', () => {
  beforeEach(() => {
    // Clear data store before each test
    dataStore.clearAll();

    // Create a test group with members
    const group = dataStore.createGroup({
      id: 'test-group-id',
      name: 'Test Group',
      description: 'Integration test group',
      members: [],
      createdAt: new Date(),
    });

    const member1 = dataStore.createMember({
      id: 'member1',
      name: 'Alice',
      email: 'alice@example.com',
    });

    const member2 = dataStore.createMember({
      id: 'member2',
      name: 'Bob',
      email: 'bob@example.com',
    });

    const member3 = dataStore.createMember({
      id: 'member3',
      name: 'Charlie',
      email: 'charlie@example.com',
    });

    dataStore.addMemberToGroup(group.id, member1.id);
    dataStore.addMemberToGroup(group.id, member2.id);
    dataStore.addMemberToGroup(group.id, member3.id);
  });

  describe('POST /api/expenses', () => {
    it('should create expense with equal split', async () => {
      const group = dataStore.getAllGroups()[0];
      const members = dataStore.getAllMembers();

      const response = await request(app)
        .post('/api/expenses')
        .send({
          groupId: group.id,
          description: 'Team Dinner',
          amount: 90,
          paidBy: members[0].id,
          splitType: 'equal',
          category: 'food',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.description).toBe('Team Dinner');
      expect(response.body.amount).toBe(90);
      expect(response.body.splitBetween).toHaveLength(3);
      expect(response.body.splitBetween[0].amount).toBe(30);
    });

    it('should create expense with percentage split', async () => {
      const group = dataStore.getAllGroups()[0];
      const members = dataStore.getAllMembers();

      const response = await request(app)
        .post('/api/expenses')
        .send({
          groupId: group.id,
          description: 'Shared Cab',
          amount: 100,
          paidBy: members[0].id,
          splitType: 'percentage',
          category: 'travel',
          splitBetween: [
            { memberId: members[0].id, amount: 50 },
            { memberId: members[1].id, amount: 30 },
            { memberId: members[2].id, amount: 20 },
          ],
        })
        .expect(201);

      expect(response.body.splitBetween).toHaveLength(3);
      expect(response.body.splitBetween[0].amount).toBe(50);
      expect(response.body.splitBetween[1].amount).toBe(30);
      expect(response.body.splitBetween[2].amount).toBe(20);
    });

    it('should create expense with exact split', async () => {
      const group = dataStore.getAllGroups()[0];
      const members = dataStore.getAllMembers();

      const response = await request(app)
        .post('/api/expenses')
        .send({
          groupId: group.id,
          description: 'Shopping',
          amount: 100,
          paidBy: members[0].id,
          splitType: 'exact',
          category: 'shopping',
          splitBetween: [
            { memberId: members[0].id, amount: 40 },
            { memberId: members[1].id, amount: 35 },
            { memberId: members[2].id, amount: 25 },
          ],
        })
        .expect(201);

      expect(response.body.splitBetween).toHaveLength(3);
      expect(response.body.splitBetween[0].amount).toBe(40);
      expect(response.body.splitBetween[1].amount).toBe(35);
      expect(response.body.splitBetween[2].amount).toBe(25);
    });

    it('should return 400 for invalid percentage split', async () => {
      const group = dataStore.getAllGroups()[0];
      const members = dataStore.getAllMembers();

      const response = await request(app)
        .post('/api/expenses')
        .send({
          groupId: group.id,
          description: 'Invalid Split',
          amount: 100,
          paidBy: members[0].id,
          splitType: 'percentage',
          category: 'other',
          splitBetween: [
            { memberId: members[0].id, amount: 50 },
            { memberId: members[1].id, amount: 40 }, // Total = 90, not 100
          ],
        })
        .expect(400);

      expect(response.body.message).toContain('Percentages must sum to 100');
    });

    it('should return 400 for invalid exact split', async () => {
      const group = dataStore.getAllGroups()[0];
      const members = dataStore.getAllMembers();

      const response = await request(app)
        .post('/api/expenses')
        .send({
          groupId: group.id,
          description: 'Invalid Split',
          amount: 100,
          paidBy: members[0].id,
          splitType: 'exact',
          category: 'other',
          splitBetween: [
            { memberId: members[0].id, amount: 40 },
            { memberId: members[1].id, amount: 40 }, // Total = 80, not 100
          ],
        })
        .expect(400);

      expect(response.body.message).toContain('Split amounts must sum to total expense amount');
    });

    it('should return 404 for non-existent group', async () => {
      const members = dataStore.getAllMembers();

      await request(app)
        .post('/api/expenses')
        .send({
          groupId: 'nonexistent',
          description: 'Test',
          amount: 100,
          paidBy: members[0].id,
          splitType: 'equal',
          category: 'other',
        })
        .expect(404);
    });
  });

  describe('GET /api/expenses', () => {
    it('should return all expenses', async () => {
      const group = dataStore.getAllGroups()[0];
      const members = dataStore.getAllMembers();

      // Create multiple expenses
      await request(app)
        .post('/api/expenses')
        .send({
          groupId: group.id,
          description: 'Expense 1',
          amount: 50,
          paidBy: members[0].id,
          splitType: 'equal',
          category: 'food',
        });

      await request(app)
        .post('/api/expenses')
        .send({
          groupId: group.id,
          description: 'Expense 2',
          amount: 60,
          paidBy: members[1].id,
          splitType: 'equal',
          category: 'travel',
        });

      const response = await request(app)
        .get('/api/expenses')
        .expect(200);

      expect(response.body).toHaveLength(2);
    });

    it('should filter expenses by groupId', async () => {
      const group = dataStore.getAllGroups()[0];
      const members = dataStore.getAllMembers();

      // Create second group
      const group2 = dataStore.createGroup({
        id: 'test-group-2',
        name: 'Group 2',
        description: 'Second group',
        members: [],
        createdAt: new Date(),
      });
      dataStore.addMemberToGroup(group2.id, members[0].id);

      // Create expenses in both groups
      await request(app)
        .post('/api/expenses')
        .send({
          groupId: group.id,
          description: 'Group 1 Expense',
          amount: 50,
          paidBy: members[0].id,
          splitType: 'equal',
          category: 'food',
        });

      await request(app)
        .post('/api/expenses')
        .send({
          groupId: group2.id,
          description: 'Group 2 Expense',
          amount: 60,
          paidBy: members[0].id,
          splitType: 'equal',
          category: 'travel',
        });

      const response = await request(app)
        .get(`/api/expenses?groupId=${group.id}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].description).toBe('Group 1 Expense');
    });
  });

  describe('GET /api/expenses/:id', () => {
    it('should return expense by id', async () => {
      const group = dataStore.getAllGroups()[0];
      const members = dataStore.getAllMembers();

      const createResponse = await request(app)
        .post('/api/expenses')
        .send({
          groupId: group.id,
          description: 'Test Expense',
          amount: 100,
          paidBy: members[0].id,
          splitType: 'equal',
          category: 'food',
        });

      const response = await request(app)
        .get(`/api/expenses/${createResponse.body.id}`)
        .expect(200);

      expect(response.body.description).toBe('Test Expense');
      expect(response.body.amount).toBe(100);
    });

    it('should return 404 for non-existent expense', async () => {
      await request(app)
        .get('/api/expenses/nonexistent')
        .expect(404);
    });
  });

  describe('PUT /api/expenses/:id', () => {
    it('should update expense', async () => {
      const group = dataStore.getAllGroups()[0];
      const members = dataStore.getAllMembers();

      const createResponse = await request(app)
        .post('/api/expenses')
        .send({
          groupId: group.id,
          description: 'Original',
          amount: 100,
          paidBy: members[0].id,
          splitType: 'equal',
          category: 'food',
        });

      const response = await request(app)
        .put(`/api/expenses/${createResponse.body.id}`)
        .send({
          description: 'Updated',
          amount: 150,
          category: 'travel',
        })
        .expect(200);

      expect(response.body.description).toBe('Updated');
      expect(response.body.amount).toBe(150);
      expect(response.body.category).toBe('travel');
    });

    it('should return 404 for non-existent expense', async () => {
      await request(app)
        .put('/api/expenses/nonexistent')
        .send({
          description: 'Updated',
        })
        .expect(404);
    });
  });

  describe('DELETE /api/expenses/:id', () => {
    it('should delete expense', async () => {
      const group = dataStore.getAllGroups()[0];
      const members = dataStore.getAllMembers();

      const createResponse = await request(app)
        .post('/api/expenses')
        .send({
          groupId: group.id,
          description: 'To Delete',
          amount: 100,
          paidBy: members[0].id,
          splitType: 'equal',
          category: 'food',
        });

      await request(app)
        .delete(`/api/expenses/${createResponse.body.id}`)
        .expect(204);

      // Verify expense is deleted
      await request(app)
        .get(`/api/expenses/${createResponse.body.id}`)
        .expect(404);
    });

    it('should return 404 for non-existent expense', async () => {
      await request(app)
        .delete('/api/expenses/nonexistent')
        .expect(404);
    });
  });
});
