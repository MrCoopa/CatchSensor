const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
            // console.log('AuthMiddleware: Decoded:', decoded); 
            req.user = await User.findByPk(decoded.id);
            if (!req.user) {
                console.log('AuthMiddleware: User not found for ID:', decoded.id);
                return res.status(401).json({ message: 'User not found' });
            }
            // console.log('AuthMiddleware: User authorized:', req.user.id);
            next();
        } catch (error) {
            console.error('AuthMiddleware: Token verification failed:', error.message);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        console.log('AuthMiddleware: No token provided');
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };
