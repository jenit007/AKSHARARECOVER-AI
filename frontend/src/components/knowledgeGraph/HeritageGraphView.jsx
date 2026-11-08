import React, { useState, useMemo, useCallback, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Network,
  Search,
  Filter,
  MapPin,
  User,
  Flower2,
  Sparkles,
  X,
  BookOpen,
} from 'lucide-react';

const CATEGORY_COLORS = {
  PEOPLE: { bg: '#1c2923', border: '#ccd5ae', text: '#fefae0', icon: User },
  PLACES: { bg: '#1c2923', border: '#d4a373', text: '#fefae0', icon: MapPin },
  RITUALS: { bg: '#1c2923', border: '#fefae0', text: '#fefae0', icon: Sparkles },
  ART_FORMS: { bg: '#1c2923', border: '#e9edc9', text: '#fefae0', icon: Sparkles },
  PLANTS: { bg: '#1c2923', border: '#ccd5ae', text: '#fefae0', icon: Flower2 },
  TRADITIONAL_PRACTICES: { bg: '#1c2923', border: '#d4a373', text: '#fefae0', icon: BookOpen },
  INSTRUMENTS: { bg: '#1c2923', border: '#faedcd', text: '#fefae0', icon: Sparkles },
};

const DEMO_NODES = [
  {
    id: 'node-1',
    type: 'default',
    data: {
      label: 'Theyyam Ritual Tradition',
      category: 'RITUALS',
      canonicalName: 'Theyyam',
      region: 'North Malabar, Kerala',
      description: 'Ritual performance tradition incorporating sacred narratives, vocal recitations (Thottam), and percussion.',
      sourceExcerpt: 'Illustrative excerpt: Reference to Thottam invocation verses.',
      evidence: 'Illustrative ontology node demonstrating cultural entity linking.',
      verificationStatus: 'ILLUSTRATIVE',
      related: ['Kannur', 'Chenda', 'Karuka Grass'],
    },
    position: { x: 350, y: 150 },
    style: {
      background: '#17211d',
      border: '2px solid #ccd5ae',
      borderRadius: '12px',
      padding: '12px 18px',
      color: '#fefae0',
      fontWeight: 'bold',
    },
  },
  {
    id: 'node-2',
    data: {
      label: 'Chenda (Percussion)',
      category: 'INSTRUMENTS',
      canonicalName: 'Chenda',
      region: 'Kerala',
      description: 'Traditional wooden percussion instrument used in temple ensembles, Kathakali, and ritual performances.',
      sourceExcerpt: 'Illustrative excerpt: Rhythmic meter (thala) notation.',
      evidence: 'Illustrative demonstration dataset.',
      verificationStatus: 'ILLUSTRATIVE',
      related: ['Theyyam', 'Kathakali'],
    },
    position: { x: 140, y: 310 },
    style: {
      background: '#17211d',
      border: '2px solid #d4a373',
      borderRadius: '12px',
      padding: '10px 16px',
      color: '#fefae0',
      fontWeight: '600',
    },
  },
  {
    id: 'node-3',
    data: {
      label: 'North Malabar Sacred Groves (Kavu)',
      category: 'PLACES',
      canonicalName: 'Sacred Groves (Kavu)',
      region: 'North Kerala',
      description: 'Traditional ecological and ritual sanctuary spaces associated with regional manuscript custody and performance.',
      sourceExcerpt: 'Illustrative excerpt: Provenance reference.',
      evidence: 'Illustrative demonstration dataset.',
      verificationStatus: 'ILLUSTRATIVE',
      related: ['Theyyam'],
    },
    position: { x: 580, y: 120 },
    style: {
      background: '#17211d',
      border: '2px solid #d4a373',
      borderRadius: '12px',
      padding: '10px 16px',
      color: '#fefae0',
      fontWeight: '600',
    },
  },
  {
    id: 'node-4',
    data: {
      label: 'Karuka (Cynodon dactylon)',
      category: 'PLANTS',
      canonicalName: 'Karuka Grass',
      region: 'Kerala',
      description: 'Botanical species referenced in traditional Ayurvedic formulations and ritual offerings.',
      sourceExcerpt: 'Illustrative excerpt: Herbal preparation reference.',
      evidence: 'Illustrative demonstration dataset.',
      verificationStatus: 'ILLUSTRATIVE',
      related: ['Ayurvedic Formulations'],
    },
    position: { x: 420, y: 360 },
    style: {
      background: '#17211d',
      border: '2px solid #ccd5ae',
      borderRadius: '12px',
      padding: '10px 16px',
      color: '#fefae0',
      fontWeight: '600',
    },
  },
  {
    id: 'node-5',
    data: {
      label: 'Kathakali Classical Drama',
      category: 'ART_FORMS',
      canonicalName: 'Kathakali',
      region: 'Kerala',
      description: 'Classical dance-drama tradition drawing upon epic narratives, mudra hand gestures, and percussion.',
      sourceExcerpt: 'Illustrative excerpt: Attaprakaram stage manual reference.',
      evidence: 'Illustrative demonstration dataset.',
      verificationStatus: 'ILLUSTRATIVE',
      related: ['Chenda'],
    },
    position: { x: 100, y: 100 },
    style: {
      background: '#17211d',
      border: '2px solid #e9edc9',
      borderRadius: '12px',
      padding: '10px 16px',
      color: '#fefae0',
      fontWeight: '600',
    },
  },
];

