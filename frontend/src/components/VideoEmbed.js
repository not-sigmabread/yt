const VideoEmbed = ({ url, startTime, endTime }) => {
  const videoId = url.split("v=")[1]?.split("&")[0];

  return (
    <iframe
      width="560"
      height="315"
      src={`https://www.youtube.com/embed/${videoId}?start=${startTime}&end=${endTime}&autoplay=1`}
      frameBorder="0"
      allowFullScreen
    ></iframe>
  );
};

export default VideoEmbed;
