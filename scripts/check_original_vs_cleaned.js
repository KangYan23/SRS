const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function checkCollections() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB\n');

        const db = mongoose.connection.db;
        
        // Check original collection
        console.log('=== ORIGINAL COLLECTION (completed_original_clinical) ===');
        const originalCollection = db.collection('completed_original_clinical');
        const originalDoc = await originalCollection.findOne({
            $or: [
                { "Body Area": /^\s*Abdomen\s*$/i },
                { "body_area": /^\s*Abdomen\s*$/i }
            ],
            $or: [
                { "panel": /^\s*Gastrointestinal\s*$/i },
                { "Panel": /^\s*Gastrointestinal\s*$/i }
            ]
        });
        
        if (originalDoc) {
            console.log('Sample original document condition:', originalDoc.condition || originalDoc.Condition);
            console.log('Original doc keys:', Object.keys(originalDoc));
        } else {
            console.log('No matching documents found in original collection');
        }

        // Check cleaned collection
        console.log('\n=== CLEANED COLLECTION (completed_cleaned_clinical) ===');
        const cleanedCollection = db.collection('completed_cleaned_clinical');
        const cleanedDoc = await cleanedCollection.findOne({
            $or: [
                { "Body Area": /^\s*Abdomen\s*$/i },
                { "body_area": /^\s*Abdomen\s*$/i }
            ],
            $or: [
                { "panel": /^\s*Gastrointestinal\s*$/i },
                { "Panel": /^\s*Gastrointestinal\s*$/i }
            ]
        });
        
        if (cleanedDoc) {
            console.log('Sample cleaned document condition:', cleanedDoc.condition || cleanedDoc.Condition);
            console.log('Cleaned doc keys:', Object.keys(cleanedDoc));
        } else {
            console.log('No matching documents found in cleaned collection');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected');
    }
}

checkCollections();