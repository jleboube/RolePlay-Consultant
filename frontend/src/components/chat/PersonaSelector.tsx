import type { Persona } from "../../types";

interface PersonaSelectorProps {
  personas: Persona[];
  selectedPersona: string | null;
  onSelect: (name: string) => void;
  disabled?: boolean;
}

const personaIcons: Record<string, string> = {
  sr_vp_software: "VP",
  cto: "CTO",
  cio: "CIO",
  project_manager: "PM",
};

export default function PersonaSelector({
  personas,
  selectedPersona,
  onSelect,
  disabled,
}: PersonaSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
        Select Persona
      </h3>
      <div className="grid grid-cols-1 gap-3">
        {personas.map((persona) => (
          <button
            key={persona.name}
            onClick={() => onSelect(persona.name)}
            disabled={disabled}
            className={`text-left p-4 rounded-xl border-2 transition-all ${
              selectedPersona === persona.name
                ? "border-primary-500 bg-primary-50"
                : "border-gray-200 hover:border-primary-300 bg-white"
            } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                  selectedPersona === persona.name
                    ? "bg-primary-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {personaIcons[persona.name] || "AI"}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{persona.title}</p>
                <p className="text-xs text-gray-500">
                  {persona.traits.join(" · ")}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
