import { useState, useEffect } from "react";

const Playlists = () => {
  const [playlists, setPlaylists] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/playlists")
      .then((res) => res.json())
      .then((data) => setPlaylists(data));
  }, []);

  return (
    <div>
      <h2>Playlists</h2>
      {playlists.map((playlist) => (
        <div key={playlist._id}>
          <h3>{playlist.name}</h3>
          {playlist.videos.map((video) => (
            <iframe
              key={video._id}
              width="560"
              height="315"
              src={`https://www.youtube.com/embed/${video.url.split("v=")[1]?.split("&")[0]}`}
              frameBorder="0"
              allowFullScreen
            ></iframe>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Playlists;
