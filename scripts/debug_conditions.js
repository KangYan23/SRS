const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MONGODB_URI is missing from .env');
    process.exit(1);
} else {
    console.log('MONGODB_URI loaded (starts with):', MONGODB_URI.substring(0, 15));
}

async function debugConditions() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const collectionName = 'completed_cleaned_clinical';
        const db = mongoose.connection.db;
        const collection = db.collection(collectionName);

        // 1. Check for any documents with panel "Gastrointestinal"
        console.log('\n--- Searching for panel: "Gastrointestinal" ---');
        // Case insensitive search for panel just in case
        const panelQuery = { $or: [{ panel: "Gastrointestinal" }, { Panel: "Gastrointestinal" }] };
        const docs = await collection.find(panelQuery).limit(2).toArray();
        console.log(`Found ${docs.length} documents for Gastrointestinal`);

        if (docs.length > 0) {
            console.log('Sample document keys:', Object.keys(docs[0]));
            console.log('Sample document:', JSON.stringify(docs[0], null, 2));

            // Check specifically for condition field variations
            console.log('condition:', docs[0].condition);
            console.log('Condition:', docs[0].Condition);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected');
    }
}

debugConditions();
