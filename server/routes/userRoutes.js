

const express = require('express');
const {
  getMyProfile,
  getUserById,
  updateProfile,
  addOfferedSkill,
  removeOfferedSkill,
  addWantedSkill,
  removeWantedSkill,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();


router.use(protect);


router.get('/profile', getMyProfile);
router.put('/profile', updateProfile);



router.post  ('/skills/offered',             addOfferedSkill);
router.delete('/skills/offered/:skillName',  removeOfferedSkill);


router.post  ('/skills/wanted',              addWantedSkill);
router.delete('/skills/wanted/:skillName',   removeWantedSkill);


router.get('/:id', getUserById);

module.exports = router;
