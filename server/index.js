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
    origin: "https://collaborative-env.vercel.app", // frontend domain
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.send("✅ Backend is working");
});

// MongoDB connection
const URI = 'mongodb+srv://nithin20891a05e5:PWqCF5I0zjAFgIcf@cluster0.kcjk83s.mongodb.net/';
mongoose.connect(URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Use a fixed ID to ensure we're always working on the same document
const DOC_ID = "shared-doc";

io.on("connection", (socket) => {
  console.log("📥 User connected:", socket.id);

  // Send document content to the newly connected client
  Document.findById(DOC_ID).then((doc) => {
    if (doc) {
      socket.emit("document", doc.content);
    } else {
      Document.create({ _id: DOC_ID, content: "" })
        .then(() => socket.emit("document", ""))
        .catch(err => console.error("❌ Error creating document:", err));
    }
  });

  // Document content update
  socket.on("documentChange", (data) => {
    socket.broadcast.emit("document", data);

    Document.findByIdAndUpdate(
      DOC_ID,
      { content: data },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).catch((err) => {
      console.error("❌ Failed to update document:", err);
    });
  });

  // Delete document content
  socket.on("deleteDocument", () => {
    Document.findByIdAndUpdate(DOC_ID, { content: "" })
      .then(() => {
        io.emit("document", ""); // clear for all clients
      })
      .catch(err => console.error("❌ Error clearing document:", err));
  });

  socket.on("disconnect", () => {
    console.log("📤 User disconnected:", socket.id);
  });
});

server.listen(5000, () => console.log("🚀 Server running on http://localhost:5000"));
