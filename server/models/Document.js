import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
  content: {
    type: String,
    default: "",
  },
});

const Document = mongoose.model("Document", documentSchema);
export default Document;
