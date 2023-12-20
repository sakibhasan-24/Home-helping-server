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
// app.use(
//   cors({
//     origin: [
//       "https://book-swap-64d94.web.app",
//       "https://book-swap-64d94.firebaseapp.com",
//     ],
//     credentials: true,
//   })
// );
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

// vereify token
const vereifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  console.log("cookies ", token);
  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }
  jwt.verify(token, "secret", (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized!" });
    }

    req.user = decoded;
    next();
  });
};

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
      const token = jwt.sign(user, "secret");

      console.log(token);
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
      //   console.log(services);
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
      //   console.log(result);
      res.send(result);
    });
    app.get("/bookings", vereifyToken, async (req, res) => {
      let query = {};
      //   console.log("token from verrify", req.user);
      //   console.log(req.query.email);
      const size = parseInt(req.query.size);
      const page = parseInt(req.query.page);

      console.log(page * size);
      console.log(req.query);
      if (req.query.email) {
        query = { email: req.query.email };
      }
      if (req.user?.email !== req.query.email) {
        // console.log("not valid");
        // console.log(req.user?.email + " user email");
        // console.log(req.query.email + " user query email");
        return res.send("you are not allowed to see this");
      }
      const result = await bookingCollections
        .find(query)

        .skip(page * size)
        .limit(size)
        .toArray();
      const count = await bookingCollections.countDocuments(query);
      console.log(count);
      res.send(result);
    });
    // single booking
    app.get("/bookings/:id", async (req, res) => {
      // console.log(req.params.id);
      const result = await bookingCollections.findOne({
        _id: new ObjectId(req.params.id),
      });

      // console.log(result);
      res.send(result);
    });
    app.post("/jwtlogout", async (req, res) => {
      res.clearCookie("token");
    });
    // booking create
    app.post("/booking", async (req, res) => {
      const data = req.body;

      const result = await bookingCollections.insertOne(data);
      //   console.log(result);
      res.send(result);
    });
    app.put("/booking/update/:id", async (req, res) => {
      const id = { _id: new ObjectId(req.params.id) };
      const data = req.body;
      console.log("data", data);
      const options = { upsert: true };
      const updateInfo = {
        $set: {
          customerName: data.name,
          phone: data.phone,
          address: data.address,
          detail: data.detail,
          date: data.date,
        },
      };

      console.log(updateInfo);
      // console.log("updated Info", updateInfo);
      const result = await bookingCollections.updateOne(
        id,
        updateInfo,
        options
      );

      // console.log(result);
      res.send(result);
    });
    app.delete("/booking/:id", async (req, res) => {
      const id = req.params.id;
      const result = await bookingCollections.deleteOne({
        _id: new ObjectId(id),
      });
      //   console.log(result);
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
