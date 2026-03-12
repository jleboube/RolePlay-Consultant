import { useState, useEffect, useCallback } from "react";
import { adminApi, PersonaDetail, PersonaCreateUpdate } from "../../services/adminApi";

type View = "list" | "create" | "edit" | "history";

export default function PersonasTab() {
  const [personas, setPersonas] = useState<PersonaDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<View>("list");
  const [selectedPersona, setSelectedPersona] = useState<PersonaDetail | null>(null);
  const [versionHistory, setVersionHistory] = useState<PersonaDetail[]>([]);

  const loadPersonas = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminApi.getPersonas();
      setPersonas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load personas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPersonas();
  }, [loadPersonas]);

  const handleViewHistory = async (name: string) => {
    try {
      const versions = await adminApi.getPersonaVersions(name);
      setVersionHistory(versions);
      setView("history");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load version history.");
    }
  };

  const handleEdit = (persona: PersonaDetail) => {
    setSelectedPersona(persona);
    setView("edit");
  };

  const handleDeactivate = async (name: string) => {
    if (!confirm(`Deactivate persona "${name}"? It will no longer be available for role-playing.`)) return;
    try {
      await adminApi.deactivatePersona(name);
      await loadPersonas();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deactivate persona.");
    }
  };

  const handleSaved = async () => {
    setView("list");
    setSelectedPersona(null);
    await loadPersonas();
  };

  if (loading) return <p className="text-gray-500">Loading personas...</p>;

  if (view === "create") {
    return <PersonaForm onSave={handleSaved} onCancel={() => setView("list")} />;
  }

  if (view === "edit" && selectedPersona) {
    return (
      <PersonaForm
        existing={selectedPersona}
        onSave={handleSaved}
        onCancel={() => { setView("list"); setSelectedPersona(null); }}
      />
    );
  }

  if (view === "history") {
    return (
      <VersionHistory
        versions={versionHistory}
        onBack={() => setView("list")}
        onRestore={async (v) => {
          try {
            await adminApi.updatePersona(v.name, {
              title: v.title,
              description: v.description,
              traits: v.traits,
              system_prompt: v.system_prompt,
            });
            setView("list");
            await loadPersonas();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to restore version.");
          }
        }}
      />
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
          <button onClick={() => setError("")} className="ml-2 font-medium underline">Dismiss</button>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Personas</h2>
        <button
          onClick={() => setView("create")}
          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
        >
          Create Persona
        </button>
      </div>

      <div className="space-y-4">
        {personas.length === 0 ? (
          <p className="text-gray-500">No personas found.</p>
        ) : (
          personas.map((p) => (
            <div key={p.name} className="bg-white rounded-lg shadow p-5">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{p.title}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{p.name}</span>
                    {" "}· v{p.version}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">{p.description}</p>
                  {p.traits.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {p.traits.map((trait) => (
                        <span key={trait} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                          {trait}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0 ml-4">
                  <button
                    onClick={() => handleViewHistory(p.name)}
                    className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 border rounded"
                  >
                    History
                  </button>
                  <button
                    onClick={() => handleEdit(p)}
                    className="text-xs text-primary-600 hover:text-primary-800 px-2 py-1 border border-primary-200 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeactivate(p.name)}
                    className="text-xs text-red-600 hover:text-red-800 px-2 py-1 border border-red-200 rounded"
                  >
                    Deactivate
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function PersonaForm({
  existing,
  onSave,
  onCancel,
}: {
  existing?: PersonaDetail;
  onSave: () => void;
  onCancel: () => void;
}) {
  const isEdit = !!existing;
  const [name, setName] = useState(existing?.name || "");
  const [title, setTitle] = useState(existing?.title || "");
  const [description, setDescription] = useState(existing?.description || "");
  const [traitsText, setTraitsText] = useState(existing?.traits.join(", ") || "");
  const [systemPrompt, setSystemPrompt] = useState(existing?.system_prompt || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const traits = traitsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const data: PersonaCreateUpdate = {
      title,
      description,
      traits,
      system_prompt: systemPrompt,
    };

    if (!isEdit) {
      data.name = name.trim().toLowerCase().replace(/\s+/g, "_");
    }

    try {
      setSaving(true);
      if (isEdit) {
        await adminApi.updatePersona(existing!.name, data);
      } else {
        await adminApi.createPersona(data);
      }
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save persona.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-700">
          &larr; Back
        </button>
        <h2 className="text-lg font-semibold text-gray-900">
          {isEdit ? `Edit: ${existing!.title} (creates v${existing!.version + 1})` : "Create New Persona"}
        </h2>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        {!isEdit && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name (identifier)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. cfo"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="text-xs text-gray-400 mt-1">Lowercase, underscores allowed. Cannot be changed after creation.</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Chief Financial Officer"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the persona"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Traits (comma-separated)</label>
          <input
            type="text"
            value={traitsText}
            onChange={(e) => setTraitsText(e.target.value)}
            placeholder="e.g. analytical, budget-focused, risk-averse"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">System Prompt</label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            required
            rows={16}
            placeholder="You are a... (full persona instructions for the AI)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : isEdit ? `Save as v${existing!.version + 1}` : "Create Persona"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 text-gray-600 text-sm border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function VersionHistory({
  versions,
  onBack,
  onRestore,
}: {
  versions: PersonaDetail[];
  onBack: () => void;
  onRestore: (v: PersonaDetail) => void;
}) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (versions.length === 0) return <p className="text-gray-500">No versions found.</p>;

  const personaName = versions[0].title;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700">
          &larr; Back
        </button>
        <h2 className="text-lg font-semibold text-gray-900">Version History: {personaName}</h2>
      </div>

      <div className="space-y-3">
        {versions.map((v, idx) => (
          <div key={v.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm font-semibold text-gray-900">v{v.version}</span>
                {idx === 0 && (
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    Current
                  </span>
                )}
                <span className="ml-3 text-xs text-gray-400">
                  {v.created_at ? new Date(v.created_at).toLocaleString() : ""}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}
                  className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 border rounded"
                >
                  {expandedId === v.id ? "Collapse" : "View"}
                </button>
                {idx !== 0 && (
                  <button
                    onClick={() => {
                      if (confirm(`Restore v${v.version} as a new version?`)) onRestore(v);
                    }}
                    className="text-xs text-primary-600 hover:text-primary-800 px-2 py-1 border border-primary-200 rounded"
                  >
                    Restore
                  </button>
                )}
              </div>
            </div>

            {expandedId === v.id && (
              <div className="mt-3 border-t pt-3">
                <p className="text-sm text-gray-700 mb-1"><strong>Title:</strong> {v.title}</p>
                <p className="text-sm text-gray-700 mb-1"><strong>Description:</strong> {v.description}</p>
                <p className="text-sm text-gray-700 mb-2"><strong>Traits:</strong> {v.traits.join(", ")}</p>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">System Prompt:</p>
                  <pre className="text-xs bg-gray-50 p-3 rounded border overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto">
                    {v.system_prompt}
                  </pre>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
