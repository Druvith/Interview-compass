import { motion } from 'framer-motion';

interface StageProps {
  videoUrl: string | null;
  status: string;
  headline?: string;
  summary?: string;
  isAnalyzing: boolean;
  onExport: () => void;
  canExport: boolean;
}

export const Stage = ({ videoUrl, status, headline, summary, isAnalyzing, onExport, canExport }: StageProps) => {
  return (
    <div className="flex flex-col min-h-full bg-[#080808]">
      {/* Header */}
      <header className="p-6 md:p-8 flex justify-between items-end border-b border-border bg-[#050505]/80 backdrop-blur-md z-10 sticky top-0">
        <div>
          <div className="mono-label mb-2">Session Status: {status}</div>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold uppercase leading-[0.9] max-w-2xl">
            {headline || "Awaiting Vision Input."}
          </h1>
        </div>
        <button 
          onClick={onExport}
          disabled={!canExport}
          className="btn border border-border-light px-4 py-2 hover:bg-surface-hover text-xs font-mono uppercase tracking-wider disabled:opacity-30"
        >
          Export Report
        </button>
      </header>

      {/* Viewport */}
      <div className="flex-grow flex items-center justify-center p-8 md:p-12 relative">
        {/* Technical Overlays */}
        <div className="absolute inset-8 border border-border pointer-events-none opacity-50 hidden md:block">
            <div className="absolute -top-[1px] -left-[1px] w-3 h-3 border-t-2 border-l-2 border-accent"></div>
            <div className="absolute -top-[1px] -right-[1px] w-3 h-3 border-t-2 border-r-2 border-accent"></div>
            <div className="absolute -bottom-[1px] -left-[1px] w-3 h-3 border-b-2 border-l-2 border-accent"></div>
            <div className="absolute -bottom-[1px] -right-[1px] w-3 h-3 border-b-2 border-r-2 border-accent"></div>
            
            <div className="absolute bottom-4 left-0 right-0 text-center mono-label">
                View 01 // Main Feed
            </div>
        </div>

        {/* Video Container */}
        <div className="w-full max-w-4xl aspect-video bg-black relative shadow-2xl z-0">
          {videoUrl ? (
            <video src={videoUrl} controls className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#111]">
               <div className="text-border-light">NO SIGNAL</div>
            </div>
          )}
          
          {/* Status Overlay */}
          <div className="absolute top-4 left-4 flex items-center gap-2 mono-label text-accent font-bold bg-black/50 px-2 py-1 backdrop-blur-sm">
             <div className={`w-2 h-2 rounded-full bg-accent ${isAnalyzing ? 'animate-blink' : ''}`} />
             {isAnalyzing ? "REC // ANALYZING" : "STANDBY"}
          </div>
        </div>

        {summary && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-12 left-12 right-12 bg-black/80 border-l-2 border-accent p-6 backdrop-blur-md max-w-2xl shadow-2xl z-20"
          >
            <div className="mono-label text-accent mb-2">Executive Summary</div>
            <p className="text-sm leading-relaxed text-text-main">{summary}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};
