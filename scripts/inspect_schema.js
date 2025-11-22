const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://dltyx04_db_user:DvtVn9ExJQWDeEdx@cluster0.hjleolt.mongodb.net/clinical_advice?retryWrites=true&w=majority&appName=Cluster0";

const ConditionSchema = new mongoose.Schema({}, { strict: false, collection: 'half_updated_cardiac' });
const Condition = mongoose.model('Condition', ConditionSchema);

async function inspect() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        const doc = await Condition.findOne({ scenario_id: { $exists: true } }).lean();
        if (doc) {
            console.log('Document Keys:', Object.keys(doc));
            console.log('Sample Document:', JSON.stringify(doc, null, 2));
        } else {
            console.log('No document found with scenario_id');
            const anyDoc = await Condition.findOne().lean();
            console.log('Any Document:', JSON.stringify(anyDoc, null, 2));
        }

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}

inspect();
