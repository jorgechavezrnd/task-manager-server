import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import { body, validationResult } from 'express-validator';

export default function (router) {

  router.post(
    '/api/auth/register',
    body('name').notEmpty().withMessage('Name cannot be empty'),
    body('email').isEmail().withMessage('Email format is not valid'),
    body('password').notEmpty().withMessage('Password cannot be empty'),
    async (req, res) => {

    const result = validationResult(req);

    if (!result.isEmpty()) {
      return res.status(500).json({ message: 'error', errors: result.array() });
    }

    const { name, email, password } = req.body;

    const validateUser = await User.findOne({ where: { email } });

    if (validateUser) {
      return res.status(500).json({ message: 'error', errors: [{ msg: 'User with the email already exists' }] });
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    let user = null;

    try {
      user = await User.create({ name, email, password: hashedPassword });
    } catch (error) {
      return res.status(500).json({ message: 'error', errors: [{ msg: 'Error found' }] });
    }

    const payload = {
      id: user.id,
      email,
      name,
    };

    const token = jwt.sign(payload, process.env.SECRET_TOKEN, {
      expiresIn: '14400s',
    });

    const responseObject = {
      message: 'ok',
      data: { token, payload },
    };

    res.json(responseObject);

  });

  router.post(
    '/api/auth/login',
    body('email').isEmail().withMessage('Email format is not valid'),
    body('password').notEmpty().withMessage('Password cannot be empty'),
    async (req, res) => {

    const result = validationResult(req);

    if (!result.isEmpty()) {
      return res.status(500).json({ message: 'error', errors: result.array() });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'error', errors: [{ msg: 'User not found' }] });
    }

    const isValidPassword = bcrypt.compareSync(password, user.password);

    if (!isValidPassword) {
      return res.status(500).json({ message: 'error', errors: [{ msg: 'Email or Password is not correct' }] });
    }

    const payload = {
      id: user.id,
      email,
      name: user.name,
    };

    const token = jwt.sign(payload, process.env.SECRET_TOKEN, {
      expiresIn: '14400s',
    });

    const responseObject = {
      message: 'ok',
      data: { token, payload },
    };

    res.json(responseObject);

  });

  return router;

}
