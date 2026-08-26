const express = require('express');
const { getSkillListings } = require('../controllers/skillController');
const { protect }          = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getSkillListings);

module.exports = router;
