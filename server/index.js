import express from "express";
import http from "http";
import mongoose from "mongoose";
import cors from "cors";
import { Server } from "socket.io";
import Document from "./models/Document.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://collaborative-env.vercel.app",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("✅ Backend is running");
});

// MongoDB connect...
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("MongoDB connected"))
.catch((err) => console.error(err));

// Socket.io logic
let currentData = "";

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  Document.findOne().then((doc) => {
    if (doc) {
      socket.emit("document", doc.content);
    }
  });

  socket.on("documentChange", (data) => {
    socket.broadcast.emit("document", data);
    Document.findOneAndUpdate({}, { content: data }, { upsert: true }).exec();
  });

  socket.on("deleteDocument", () => {
    Document.findOneAndDelete({}).exec().then(() => {
      io.emit("document", "");
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
