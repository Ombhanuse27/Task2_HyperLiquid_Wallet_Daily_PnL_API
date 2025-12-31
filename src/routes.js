const express = require('express');
const router = express.Router();
const controller = require('./controllers');

router.get('/:wallet/pnl', controller.getPnl);

module.exports = router;