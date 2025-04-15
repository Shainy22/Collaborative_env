// server.js (ES module compatible)
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
    origin: "https://collaborative-env.vercel.app", // Update to your frontend URL if different
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.get('/',(req,res)=>{
  res.send("Backend is working")
})
// mongoose.connect("mongodb://127.0.0.1:27017/realtime-doc", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// });
const URI='mongodb+srv://nithin20891a05e5:PWqCF5I0zjAFgIcf@cluster0.kcjk83s.mongodb.net/test';
try {
    mongoose.connect(URI
        ,{
            useNewUrlParser:true,
            useUnifiedTopology:true
        }
    )
    .then(()=>console.log("Connected to mongodb"))
    .catch((error)=>console.log(error));
} catch (error) {
    console.log(error);
}

let currentData = "";

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Initial document data on connection
  Document.findOne().then((doc) => {
    if (doc) {
      currentData = doc.content;
      socket.emit("document", doc.content);
    }
  });

  // Document change handler
  socket.on("documentChange", (data) => {
    currentData = data;
    socket.broadcast.emit("document", data); // broadcast to all clients
    Document.findOneAndUpdate({}, { content: data }, { upsert: true }).exec();
  });

  // Delete document handler
  socket.on("deleteDocument", () => {
    Document.findOneAndDelete({}).exec().then(() => {
      // Emit empty content to all clients (clear the document)
      io.emit("document", ""); // Emit empty string to clear content on all clients
    }).catch((error) => {
      console.error("Error deleting document:", error);
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(5000, () => console.log("Server running on http://localhost:5000"));
