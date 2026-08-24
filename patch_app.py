import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Add imports
lucide_import_match = re.search(r'import \{[^}]+\} from "lucide-react";', content)
if lucide_import_match:
    lucide_import = lucide_import_match.group(0)
    new_lucide_import = lucide_import.replace('} from "lucide-react";', ', Play, Pause, Square, Volume2 } from "lucide-react";')
    content = content.replace(lucide_import, new_lucide_import)

# Add state variables
state_match = "const [focusArea, setFocusArea] = useState(\"Algorithms, step-by-step processes, and diagrams in student style\");"
new_state = """const [focusArea, setFocusArea] = useState("Algorithms, step-by-step processes, and diagrams in student style");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSpeechPaused, setIsSpeechPaused] = useState(false);"""
content = content.replace(state_match, new_state)

# Add TTS functions
tts_functions = """
  // Text-to-Speech logic
  const handlePlayPauseSpeech = () => {
    if (isSpeaking && !isSpeechPaused) {
      window.speechSynthesis.pause();
      setIsSpeechPaused(true);
    } else if (isSpeaking && isSpeechPaused) {
      window.speechSynthesis.resume();
      setIsSpeechPaused(false);
    } else {
      if (!resultText) return;
      // Strip markdown using a simple regex
      const plainText = resultText
        .replace(/---PAGE_BREAK---/g, " ")
        .replace(/---SET_SEPARATOR---/g, " ")
        .replace(/[*_#`~>]/g, "")
        .replace(/\[DIAGRAM:.*?\]/g, "Diagram omitted.")
        .replace(/\[.*?\]\\(.*?\\)/g, "Link omitted.");
      
      const utterance = new SpeechSynthesisUtterance(plainText);
      utterance.onend = () => {
        setIsSpeaking(false);
        setIsSpeechPaused(false);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setIsSpeechPaused(false);
      };
      
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
      setIsSpeechPaused(false);
    }
  };

  const handleStopSpeech = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsSpeechPaused(false);
  };
  
  useEffect(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsSpeechPaused(false);
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [resultText]);

"""

# Insert TTS functions right before downloadHandwrittenPDF
download_fn_match = r"(?s)  const downloadHandwrittenPDF = async \(fast: boolean = false\) => \{"
new_download_fn = tts_functions + "  const downloadHandwrittenPDF = async (fast: boolean = false) => {"
content = re.sub(download_fn_match, new_download_fn, content)

# Insert UI for TTS controls near the Export button
export_btn_html = """                    <div className="relative">
                      <button
                        onClick={() => setShowExportMenu(!showExportMenu)}"""
new_export_btn_html = """                    <div className="flex items-center gap-2">
                      {resultText && (
                        <div className="flex items-center gap-1 bg-white/50 border border-[#D1D1C4] rounded-full p-1 shadow-sm mr-2">
                          <button
                            onClick={handlePlayPauseSpeech}
                            className={`p-1.5 rounded-full transition-colors ${isSpeaking && !isSpeechPaused ? 'bg-[#5A5A40] text-white' : 'text-[#5A5A40] hover:bg-[#F0F0E8]'}`}
                            title={isSpeaking && !isSpeechPaused ? "Pause Audio" : "Play Audio"}
                          >
                            {isSpeaking && !isSpeechPaused ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill={isSpeaking && isSpeechPaused ? "currentColor" : "none"} />}
                          </button>
                          {(isSpeaking || isSpeechPaused) && (
                            <button
                              onClick={handleStopSpeech}
                              className="p-1.5 rounded-full transition-colors text-red-500 hover:bg-red-50"
                              title="Stop Audio"
                            >
                              <Square size={14} fill="currentColor" />
                            </button>
                          )}
                        </div>
                      )}
                    <div className="relative">
                      <button
                        onClick={() => setShowExportMenu(!showExportMenu)}"""
content = content.replace(export_btn_html, new_export_btn_html)

with open("src/App.tsx", "w") as f:
    f.write(content)

print("Patch applied!")
