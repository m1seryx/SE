const express = require('express');
const router = express.Router();
const damageRecordController = require('../controller/DamageRecordController');
const middleware = require('../middleware/AuthToken');

// Apply authentication middleware to all routes (admin only)
router.use(middleware.verifyToken);

// Damage record CRUD operations
router.post('/', damageRecordController.createDamageRecord);
router.get('/', damageRecordController.getAllDamageRecords);
router.get('/item/:itemId', damageRecordController.getDamageRecordsByItem);
router.get('/:id', damageRecordController.getDamageRecordById);
router.put('/:id', damageRecordController.updateDamageRecord);
router.delete('/:id', damageRecordController.deleteDamageRecord);

module.exports = router;

