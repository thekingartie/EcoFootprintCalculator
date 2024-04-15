const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
const port = 3000;

const uri =
  "mongodb+srv://alvinyeboah5:passwordformongo@useremissions.nhsfyok.mongodb.net/?retryWrites=true&w=majority&appName=UserEmissions";
const dbName = "CarbonEntries"; // Your MongoDB Atlas database name
const collectionName = "CarbonFootprints"; // Your MongoDB Atlas collection name

const client = new MongoClient(uri);

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas cluster");
  } catch (err) {
    console.error("Error connecting to MongoDB Atlas:", err);
  }
}
connectToDatabase();

app.post("/calculator", async (req, res) => {
  try {
    const energy_consumption = parseFloat(req.body.energyconsumption);
    const transportation_methods = req.body.transportationmethods;
    const distance_travelled = parseFloat(req.body.distance_travelled);
    const dietary_preferences = req.body.dietarypreferences;
    const travel_habits = req.body.travelhabits;

    const carEmissionsFactor = 0.404; // kg CO2 per mile for an average gasoline car (Source: EPA)
    const trainEmissionsFactor = 0.046; // kg CO2 per mile for an average train (Source: US DOT)
    const flightEmissionsFactor = 0.227; // kg CO2 per passenger mile for an average flight (Source: EPA)

    let emissionsByCar = 0;
    let emissionsByTrain = 0;
    let emissionsByPlane = 0;
    let emissionsByOther = 0;

    if (transportation_methods === "car") {
      emissionsByCar = carEmissionsFactor * distance_travelled;
    } else if (transportation_methods === "train") {
      emissionsByTrain = trainEmissionsFactor * distance_travelled;
    } else if (transportation_methods === "plane") {
      emissionsByPlane = flightEmissionsFactor * distance_travelled;
    }

    const totalEmissions =
      emissionsByCar + emissionsByTrain + emissionsByPlane + emissionsByOther;

    const document = {
      energy_consumption,
      transportation_methods,
      distance_travelled,
      dietary_preferences,
      travel_habits,
      totalEmissions,
    };

    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    await collection.insertOne(document);

    res.sendFile(__dirname + '/pages/recorded.html');
  } catch (err) {
    console.error("Error inserting document:", err);
    res.status(500).send("Error inserting document into database.");
  }
});

app.get("/sugprog", (req, res) => {
  res.sendFile(__dirname + "/pages/progress.html");
});

app.get("/data", async (req, res) => {
  try {
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    const data = await collection.find({}).toArray();
    res.json(data);
  } catch (err) {
    console.error("Error fetching data from MongoDB:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.put("/data/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const updatedEntry = req.body;
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    await collection.updateOne({ _id: ObjectId(id) }, { $set: updatedEntry });
    res.sendStatus(200);
  } catch (err) {
    console.error("Error updating entry:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.delete("/data/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    await collection.deleteOne({ _id: ObjectId(id) });
    res.sendStatus(200);
  } catch (err) {
    console.error("Error deleting entry:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/", (req, res) => res.sendFile(__dirname + "/pages/index.html"));
app.get("/calculator", (req, res) =>
  res.sendFile(__dirname + "/pages/footprintcaluculator.html")
);
app.get("/login", (req, res) => res.sendFile(__dirname + "/pages/login.html"));
app.get("/mitigation", (req, res) => res.sendFile(__dirname + "/pages/mitigation.html"));



app.listen(port, () => console.log(`Server is running on port ${port}`));
