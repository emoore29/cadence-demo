interface LobbyProps {
  setGuide: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Lobby({ setGuide }: LobbyProps) {
  return (
    <div>
      <h1>Cadence</h1>
      <p>
        Create playlists by filtering your Spotify library based on musical
        features. Combine your favourite artists, genres, and tracks into one
        playlist.
      </p>
      <p>Project by Emma Moore.</p>
      <button onClick={() => setGuide(true)}>Get started</button>
    </div>
  );
}
