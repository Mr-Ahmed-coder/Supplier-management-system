const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect, adminOnly } = require('../middleware/auth');
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const Receipt = require('../models/Receipt');

router.get('/db-stats', protect, adminOnly, async (req, res, next) => {
    try {
        if (!mongoose.connection || !mongoose.connection.db) {
            return res.status(500).json({ message: "Database connection not ready." });
        }
        
        // MongoDB statistics command directly executed against the current active cluster
        const stats = await mongoose.connection.db.stats();
        
        const dataSizeMB = (stats.dataSize / (1024 * 1024)).toFixed(2);
        const storageSizeMB = (stats.storageSize / (1024 * 1024)).toFixed(2);
        
        res.json({
            dataSizeMB,
            storageSizeMB,
            collections: stats.collections,
            objects: stats.objects
        });
    } catch(err) {
        // Safe fallback in case db.stats() errors out natively due to Atlas free tier clustering limits
        res.status(200).json({
             message: "Database statistics are restricted by the current hosting tier or an error occurred.",
             collections: null,
             dataSizeMB: "0.00",
             storageSizeMB: "0.00",
             error: err.message
        });
    }
});

router.delete('/reset', protect, adminOnly, async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        await Invoice.deleteMany({}).session(session);
        await Product.deleteMany({}).session(session);
        await Receipt.deleteMany({}).session(session);
        
        await session.commitTransaction();
        session.endSession();
        res.json({ message: "System structurally reset. Volatile ledgers cleared." });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ message: "System Reset Failed. Transaction Aborted.", error: err.message });
    }
});

module.exports = router;
