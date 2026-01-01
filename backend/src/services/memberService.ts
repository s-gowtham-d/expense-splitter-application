import { dataStore } from '../models';
import { Member, AddMemberRequest } from '../types';
import { generateId } from '../utils/idGenerator';
import { AppError } from '../middleware/errorHandler';

export const createMember = (data: AddMemberRequest): Member => {
  const member: Member = {
    id: generateId(),
    name: data.name,
    email: data.email,
  };

  return dataStore.createMember(member);
};

export const getMemberById = (id: string): Member => {
  const member = dataStore.getMember(id);
  if (!member) {
    throw new AppError(404, 'Member not found');
  }
  return member;
};

export const getAllMembers = (): Member[] => {
  return dataStore.getAllMembers();
};

export const deleteMember = (id: string): void => {
  const member = dataStore.getMember(id);
  if (!member) {
    throw new AppError(404, 'Member not found');
  }

  const deleted = dataStore.deleteMember(id);
  if (!deleted) {
    throw new AppError(500, 'Failed to delete member');
  }
};
