import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Shield,
  Terminal,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Copy,
  Check,
  Cpu,
  BookOpen,
  Layers
} from 'lucide-react';
import { auditService } from '../services/api';

const REMEDIATION_OPTIONS = [
  {
    id: 'mgmt.ssh_only',
    val: 'SSH_ONLY',
    label: 'Enforce SSH-Only Remote Access',
    desc: 'Prohibit Telnet and mandate SSH v2 cryptographic cipher suites',
    frameworks: 'CIS 1.1 &middot; NIST AC-17 &middot; DISA NET-0420 &middot; ISO A.9.4.2 &middot; NCIIPC Sec 4.2'
  },
  {
    id: 'mgmt.timeout',
    val: 'RESTRICTED',
    label: 'Session Idle Timeout <= 10 Minutes',
    desc: 'Configure console and VTY exec-timeout to terminate idle sessions',
    frameworks: 'CIS 1.2 &middot; NIST AC-11 &middot; DISA NET-0430 &middot; ISO A.11.2.8 &middot; NCIIPC Sec 4.3'
  },
  {
    id: 'auth.password_complexity',
    val: 'TRUE',
    label: 'Enforce Password Complexity & Length',
    desc: 'Require minimum 12-char length, uppercase, lowercase, and special characters',
    frameworks: 'CIS 2.1 &middot; NIST IA-2 &middot; DISA NET-0810 &middot; ISO A.9.4.3 &middot; NCIIPC Sec 3.1'
  },
  {
    id: 'auth.root_auth',
    val: 'REQUIRED',
    label: 'Privileged Root / Secret Authentication',
    desc: 'Enforce cryptographic Type 9/scrypt enable secret instead of legacy MD5/plaintext',
    frameworks: 'CIS 2.2 &middot; NIST IA-5 &middot; DISA NET-0820 &middot; ISO A.9.2.3 &middot; NCIIPC Sec 3.2'
  },
  {
    id: 'logging.central',
    val: 'CENTRAL_ENABLED',
    label: 'Central Syslog SIEM Event Forwarding',
    desc: 'Stream security events to authoritative central logging collector',
    frameworks: 'CIS 3.1 &middot; NIST AU-2 &middot; DISA NET-1620 &middot; ISO A.12.4.1 &middot; NCIIPC Sec 5.1'
  },
  {
    id: 'time.ntp',
    val: 'NTP_ENABLED',
    label: 'Authoritative NTP Time Synchronization',
    desc: 'Sync hardware clock with redundant stratum time servers for log correlation',
    frameworks: 'CIS 3.2 &middot; NIST AU-8 &middot; DISA NET-1630 &middot; ISO A.12.4.4 &middot; NCIIPC Sec 5.2'
  },
  {
    id: 'snmp.secure',
    val: 'SECURE',
    label: 'Mandate Encrypted SNMPv3 Priv/Auth Only',
    desc: 'Eliminate plaintext SNMP v1/v2c community strings fleet-wide',
    frameworks: 'CIS 4.1 &middot; NIST SC-8 &middot; DISA NET-2010 &middot; ISO A.13.1.1 &middot; NCIIPC Sec 6.1'
  },
  {
    id: 'svc.insecure_services',
    val: 'DISABLED',
    label: 'Disable Insecure Daemons (HTTP / Telnet)',
    desc: 'Disable unencrypted HTTP server and unauthenticated auxiliary management',
    frameworks: 'CIS 5.1 &middot; NIST CM-7 &middot; DISA NET-2410 &middot; ISO A.12.5.1 &middot; NCIIPC Sec 7.1'
  }
];

