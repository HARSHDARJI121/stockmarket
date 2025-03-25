// filepath: c:\stocktrade\stocktrade-project\routes\stockRoutes.js
const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');

// Route to fetch all stocks
router.get('/stocks', stockController.getAllStocks);

// Route to fetch a single stock by ID
router.get('/stocks/:id', stockController.getStockById);

// Route to create a new stock
router.post('/stocks', stockController.createStock);

// Route to update an existing stock
router.put('/stocks/:id', stockController.updateStock);

// Route to delete a stock
router.delete('/stocks/:id', stockController.deleteStock);

module.exports = router;