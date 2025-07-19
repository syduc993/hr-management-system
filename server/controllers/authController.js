import { users } from '../config/database.js';

const login = (req, res) => {
    const { username, password } = req.body;
    
    const user = users[username];
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    if (user.password !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    req.session.user = {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName
    };
    
    const response = { 
        message: 'Login successful',
        user: req.session.user
    };
    
    res.json(response);
};

const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Could not log out' });
        }
        res.json({ message: 'Logout successful' });
    });
};

const getProfile = (req, res) => {
    res.json({ user: req.user });
};

export {
    login,
    logout,
    getProfile
};
