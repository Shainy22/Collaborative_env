import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import "./App.css";

const socket = io("https://collaborative-env-l5m2.vercel.app");
const CLEAR_PASSWORD = import.meta.env.VITE_CLEAR_PASSWORD;

function App() {
  const [content, setContent] = useState("");
  const [feedback, setFeedback] = useState("");
  const textRef = useRef();

  useEffect(() => {
    socket.on("document", (data) => {
      setContent(data);
    });

    return () => {
      socket.off("document");
    };
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    setContent(value);
    socket.emit("documentChange", value);
  };

  const handleClear = () => {
    const enteredPassword = prompt("Enter password to clear the document:");
    if (enteredPassword === CLEAR_PASSWORD) {
      socket.emit("deleteDocument");
      setFeedback("✅ Document deleted.");
    } else {
      setFeedback("❌ Incorrect password. Document not deleted.");
    }

    setTimeout(() => setFeedback(""), 3000);
  };

  return (
    <div className="App">
      <h1>📝 Real-Time Collaborative Editor</h1>
      <div className="editor-container">
        <textarea
          ref={textRef}
          value={content}
          onChange={handleChange}
          rows={20}
        />
        <div className="button-row">
          <button onClick={handleClear}>Clear Document</button>
          {feedback && <p className="feedback">{feedback}</p>}
        </div>
      </div>
    </div>
  );
}

export default App;
