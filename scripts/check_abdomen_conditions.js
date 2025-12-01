const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MONGODB_URI is missing from .env');
    process.exit(1);
}

async function checkConditions() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB\n');

        const collectionName = 'completed_cleaned_clinical';
        const db = mongoose.connection.db;
        const collection = db.collection(collectionName);

        // Check "Abdomen" (exact)
        console.log('=== Conditions under "Abdomen" (exact match) ===');
        const abdomenDocs = await collection.find({
            $or: [
                { "Body Area": /^Abdomen$/i },
                { "body_area": /^Abdomen$/i }
            ]
        }).toArray();
        const abdomenConditions = [...new Set(abdomenDocs.map(d => d.condition || d.Condition).filter(c => c))];
        console.log(`Found ${abdomenConditions.length} unique conditions:`);
        abdomenConditions.forEach(c => console.log(`  - ${c}`));

        // Check "Abdomen-pelvis" (exact)
        console.log('\n=== Conditions under "Abdomen-pelvis" (exact match) ===');
        const abdomenPelvisDocs = await collection.find({
            $or: [
                { "Body Area": /^Abdomen-pelvis$/i },
                { "body_area": /^Abdomen-pelvis$/i }
            ]
        }).toArray();
        const abdomenPelvisConditions = [...new Set(abdomenPelvisDocs.map(d => d.condition || d.Condition).filter(c => c))];
        console.log(`Found ${abdomenPelvisConditions.length} unique conditions:`);
        abdomenPelvisConditions.forEach(c => console.log(`  - ${c}`));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected');
    }
}

checkConditions();
