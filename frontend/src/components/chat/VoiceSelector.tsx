import { OPENAI_VOICES } from "../../hooks/useSpeechSynthesis";

interface VoiceSelectorProps {
  selectedVoice: string;
  onSelect: (name: string) => void;
  disabled?: boolean;
}

export default function VoiceSelector({
  selectedVoice,
  onSelect,
  disabled,
}: VoiceSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
        AI Voice
      </label>
      <select
        value={selectedVoice || "nova"}
        onChange={(e) => onSelect(e.target.value)}
        disabled={disabled}
        className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
      >
        {OPENAI_VOICES.map((voice) => (
          <option key={voice.id} value={voice.id}>
            {voice.name} - {voice.description}
          </option>
        ))}
      </select>
    </div>
  );
}
