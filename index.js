const express = require("express");
const cors = require("cors");
const app = express();
const morgan = require("morgan");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const PORT = process.env.PORT || 5000;

// ? middlewares
app.use(cors({ origin: "*" , credentials: true, methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"] }));
app.use(express.json());
app.use(morgan("dev"));

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@users.wit5elw.mongodb.net/?retryWrites=true&w=majority&appName=users`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
let gameReviewCollection;
let watchListCollection;
async function run() {
  try {
    await client.connect();
    const database = client.db(process.env.DB_NAME);
    gameReviewCollection = database.collection("gameReview");
    watchListCollection = database.collection("watchList");
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    app.get("/", (req, res) => {
      res.send("Server health is well.");
    });
    app.get("/reviews", async (req, res) => {
      try {
        if (!gameReviewCollection) {
          return res
            .status(500)
            .json({ success: false, message: "Database not connected yet." });
        }
        const result = await gameReviewCollection.find().toArray();
        res.status(200).json(result);
      } catch (error) {
        res
          .status(500)
          .send({ success: false, error: error, message: error.message });
      }
    });
    app.get("/top-rated-games", async (req, res) => {
      try {
        const result = await gameReviewCollection
          .find()
          .sort({ rating: -1 })
          .limit(6)
          .toArray();
        res.status(200).json(result);
      } catch (error) {
        res
          .status(500)
          .send({ success: false, error: error, message: error.message });
      }
    });
    app.get("/my-reviews", async (req, res) => {
      try {
        const email = req.query.email;
        const result = await gameReviewCollection
          .find({ email: email })
          .toArray();
        res.status(200).json(result);
      } catch (error) {
        res.status(500).send({ success: false, error: error.message });
      }
    });
    app.get("/watchlist/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const result = await watchListCollection.find({ gameId: id }).toArray();

        res.status(200).json(result);
      } catch (error) {
        res.status(500).send({ success: false, error: error.message });
      }
    });
    app.get("/watchlist", async (req, res) => {
      try {
        const email = req.query.email;

        const result = await watchListCollection
          .find({ userId: email })
          .toArray();

        res.status(200).json(result);
      } catch (error) {
        res.status(500).send({ success: false, error: error.message });
      }
    });
    app.put("/update-review/:id", async (req, res) => {
      try {
        const id = new ObjectId(req.params.id);

        const review = req.body;

        const filter = { _id: id };
        const options = { upsert: true };
        const updateDoc = {
          $set: review,
        };
        const result = await gameReviewCollection.updateOne(
          filter,
          updateDoc,
          options
        );

        res.status(202).json(result);
      } catch (error) {
        res.status(500).send({ success: false, error: error.message });
      }
    });
    app.post("/add-review", async (req, res) => {
      try {
        const review = req.body;
        const result = await gameReviewCollection.insertOne(review);
        res.status(201).send({ success: true, insertedId: result.insertedId });
      } catch (error) {
        res.status(500).send({ success: false, error: error.message });
      }
    });
    app.post("/add-to-watchlist", async (req, res) => {
      try {
        const review = req.body;

        const result = await watchListCollection.insertOne(review);
        res.status(201).send({ success: true, insertedId: result.insertedId });
      } catch (error) {
        res.status(500).send({ success: false, error: error.message });
      }
    });
    app.delete("/delete-review/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await gameReviewCollection.deleteOne(query);
        res.status(204).send(result);
      } catch (error) {
        res.status(500).send({ success: false, error: error.message });
      }
    });
    app.delete("/remove-from-watchlist/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { gameId: id };
        const result = await watchListCollection.deleteOne(query);
        res.status(204).send(result);
      } catch (error) {
        res.status(500).send({ success: false, error: error.message });
      }
    });
    app.listen(PORT, () =>
      console.log(`Server is running on port http://localhost:${PORT}`)
    );
  } catch (error) {
    console.log("error connecting to mongodb: ", error);
    process.exit(1);
  }
}
run().catch(console.dir);

module.exports = app;
