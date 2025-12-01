const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MONGODB_URI is missing from .env');
    process.exit(1);
}

async function checkSpecificConditions() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB\n');

        const collectionName = 'completed_cleaned_clinical';
        const db = mongoose.connection.db;
        const collection = db.collection(collectionName);

        // Find documents matching: Abdomen + Gastrointestinal + Adult age
        console.log('=== Searching for: Body Area="Abdomen" (exact), Panel="Gastrointestinal" ===\n');

        const docs = await collection.find({
            $or: [
                { "Body Area": /^\s*Abdomen\s*$/i },
                { "body_area": /^\s*Abdomen\s*$/i }
            ],
            $or: [
                { "panel": /^\s*Gastrointestinal\s*$/i },
                { "Panel": /^\s*Gastrointestinal\s*$/i }
            ]
        }).toArray();

        console.log(`Found ${docs.length} total documents\n`);

        // Filter by age (adult = 18+)
        const adultDocs = docs.filter(doc => {
            const ageStr = doc.age || doc.Age;
            if (!ageStr) return false;
            const matches = ageStr.match(/(\d+)/);
            if (!matches) return false;
            const startAge = parseInt(matches[1], 10);
            return startAge >= 18;
        });

        console.log(`After age filter (adult): ${adultDocs.length} documents\n`);

        // Get unique conditions
        const conditions = [...new Set(adultDocs.map(d => d.condition || d.Condition).filter(c => c))];

        console.log(`Unique conditions (${conditions.length}):`);
        conditions.forEach(c => console.log(`  - ${c}`));

        // Show details of first few docs
        console.log('\n=== Sample Document Details ===');
        adultDocs.slice(0, 3).forEach((doc, i) => {
            console.log(`\nDocument ${i + 1}:`);
            console.log(`  Body Area: "${doc['Body Area'] || doc.body_area}"`);
            console.log(`  Panel: "${doc.Panel || doc.panel}"`);
            console.log(`  Condition: "${doc.Condition || doc.condition}"`);
            console.log(`  Age: "${doc.Age || doc.age}"`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected');
    }
}

checkSpecificConditions();
