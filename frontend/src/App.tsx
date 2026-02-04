import { useEffect, useMemo, useState } from "react";
import { Shell } from "./components/layout/Shell";
import { Sidebar } from "./components/features/Sidebar";
import { Stage } from "./components/features/Stage";
import { AnalysisPanel, RubricScore } from "./components/features/AnalysisPanel";

type PromptConfig = {
  prompt_version: string;
  prompt_text: string;
  rubric: string[];
};

type AnalysisResult = {
  rubric: RubricScore[];
  overall_summary: string;
};

type AnalysisResponse = {
  analysis: AnalysisResult;
  cached: boolean;
  model: string;
  video_hash: string;
};

export default function App() {
  // State
  const [prompt, setPrompt] = useState<PromptConfig | null>(null);
  const [rubricDraft, setRubricDraft] = useState<string[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  
  const [status, setStatus] = useState<string>("SYSTEM READY");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [currentModel, setCurrentModel] = useState("");
  
  // Results Metadata
  const [resultModel, setResultModel] = useState("");
  const [resultHash, setResultHash] = useState("");
  const [resultCached, setResultCached] = useState(false);

  // --- Effects ---

  // Load Prompt Config
  useEffect(() => {
    fetch("/api/prompt")
      .then((res) => res.json())
      .then((data: PromptConfig) => {
        setPrompt(data);
        setRubricDraft(data.rubric);
      })
      .catch(() => setStatus("OFFLINE: PROMPT LOAD FAILED"));
  }, []);

  // Load Models
  useEffect(() => {
    fetch("/api/models")
      .then((res) => res.json())
      .then((data: { current: string; available: string[] }) => {
        setCurrentModel(data.current);
        setModels(data.available);
      })
      .catch(() => setStatus("OFFLINE: MODEL LOAD FAILED"));
  }, []);

  // Video Preview
  useEffect(() => {
    if (video) {
      const url = URL.createObjectURL(video);
      setVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setVideoUrl(null);
    }
  }, [video]);

  // --- Handlers ---

  const handleRubricUpdate = async (newRubric: string[]) => {
    setRubricDraft(newRubric);
    // Auto-save rubric changes if we have the prompt loaded
    if (prompt) {
      const payload = { ...prompt, rubric: newRubric };
      try {
        await fetch("/api/prompt", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setPrompt(payload);
      } catch {
        setStatus("ERROR: RUBRIC SYNC FAILED");
      }
    }
  };

  const handleAddRubric = (item: string) => {
    const trimmed = item.trim();
    if (trimmed && !rubricDraft.includes(trimmed)) {
      handleRubricUpdate([...rubricDraft, trimmed]);
    }
  };

  const handleRemoveRubric = (item: string) => {
    handleRubricUpdate(rubricDraft.filter((i) => i !== item));
  };

  const handleModelChange = async (model: string) => {
    setCurrentModel(model);
    try {
      await fetch("/api/models", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model }),
      });
    } catch {
      setStatus("ERROR: MODEL SYNC FAILED");
    }
  };

  const handleAnalyze = async () => {
    if (!video) return;
    
    setIsAnalyzing(true);
    setStatus("INITIALIZING NEURAL LINK...");
    setAnalysis(null);
    
    const formData = new FormData();
    formData.append("video", video);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) throw new Error("API_ERROR");
      
      const data = (await res.json()) as AnalysisResponse;
      setAnalysis(data.analysis);
      setResultModel(data.model);
      setResultHash(data.video_hash);
      setResultCached(data.cached);
      setStatus(data.cached ? "ANALYSIS COMPLETE (CACHED)" : "ANALYSIS COMPLETE");
    } catch (err) {
      setStatus("CRITICAL FAILURE: ANALYSIS ABORTED");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExport = () => {
    if (!analysis) return;
    const payload = {
      timestamp: new Date().toISOString(),
      model: resultModel,
      video_hash: resultHash,
      cached: resultCached,
      analysis,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `compass-report-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // --- Derived State ---
  
  const headline = useMemo(() => {
    if (isAnalyzing) return "Processing visual stream...";
    if (analysis?.overall_summary) {
      const s = analysis.overall_summary;
      // Get first sentence
      return s.split(/[.!?]/)[0] + ".";
    }
    return undefined;
  }, [isAnalyzing, analysis]);

  return (
    <Shell
      sidebar={
        <Sidebar
          models={models}
          currentModel={currentModel}
          onModelChange={handleModelChange}
          rubric={rubricDraft}
          onAddRubric={handleAddRubric}
          onRemoveRubric={handleRemoveRubric}
          onAnalyze={handleAnalyze}
          isAnalyzing={isAnalyzing}
          onFileSelect={setVideo}
          selectedFile={video}
        />
      }
      stage={
        <Stage
          videoUrl={videoUrl}
          status={status}
          headline={headline}
          summary={analysis?.overall_summary}
          isAnalyzing={isAnalyzing}
          onExport={handleExport}
          canExport={!!analysis}
        />
      }
      panel={
        <AnalysisPanel scores={analysis?.rubric ?? null} />
      }
    />
  );
}