interface VoiceSelectorProps {
  voices: SpeechSynthesisVoice[];
  selectedVoice: string;
  onSelect: (name: string) => void;
  disabled?: boolean;
}

export default function VoiceSelector({
  voices,
  selectedVoice,
  onSelect,
  disabled,
}: VoiceSelectorProps) {
  const englishVoices = voices.filter((v) => v.lang.startsWith("en"));

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
        AI Voice
      </label>
      <select
        value={selectedVoice}
        onChange={(e) => onSelect(e.target.value)}
        disabled={disabled || englishVoices.length === 0}
        className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
      >
        {englishVoices.length === 0 ? (
          <option>Default Voice</option>
        ) : (
          englishVoices.map((voice) => (
            <option key={voice.name} value={voice.name}>
              {voice.name} ({voice.lang})
            </option>
          ))
        )}
      </select>
    </div>
  );
}
