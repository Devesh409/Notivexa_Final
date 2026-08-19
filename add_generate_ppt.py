import sys

with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

new_func = """
  const generatePPT = async () => {
    if (!fileData) return;
    setLoading(true);
    setGeneratingType("ppt");
    setError(null);

    try {
      // Client-side cache check
      const cached = history.find(
        (item) => item.fileUri === fileData.fileUri && item.type === "ppt"
      );
      if (cached) {
        setSlides(cached.slides || []);
        setResultType("ppt");
        setLoading(false);
        setGeneratingType("");
        return;
      }

      const response = await fetch("/api/generate-ppt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUri: fileData.fileUri,
          mimeType: fileData.mimeType,
          focusArea: selectedDept !== "All" ? selectedDept : "",
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to generate PPT");
      }

      const data = await response.json();
      if (data.ppt && data.ppt.slides) {
        setSlides(data.ppt.slides);
        setResultType("ppt");
        // We'd add this to firestore here, but we can do it after.
      }
    } catch (err: any) {
      handleFetchError(err);
    } finally {
      setLoading(false);
      setGeneratingType("");
    }
  };
"""

insert_idx = 0
for i, line in enumerate(lines):
    if line.strip().startswith('const generateVideoExplanation = async () => {'):
        insert_idx = i
        break

lines.insert(insert_idx, new_func)

with open('src/App.tsx', 'w') as f:
    f.writelines(lines)
