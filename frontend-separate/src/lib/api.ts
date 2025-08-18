export async function downloadKEDB(id: string): Promise<void> {
  try {
    const response = await fetch(`/api/kedbs/${id}/download`);
    if (!response.ok) {
      throw new Error("Failed to download KEDB");
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = response.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "") || `kedb-${id}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error("Download error:", error);
    throw error;
  }
}
