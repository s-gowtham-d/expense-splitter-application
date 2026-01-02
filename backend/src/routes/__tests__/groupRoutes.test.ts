import request from 'supertest';
import app from '../../app';
import { dataStore } from '../../models';

describe('Group Routes Integration Tests', () => {
  beforeEach(() => {
    // Clear data store before each test
    dataStore.clearAll();
  });

  describe('POST /api/groups', () => {
    it('should create a new group', async () => {
      const response = await request(app)
        .post('/api/groups')
        .send({
          name: 'Trip to Bali',
          description: 'Summer vacation expenses',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Trip to Bali');
      expect(response.body.description).toBe('Summer vacation expenses');
      expect(response.body.members).toEqual([]);
    });

    it('should create group without description', async () => {
      const response = await request(app)
        .post('/api/groups')
        .send({
          name: 'Simple Group',
        })
        .expect(201);

      expect(response.body.name).toBe('Simple Group');
      expect(response.body.description).toBeUndefined();
    });

    it('should return 400 if name is missing', async () => {
      await request(app)
        .post('/api/groups')
        .send({
          description: 'No name provided',
        })
        .expect(400);
    });
  });

  describe('GET /api/groups', () => {
    it('should return all groups', async () => {
      // Create multiple groups
      await request(app)
        .post('/api/groups')
        .send({ name: 'Group 1', description: 'First' });

      await request(app)
        .post('/api/groups')
        .send({ name: 'Group 2', description: 'Second' });

      const response = await request(app)
        .get('/api/groups')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBe('Group 1');
      expect(response.body[1].name).toBe('Group 2');
    });

    it('should return empty array when no groups exist', async () => {
      const response = await request(app)
        .get('/api/groups')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /api/groups/:id', () => {
    it('should return group by id with members and expenses', async () => {
      const createResponse = await request(app)
        .post('/api/groups')
        .send({
          name: 'Test Group',
          description: 'Testing',
        });

      const groupId = createResponse.body.id;

      const response = await request(app)
        .get(`/api/groups/${groupId}`)
        .expect(200);

      expect(response.body.id).toBe(groupId);
      expect(response.body.name).toBe('Test Group');
      expect(response.body.members).toEqual([]);
      expect(response.body.expenses).toEqual([]);
    });

    it('should return 404 for non-existent group', async () => {
      await request(app)
        .get('/api/groups/nonexistent')
        .expect(404);
    });
  });

  describe('PUT /api/groups/:id', () => {
    it('should update group name and description', async () => {
      const createResponse = await request(app)
        .post('/api/groups')
        .send({
          name: 'Original Name',
          description: 'Original Description',
        });

      const groupId = createResponse.body.id;

      const response = await request(app)
        .put(`/api/groups/${groupId}`)
        .send({
          name: 'Updated Name',
          description: 'Updated Description',
        })
        .expect(200);

      expect(response.body.name).toBe('Updated Name');
      expect(response.body.description).toBe('Updated Description');
    });

    it('should update only name', async () => {
      const createResponse = await request(app)
        .post('/api/groups')
        .send({
          name: 'Original Name',
          description: 'Original Description',
        });

      const groupId = createResponse.body.id;

      const response = await request(app)
        .put(`/api/groups/${groupId}`)
        .send({
          name: 'New Name',
        })
        .expect(200);

      expect(response.body.name).toBe('New Name');
      expect(response.body.description).toBe('Original Description');
    });

    it('should return 404 for non-existent group', async () => {
      await request(app)
        .put('/api/groups/nonexistent')
        .send({
          name: 'Updated',
        })
        .expect(404);
    });
  });

  describe('DELETE /api/groups/:id', () => {
    it('should delete group', async () => {
      const createResponse = await request(app)
        .post('/api/groups')
        .send({
          name: 'To Delete',
          description: 'Will be deleted',
        });

      const groupId = createResponse.body.id;

      await request(app)
        .delete(`/api/groups/${groupId}`)
        .expect(204);

      // Verify group is deleted
      await request(app)
        .get(`/api/groups/${groupId}`)
        .expect(404);
    });

    it('should return 404 for non-existent group', async () => {
      await request(app)
        .delete('/api/groups/nonexistent')
        .expect(404);
    });
  });

  describe('POST /api/groups/:id/members', () => {
    it('should add member to group', async () => {
      const groupResponse = await request(app)
        .post('/api/groups')
        .send({
          name: 'Test Group',
        });

      const groupId = groupResponse.body.id;

      const response = await request(app)
        .post(`/api/groups/${groupId}/members`)
        .send({
          name: 'Alice',
          email: 'alice@example.com',
        })
        .expect(201);

      expect(response.body.name).toBe('Alice');
      expect(response.body.email).toBe('alice@example.com');

      // Verify member is in group
      const groupCheck = await request(app)
        .get(`/api/groups/${groupId}`)
        .expect(200);

      expect(groupCheck.body.members).toHaveLength(1);
      expect(groupCheck.body.members[0].id).toBe(response.body.id);
    });

    it('should return 404 for non-existent group', async () => {
      await request(app)
        .post('/api/groups/nonexistent/members')
        .send({
          name: 'Alice',
          email: 'alice@example.com',
        })
        .expect(404);
    });

    it('should return 400 if name is missing', async () => {
      const groupResponse = await request(app)
        .post('/api/groups')
        .send({
          name: 'Test Group',
        });

      await request(app)
        .post(`/api/groups/${groupResponse.body.id}/members`)
        .send({
          email: 'alice@example.com',
        })
        .expect(400);
    });
  });

  describe('DELETE /api/groups/:groupId/members/:memberId', () => {
    it('should remove member from group', async () => {
      const groupResponse = await request(app)
        .post('/api/groups')
        .send({
          name: 'Test Group',
        });

      const groupId = groupResponse.body.id;

      const memberResponse = await request(app)
        .post(`/api/groups/${groupId}/members`)
        .send({
          name: 'Alice',
          email: 'alice@example.com',
        });

      const memberId = memberResponse.body.id;

      await request(app)
        .delete(`/api/groups/${groupId}/members/${memberId}`)
        .expect(204);

      // Verify member is removed
      const groupCheck = await request(app)
        .get(`/api/groups/${groupId}`)
        .expect(200);

      expect(groupCheck.body.members).toHaveLength(0);
    });

    it('should return 404 for non-existent group', async () => {
      await request(app)
        .delete('/api/groups/nonexistent/members/somemember')
        .expect(404);
    });

    it('should return 400 if member has expenses', async () => {
      const groupResponse = await request(app)
        .post('/api/groups')
        .send({
          name: 'Test Group',
        });

      const groupId = groupResponse.body.id;

      const member1Response = await request(app)
        .post(`/api/groups/${groupId}/members`)
        .send({
          name: 'Alice',
          email: 'alice@example.com',
        });

      await request(app)
        .post(`/api/groups/${groupId}/members`)
        .send({
          name: 'Bob',
          email: 'bob@example.com',
        });

      // Create expense paid by Alice
      await request(app)
        .post('/api/expenses')
        .send({
          groupId: groupId,
          description: 'Dinner',
          amount: 100,
          paidBy: member1Response.body.id,
          splitType: 'equal',
          category: 'food',
        });

      // Try to remove Alice
      const response = await request(app)
        .delete(`/api/groups/${groupId}/members/${member1Response.body.id}`)
        .expect(400);

      expect(response.body.message).toContain('has expenses');
    });
  });
});
