const mongoose = require('mongoose');
require('dotenv').config();

const Customer = require('./models/Customer');
const Supplier = require('./models/Supplier');
const Product = require('./models/Product');

async function checkIndexes() {
    try {
        console.log("Connecting to Database:", process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        
        console.log("\n--- Customer Indexes ---");
        const custIndexes = await Customer.collection.indexes();
        console.log(JSON.stringify(custIndexes, null, 2));

        console.log("\n--- Supplier Indexes ---");
        const supIndexes = await Supplier.collection.indexes();
        console.log(JSON.stringify(supIndexes, null, 2));

        console.log("\n--- Product Indexes ---");
        const prodIndexes = await Product.collection.indexes();
        console.log(JSON.stringify(prodIndexes, null, 2));

        console.log("\nTesting Insert...");
        
        try {
            const tempSupplier = await Supplier.create({ name: "Subagent Diagnostic Test " + Date.now(), email: "", phone: "", company: "" });
            console.log("Supplier Insert Success:", tempSupplier._id);
            await Supplier.findByIdAndDelete(tempSupplier._id);
            console.log("Supplier Cleaned.");
        } catch (e) {
            console.log("SUPPLIER INSERT FAILED:", e.message);
        }

        mongoose.connection.close();
    } catch (err) {
        console.error("Error:", err);
    }
}

checkIndexes();
