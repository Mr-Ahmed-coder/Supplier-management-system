const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, getUsers, deleteUser, updateUserRole, changePassword } = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/change-password', protect, changePassword);
router.get('/me', protect, getMe);
router.get('/', protect, adminOnly, getUsers);
router.delete('/:id', protect, adminOnly, deleteUser);
router.put('/:id/role', protect, adminOnly, updateUserRole);

module.exports = router;
