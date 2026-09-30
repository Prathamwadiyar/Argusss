import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Shield, Server, CheckCircle, Code, Filter, RefreshCw, X, Info, GitFork, BookOpen } from 'lucide-react';
import { auditService } from '../services/api';

const EquivalenceGraphTab = ({ auditId }) => {
  const [graphData, setGraphData] = useState({ nodes: [], edges: [], summary: {} });
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [activeVendorFilter, setActiveVendorFilter] = useState('ALL');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('ALL');

  const fetchGraph = async () => {
    setLoading(true);
    try {
      const data = await auditService.getEquivalenceGraph(auditId);
      setGraphData(data);
    } catch (err) {
      console.error('Failed to load equivalence graph', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, [auditId]);

  const vendorNodes = graphData.nodes.filter(
    (n) => n.type === 'vendor_command' && (activeVendorFilter === 'ALL' || n.details?.vendor === activeVendorFilter)
  );

  const propertyNodes = graphData.nodes.filter(
    (n) => n.type === 'security_property' && (activeCategoryFilter === 'ALL' || n.details?.category === activeCategoryFilter)
  );

  const controlNodes = graphData.nodes.filter((n) => n.type === 'compliance_control');

  const categories = ['ALL', 'Management', 'Authentication', 'Logging', 'Time', 'SNMP', 'Service'];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Info */}
      <div className="minimal-panel p-6 border-white/[0.08] relative overflow-hidden bg-gradient-to-r from-[#07070a] via-[#0d0d14] to-[#07070a]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="badge badge-cyan text-[10px] tracking-wider uppercase font-mono">
                SIH26155 &middot; DIF-03
              </span>
              <span className="badge badge-white text-[10px] font-mono">
                Cross-Vendor Equivalence Graph
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight pt-1">
              Cross-Vendor Security Equivalence &amp; Mapping Graph
            </h2>
            <p className="text-xs text-white/50 max-w-3xl leading-relaxed">
              Visualizes how disparate Cisco IOS-XE, Juniper Junos, and Fortinet FortiOS CLI commands converge into unified
              canonical security properties without claiming byte-for-byte configuration equivalence. Maps intermediate properties
              directly to CIS, NIST, DISA STIG, ISO 27001, and NCIIPC controls.
            </p>
          </div>

          <button
            onClick={fetchGraph}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white text-xs font-semibold self-start md:self-auto transition-all border border-white/[0.08]"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Topology</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-4 mt-5 pt-4 border-t border-white/[0.06] text-xs">
          <div className="flex items-center gap-2">
            <span className="text-white/40 font-mono text-[11px]">Vendor Filter:</span>
            {['ALL', 'Cisco', 'Juniper', 'Fortinet'].map((v) => (
              <button
                key={v}
                onClick={() => setActiveVendorFilter(v)}
                className={`px-3 py-1 rounded-md text-xs font-mono transition-all ${
                  activeVendorFilter === v
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'bg-black/50 text-white/50 hover:text-white border border-white/[0.06]'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-white/40 font-mono text-[11px]">Category:</span>
            <select
              value={activeCategoryFilter}
              onChange={(e) => setActiveCategoryFilter(e.target.value)}
              className="minimal-input text-xs px-2.5 py-1 font-mono bg-black/60 border-white/[0.12] text-white/80"
            >
              {categories.map((c) => (
                <option key={c} value={c} className="bg-[#0e0e14]">
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3-Tier Convergent Hierarchy Visualizer */}
      <div className="minimal-panel p-6 border-white/[0.08] space-y-6">
        <div className="flex items-center justify-between text-xs text-white/50 pb-3 border-b border-white/[0.06] font-mono">
          <div className="font-semibold text-white/80 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-zinc-400" />
            Tier 1: Heterogeneous CLI Commands ({vendorNodes.length})
          </div>
          <div className="font-semibold text-white/80 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-zinc-200" />
            Tier 2: Canonical Security Properties ({propertyNodes.length})
          </div>
          <div className="font-semibold text-white/80 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Tier 3: CIS / NIST / DISA / ISO / NCIIPC Controls ({controlNodes.length})
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-white/40 text-xs font-mono">
            Generating semantic equivalence graph topology...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
            {/* Column 1: Vendor Commands */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-white uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
                <GitFork size={13} />
                <span>Tier 1: Vendor CLI Syntax</span>
              </div>
              <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
                {vendorNodes.map((node) => {
                  const isSelected = selectedNode?.id === node.id;
                  const vColor = 'text-zinc-200';

                  return (
                    <motion.div
                      key={node.id}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => setSelectedNode(node)}
                      className={`p-3.5 rounded-xl bg-black/60 border cursor-pointer transition-all ${
                        isSelected
                          ? 'ring-1 ring-white border-white bg-white/[0.08]'
                          : 'border-white/[0.06] hover:border-white/[0.15]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
                        <span className={`font-bold ${vColor}`}>{node.details.vendor}</span>
                        <span className="text-white/40">Line {node.details.line}</span>
                      </div>
                      <div className="font-mono text-xs text-white/90 truncate">
                        {node.details.full_text || node.label}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Column 2: Canonical Security Properties */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-white uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
                <Layers size={13} />
                <span>Tier 2: Unified Security Properties</span>
              </div>
              <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
                {propertyNodes.map((node) => {
                  const isSelected = selectedNode?.id === node.id;

                  return (
                    <motion.div
                      key={node.id}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => setSelectedNode(node)}
                      className={`p-3.5 rounded-xl bg-black/60 border cursor-pointer transition-all ${
                        isSelected
                          ? 'ring-1 ring-white border-white bg-white/[0.08]'
                          : 'border-white/[0.06] hover:border-white/[0.15]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-white mb-1 font-mono">
                        <span>{node.details.name || node.details.property_id}</span>
                        <span className="badge badge-white text-[9px] py-0 px-1.5">{node.details.state}</span>
                      </div>
                      <div className="text-[11px] font-mono text-zinc-300">{node.details.property_id}</div>
                      <div className="text-[10px] text-white/40 mt-1 font-mono">Category: {node.details.category}</div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Column 3: Compliance Controls */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
                <BookOpen size={13} />
                <span>Tier 3: Authoritative Controls</span>
              </div>
              <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
                {controlNodes.map((node) => {
                  const isSelected = selectedNode?.id === node.id;

                  return (
                    <motion.div
                      key={node.id}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => setSelectedNode(node)}
                      className={`p-3.5 rounded-xl bg-black/60 border cursor-pointer transition-all ${
                        isSelected
                          ? 'ring-1 ring-white border-white bg-white/[0.08]'
                          : 'border-white/[0.06] hover:border-white/[0.15]'
                      }`}
                    >
                      <div className="font-bold text-xs text-white mb-1">{node.label}</div>
                      <div className="flex flex-wrap items-center gap-1 text-[10px] text-white/50 font-mono mt-1.5">
                        <span className="badge badge-pass text-[9px] py-0 px-1.5">{node.details.severity}</span>
                        <span className="text-white/40">{node.details.refs?.join(' &middot; ')}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected Node Details Drawer */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="minimal-panel p-6 border-white/[0.12] space-y-4 bg-[#08080c]"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
                <Info size={16} className="text-cyan-400" />
                Topology Inspector: <span className="text-cyan-400">{selectedNode.label}</span>
              </h4>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1.5 rounded-lg bg-white/[0.05] text-white/60 hover:text-white transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-3.5 rounded-lg bg-black/60 border border-white/[0.06]">
                <span className="text-white/40 block text-[10px] uppercase">Node Type:</span>
                <span className="text-white font-bold">{selectedNode.type}</span>
              </div>
              <div className="p-3.5 rounded-lg bg-black/60 border border-white/[0.06]">
                <span className="text-white/40 block text-[10px] uppercase">Node ID:</span>
                <span className="text-cyan-400 font-bold">{selectedNode.id}</span>
              </div>
              <div className="p-3.5 rounded-lg bg-black/60 border border-white/[0.06]">
                <span className="text-white/40 block text-[10px] uppercase">Equivalence Metadata:</span>
                <span className="text-white/80">{JSON.stringify(selectedNode.details)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EquivalenceGraphTab;
