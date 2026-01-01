import { Request, Response } from 'express';
import * as groupService from '../services/groupService';
import { dataStore } from '../models';
import { CreateGroupRequest, UpdateGroupRequest } from '../types';

export const createGroup = async (req: Request, res: Response): Promise<void> => {
  const data: CreateGroupRequest = req.body;
  const group = groupService.createGroup(data);

  res.status(201).json({
    status: 'success',
    data: { group },
  });
};

export const getAllGroups = async (_req: Request, res: Response): Promise<void> => {
  const groups = groupService.getAllGroups();

  res.status(200).json({
    status: 'success',
    data: { groups },
  });
};

export const getGroupById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const group = groupService.getGroupById(id);

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
  const data: UpdateGroupRequest = req.body;
  const group = groupService.updateGroup(id, data);

  res.status(200).json({
    status: 'success',
    data: { group },
  });
};

export const deleteGroup = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  groupService.deleteGroup(id);

  res.status(204).send();
};
