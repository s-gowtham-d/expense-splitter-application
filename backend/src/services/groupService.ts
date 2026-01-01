import { dataStore } from '../models';
import { Group, CreateGroupRequest, UpdateGroupRequest } from '../types';
import { generateId } from '../utils/idGenerator';
import { AppError } from '../middleware/errorHandler';

export const createGroup = (data: CreateGroupRequest): Group => {
  const group: Group = {
    id: generateId(),
    name: data.name,
    description: data.description,
    members: [],
    createdAt: new Date(),
  };

  return dataStore.createGroup(group);
};

export const getAllGroups = (): Group[] => {
  return dataStore.getAllGroups();
};

export const getGroupById = (id: string): Group => {
  const group = dataStore.getGroup(id);
  if (!group) {
    throw new AppError(404, 'Group not found');
  }
  return group;
};

export const updateGroup = (id: string, data: UpdateGroupRequest): Group => {
  const group = dataStore.getGroup(id);
  if (!group) {
    throw new AppError(404, 'Group not found');
  }

  const updatedGroup = dataStore.updateGroup(id, {
    name: data.name,
    description: data.description,
  });

  if (!updatedGroup) {
    throw new AppError(500, 'Failed to update group');
  }

  return updatedGroup;
};

export const deleteGroup = (id: string): void => {
  const group = dataStore.getGroup(id);
  if (!group) {
    throw new AppError(404, 'Group not found');
  }

  // Delete all expenses associated with this group
  dataStore.deleteExpensesByGroupId(id);

  // Delete the group
  const deleted = dataStore.deleteGroup(id);
  if (!deleted) {
    throw new AppError(500, 'Failed to delete group');
  }
};

export const addMemberToGroup = (groupId: string, memberId: string): Group => {
  const group = dataStore.getGroup(groupId);
  if (!group) {
    throw new AppError(404, 'Group not found');
  }

  if (!dataStore.memberExists(memberId)) {
    throw new AppError(404, 'Member not found');
  }

  if (group.members.includes(memberId)) {
    throw new AppError(400, 'Member already in group');
  }

  const updatedMembers = [...group.members, memberId];
  const updatedGroup = dataStore.updateGroup(groupId, {
    members: updatedMembers,
  });

  if (!updatedGroup) {
    throw new AppError(500, 'Failed to add member to group');
  }

  return updatedGroup;
};

export const removeMemberFromGroup = (groupId: string, memberId: string): Group => {
  const group = dataStore.getGroup(groupId);
  if (!group) {
    throw new AppError(404, 'Group not found');
  }

  if (!group.members.includes(memberId)) {
    throw new AppError(400, 'Member not in group');
  }

  const updatedMembers = group.members.filter(id => id !== memberId);
  const updatedGroup = dataStore.updateGroup(groupId, {
    members: updatedMembers,
  });

  if (!updatedGroup) {
    throw new AppError(500, 'Failed to remove member from group');
  }

  return updatedGroup;
};
