import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Shield, RefreshCw, X, Info, GitFork, BookOpen } from 'lucide-react';
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
      const targetId = auditId || 1;
      const data = await auditService.getEquivalenceGraph(targetId);
      setGraphData(data && data.nodes ? data : { nodes: [], edges: [], summary: {} });
    } catch (err) {
      console.error('Failed to load equivalence graph', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, [auditId]);

  const vendorNodes = (graphData.nodes || []).filter(
    (n) =>
      (n.type === 'vendor_command' || n.type === 'syntax') &&
      (activeVendorFilter === 'ALL' || (n.details?.vendor && n.details.vendor.toLowerCase().includes(activeVendorFilter.toLowerCase())))
  );

  const propertyNodes = (graphData.nodes || []).filter(
    (n) =>
      (n.type === 'security_property' || n.type === 'property') &&
      (activeCategoryFilter === 'ALL' || (n.details?.category && n.details.category.toLowerCase().includes(activeCategoryFilter.toLowerCase())))
  );

  const controlNodes = (graphData.nodes || []).filter(
    (n) => n.type === 'compliance_control' || n.type === 'control'
  );

  const categories = ['ALL', 'Management', 'Authentication', 'Logging', 'Time', 'SNMP', 'Service'];

  return (
    <div className="space-y-6 animate-fadeIn text-slate-800">
      {/* Header Info */}
      <div className="rounded-xl p-5 bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                Equivalence Graph
              </span>
              <h2 className="text-lg font-bold text-slate-900 font-display">
                Cross-Vendor Security Equivalence &amp; Mapping Graph
              </h2>
            </div>
            <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
              Visualizes how disparate Cisco, Juniper, and Fortinet commands converge into unified canonical properties and map to standards.
            </p>
          </div>

          <button
            onClick={fetchGraph}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold self-start md:self-auto transition-all border border-slate-200 shadow-xs"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Topology</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-4 pt-2.5 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-mono text-[11px]">Vendor:</span>
            {['ALL', 'Cisco', 'Juniper', 'Fortinet'].map((v) => (
              <button
                key={v}
                onClick={() => setActiveVendorFilter(v)}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                  activeVendorFilter === v
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-mono text-[11px]">Category:</span>
            <select
              value={activeCategoryFilter}
              onChange={(e) => setActiveCategoryFilter(e.target.value)}
              className="text-xs px-2.5 py-1 font-mono bg-white border border-slate-300 rounded text-slate-800 shadow-xs focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c} className="bg-white text-slate-900">
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3-Tier Convergent Hierarchy Visualizer */}
      <div className="rounded-xl p-5 bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 pb-2.5 border-b border-slate-100 font-mono">
          <div className="font-semibold text-slate-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Tier 1: Vendor CLI ({vendorNodes.length})
          </div>
          <div className="font-semibold text-slate-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-700" />
            Tier 2: Unified Properties ({propertyNodes.length})
          </div>
          <div className="font-semibold text-slate-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Tier 3: Compliance Controls ({controlNodes.length})
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-mono bg-slate-50 rounded-lg">
            Generating semantic equivalence graph topology...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 relative">
            {/* Column 1: Vendor Commands */}
            <div className="space-y-2.5">
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 font-mono flex items-center gap-1.5">
                <GitFork size={13} />
                <span>Tier 1: Vendor CLI Syntax</span>
              </div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {vendorNodes.map((node) => {
                  const isSelected = selectedNode?.id === node.id;

                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'ring-2 ring-emerald-500 border-emerald-300 bg-emerald-50/40'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
                        <span className="font-bold text-slate-800">{node.details?.vendor || 'Vendor CLI'}</span>
                        <span className="text-slate-400">Line {node.details?.line || 1}</span>
                      </div>
                      <div className="font-mono text-xs text-slate-900 truncate">
                        {node.details?.full_text || node.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Column 2: Canonical Security Properties */}
            <div className="space-y-2.5">
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 font-mono flex items-center gap-1.5">
                <Layers size={13} />
                <span>Tier 2: Unified Properties</span>
              </div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {propertyNodes.map((node) => {
                  const isSelected = selectedNode?.id === node.id;

                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'ring-2 ring-emerald-500 border-emerald-300 bg-emerald-50/40'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900 mb-1 font-mono">
                        <span>{node.details?.name || node.details?.property_id || node.label}</span>
                        <span className="px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 text-[10px]">{node.details?.state || 'ACTIVE'}</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-600">{node.details?.property_id || node.id}</div>
                      <div className="text-[10px] text-slate-400 mt-1 font-mono">Category: {node.details?.category || 'General'}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Column 3: Compliance Controls */}
            <div className="space-y-2.5">
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 font-mono flex items-center gap-1.5">
                <BookOpen size={13} />
                <span>Tier 3: Compliance Controls</span>
              </div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {controlNodes.map((node) => {
                  const isSelected = selectedNode?.id === node.id;

                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'ring-2 ring-emerald-500 border-emerald-300 bg-emerald-50/40'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60'
                      }`}
                    >
                      <div className="font-bold text-xs text-slate-900 mb-1">{node.label}</div>
                      <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-500 font-mono mt-1">
                        <span className="px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 text-[9px] font-bold">{node.details?.severity || 'HIGH'}</span>
                        <span className="text-slate-500">{node.details?.refs ? node.details.refs.join(' · ') : (node.details?.framework || 'CIS / NIST')}</span>
                      </div>
                    </div>
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
            className="rounded-xl p-5 border border-slate-200 bg-white shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 font-mono">
                <Info size={15} className="text-slate-700" />
                Topology Inspector: <span className="text-emerald-700">{selectedNode.label}</span>
              </h4>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded bg-slate-100 text-slate-500 hover:text-slate-900"
              >
                <X size={15} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase">Node Type:</span>
                <span className="text-slate-900 font-bold">{selectedNode.type}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase">Node ID:</span>
                <span className="text-slate-900 font-bold">{selectedNode.id}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase">Details:</span>
                <span className="text-slate-700 truncate block">{JSON.stringify(selectedNode.details)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EquivalenceGraphTab;
