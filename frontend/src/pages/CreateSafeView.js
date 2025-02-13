import { useState } from "react";

const CreateSafeView = () => {
  const [url, setUrl] = useState("");
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);

  const handleSubmit = async () => {
    await fetch("http://localhost:5000/api/videos/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, startTime, endTime }),
    });
  };

  return (
    <div>
      <h2>Create SafeView</h2>
      <input type="text" placeholder="Video URL" onChange={(e) => setUrl(e.target.value)} />
      <input type="number" placeholder="Start Time" onChange={(e) => setStartTime(e.target.value)} />
      <input type="number" placeholder="End Time" onChange={(e) => setEndTime(e.target.value)} />
      <button onClick={handleSubmit}>Create</button>
    </div>
  );
};

export default CreateSafeView;
  
