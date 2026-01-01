import { Request, Response } from 'express';
import * as memberService from '../services/memberService';
import * as groupService from '../services/groupService';
import { AddMemberRequest } from '../types';

export const addMemberToGroup = async (req: Request, res: Response): Promise<void> => {
  const { groupId } = req.params;
  const data: AddMemberRequest = req.body;

  // Create the member first
  const member = memberService.createMember(data);

  // Add member to the group
  const group = groupService.addMemberToGroup(groupId, member.id);

  res.status(201).json({
    status: 'success',
    data: {
      member,
      group,
    },
  });
};

export const removeMemberFromGroup = async (req: Request, res: Response): Promise<void> => {
  const { groupId, memberId } = req.params;

  // Remove member from the group
  const group = groupService.removeMemberFromGroup(groupId, memberId);

  // Optionally delete the member entirely (you can modify this logic)
  // For now, we'll just remove from group but keep the member in the system

  res.status(200).json({
    status: 'success',
    data: { group },
  });
};
