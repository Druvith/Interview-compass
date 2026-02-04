import { motion } from 'framer-motion';

export type RubricScore = {
  label: string;
  score: number;
  rationale: string;
};

interface AnalysisPanelProps {
  scores: RubricScore[] | null;
}

const ScoreItem = ({ score, index }: { score: RubricScore; index: number }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="p-6 border-b border-border hover:bg-surface-hover transition-colors group"
    >
      <div className="flex justify-between items-center mb-3">
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-text-main">
          {score.label}
        </span>
        <span className="font-display text-2xl text-accent">
          {score.score}
        </span>
      </div>
      <p className="text-xs text-text-muted leading-relaxed mb-4 group-hover:text-text-main transition-colors">
        {score.rationale}
      </p>
      
      {/* Tech Bar */}
      <div className="h-1 bg-[#222] w-full relative overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${(score.score / 5) * 100}%` }}
          transition={{ duration: 1, delay: 0.2 + (index * 0.1) }}
          className="h-full bg-text-main relative"
        >
          <div className="absolute right-0 top-[-2px] w-[2px] h-[8px] bg-accent" />
        </motion.div>
      </div>
    </motion.div>
  );
};

export const AnalysisPanel = ({ scores }: AnalysisPanelProps) => {
  return (
    <div className="flex flex-col h-full bg-surface border-l border-border w-full">
      <div className="p-6 border-b border-border sticky top-0 bg-surface z-10">
        <div className="mono-label">Evaluation Metrics</div>
      </div>

      <div className="flex-grow overflow-y-auto">
        {scores ? (
          <div className="flex flex-col">
            {scores.map((s, i) => (
              <ScoreItem key={s.label} score={s} index={i} />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center mono-label opacity-50">
            No data available.
          </div>
        )}
      </div>
    </div>
  );
};
