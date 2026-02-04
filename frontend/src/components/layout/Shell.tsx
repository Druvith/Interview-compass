import { ReactNode } from 'react';

interface ShellProps {
  sidebar: ReactNode;
  stage: ReactNode;
  panel: ReactNode;
}

export const Shell = ({ sidebar, stage, panel }: ShellProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[280px_1fr_360px] h-full w-full">
      <aside className="border-r border-[var(--border)] bg-[var(--surface)] flex flex-col overflow-hidden h-full z-20">
        {sidebar}
      </aside>
      
      <main className="bg-[#080808] flex flex-col relative overflow-y-auto h-full z-10">
        {stage}
      </main>
      
      <aside className="border-l border-[var(--border)] bg-[var(--surface)] flex flex-col overflow-hidden h-full hidden lg:flex z-20">
        {panel}
      </aside>
    </div>
  );
};
