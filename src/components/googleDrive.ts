type GoogleDriveDocument = {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
};

const DRIVE_FILE_FIELDS = "files(id,name,mimeType,modifiedTime,size)";
const SUPPORTED_DRIVE_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];

export function prepareGoogleDrivePicker(): Promise<void> {
  return Promise.resolve();
}

async function fetchDriveDocuments(accessToken: string): Promise<GoogleDriveDocument[]> {
  const mimeQuery = SUPPORTED_DRIVE_MIME_TYPES.map((mimeType) => `mimeType='${mimeType}'`).join(" or ");
  const params = new URLSearchParams({
    fields: DRIVE_FILE_FIELDS,
    orderBy: "modifiedTime desc",
    pageSize: "25",
    q: `trashed=false and (${mimeQuery})`,
  });

  const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("Google Drive could not list your files. Check Drive permission and try again.");
  }

  const data = (await response.json()) as { files?: GoogleDriveDocument[] };
  return data.files || [];
}

function formatDriveFileMeta(documentItem: GoogleDriveDocument): string {
  const parts: string[] = [];
  if (documentItem.modifiedTime) {
    parts.push(new Date(documentItem.modifiedTime).toLocaleDateString());
  }
  if (documentItem.size) {
    const size = Number(documentItem.size);
    if (Number.isFinite(size)) {
      parts.push(`${Math.max(1, Math.round(size / 1024))} KB`);
    }
  }
  return parts.join(" | ");
}

function selectDriveDocument(documents: GoogleDriveDocument[]): Promise<GoogleDriveDocument | null> {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.zIndex = "9999";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.background = "rgba(15, 23, 42, 0.42)";
    overlay.style.padding = "24px";

    const panel = document.createElement("div");
    panel.style.width = "min(560px, 100%)";
    panel.style.maxHeight = "min(640px, calc(100vh - 48px))";
    panel.style.overflow = "hidden";
    panel.style.borderRadius = "16px";
    panel.style.background = "#ffffff";
    panel.style.boxShadow = "0 24px 80px rgba(15, 23, 42, 0.28)";
    panel.style.display = "flex";
    panel.style.flexDirection = "column";

    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.alignItems = "center";
    header.style.justifyContent = "space-between";
    header.style.gap = "16px";
    header.style.padding = "18px 20px";
    header.style.borderBottom = "1px solid #e2e8f0";

    const title = document.createElement("h2");
    title.textContent = "Choose from Google Drive";
    title.style.margin = "0";
    title.style.color = "#0f172a";
    title.style.font = "700 16px Inter, system-ui, sans-serif";

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.textContent = "Cancel";
    closeButton.style.border = "0";
    closeButton.style.borderRadius = "999px";
    closeButton.style.background = "#f1f5f9";
    closeButton.style.color = "#475569";
    closeButton.style.cursor = "pointer";
    closeButton.style.font = "600 12px Inter, system-ui, sans-serif";
    closeButton.style.padding = "8px 12px";

    header.append(title, closeButton);

    const list = document.createElement("div");
    list.style.overflow = "auto";
    list.style.padding = "8px";

    const cleanup = (documentChoice: GoogleDriveDocument | null) => {
      overlay.remove();
      resolve(documentChoice);
    };

    closeButton.addEventListener("click", () => cleanup(null));
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) cleanup(null);
    });

    for (const documentItem of documents) {
      const button = document.createElement("button");
      button.type = "button";
      button.style.width = "100%";
      button.style.border = "0";
      button.style.borderRadius = "12px";
      button.style.background = "#ffffff";
      button.style.cursor = "pointer";
      button.style.display = "block";
      button.style.padding = "12px";
      button.style.textAlign = "left";

      const name = document.createElement("div");
      name.textContent = documentItem.name || "Untitled file";
      name.style.color = "#0f172a";
      name.style.font = "700 14px Inter, system-ui, sans-serif";
      name.style.overflow = "hidden";
      name.style.textOverflow = "ellipsis";
      name.style.whiteSpace = "nowrap";

      const meta = document.createElement("div");
      meta.textContent = formatDriveFileMeta(documentItem) || documentItem.mimeType;
      meta.style.color = "#64748b";
      meta.style.font = "500 12px Inter, system-ui, sans-serif";
      meta.style.marginTop = "4px";

      button.append(name, meta);
      button.addEventListener("mouseenter", () => {
        button.style.background = "#f8fafc";
      });
      button.addEventListener("mouseleave", () => {
        button.style.background = "#ffffff";
      });
      button.addEventListener("click", () => cleanup(documentItem));
      list.append(button);
    }

    panel.append(header, list);
    overlay.append(panel);
    document.body.append(overlay);
  });
}

export async function pickBookFromGoogleDrive(accessToken: string): Promise<File | null> {
  const documents = await fetchDriveDocuments(accessToken);
  if (!documents.length) {
    throw new Error("No PDF, JPEG, or PNG files were found in your Google Drive.");
  }

  const selectedDocument = await selectDriveDocument(documents);
  if (!selectedDocument) return null;

  const downloadResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(selectedDocument.id)}?alt=media`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!downloadResponse.ok) {
    throw new Error("Google Drive could not download that file. Check its access and try again.");
  }

  const fileBlob = await downloadResponse.blob();
  return new File([fileBlob], selectedDocument.name || "Google Drive book", {
    type: selectedDocument.mimeType || fileBlob.type || "application/pdf",
    lastModified: Date.now(),
  });
}
