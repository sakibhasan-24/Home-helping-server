const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
// console.log(jwt);
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
app.use(cors({ origin: ["http://localhost:5173"], credentials: true }));
app.use(express.json());
app.use(cookieParser());
const uri = `mongodb+srv://House-services:${process.env.DB_PASSWORD}@Home-service.wlfdec9.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri);
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

    // token
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, "secret", { expiresIn: "1h" });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
        })
        .send({ success: true, token });
    });
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
      console.log("token is", req.cookies.token);
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
    app.delete("/booking/:id", async (req, res) => {
      const id = req.params.id;
      const result = await bookingCollections.deleteOne({
        _id: new ObjectId(id),
      });
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
