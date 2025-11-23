const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://dltyx04_db_user:DvtVn9ExJQWDeEdx@cluster0.hjleolt.mongodb.net/clinical_advice?retryWrites=true&w=majority&appName=Cluster0";

const ConditionSchema = new mongoose.Schema({}, { strict: false, collection: 'half_updated_cardiac' });
const Condition = mongoose.model('Condition', ConditionSchema);

async function inspectFields() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        const doc = await Condition.findOne({ scenario_id: { $exists: true } }).lean();
        console.log('\n=== ALL FIELDS ===');
        console.log(JSON.stringify(doc, null, 2));

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}

inspectFields();
