const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://dltyx04_db_user:DvtVn9ExJQWDeEdx@cluster0.hjleolt.mongodb.net/clinical_advice?retryWrites=true&w=majority&appName=Cluster0";

const ConditionSchema = new mongoose.Schema({}, { strict: false, collection: 'half_updated_cardiac' });
const Condition = mongoose.model('Condition', ConditionSchema);

async function testResults() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        // Find a scenario_id first
        const sampleDoc = await Condition.findOne({ scenario_id: { $exists: true } }).lean();
        console.log('\n=== Sample Document ===');
        console.log('scenario_id:', sampleDoc.scenario_id);
        console.log('procedure_name:', sampleDoc.procedure_name);
        console.log('appropriateness:', sampleDoc.appropriateness);
        console.log('adult_rrl:', sampleDoc.adult_rrl);
        console.log('peds_rrl:', sampleDoc.peds_rrl);

        // Now fetch all results for this scenario
        const results = await Condition.find({ scenario_id: sampleDoc.scenario_id }).lean();
        console.log('\n=== All Results for scenario_id:', sampleDoc.scenario_id, '===');
        console.log('Found', results.length, 'results');

        results.forEach((doc, idx) => {
            console.log(`\n[${idx + 1}]`);
            console.log('  procedure_name:', doc.procedure_name);
            console.log('  appropriateness:', doc.appropriateness);
            console.log('  adult_rrl:', doc.adult_rrl);
            console.log('  peds_rrl:', doc.peds_rrl);
        });

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}

testResults();
