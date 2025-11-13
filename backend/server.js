import express from "express";
import mongoose from "mongoose";
import cors from "cors";

const app = express();
app.use(cors());

// Connect to MongoDB (optional, just logs connection)
mongoose
  .connect("mongodb://mongo:27017/helloworld")
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

// Simple API route
app.get("/api/message", (req, res) => {
  res.json({ message: "Hello World from the MERN Stack!!!!!!!!!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
