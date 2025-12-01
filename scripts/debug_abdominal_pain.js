const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MONGODB_URI is missing from .env');
    process.exit(1);
}

async function debugAbdominalPain() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const collectionName = 'completed_cleaned_clinical';
        const db = mongoose.connection.db;
        const collection = db.collection(collectionName);

        console.log('\n--- Searching for condition: "Abdominal Pain" ---');
        const docs = await collection.find({ condition: "Abdominal Pain" }).limit(1).toArray();

        if (docs.length > 0) {
            console.log('BODY_AREA_VALUE_START');
            console.log(docs[0]['Body Area']);
            console.log('BODY_AREA_VALUE_END');
        } else {
            console.log('No document found for "Abdominal Pain"');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected');
    }
}

debugAbdominalPain();
