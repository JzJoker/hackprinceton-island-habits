import { GameWindow } from "@/components/game/GameWindow";
import { GameProvider } from "@/game/state";

const Index = () => {
  return (
    <GameProvider>
      <div className="w-screen h-screen overflow-hidden">
        <GameWindow />
      </div>
    </GameProvider>
  );
};

export default Index;
