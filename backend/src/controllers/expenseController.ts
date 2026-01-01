import { Request, Response } from 'express';
import * as expenseService from '../services/expenseService';
import { CreateExpenseRequest, UpdateExpenseRequest } from '../types';

export const createExpense = async (req: Request, res: Response): Promise<void> => {
  const data: CreateExpenseRequest = req.body;
  const expense = expenseService.createExpense(data);

  res.status(201).json({
    status: 'success',
    data: { expense },
  });
};

export const getAllExpenses = async (req: Request, res: Response): Promise<void> => {
  const { groupId } = req.query;
  const expenses = expenseService.getAllExpenses(groupId as string | undefined);

  res.status(200).json({
    status: 'success',
    data: { expenses },
  });
};

export const getExpenseById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const expense = expenseService.getExpenseById(id);

  res.status(200).json({
    status: 'success',
    data: { expense },
  });
};

export const updateExpense = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const data: UpdateExpenseRequest = req.body;
  const expense = expenseService.updateExpense(id, data);

  res.status(200).json({
    status: 'success',
    data: { expense },
  });
};

export const deleteExpense = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  expenseService.deleteExpense(id);

  res.status(204).send();
};
