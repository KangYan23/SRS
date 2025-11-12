import { AIChatInput } from "@/components/ui/ai-chat-input";
import { GooeyText } from "@/components/ui/gooey-text-morphing";
import { BackgroundPaths } from "@/components/ui/background-paths";

const ChatbotUI = () => {
  return (
    <BackgroundPaths>
      <div className="h-[200px] flex items-end justify-center pb-8">
        <GooeyText
          texts={["Hi", "Welcome", "to",  "Smart", "Referral", "System"]}
          morphTime={1}
          cooldownTime={0.25}
          className="font-bold text-4xl"
        />
      </div>
      <AIChatInput />
    </BackgroundPaths>
  );
};

export default ChatbotUI;
