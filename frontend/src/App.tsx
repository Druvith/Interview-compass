import { useEffect, useMemo, useState } from "react";

type PromptConfig = {
  prompt_version: string;
  prompt_text: string;
  rubric: string[];
};

type RubricScore = {
  label: string;
  score: number;
  rationale: string;
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
  const [prompt, setPrompt] = useState<PromptConfig | null>(null);
  const [rubricDraft, setRubricDraft] = useState<string[]>([]);
  const [newRubricItem, setNewRubricItem] = useState("");
  const [video, setVideo] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [currentModel, setCurrentModel] = useState("");
  const [resultModel, setResultModel] = useState("");
  const [resultCached, setResultCached] = useState(false);
  const [resultHash, setResultHash] = useState("");

  const headlineText = useMemo(() => {
    if (running) return "Analyzing neural stream...";
    if (!analysis) return "Awaiting vision input for analysis.";
    const summary = analysis.overall_summary?.trim();
    if (!summary) return "Evaluation complete.";
    // Pick the first sentence or first 100 chars for the headline
    const firstSentence = summary.split(/[.!?]/)[0];
    return firstSentence.length > 100 ? `${firstSentence.slice(0, 97)}...` : firstSentence + ".";
  }, [analysis, running]);

  const fileMeta = useMemo(() => {
    const filename = video?.name ?? "NO_SOURCE_LOADED";
    const model = resultModel || currentModel || "AUTO";
    const hash = resultHash ? resultHash.slice(0, 8).toUpperCase() : "NULL";
    return `SESSION // ${new Date().toLocaleDateString()} // ${filename} // ${model} // ${hash}`;
  }, [video, resultModel, currentModel, resultHash]);

  useEffect(() => {
    fetch("/api/prompt")
      .then((res) => res.json())
      .then((data: PromptConfig) => {
        setPrompt(data);
        setRubricDraft(data.rubric);
      })
      .catch(() => setStatus("OFFLINE: PROMPT_LOAD_FAIL"));
  }, []);

  useEffect(() => {
    fetch("/api/models")
      .then((res) => res.json())
      .then((data: { current: string; available: string[] }) => {
        setCurrentModel(data.current);
        setModels(data.available);
      })
      .catch(() => setStatus("OFFLINE: MODEL_LOAD_FAIL"));
  }, []);

  useEffect(() => {
    if (video) {
      const url = URL.createObjectURL(video);
      setVideoPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setVideoPreviewUrl(null);
    }
  }, [video]);

  async function handleSavePrompt() {
    if (!prompt) return;
    setSaving(true);
    setStatus("");
    const payload = { ...prompt, rubric: rubricDraft };
    try {
      const res = await fetch("/api/prompt", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as PromptConfig;
      setPrompt(data);
      setStatus("SYSTEM: RUBRIC_UPDATED");
    } catch {
      setStatus("ERROR: RUBRIC_SAVE_FAIL");
    } finally {
      setSaving(false);
    }
  }

  function handleAddRubric() {
    const trimmed = newRubricItem.trim();
    if (!trimmed) return;
    if (rubricDraft.includes(trimmed)) {
      setNewRubricItem("");
      return;
    }
    setRubricDraft([...rubricDraft, trimmed]);
    setNewRubricItem("");
  }

  function handleRemoveRubric(label: string) {
    setRubricDraft(rubricDraft.filter((item) => item !== label));
  }

  async function handleAnalyze() {
    if (!video) {
      setStatus("ERROR: MISSING_SOURCE_FILE");
      return;
    }
    setRunning(true);
    setStatus("BUSY: NEURAL_SYNC");
    setAnalysis(null);
    setResultModel("");
    setResultCached(false);
    setResultHash("");

    const formData = new FormData();
    formData.append("video", video);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "ANALYSIS_FAILED");
      }
      const data = (await res.json()) as AnalysisResponse;
      setAnalysis(data.analysis);
      setResultModel(data.model);
      setResultCached(data.cached);
      setResultHash(data.video_hash);
      setStatus(data.cached ? "SYSTEM: CACHE_HIT" : "SYSTEM: ANALYSIS_SUCCESS");
    } catch (err) {
      setStatus(err instanceof Error ? `ERROR: ${err.message.toUpperCase()}` : "ERROR: UNKNOWN");
    } finally {
      setRunning(false);
    }
  }

  function handleExport() {
    if (!analysis) return;
    const payload = {
      model: resultModel,
      cached: resultCached,
      video_hash: resultHash,
      analysis,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `analysis-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleModelChange(nextModel: string) {
    setCurrentModel(nextModel);
    try {
      const res = await fetch("/api/models", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: nextModel }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setStatus("ERROR: MODEL_UPDATE_FAIL");
    }
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">Compass.</div>
          <div className="brand-sub">Analytical Intelligence</div>
        </div>

        <div className="nav-section">
          <div className="nav-label">01. Source</div>
          <label className="upload-area">
            <input type="file" accept="video/*" onChange={(e) => setVideo(e.target.files?.[0] ?? null)} />
            <div className="upload-icon">✦</div>
            <div className="upload-text">{video ? "Replace Interview" : "Import Interview"}</div>
            <div className="upload-hint">{video ? video.name : "MP4, MOV / Max 100MB"}</div>
          </label>
        </div>

        <div className="nav-section">
          <div className="nav-label">02. Configuration</div>
          <div className="config-group">
            <label className="nav-label" style={{ marginBottom: 0 }}>
              Model Selection
            </label>
            <select value={currentModel} onChange={(e) => handleModelChange(e.target.value)}>
              {models.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>
          <div className="config-group">
            <label className="nav-label" style={{ marginBottom: 0 }}>
              Evaluation Rubric
            </label>
            <div className="chip-container">
              {rubricDraft.map((item) => (
                <button key={item} className="chip" onClick={() => handleRemoveRubric(item)} type="button">
                  {item} <span className="chip-remove">×</span>
                </button>
              ))}
            </div>
            <input
              type="text"
              value={newRubricItem}
              onChange={(e) => setNewRubricItem(e.target.value)}
              placeholder="+ Add Dimension"
              onKeyDown={(e) => e.key === "Enter" && handleAddRubric()}
            />
            <button className="btn-secondary" onClick={handleSavePrompt} disabled={saving}>
              {saving ? "SYNCING..." : "UPDATE_RUBRIC"}
            </button>
          </div>
        </div>

        <div className="sidebar-footer">
          <button className="btn-primary" onClick={handleAnalyze} disabled={running}>
            {running ? "PROCESSING..." : "START ANALYSIS"}
            <span style={{ marginLeft: "8px" }}>→</span>
          </button>
          <div className="status-line">
            <div className={`status-dot ${running ? "busy" : ""}`} />
            {status || (running ? "Analyzing neural stream..." : "Awaiting vision input...")}
          </div>
        </div>
      </aside>

      <main className="workspace">
        <header className="result-header reveal">
          <div className="header-left">
            <div className="file-meta">{fileMeta}</div>
            <h1 className="headline">{headlineText}</h1>
          </div>
          <button className="text-button" onClick={handleExport} disabled={!analysis}>
            Export Intelligence
          </button>
        </header>

        <section className="video-stage reveal delay-1">
          {videoPreviewUrl ? (
            <video src={videoPreviewUrl} controls className="video-preview" />
          ) : (
            <div className="video-placeholder">
              <div className="play-ring">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <div className="file-meta">No Preview Available</div>
            </div>
          )}
        </section>

        <div className="insights-grid">
          <article className="summary-card reveal delay-2">
            <div className="section-title">Executive Summary</div>
            <div className="summary-text">
              {analysis
                ? analysis.overall_summary
                : "System idle. Upload a video and initialize analysis to generate results."}
            </div>
          </article>

          <div className="scores-grid">
            {analysis ? (
              analysis.rubric.map((score, idx) => (
                <div className={`score-card reveal delay-${(idx % 4) + 1}`} key={score.label}>
                  <div className="score-val">{score.score}</div>
                  <div className="score-label">{score.label}</div>
                  <p className="score-rationale">{score.rationale}</p>
                  <div className="bar-bg">
                    <div className="bar-fill" style={{ width: `${(score.score / 5) * 100}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">No scoring data available in the current session.</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
