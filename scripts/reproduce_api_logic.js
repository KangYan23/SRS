const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MONGODB_URI is missing from .env');
    process.exit(1);
}

async function reproduceApi() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const collectionName = 'completed_cleaned_clinical';
        const db = mongoose.connection.db;
        const collection = db.collection(collectionName);

        // Mock request parameters
        const ageGroup = 'adult';
        const bodyArea = 'abdomen'; // lowercase as per API logic
        const panel = 'Gastrointestinal';

        console.log(`Testing with: ageGroup=${ageGroup}, bodyArea=${bodyArea}, panel=${panel}`);

        // 1. Build initial query for Body Area
        const query = {};
        if (bodyArea) {
            const regex = new RegExp(`^${bodyArea}$`, 'i');
            query.$or = [
                { body_area: { $regex: regex } },
                { "Body Area": { $regex: regex } }
            ];
        }

        // 2. Fetch all matching documents
        const allConditions = await collection.find(query).toArray();
        console.log(`Found ${allConditions.length} documents for bodyArea ${bodyArea}`);

        // 3. Filter by Age Group
        const filteredConditions = allConditions.filter(doc => {
            if (!ageGroup) return true;

            const ageStr = doc.age || doc.Age;
            if (!ageStr || typeof ageStr !== 'string') {
                console.log(`Skipping doc ${doc._id}: Missing or invalid age string:`, ageStr);
                return false;
            }

            // New Regex Logic
            const matches = ageStr.match(/(\d+)/);
            if (!matches) {
                console.log(`Skipping doc ${doc._id}: Age regex mismatch:`, ageStr);
                return false;
            }

            const startAge = parseInt(matches[1], 10);
            // console.log(`Doc ${doc._id}: Age "${ageStr}" -> startAge ${startAge}`);

            if (ageGroup === 'adult') {
                return startAge >= 18;
            } else if (ageGroup === 'child') {
                return startAge < 18;
            }
            return true;
        });

        console.log(`Filtered to ${filteredConditions.length} documents after age check`);

        // 4. Filter by Panel
        let finalList = filteredConditions;
        if (panel) {
            finalList = finalList.filter(c => c.panel === panel || c.Panel === panel);
        }
        console.log(`Filtered to ${finalList.length} documents after panel check`);

        // 5. Deduplicate Conditions
        const uniqueConditions = [];
        const seen = new Set();

        for (const c of finalList) {
            const conditionName = c.condition || c.Condition;
            if (!conditionName) continue;

            if (!seen.has(conditionName)) {
                seen.add(conditionName);
                uniqueConditions.push({
                    condition: conditionName,
                    severity: c.severity || c.Severity
                });
            }
        }

        console.log('Unique Conditions:', JSON.stringify(uniqueConditions, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
}

reproduceApi();
