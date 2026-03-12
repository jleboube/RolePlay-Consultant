import logging
from urllib.parse import urlencode

import requests

logger = logging.getLogger(__name__)


class OneDriveService:
    """Wraps Microsoft Graph API calls for OneDrive file access."""

    GRAPH_BASE = "https://graph.microsoft.com/v1.0"

    def __init__(self, client_id, client_secret, tenant_id, access_token, refresh_token=None):
        self.client_id = client_id
        self.client_secret = client_secret
        self.tenant_id = tenant_id
        self.access_token = access_token
        self.refresh_token = refresh_token

    @staticmethod
    def get_auth_url(client_id, tenant_id, redirect_uri):
        params = {
            "client_id": client_id,
            "response_type": "code",
            "redirect_uri": redirect_uri,
            "scope": "Files.Read.All offline_access",
            "response_mode": "query",
        }
        return f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/authorize?{urlencode(params)}"

    @staticmethod
    def exchange_code(client_id, client_secret, tenant_id, redirect_uri, code):
        token_url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"
        data = {
            "client_id": client_id,
            "client_secret": client_secret,
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
            "scope": "Files.Read.All offline_access",
        }
        resp = requests.post(token_url, data=data, timeout=30)
        resp.raise_for_status()
        return resp.json()

    def _refresh_access_token(self):
        if not self.refresh_token:
            raise RuntimeError("No refresh token available. Please reconnect OneDrive.")

        token_url = f"https://login.microsoftonline.com/{self.tenant_id}/oauth2/v2.0/token"
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "grant_type": "refresh_token",
            "refresh_token": self.refresh_token,
            "scope": "Files.Read.All offline_access",
        }
        resp = requests.post(token_url, data=data, timeout=30)
        resp.raise_for_status()
        tokens = resp.json()
        self.access_token = tokens["access_token"]
        if "refresh_token" in tokens:
            self.refresh_token = tokens["refresh_token"]

    def _headers(self):
        return {"Authorization": f"Bearer {self.access_token}"}

    def _request(self, url, retry=True):
        resp = requests.get(url, headers=self._headers(), timeout=30)
        if resp.status_code == 401 and retry:
            self._refresh_access_token()
            resp = requests.get(url, headers=self._headers(), timeout=30)
        resp.raise_for_status()
        return resp

    def list_folder_contents(self, folder_path):
        """List items in a OneDrive folder by path."""
        if folder_path == "/":
            url = f"{self.GRAPH_BASE}/me/drive/root/children"
        else:
            clean = folder_path.strip("/")
            url = f"{self.GRAPH_BASE}/me/drive/root:/{clean}:/children"
        resp = self._request(url)
        return resp.json().get("value", [])

    def download_file_content(self, item_id):
        """Download a file's content by item ID."""
        url = f"{self.GRAPH_BASE}/me/drive/items/{item_id}/content"
        resp = self._request(url)
        return resp.text

    def sync_folder(self, folder):
        """Download text content from all supported files in a folder."""
        items = self.list_folder_contents(folder.folder_path)
        text_extensions = {".txt", ".md", ".csv", ".json"}
        content_parts = []

        for item in items:
            name = item.get("name", "")
            if item.get("file") and any(name.lower().endswith(ext) for ext in text_extensions):
                try:
                    text = self.download_file_content(item["id"])
                    content_parts.append(f"--- {name} ---\n{text}")
                except Exception as e:
                    logger.warning("Failed to download %s: %s", name, str(e))

        return "\n\n".join(content_parts) if content_parts else ""
