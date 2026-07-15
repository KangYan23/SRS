const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://admin:vH7p3W54anBpzARJ@radiologyac.yqlkydq.mongodb.net/?appName=RadiologyAC";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas");
    const db = client.db("srs");
    const collection = db.collection("completed_original_clinical");

    const docs = await collection.find({}).toArray();
    console.log(`Processing ${docs.length} documents...`);

    const bulkOps = [];
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
        bulkOps.push({
          updateOne: {
            filter: { _id: doc._id },
            update: { $set: { age: normalizedAge } }
          }
        });
      }
    }

    if (bulkOps.length > 0) {
      const result = await collection.bulkWrite(bulkOps);
      console.log(`Updated ${result.modifiedCount} documents with normalized age.`);
    } else {
      console.log("No documents to update.");
    }

  } catch (err) {
    console.error("Error fixing Atlas data:", err);
  } finally {
    await client.close();
  }
}

run();
