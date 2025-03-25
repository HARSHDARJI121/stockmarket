// filepath: c:\stocktrade\stocktrade-project\controllers\stockController.js

const Stock = require('../models/Stock');

// Fetch all stocks
exports.getAllStocks = async (req, res) => {
    try {
        const stocks = await Stock.find();
        res.status(200).json(stocks);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching stocks', error });
    }
};

// Fetch a single stock by ID
exports.getStockById = async (req, res) => {
    try {
        const stock = await Stock.findById(req.params.id);
        if (!stock) {
            return res.status(404).json({ message: 'Stock not found' });
        }
        res.status(200).json(stock);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching stock', error });
    }
};

// Create a new stock
exports.createStock = async (req, res) => {
    const newStock = new Stock(req.body);
    try {
        const savedStock = await newStock.save();
        res.status(201).json(savedStock);
    } catch (error) {
        res.status(400).json({ message: 'Error creating stock', error });
    }
};

// Update a stock
exports.updateStock = async (req, res) => {
    try {
        const updatedStock = await Stock.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedStock) {
            return res.status(404).json({ message: 'Stock not found' });
        }
        res.status(200).json(updatedStock);
    } catch (error) {
        res.status(400).json({ message: 'Error updating stock', error });
    }
};

// Delete a stock
exports.deleteStock = async (req, res) => {
    try {
        const deletedStock = await Stock.findByIdAndDelete(req.params.id);
        if (!deletedStock) {
            return res.status(404).json({ message: 'Stock not found' });
        }
        res.status(200).json({ message: 'Stock deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting stock', error });
    }
};