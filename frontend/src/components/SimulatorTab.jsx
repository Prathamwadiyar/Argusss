import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Shield,
  Terminal,
  ArrowRight,
  CheckCircle,
  Copy,
  Check,
  RotateCcw
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
    'auth.password_complexity': 'TRUE',
    'auth.root_auth': 'REQUIRED',
    'logging.central': 'CENTRAL_ENABLED',
    'time.ntp': 'NTP_ENABLED',
    'snmp.secure': 'SECURE',
    'svc.insecure_services': 'DISABLED'
  });
  const [simResult, setSimResult] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [scriptTab, setScriptTab] = useState('remediation'); // 'remediation' | 'rollback'

  const activeDevices = devices && devices.length > 0 ? devices : [
    { id: 1, hostname: 'CORE-RTR-01', vendor: 'Cisco', platform: 'IOS-XE' },
    { id: 2, hostname: 'EDGE-SW-01', vendor: 'Juniper', platform: 'Junos' },
    { id: 3, hostname: 'DC-FW-01', vendor: 'Fortinet', platform: 'FortiOS' },
    { id: 4, hostname: 'LEGACY-RTR-02', vendor: 'Cisco', platform: 'IOS-Legacy' }
  ];

  useEffect(() => {
    if (activeDevices.length > 0 && !selectedDeviceId) {
      const vulnerable = activeDevices.find((d) => d.hostname.toLowerCase().includes('vulnerable') || d.hostname.toLowerCase().includes('legacy'));
      setSelectedDeviceId(String(vulnerable ? vulnerable.id : activeDevices[0].id));
    }
  }, [activeDevices, selectedDeviceId]);

  const togglePropertyProposal = (propId, val) => {
    setSimulatedChanges((prev) => {
      const next = { ...prev };
      if (next[propId]) {
        delete next[propId];
      } else {
        next[propId] = val;
      }
      return next;
    });
  };

  const handleRunSimulation = async () => {
    const devId = selectedDeviceId || (activeDevices[0] ? String(activeDevices[0].id) : '1');
    setSimulating(true);
    try {
      const res = await auditService.simulateRemediation({
        device_id: Number(devId),
        proposed_changes: simulatedChanges,
      });
      setSimResult(res);
    } catch (err) {
      console.error('Simulation failed', err);
    } finally {
      setSimulating(false);
    }
  };

  useEffect(() => {
    if (selectedDeviceId || activeDevices.length > 0) {
      handleRunSimulation();
    }
  }, [selectedDeviceId, activeDevices.length]);

  const handleCopyScript = () => {
    const scriptText = scriptTab === 'remediation'
      ? (simResult?.generated_cli_script || simResult?.remediation_script || '')
      : (simResult?.generated_rollback_script || simResult?.rollback_script || '');

    if (scriptText) {
      navigator.clipboard.writeText(scriptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-800">
      {/* Header Info */}
      <div className="rounded-xl p-5 bg-white border border-slate-200 shadow-sm space-y-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                Remediation Simulator
              </span>
              <h2 className="text-lg font-bold text-slate-900 font-display">
                Dry-Run &ldquo;What-If&rdquo; Security Simulator
              </h2>
            </div>
            <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
              Predict compliance score improvements and control transitions across CIS, NIST, DISA, and ISO
              before applying changes. Synthesizes vendor-specific CLI configuration remediation scripts without risk to live hardware.
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-700 font-medium self-start md:self-auto">
            <Shield size={13} className="text-emerald-600" />
            <span>Zero-Risk Local Sandbox</span>
          </div>
        </div>
      </div>

      {/* Simulator Control Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Device Selection & Remediation Fix Toggles */}
        <div className="lg:col-span-5 rounded-xl p-5 bg-white border border-slate-200 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
              Target Network Appliance:
            </label>
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="w-full p-2 text-xs font-mono bg-white border border-slate-300 text-slate-900 rounded-lg shadow-xs focus:outline-none"
            >
              {activeDevices.map((d) => (
                <option key={d.id} value={String(d.id)} className="bg-white text-slate-900">
                  {d.hostname} &mdash; {d.vendor} ({d.platform})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono">
                Select Proposed Fixes:
              </label>
              <span className="text-[11px] text-emerald-700 font-mono font-medium">
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
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-2.5 ${isChecked
                        ? 'bg-emerald-50/50 border-emerald-300 text-slate-900'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => { }}
                      className="mt-0.5 accent-emerald-600 rounded"
                    />
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-slate-900">{opt.label}</div>
                      <div className="text-[11px] text-slate-600 leading-tight">{opt.desc}</div>
                      <div
                        className="text-[10px] text-slate-500 font-mono pt-0.5"
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
            className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
          >
            {simulating ? 'Computing Counterfactual Delta...' : 'Run Dry-Run Simulation'}
          </button>
        </div>

        {/* Right: Simulation Delta Scorecard & Generated CLI Script */}
        <div className="lg:col-span-7 space-y-5">
          {simResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-5"
            >
              {/* Scorecard Hero */}
              <div className="rounded-xl p-5 bg-white border border-slate-200 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                      Predicted Compliance Trajectory
                    </span>
                    <div className="flex items-baseline gap-3 mt-1 font-mono">
                      <span className="text-3xl font-bold text-slate-400">
                        {simResult.summary.before_score}%
                      </span>
                      <ArrowRight size={18} className="text-emerald-600" />
                      <span className="text-3xl font-extrabold text-slate-900">
                        {simResult.summary.after_score}%
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 ml-1">
                        +{simResult.summary.score_gain}% Gain
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-mono font-semibold">
                      SAFE DRY-RUN
                    </span>
                    <div className="text-xs text-slate-600 font-mono mt-1">
                      {simResult.summary.controls_fixed} Violations Remediated
                    </div>
                  </div>
                </div>
              </div>

              {/* Control Deltas Table */}
              <div className="rounded-xl p-5 bg-white border border-slate-200 shadow-sm space-y-2.5">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono">
                  Predicted Control State Transitions
                </h4>
                <div className="space-y-1.5 max-h-[240px] overflow-y-auto pr-1">
                  {simResult.control_deltas?.map((delta, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-lg border flex items-center justify-between text-xs ${delta.is_improved
                          ? 'bg-emerald-50/60 border-emerald-200'
                          : 'bg-slate-50 border-slate-200'
                        }`}
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900 font-mono">
                          {delta.control_code}: {delta.control_name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Property: {delta.property_id}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 font-mono font-bold text-xs">
                        <span className={delta.status_before === 'PASS' ? 'text-emerald-700' : 'text-rose-700'}>
                          {delta.status_before}
                        </span>
                        <ArrowRight size={12} className="text-slate-400" />
                        <span className={delta.status_after === 'PASS' ? 'text-emerald-700' : 'text-rose-700'}>
                          {delta.status_after}
                        </span>
                        {delta.is_improved && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 ml-1">REMEDIATED</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Synthesized Vendor CLI Script (Remediation & Automated Rollback) */}
              <div className="rounded-xl p-5 bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
                    <button
                      onClick={() => setScriptTab('remediation')}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold font-mono transition-all flex items-center gap-1.5 ${
                        scriptTab === 'remediation'
                          ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Terminal size={13} className={scriptTab === 'remediation' ? 'text-emerald-600' : 'text-slate-400'} />
                      <span>Hardening Remediation Script</span>
                    </button>
                    <button
                      onClick={() => setScriptTab('rollback')}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold font-mono transition-all flex items-center gap-1.5 ${
                        scriptTab === 'rollback'
                          ? 'bg-amber-500 text-white shadow-xs border border-amber-600'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <RotateCcw size={13} className={scriptTab === 'rollback' ? 'text-white' : 'text-amber-500'} />
                      <span>Automated Rollback Script</span>
                    </button>
                  </div>

                  <button
                    onClick={handleCopyScript}
                    className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs flex items-center gap-1.5 transition-all font-mono self-end sm:self-auto"
                  >
                    {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    <span>{copied ? 'Copied!' : scriptTab === 'remediation' ? 'Copy Hardening Script' : 'Copy Rollback Script'}</span>
                  </button>
                </div>

                <div className={`p-4 rounded-lg font-mono text-xs leading-relaxed max-h-[240px] overflow-y-auto ${
                  scriptTab === 'remediation' ? 'bg-slate-900 text-emerald-400' : 'bg-slate-950 text-amber-300 border border-amber-900/40'
                }`}>
                  <pre>
                    {scriptTab === 'remediation'
                      ? (simResult.generated_cli_script || simResult.remediation_script || '// No proposed changes active')
                      : (simResult.generated_rollback_script || simResult.rollback_script || '// No rollback actions generated')}
                  </pre>
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