import { GooeyText } from "@/components/ui/gooey-text-morphing";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { StartChatButton } from "@/components/ui/startchat-button";

const Chatbot2UI = () => {
  return (
    <BackgroundPaths>
      <div className="h-[300px] flex flex-col items-center justify-start gap-30">
        <GooeyText
          texts={["Hi", "Welcome", "to",  "Smart", "Referral", "System"]}
          morphTime={1}
          cooldownTime={0.25}
          className="font-bold text-4xl"
        />
        <div className="flex flex-col items-center gap-20">
          <p className="font-semibold text-5xl tracking-wide text-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">How's your patient today?</p>
          <StartChatButton />
        </div>
      </div>
    </BackgroundPaths>
    
  );
};

export default Chatbot2UI;
