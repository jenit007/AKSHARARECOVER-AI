import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import HeritageGraphView from '../components/knowledgeGraph/HeritageGraphView';
import { listManuscripts } from '../services/manuscriptService';
import { getKnowledgeGraph } from '../services/knowledgeGraphService';
import { useManuscript } from '../context/ManuscriptContext';

export default function KnowledgeGraph() {
  const { activeManuscriptId } = useManuscript();
  const [manuscripts, setManuscripts] = useState([]);
  const [selectedMid, setSelectedMid] = useState(activeManuscriptId || '');
  const [graphData, setGraphData] = useState(null);

  useEffect(() => {
    listManuscripts({ page: 1, page_size: 20 })
      .then((res) => {
        setManuscripts(res.items || []);
        if (!selectedMid && res.items?.length > 0) {
          setSelectedMid(res.items[0].id);
        }
      })
      .catch((err) => console.warn('Could not load manuscripts list:', err));
  }, []);

  useEffect(() => {
    if (!selectedMid) return;
    getKnowledgeGraph(selectedMid)
      .then((data) => {
        if (data && data.nodes && data.nodes.length > 0) {
          const rfNodes = data.nodes.map((n, i) => ({
            id: n.id || `node-${i}`,
            position: n.position || {
              x: 150 + (i % 3) * 220,
              y: 100 + Math.floor(i / 3) * 160,
            },
            data: {
              label: n.canonical_name || n.name || n.label,
              category: n.category || 'RITUALS',
              canonicalName: n.canonical_name || n.name,
              description: n.description,
              sourceExcerpt: n.source_excerpt,
              evidence: n.evidence_excerpt || n.source,
              verificationStatus: n.verification_status || 'EXTRACTED',
              related: n.related || [],
            },
            style: {
              background: '#17211d',
              border: '2px solid #ccd5ae',
              borderRadius: '12px',
              padding: '10px 16px',
              color: '#f1f2e9',
              fontWeight: '600',
            },
          }));

          const rfEdges = (data.edges || []).map((e, i) => ({
            id: e.id || `e-${i}`,
            source: e.source_entity_id || e.source,
            target: e.target_entity_id || e.target,
            label: e.relationship_type || e.label || 'related to',
            style: { stroke: '#d4a373', strokeWidth: 2 },
          }));

          setGraphData({ nodes: rfNodes, edges: rfEdges });
        } else {
          setGraphData(null);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch knowledge graph for manuscript:', err);
        setGraphData(null);
      });
  }, [selectedMid]);

  return (
    <div className="min-h-screen bg-[#101614] text-[#f1f2e9] py-16 px-4 sm:px-6 lg:px-8 space-y-12 selection:bg-[#ccd5ae]/30">
      {/* Header */}
      <section className="max-w-4xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#1c2923] border border-[#35443a] text-xs font-mono text-[#ccd5ae]">
          <Sparkles className="w-3.5 h-3.5 text-[#ccd5ae]" />
          <span>Semantic Heritage Graph</span>
        </div>
        <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-[#fefae0] tracking-tight leading-tight">
          Explore the Connections Behind Our Heritage
        </h1>
        <p className="text-lg text-[#a9b3a8] max-w-2xl mx-auto font-sans leading-relaxed">
          Inspect cultural entities and relationships indexed from your processed manuscripts.
        </p>

        {manuscripts.length > 0 && (
          <div className="pt-2 flex items-center justify-center space-x-2 text-xs font-mono">
            <span className="text-[#77857b]">Select Source Manuscript:</span>
            <select
              value={selectedMid}
              onChange={(e) => setSelectedMid(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-[#35443a] bg-[#101614] text-xs text-[#f1f2e9] font-medium focus:outline-none focus:border-[#ccd5ae]"
            >
              {manuscripts.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title || m.original_filename} ({m.source_language || 'mal'})
                </option>
              ))}
            </select>
          </div>
        )}
      </section>

      {/* Main Graph Component */}
      <section className="max-w-7xl mx-auto">
        <HeritageGraphView manuscriptGraphData={graphData} />
      </section>

      {/* Epistemological Legend */}
      <section className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 space-y-2 rounded-2xl bg-[#17211d] border border-[#35443a] border-l-4 border-l-[#ccd5ae] shadow-xl">
          <h2 className="font-heading text-lg font-bold text-[#f1f2e9]">
            Tradition-Bearers &amp; Patrons
          </h2>
          <p className="text-xs text-[#a9b3a8] leading-relaxed">
            Links manuscript provenance notes and regional temple archives indexed during archival processing.
          </p>
        </div>

        <div className="p-6 space-y-2 rounded-2xl bg-[#17211d] border border-[#35443a] border-l-4 border-l-[#d4a373] shadow-xl">
          <h2 className="font-heading text-lg font-bold text-[#f1f2e9]">
            Ritual &amp; Script Lineages
          </h2>
          <p className="text-xs text-[#a9b3a8] leading-relaxed">
            Connects script classifications such as Grantha, Vatteluttu, Kolezhuthu, and Malayalam palm-leaf corpora.
          </p>
        </div>

        <div className="p-6 space-y-2 rounded-2xl bg-[#17211d] border border-[#35443a] border-l-4 border-l-[#e9edc9] shadow-xl">
          <h2 className="font-heading text-lg font-bold text-[#f1f2e9]">
            Ethno-Botanical References
          </h2>
          <p className="text-xs text-[#a9b3a8] leading-relaxed">
            Highlights botanical and Ayurvedic entities when grounded text excerpts appear in verified transcriptions.
          </p>
        </div>
      </section>
    </div>
  );
}
