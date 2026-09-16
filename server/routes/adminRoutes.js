const express = require('express');
const { getUsers } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect, authorize('admin'));
router.get('/users', getUsers);

module.exports = router;