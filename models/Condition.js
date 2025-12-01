import mongoose from 'mongoose';

const ConditionSchema = new mongoose.Schema({
    panel: {
        type: String,
        required: true,
    },
    condition: {
        type: String,
        required: true,
    },
    body_area: {
        type: String,
        required: true,
    },
    age: {
        type: String,
        required: true,
    },
    // Allow other fields
}, {
    strict: false,
    collection: 'completed_original_clinical' // Explicitly target the collection from the screenshot
});

export default mongoose.models.Condition || mongoose.model('Condition', ConditionSchema);
