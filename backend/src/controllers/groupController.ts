import { Request, Response } from 'express';
import * as groupService from '../services/groupService';
import { dataStore } from '../models';
import { CreateGroupRequest, UpdateGroupRequest } from '../types';

export const createGroup = async (req: Request, res: Response): Promise<void> => {
  const data: CreateGroupRequest = req.body;
  const userId = req.user!.userId;
  const group = groupService.createGroup(userId, data);

  res.status(201).json({
    status: 'success',
    data: { group },
  });
};

export const getAllGroups = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const groups = groupService.getAllGroups(userId);

  res.status(200).json({
    status: 'success',
    data: { groups },
  });
};

export const getGroupById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.userId;
  const group = groupService.getGroupById(id, userId);

  // Get members details
  const members = dataStore.getMembersByIds(group.members);

  // Get expenses for this group
  const expenses = dataStore.getExpensesByGroupId(id);

  res.status(200).json({
    status: 'success',
    data: {
      group,
      members,
      expenses,
    },
  });
};

export const updateGroup = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.userId;
  const data: UpdateGroupRequest = req.body;
  const group = groupService.updateGroup(id, userId, data);

  res.status(200).json({
    status: 'success',
    data: { group },
  });
};

export const deleteGroup = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.userId;
  groupService.deleteGroup(id, userId);

  res.status(204).send();
};
