import { Request, Response } from 'express';
import * as balanceService from '../services/balanceService';

export const getGroupBalances = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const balances = balanceService.calculateGroupBalances(id);

  res.status(200).json({
    status: 'success',
    data: { balances },
  });
};

export const getGroupSettlements = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const settlements = balanceService.calculateSettlements(id);

  res.status(200).json({
    status: 'success',
    data: { settlements },
  });
};
