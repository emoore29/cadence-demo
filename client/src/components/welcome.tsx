import { useState } from "react";
import Lobby from "./lobby";
import Guide from "./guide";

interface WelcomeProps {
  setWelcome: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Welcome({ setWelcome }: WelcomeProps) {
  const [guide, setGuide] = useState<boolean>(false);

  return (
    <div>
      {!guide ? (
        <Lobby setGuide={setGuide} />
      ) : (
        <Guide setGuide={setGuide} setWelcome={setWelcome} />
      )}
    </div>
  );
}