const SimulatorTab = ({ devices = [] }) => {
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [simulatedChanges, setSimulatedChanges] = useState({
    'mgmt.ssh_only': 'SSH_ONLY',
    'mgmt.timeout': 'RESTRICTED',
    'logging.central': 'CENTRAL_ENABLED',
    'svc.insecure_services': 'DISABLED'
  });
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (devices.length > 0 && !selectedDeviceId) {
      const legacyDev = devices.find(
        (d) => d.hostname.toLowerCase().includes('legacy') || d.hostname.toLowerCase().includes('vulnerable')
      );
      setSelectedDeviceId(String(legacyDev ? legacyDev.id : devices[0].id));
    }
  }, [devices]);

  const togglePropertyProposal = (propId, targetVal) => {
    setSimulatedChanges((prev) => {
      const next = { ...prev };
      if (next[propId]) {
        delete next[propId];
      } else {
        next[propId] = targetVal;
      }
      return next;
    });
  };

  const handleRunSimulation = async () => {
    if (!selectedDeviceId) return;
    setSimulating(true);

    try {
      const res = await auditService.runSimulation({
        device_id: Number(selectedDeviceId),
        proposed_changes: simulatedChanges
      });
      setSimResult(res);
    } catch (err) {
      console.error('Simulation failed', err);
      alert('Simulation failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSimulating(false);
    }
  };

  useEffect(() => {
    if (selectedDeviceId) {
      handleRunSimulation();
    }
  }, [selectedDeviceId]);

  const handleCopyScript = () => {
    if (simResult?.generated_cli_script) {
      navigator.clipboard.writeText(simResult.generated_cli_script);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Info */}
      <div className="minimal-panel p-6 border-white/[0.08] relative overflow-hidden bg-gradient-to-r from-[#07070a] via-[#0d0d14] to-[#07070a]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="badge badge-cyan text-[10px] tracking-wider uppercase font-mono">
                SIH26155 &middot; DIF-04
              </span>
              <span className="badge badge-white text-[10px] font-mono">
                Counterfactual Remediation Simulator
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight pt-1">
              Zero-Risk Dry-Run &ldquo;What-If&rdquo; Security Simulator
            </h2>
            <p className="text-xs text-white/50 max-w-3xl leading-relaxed">
              Predicts exact compliance score improvements and control transitions across CIS Benchmarks, NIST SP 800-53,
              DISA STIGs, ISO/IEC 27001, and NCIIPC directives before deploying changes. Synthesizes vendor-specific CLI configuration
              remediation scripts (Cisco, Juniper, Fortinet) without touching live hardware.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.08] text-[11px] font-mono text-white/60">
              <Shield size={12} className="text-emerald-400" />
              <span>Offline Dry-Run Sandbox</span>
            </div>
          </div>
        </div>
      </div>

      {/* Simulator Control Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Device Selection & Remediation Fix Toggles */}
        <div className="lg:col-span-5 minimal-panel p-6 border-white/[0.08] space-y-5">
          <div>
            <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2 font-mono">
              Target Network Appliance:
            </label>
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="minimal-input w-full p-2.5 text-xs font-mono bg-black/70 border-white/[0.12] text-white"
            >
              {devices.map((d) => (
                <option key={d.id} value={String(d.id)} className="bg-[#0e0e14]">
                  {d.hostname} &mdash; {d.vendor} ({d.platform})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-white/60 uppercase tracking-wider font-mono">
                Select Counterfactual Fixes:
              </label>
              <span className="text-[11px] text-cyan-400 font-mono">
                {Object.keys(simulatedChanges).length} active proposals
              </span>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {REMEDIATION_OPTIONS.map((opt) => {
                const isChecked = !!simulatedChanges[opt.id];
                return (
                  <div
                    key={opt.id}
                    onClick={() => togglePropertyProposal(opt.id, opt.val)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      isChecked
                        ? 'bg-white/[0.06] border-white/30 text-white'
                        : 'bg-black/40 border-white/[0.06] text-white/50 hover:border-white/[0.12]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="mt-0.5 accent-white rounded"
                    />
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-white">{opt.label}</div>
                      <div className="text-[11px] text-white/50 leading-relaxed">{opt.desc}</div>
                      <div
                        className="text-[10px] text-cyan-400/80 font-mono pt-0.5"
                        dangerouslySetInnerHTML={{ __html: opt.frameworks }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleRunSimulation}
            disabled={simulating}
            className="w-full py-2.5 rounded-full bg-white text-black font-semibold text-xs hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all flex items-center justify-center gap-2"
          >
            {simulating ? 'Computing Counterfactual Delta...' : 'Run Dry-Run Remediation Simulation'}
          </button>
        </div>

        {/* Right: Simulation Delta Scorecard & Generated CLI Script */}
        <div className="lg:col-span-7 space-y-6">
          {simResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              {/* Scorecard Hero */}
              <div className="minimal-panel p-6 border-white/[0.08] bg-[#07070b]">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 font-mono">
                      Predicted Posture Trajectory
                    </span>
                    <div className="flex items-baseline gap-3 mt-1 font-mono">
                      <span className="text-3xl font-bold text-white/40">
                        {simResult.summary.before_score}%
                      </span>
                      <ArrowRight size={20} className="text-emerald-400" />
                      <span className="text-4xl font-extrabold text-white">
                        {simResult.summary.after_score}%
                      </span>
                      <span className="badge badge-pass text-xs font-mono ml-2">
                        +{simResult.summary.score_gain}% Projected Gain
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="badge badge-white text-[10px] font-mono py-1 px-3">
                      ZERO HARDWARE RISK &middot; DRY-RUN
                    </span>
                    <div className="text-xs text-white/50 font-mono mt-1">
                      {simResult.summary.controls_fixed} Violations Eliminated
                    </div>
                  </div>
                </div>
              </div>

              {/* Control Deltas Table */}
              <div className="minimal-panel p-6 border-white/[0.08] space-y-3">
                <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider font-mono">
                  Predicted Control State Transitions
                </h4>
                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                  {simResult.control_deltas?.map((delta, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                        delta.is_improved
                          ? 'bg-emerald-500/[0.04] border-emerald-500/30'
                          : 'bg-black/60 border-white/[0.06]'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-white font-mono">
                          {delta.control_code}: {delta.control_name}
                        </div>
                        <div className="text-[10px] text-white/40 font-mono">
                          Canonical Property: {delta.property_id}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 font-mono font-bold text-xs">
                        <span className={delta.status_before === 'PASS' ? 'text-emerald-400' : 'text-rose-400'}>
                          {delta.status_before}
                        </span>
                        <ArrowRight size={12} className="text-white/40" />
                        <span className={delta.status_after === 'PASS' ? 'text-emerald-400' : 'text-rose-400'}>
                          {delta.status_after}
                        </span>
                        {delta.is_improved && (
                          <span className="badge badge-pass text-[9px] py-0 px-1.5 ml-1">REMEDIATED</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Generated Vendor CLI Remediation Script */}
              <div className="minimal-panel p-6 border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <Terminal size={14} className="text-white/70" />
                    Synthesized CLI Remediation Script ({simResult.vendor} Native Syntax)
                  </h4>
                  <button
                    onClick={handleCopyScript}
                    className="px-3 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs flex items-center gap-1.5 transition-all font-mono"
                  >
                    {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copied ? 'Copied to Clipboard!' : 'Copy Script'}</span>
                  </button>
                </div>

                <div className="bg-[#040407] p-4 rounded-xl font-mono text-xs text-emerald-400/90 leading-relaxed border border-white/[0.08] max-h-[220px] overflow-y-auto">
                  <pre>{simResult.generated_cli_script || '// No proposed changes active'}</pre>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimulatorTab;
