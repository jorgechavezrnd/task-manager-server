import Task from '../models/task.js';
import User from '../models/user.js';
import AuthMiddleware from '../middlewares/authMiddleware.js';
import { Op } from 'sequelize';
import { body, validationResult } from 'express-validator';

export default function (router) {

  router.post(
    '/api/tasks',
    body('title').notEmpty().withMessage('Title is mandatory'),
    body('deadline').isDate().optional({ nullable: true, checkFalsy: true }).withMessage('Deadline has not a valid date format'),
    AuthMiddleware.isAuthenticated,
    async (req, res) => {

    const result = validationResult(req);

    if (!result.isEmpty()) {
      return res.status(500).json({ message: 'error', errors: result.array() });
    }

    const { title, description, deadline } = req.body;
    const userId = req.body.auth.id;

    const user = await User.findOne({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ message: 'error', errors: [{ msg: 'Uer Not Found' }] });
    }

    let task = null;

    try {
      const fixedDeadline = deadline == '' ? null : deadline;
      task = await Task.create({ title, description, state: 'pendiente', deadline: fixedDeadline, userId });
    } catch (error) {
      return res.status(500).json({ message: 'error', errors: [{ msg: 'Error on create task' }] });
    }

    const responseObject = {
      message: 'ok',
      data: { task },
    };

    res.json(responseObject);

  });

  router.get('/api/tasks/:id', AuthMiddleware.isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const userId = req.body.auth.id;

    const task = await Task.findOne({ where: { id } });

    if (!task) {
      return res.status(404).json({ message: 'error', errors: [{ msg: 'Task not found' }] });
    }

    if (task.userId !== userId) {
      return res.status(403).json({ message: 'error', errors: [{ msg: 'Forbidden' }] });
    }

    const responseObject = {
      message: 'ok',
      data: { task },
    };

    res.json(responseObject);
  });

  router.get('/api/tasks', AuthMiddleware.isAuthenticated, async (req, res) => {
    const userId = req.body.auth.id;
    const { state, search, limitedDeadline } = req.query;

    let searchCriteria = { userId };

    if (state) {
      searchCriteria = { ...searchCriteria, state: { [Op.iLike]: state } };
    }

    if (search) {
      searchCriteria = { ...searchCriteria, [Op.or]: [{ title: { [Op.iLike]: `%${search}%` } }, { description: { [Op.iLike]: `%${search}%` } }] };
    }

    if (limitedDeadline) {
      searchCriteria = { ...searchCriteria, deadline: { [Op.or]: [{[Op.lte]: limitedDeadline}, {[Op.is]: null}] } };
    }

    const tasks = await Task.findAll({ where: searchCriteria });

    const responseObject = {
      message: 'ok',
      data: { tasks },
    };

    res.json(responseObject);
  });

  router.put(
    '/api/tasks/:id',
    body('title').notEmpty().withMessage('Title is mandatory'),
    body('deadline').isDate().optional({ nullable: true, checkFalsy: true }).withMessage('Deadline has not a valid date format'),
    body('state').isIn(['pendiente', 'en progreso', 'completado']).withMessage('Invalid state'),
    AuthMiddleware.isAuthenticated,
    async (req, res) => {

    const result = validationResult(req);

    if (!result.isEmpty()) {
      return res.status(500).json({ message: 'error', errors: result.array() });
    }

    const userId = req.body.auth.id;
    const { id } = req.params;
    const { title, description, state, deadline } = req.body;

    const task = await Task.findOne({ where: { id } });

    if (!task) {
      return res.status(404).json({ message: 'error', errors: [{ msg: 'Task not found' }] });
    }

    if (task.userId !== userId) {
      return res.status(403).json({ message: 'error', errors: [{ msg: 'Forbidden' }] });
    }

    if (task.state === 'completado') {
      return res.status(403).json({ message: 'error', errors: [{ msg: 'Forbidden' }] });
    }

    if ((task.state === 'pendiente' && state === 'completado') ||
        (task.state === 'en progreso' && state === 'pendiente')) {
      return res.status(400).json({ message: 'error', errors: [{ msg: `Cannot set state from ${task.state} to ${state}` }] });
    }

    try {
      const fixedDeadline = deadline == '' ? null : deadline;
      await task.update({ title, description, state, deadline: fixedDeadline });
    } catch (error) {
      return res.status(500).json({ message: 'error', errors: [{ msg: 'Error on update' }] });
    }

    const responseObject = {
      message: 'ok',
      data: { task },
    };

    res.json(responseObject);

  });

  router.delete('/api/tasks/:id', AuthMiddleware.isAuthenticated, async (req, res) => {
    const userId = req.body.auth.id;
    const { id } = req.params;

    const task = await Task.findOne({ where: { id } });

    if (!task) {
      return res.status(404).json({ message: 'error', errors: [{ msg: 'Task not found' }] });
    }

    if (task.userId !== userId) {
      return res.status(403).json({ message: 'error', errors: [{ msg: 'Forbidden' }] });
    }

    await task.destroy();

    res.json({ message: 'ok' });
  });

  return router;

}
