import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";

export default function Recording() {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone.");
    }
  };

  const stopRecordingAndProcess = async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== "recording") return;

    setIsProcessing(true);
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });

      try {
        // Convert blob to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        const base64Audio = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const base64String = reader.result as string;
            // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
            resolve(base64String.split(',')[1]);
          };
          reader.onerror = reject;
        });

        // Process audio on the server through Gemini API endpoints
        const response = await fetch("/api/clinical/process-audio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audioBase64: base64Audio,
            mimeType: audioBlob.type || "audio/webm",
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Server responded with ${response.status}`);
        }

        const { transcription, soapNote, codes } = await response.json();

        // Navigate to review with processed data
        navigate("/visit/review", { state: { transcription, soapNote, codes } });
      } catch (error) {
        console.error("Processing error:", error);
        alert("An error occurred while processing the encounter.");
        setIsProcessing(false);
      }
    };

    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="flex-grow pt-8 pb-32 px-6 flex flex-col items-center justify-center max-w-5xl mx-auto w-full">
      <div className="w-full mb-12 flex flex-col md:flex-row justify-between items-end border-l-4 border-primary pl-6">
        <div className="text-left">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-on-surface-variant mb-1">Current Patient</p>
          <h2 className="text-4xl font-black tracking-tight text-on-background uppercase">Sarah Jenkins</h2>
          <p className="font-mono text-sm text-primary mt-1">ID: 992-004-XJ</p>
        </div>
        <div className="mt-6 md:mt-0 text-right flex flex-col items-end">
          <div className="flex items-center gap-2 bg-surface-container-highest px-4 py-2 rounded-sm border-l-2 border-primary">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>settings_input_antenna</span>
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-on-background">Ambient Mode: {isRecording ? "Active" : "Ready"}</span>
          </div>
        </div>
      </div>

      <div className="relative w-full aspect-square md:aspect-video bg-white border border-outline-variant/20 flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-5">
          <div className="grid grid-cols-12 h-full w-full">
            {[...Array(6)].map((_, i) => <div key={i} className="border-r border-on-background h-full"></div>)}
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="font-mono text-xs uppercase tracking-[0.4em] text-primary font-bold mb-4">Encounter Duration</div>
          <div className="text-[8rem] md:text-[12rem] leading-none font-black tracking-tighter text-on-background font-headline">
            {formatTime(duration)}
          </div>
          <div className="flex gap-8 mt-4">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isRecording ? "bg-primary animate-pulse" : "bg-outline-variant"}`}></span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">Live Transcription</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isProcessing ? "bg-tertiary animate-pulse" : "bg-outline-variant"}`}></span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">Sync: {isProcessing ? "Processing" : "Stable"}</span>
            </div>
          </div>
        </div>
      </div>

      {isProcessing && (
        <div className="w-full mt-6 bg-surface-container border border-primary/20 rounded-sm p-4 flex items-center justify-between shadow-sm animate-pulse">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>vibration</span>
            <p className="font-mono text-sm font-semibold text-on-surface tracking-tight uppercase">
              Processing Audio & Generating SOAP Note...
            </p>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 w-full p-6 bg-white border-t-2 border-slate-100 z-[60]">
        <div className="max-w-5xl mx-auto">
          {!isRecording && !isProcessing ? (
            <Button onClick={startRecording} fullWidth size="xl" className="justify-between" icon={<span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>mic</span>}>
              <span className="text-left">Start Encounter</span>
            </Button>
          ) : !isProcessing ? (
            <Button onClick={stopRecordingAndProcess} variant="tertiary" fullWidth size="xl" className="justify-between" icon={
              <div className="hidden md:flex flex-col items-end opacity-70">
                <span className="font-mono text-[10px] uppercase tracking-widest">End Session & Generate Summary</span>
              </div>
            }>
              <div className="flex items-center gap-6">
                <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span className="text-left">Finish Encounter</span>
              </div>
            </Button>
          ) : (
            <Button disabled fullWidth size="xl" className="justify-between" icon={<span className="material-symbols-outlined text-4xl animate-spin">sync</span>}>
              <span className="text-left">Processing...</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
