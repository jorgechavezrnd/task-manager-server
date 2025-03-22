import jwt from 'jsonwebtoken';

const isAuthenticated = async (req, res, next) => {
  const { authorization } = req.headers;
  const token = authorization && authorization.split(' ')[1];

  try {
    const payload = jwt.verify(token, '123456');
    req.body.auth = payload;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

export default { isAuthenticated };
