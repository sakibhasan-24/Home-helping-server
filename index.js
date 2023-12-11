const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://House-services:${process.env.DB_PASSWORD}@Home-service.wlfdec9.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  const homeServiceCollections = client
    .db("Home-Services")
    .collection("ServicesCollections");
  const bookingCollections = client
    .db("Home-Services")
    .collection("BookingCollections");

  try {
    await client.connect();
    app.get("/services", async (req, res) => {
      const cursor = homeServiceCollections.find();
      const services = await cursor.toArray();

      res.send(services);
    });
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = {
        projection: {
          title: 1,
          image: 1,
          description: 1,
          facilities: 1,
          cost: 1,
          offer: 1,
        },
      };
      const result = await homeServiceCollections.findOne(filter, options);
      console.log(result);
      res.send(result);
    });
    app.get("/bookings", async (req, res) => {
      let query = {};
      if (req.query.email) {
        query = { email: req.query.email };
      }
      const result = await bookingCollections.find(query).toArray();
      res.send(result);
    });
    // booking create
    app.post("/booking", async (req, res) => {
      const data = req.body;
      const result = await bookingCollections.insertOne(data);
      console.log(result);
      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.get("/", (req, res) => res.send("Hello World!"));
app.listen(port, () =>
  console.log(`Example on   app listening on port ${port}!`)
);