const DEMO_EDGES = [
  {
    id: 'e1-2',
    source: 'node-1',
    target: 'node-2',
    label: 'accompanied by',
    animated: true,
    style: { stroke: '#d4a373', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#d4a373' },
  },
  {
    id: 'e1-3',
    source: 'node-1',
    target: 'node-3',
    label: 'performed in',
    style: { stroke: '#ccd5ae', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#ccd5ae' },
  },
  {
    id: 'e1-4',
    source: 'node-1',
    target: 'node-4',
    label: 'botanical reference',
    style: { stroke: '#ccd5ae', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#ccd5ae' },
  },
  {
    id: 'e5-2',
    source: 'node-5',
    target: 'node-2',
    label: 'percussion ensemble',
    style: { stroke: '#d4a373', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#d4a373' },
  },
];

export default function HeritageGraphView({ manuscriptGraphData, className = '' }) {
  const isDemonstration =
    !manuscriptGraphData || !manuscriptGraphData.nodes || manuscriptGraphData.nodes.length === 0;

  const initialNodes = useMemo(
    () => (isDemonstration ? DEMO_NODES : manuscriptGraphData.nodes),
    [isDemonstration, manuscriptGraphData],
  );

  const initialEdges = useMemo(
    () => (isDemonstration ? DEMO_EDGES : manuscriptGraphData.edges),
    [isDemonstration, manuscriptGraphData],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const handleNodeClick = useCallback((event, node) => {
    setSelectedNode(node.data);
  }, []);

  const categories = ['ALL', 'RITUALS', 'PEOPLE', 'PLACES', 'ART_FORMS', 'PLANTS', 'INSTRUMENTS'];

  const filteredNodes = useMemo(() => {
    return nodes.map((node) => {
      const matchCat = filterCategory === 'ALL' || node.data.category === filterCategory;
      const matchSearch =
        !searchQuery ||
        (node.data.label || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (node.data.description || '').toLowerCase().includes(searchQuery.toLowerCase());

      return {
        ...node,
        hidden: !(matchCat && matchSearch),
      };
    });
  }, [nodes, filterCategory, searchQuery]);

  return (
    <div
      className={`relative rounded-xl border border-[#35443a] bg-[#17211d] overflow-hidden shadow-2xl text-[#f1f2e9] ${className}`}
    >
      {/* Top Header & Filters Bar */}
      <div className="bg-[#17211d] p-4 border-b border-[#35443a] flex flex-wrap items-center justify-between gap-3 z-10 relative">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-[#1c2923] text-[#ccd5ae] border border-[#35443a]">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-heading text-lg font-bold text-[#fefae0]">
                Heritage Knowledge Graph
              </h3>
              {isDemonstration && (
                <span className="px-2 py-0.5 rounded-full bg-[#1c2923] border border-[#d4a373]/40 text-[#d4a373] text-[10px] font-mono">
                  Illustrative Demonstration Dataset
                </span>
              )}
            </div>
            <p className="text-xs text-[#a9b3a8]">
              Interactive cultural entities and semantic relationships
            </p>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#77857b] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search entities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search graph entities"
              className="pl-8 pr-3 py-1.5 text-xs rounded-md border border-[#35443a] bg-[#101614] text-[#fefae0] focus:border-[#ccd5ae] focus:outline-none w-44 font-sans"
            />
          </div>

          <div className="flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5 text-[#d4a373]" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              aria-label="Filter graph category"
              className="text-xs font-sans px-2.5 py-1.5 rounded-md border border-[#35443a] bg-[#101614] text-[#fefae0] focus:outline-none focus:border-[#ccd5ae]"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Flow Canvas */}
      <div className="relative h-[500px] w-full bg-[#101614]">
        <ReactFlow
          nodes={filteredNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          fitView
          attributionPosition="bottom-left"
        >
          <Background color="#35443a" gap={20} size={1} />
          <Controls className="bg-[#17211d] border border-[#35443a] shadow-md rounded-lg text-[#fefae0]" />
          <MiniMap
            nodeColor={(n) => {
              const cat = n.data?.category;
              return CATEGORY_COLORS[cat]?.border || '#ccd5ae';
            }}
            className="border border-[#35443a] rounded-lg overflow-hidden bg-[#17211d]"
          />
        </ReactFlow>

        {selectedNode && (
          <div className="absolute top-4 right-4 z-20 w-80 sm:w-96 max-h-[90%] bg-[#17211d]/95 backdrop-blur-md rounded-xl border border-[#ccd5ae] shadow-2xl p-5 overflow-y-auto space-y-4">
            <div className="flex items-start justify-between border-b border-[#35443a] pb-3">
              <div>
                <span className="px-2 py-0.5 rounded bg-[#1c2923] text-[#d4a373] text-[10px] font-mono border border-[#35443a]">
                  {selectedNode.category}
                </span>
                <h4 className="font-heading text-xl font-bold text-[#fefae0] mt-2">
                  {selectedNode.canonicalName || selectedNode.label}
                </h4>
                {selectedNode.region && (
                  <p className="text-xs text-[#d4a373] flex items-center space-x-1 mt-0.5 font-mono">
                    <MapPin className="w-3 h-3" />
                    <span>{selectedNode.region}</span>
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                aria-label="Close entity details"
                className="p-1 rounded-md text-[#77857b] hover:text-[#fefae0] hover:bg-[#1c2923]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#a9b3a8] leading-relaxed">
              <div>
                <strong className="block text-[10px] uppercase font-mono text-[#77857b] mb-1">
                  Description
                </strong>
                <p className="text-[#fefae0]">{selectedNode.description}</p>
              </div>

              {selectedNode.sourceExcerpt && (
                <div className="p-3 rounded-lg bg-[#101614] border border-[#35443a]">
                  <strong className="block text-[10px] uppercase font-mono text-[#ccd5ae] mb-1">
                    Source Excerpt
                  </strong>
                  <p className="font-indic italic text-[#fefae0]">{selectedNode.sourceExcerpt}</p>
                </div>
              )}

              {selectedNode.related && selectedNode.related.length > 0 && (
                <div>
                  <strong className="block text-[10px] uppercase font-mono text-[#77857b] mb-1">
                    Connected Entities
                  </strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedNode.related.map((rel, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-full bg-[#1c2923] border border-[#35443a] text-[11px] text-[#e9edc9]"
                      >
                        {rel}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Notice */}
      <div className="bg-[#17211d] px-4 py-2 border-t border-[#35443a] text-[11px] text-[#77857b] flex items-center justify-between font-mono">
        <span>Click any node to inspect entity metadata and source excerpt.</span>
        <span className="text-[#ccd5ae]">
          {nodes.length} Nodes • {edges.length} Semantic Links
        </span>
      </div>
    </div>
  );
}
