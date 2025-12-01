const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MONGODB_URI is missing from .env');
    process.exit(1);
}

async function checkAbdomenOnly() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB\n');

        const collectionName = 'completed_cleaned_clinical';
        const db = mongoose.connection.db;
        const collection = db.collection(collectionName);

        // Find EXACT "Abdomen" (not "Abdomen-pelvis")
        const docs = await collection.find({
            $or: [
                { "Body Area": /^\s*Abdomen\s*$/i },
                { "body_area": /^\s*Abdomen\s*$/i }
            ]
        }).toArray();

        let output = `Total documents with Body Area = "Abdomen" (exact): ${docs.length}\n\n`;

        // Group by panel
        const byPanel = {};
        docs.forEach(doc => {
            const panel = doc.panel || doc.Panel || 'NO_PANEL';
            if (!byPanel[panel]) byPanel[panel] = [];
            byPanel[panel].push(doc);
        });

        // Show conditions for each panel
        Object.keys(byPanel).sort().forEach(panel => {
            const panelDocs = byPanel[panel];
            const conditions = [...new Set(panelDocs.map(d => d.condition || d.Condition).filter(c => c))];

            output += `Panel: "${panel}"\n`;
            output += `  Documents: ${panelDocs.length}\n`;
            output += `  Conditions (${conditions.length}):\n`;
            conditions.forEach(c => output += `    - ${c}\n`);
            output += '\n';
        });

        fs.writeFileSync('abdomen_exact_results.txt', output);
        console.log(output);
        console.log('Results written to abdomen_exact_results.txt');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected');
    }
}

checkAbdomenOnly();
