const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

// Use the same schema as your API
const ConditionSchema = new mongoose.Schema({
    panel: { type: String, required: true },
    condition: { type: String, required: true },
    body_area: { type: String, required: true },
    age: { type: String, required: true },
}, {
    strict: false,
    collection: 'completed_original_clinical' // Same as your current model
});

const Condition = mongoose.model('TestCondition', ConditionSchema);

async function simulateAPI() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB\n');

        // Simulate the exact API call: abdomen + adult + gastrointestinal panel
        const ageGroup = 'adult';
        const bodyArea = 'abdomen';
        const panel = 'Gastrointestinal';

        console.log('=== SIMULATING API CALL ===');
        console.log('Parameters:', { ageGroup, bodyArea, panel });

        // Step 1: Build query like the API
        const query = {};
        if (bodyArea) {
            const regex = new RegExp(`^\\s*${bodyArea}\\s*$`, 'i');
            query.$or = [
                { body_area: { $regex: regex } },
                { "Body Area": { $regex: regex } }
            ];
        }

        console.log('Mongo Query:', JSON.stringify(query));

        // Step 2: Fetch all matching documents
        const allConditions = await Condition.find(query).lean();
        console.log(`Found ${allConditions.length} documents for bodyArea ${bodyArea}`);

        // Step 3: Filter by age
        const filteredConditions = allConditions.filter(doc => {
            const ageStr = doc.age || doc.Age;
            if (!ageStr || typeof ageStr !== 'string') return false;

            const matches = ageStr.match(/(\d+)/);
            if (!matches) return false;

            const startAge = parseInt(matches[1], 10);
            return startAge >= 18; // adult filter
        });

        console.log(`Filtered to ${filteredConditions.length} documents after age check`);

        // Step 4: Filter by panel (conditions endpoint)
        let finalList = filteredConditions;
        if (panel) {
            const normalizedPanel = panel.trim().toLowerCase();
            console.log(`Filtering by panel: "${panel}" (normalized: "${normalizedPanel}")`);
            finalList = finalList.filter(c => {
                const p = c.panel || c.Panel;
                const matches = p && p.trim().toLowerCase() === normalizedPanel;
                if (!matches && p) {
                    console.log(`  Skipping doc with panel: "${p}" (normalized: "${p.trim().toLowerCase()}")`);
                }
                return matches;
            });
            console.log(`After panel filter: ${finalList.length} documents`);
        }

        // Step 5: Extract unique conditions
        const uniqueConditions = [];
        const seen = new Set();

        for (const c of finalList) {
            const conditionName = c.condition || c.Condition;
            if (conditionName && !seen.has(conditionName)) {
                seen.add(conditionName);
                uniqueConditions.push({
                    condition: conditionName,
                    severity: c.severity || c.Severity
                });
            }
        }

        console.log(`\nFINAL RESULT: ${uniqueConditions.length} unique conditions`);
        console.log('Conditions:', JSON.stringify(uniqueConditions, null, 2));

        // Let's also check what panels are available
        console.log('\n=== CHECKING PANELS ===');
        const panels = [...new Set(filteredConditions.map(c => c.panel || c.Panel))].filter(Boolean).sort();
        console.log('Available panels:', panels);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected');
    }
}

simulateAPI();