const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://admin:vH7p3W54anBpzARJ@radiologyac.yqlkydq.mongodb.net/?appName=RadiologyAC";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas");
    const db = client.db("srs");
    const collection = db.collection("completed_original_clinical");

    // Fix 'age' field: Map ranges to 'adult' or 'child'
    const docs = await collection.find({}).toArray();
    console.log(`Processing ${docs.length} documents...`);

    let updatedCount = 0;
    for (const doc of docs) {
      const ageStr = String(doc.age || "").trim();
      let normalizedAge = null;

      if (ageStr.includes("-")) {
        const parts = ageStr.split("-").map(s => parseInt(s.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          const [min, max] = parts;
          if (max >= 18) normalizedAge = 'adult';
          else if (min < 18) normalizedAge = 'child';
        }
      }

      if (normalizedAge) {
        await collection.updateOne(
          { _id: doc._id },
          { $set: { age: normalizedAge } }
        );
        updatedCount++;
      }
    }

    console.log(`Updated ${updatedCount} documents with normalized age.`);

  } catch (err) {
    console.error("Error fixing Atlas data:", err);
  } finally {
    await client.close();
  }
}

run();
