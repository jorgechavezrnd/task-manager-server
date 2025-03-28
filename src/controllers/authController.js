import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import { body, validationResult } from 'express-validator';

export default function (router) {

  router.post(
    '/api/auth/register',
    body('name').notEmpty().withMessage('Nombre no puede estar vacío'),
    body('email').isEmail().withMessage('Email no válido'),
    body('password').notEmpty().withMessage('Contraseña no puede estar vacío'),
    async (req, res) => {

    const result = validationResult(req);

    if (!result.isEmpty()) {
      return res.status(500).json({ message: 'error', errors: result.array() });
    }

    const { name, email, password } = req.body;

    const validateUser = await User.findOne({ where: { email } });

    if (validateUser) {
      return res.status(500).json({ message: 'error', errors: [{ msg: 'Email fue utilizado por otro usuario' }] });
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    let user = null;

    try {
      user = await User.create({ name, email, password: hashedPassword });
    } catch (error) {
      return res.status(500).json({ message: 'error', errors: [{ msg: 'Error al crear usuario' }] });
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
    body('email').isEmail().withMessage('Email no válido'),
    body('password').notEmpty().withMessage('Contraseña no puede ser vacía'),
    async (req, res) => {

    const result = validationResult(req);

    if (!result.isEmpty()) {
      return res.status(500).json({ message: 'error', errors: result.array() });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'error', errors: [{ msg: 'Usuario no encontrado' }] });
    }

    const isValidPassword = bcrypt.compareSync(password, user.password);

    if (!isValidPassword) {
      return res.status(500).json({ message: 'error', errors: [{ msg: 'Email o contraseña no es correcto' }] });
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
