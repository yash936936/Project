import Link from 'next/link';
import { Zap, GitBranch, FileText, Database } from 'lucide-react';

const FEATURES = [
  { icon: Zap, label: '7-Stage AI Pipeline', desc: 'Requirements → Architecture → Tech Stack → API → DB → Flows → PRD/TRD' },
  { icon: GitBranch, label: 'Architecture Diagrams', desc: 'Auto-generated system diagrams with component breakdown and data flow' },
  { icon: FileText, label: 'PRD & TRD', desc: 'Production-ready product and technical requirement documents' },
  { icon: Database, label: 'DB Schema', desc: 'PostgreSQL schema with indexes, migrations, and FK relationships' },
];

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 py-24 gap-16">
      <section className="text-center max-w-3xl">
        <p className="text-brand text-sm font-mono tracking-widest uppercase mb-4">AI System Design Assistant</p>
        <h1 className="text-5xl font-bold text-white leading-tight mb-6">
          Describe your product.<br />
          <span className="text-brand">Get your entire system design.</span>
        </h1>
        <p className="text-slate-400 text-lg mb-10">
          Paste a product description and our 7-stage AI pipeline generates architecture diagrams, API specs, DB schemas, PRDs, and TRDs in under 2 minutes.
        </p>
        <Link href="/design" className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-semibold px-8 py-4 rounded-xl transition-colors text-lg">
          <Zap size={20} /> Start Designing
        </Link>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl w-full">
        {FEATURES.map(({ icon: Icon, label, desc }) => (
          <div key={label} className="bg-surface-card border border-surface-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-brand/10 rounded-lg"><Icon size={20} className="text-brand" /></div>
              <h3 className="font-semibold text-white">{label}</h3>
            </div>
            <p className="text-slate-400 text-sm">{desc}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
