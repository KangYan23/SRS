const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

const uri = "mongodb+srv://admin:vH7p3W54anBpzARJ@radiologyac.yqlkydq.mongodb.net/?appName=RadiologyAC";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas");
    const db = client.db("srs");
    const collection = db.collection("completed_original_clinical");

    // Clear existing data to avoid duplicates
    await collection.deleteMany({});
    console.log("Cleared existing data in Atlas");

    const dataPath = path.join(__dirname, '../script/clinical_advice.completed_original_clinical.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    let data = JSON.parse(rawData);

    // Transform data to remove $oid and other MongoDB extended JSON markers
    data = data.map(doc => {
      const newDoc = { ...doc };
      if (newDoc._id && newDoc._id.$oid) {
        newDoc._id = new ObjectId(newDoc._id.$oid);
      } else if (newDoc._id) {
        // If _id is already a string or something else, let it be or remove it to let Atlas generate new ones
        delete newDoc._id;
      }
      return newDoc;
    });

    const result = await collection.insertMany(data);
    console.log(`${result.insertedCount} documents were inserted into Atlas`);

  } catch (err) {
    console.error("Error seeding Atlas:", err);
  } finally {
    await client.close();
  }
}

run();
