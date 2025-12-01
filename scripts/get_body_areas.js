const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MONGODB_URI is missing from .env');
    process.exit(1);
}

async function getBodyAreas() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const collectionName = 'completed_cleaned_clinical';
        const db = mongoose.connection.db;
        const collection = db.collection(collectionName);

        // Get distinct values for both fields
        const bodyAreas1 = await collection.distinct('body_area');
        const bodyAreas2 = await collection.distinct('Body Area');

        // Merge and clean
        const allAreas = new Set([...bodyAreas1, ...bodyAreas2]);
        const sortedAreas = Array.from(allAreas).filter(a => a).sort();

        const fs = require('fs');
        const content = sortedAreas.join('\n');
        fs.writeFileSync('body_areas_list.txt', content);
        console.log('Written to body_areas_list.txt');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected');
    }
}

getBodyAreas();
