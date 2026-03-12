import { useState, useEffect } from "react";
import { adminApi, type OneDriveFolder } from "../../services/adminApi";

export default function OneDriveTab() {
  const [folders, setFolders] = useState<OneDriveFolder[]>([]);
  const [newPath, setNewPath] = useState("");
  const [newPersona, setNewPersona] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const loadFolders = () => {
    adminApi.getOneDriveFolders().then(setFolders).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(loadFolders, []);

  const handleConnect = async () => {
    try {
      const { auth_url } = await adminApi.getOneDriveConnectUrl();
      window.open(auth_url, "_blank", "width=600,height=700");
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "Failed to start connection.");
    }
  };

  const handleAddFolder = async () => {
    if (!newPath.trim()) return;
    setMessage("");
    try {
      await adminApi.addOneDriveFolder({
        folder_path: newPath.trim(),
        persona: newPersona || undefined,
      });
      setNewPath("");
      setNewPersona("");
      loadFolders();
      setMessage("Folder added.");
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "Failed to add folder.");
    }
  };

  const handleSync = async (id: number) => {
    setSyncing(id);
    setMessage("");
    try {
      await adminApi.syncOneDriveFolder(id);
      setMessage("Folder synced successfully.");
      loadFolders();
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "Sync failed.");
    } finally {
      setSyncing(null);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await adminApi.deleteOneDriveFolder(id);
      loadFolders();
    } catch {
      setMessage("Failed to delete folder.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">OneDrive Integration</h3>
          <p className="text-sm text-gray-500">
            Connect OneDrive folders to augment persona conversations with organizational data.
          </p>
        </div>
        <button
          onClick={handleConnect}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Connect OneDrive
        </button>
      </div>

      {message && (
        <p className={`text-sm ${message.includes("success") || message === "Folder added." ? "text-green-600" : "text-red-600"}`}>
          {message}
        </p>
      )}

      {/* Add folder form */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Add Folder</h4>
        <div className="flex gap-3 flex-wrap">
          <input
            type="text"
            value={newPath}
            onChange={(e) => setNewPath(e.target.value)}
            placeholder="OneDrive path (e.g., /Documents/Training)"
            className="flex-1 min-w-[200px] p-2 border border-gray-300 rounded-lg text-sm"
          />
          <select
            value={newPersona}
            onChange={(e) => setNewPersona(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Personas</option>
            <option value="sr_vp_software">Sr VP Software</option>
            <option value="cto">CTO</option>
            <option value="cio">CIO</option>
            <option value="project_manager">Project Manager</option>
          </select>
          <button
            onClick={handleAddFolder}
            disabled={!newPath.trim()}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-800"
          >
            Add
          </button>
        </div>
      </div>

      {/* Folders list */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : folders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No folders configured. Add one above.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Path</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Persona</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Last Synced</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {folders.map((f) => (
                <tr key={f.id}>
                  <td className="px-4 py-3 font-mono text-xs">{f.folder_path}</td>
                  <td className="px-4 py-3 capitalize">{f.persona ? f.persona.replace(/_/g, " ") : "All"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      f.sync_status === "synced" ? "bg-green-100 text-green-800" :
                      f.sync_status === "error" ? "bg-red-100 text-red-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {f.sync_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {f.last_synced_at ? new Date(f.last_synced_at).toLocaleString() : "Never"}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => handleSync(f.id)}
                      disabled={syncing === f.id}
                      className="text-primary-600 hover:text-primary-800 text-xs font-medium disabled:opacity-50"
                    >
                      {syncing === f.id ? "Syncing..." : "Sync"}
                    </button>
                    <button
                      onClick={() => handleDelete(f.id)}
                      className="text-red-600 hover:text-red-800 text-xs font-medium"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
