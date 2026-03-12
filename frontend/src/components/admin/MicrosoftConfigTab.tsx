import { useState, useEffect } from "react";
import { adminApi, type MicrosoftConfig } from "../../services/adminApi";

export default function MicrosoftConfigTab() {
  const [config, setConfig] = useState<MicrosoftConfig | null>(null);
  const [clientId, setClientId] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    adminApi.getMicrosoftConfig().then((c) => {
      setConfig(c);
      setClientId(c.client_id || "");
      setTenantId(c.tenant_id || "");
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const payload: Record<string, string> = {};
      if (clientId) payload.client_id = clientId;
      if (tenantId) payload.tenant_id = tenantId;
      if (clientSecret) payload.client_secret = clientSecret;

      await adminApi.saveMicrosoftConfig(payload);
      setMessage("Configuration saved successfully.");
      setClientSecret("");

      const updated = await adminApi.getMicrosoftConfig();
      setConfig(updated);
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Microsoft OAuth Configuration</h3>
        <p className="text-sm text-gray-500">
          Configure Microsoft Azure AD credentials to enable "Sign in with Microsoft" for users.
          Create an app registration in the{" "}
          <a
            href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 underline"
          >
            Azure Portal
          </a>.
        </p>
      </div>

      {config && (
        <div className={`p-3 rounded-lg text-sm ${config.is_configured ? "bg-green-50 text-green-800" : "bg-yellow-50 text-yellow-800"}`}>
          {config.is_configured
            ? "Microsoft auth is configured. Users can sign in with Microsoft."
            : "Microsoft auth is not yet configured. Fill in all fields below."}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Application (Client) ID</label>
          <input
            type="text"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Directory (Tenant) ID</label>
          <input
            type="text"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Client Secret {config?.has_secret && <span className="text-green-600">(already set)</span>}
          </label>
          <input
            type="password"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            placeholder={config?.has_secret ? "Leave blank to keep current" : "Enter client secret"}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Redirect URI (add this in Azure)</label>
          <code className="block p-2.5 bg-gray-100 rounded-lg text-sm text-gray-700 select-all">
            {`https://${window.location.hostname}/api/auth/callback/microsoft`}
          </code>
        </div>
      </div>

      {message && (
        <p className={`text-sm ${message.includes("success") ? "text-green-600" : "text-red-600"}`}>{message}</p>
      )}

      <button
        onClick={handleSave}
        disabled={saving || (!clientId && !tenantId && !clientSecret)}
        className="bg-primary-600 text-white px-6 py-2.5 rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Configuration"}
      </button>
    </div>
  );
}
