import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileCode,
  Check,
  AlertCircle,
  X,
  Shield,
  Server,
  Eye,
  FileText,
  Hash,
  Cpu,
  Layers,
  Sparkles,
  Terminal,
  Code
} from 'lucide-react';
import { auditService } from '../services/api';

const VENDOR_SAMPLE_CLIS = {
  cisco: {
    vendor: 'Cisco IOS-XE',
    role: 'Core Enterprise Backbone',
    code: `! Cisco IOS-XE Secure Configuration Archetype
service password-encryption
service timestamps log datetime msec
username secadmin privilege 15 secret 9 $9$x9B7...
enable secret 9 $9$mK82...
!
ip ssh version 2
ip ssh time-out 60
ip ssh authentication-retries 3
line vty 0 4
 transport input ssh
 exec-timeout 10 0
 login local
!
logging buffered 64000
logging host 192.168.10.50
logging trap notifications
!
ntp server 192.168.10.10 prefer
snmp-server group SECURE_GRP v3 priv
snmp-server user sec-admin SECURE_GRP v3 auth sha StrongAuthPass priv aes 128 StrongPrivPass
no ip http server
no ip http secure-server`
  },
  juniper: {
    vendor: 'Juniper Junos',
    role: 'Edge Distribution Layer',
    code: `# Juniper Junos OS Configuration Archetype
system {
    services {
        ssh {
            protocol-version v2;
            connection-limit 10;
            rate-limit 5;
        }
        web-management {
            http disable;
            https disable;
        }
    }
    login {
        retry-options {
            backoff-threshold 3;
            backoff-factor 5;
            minimum-password-length 12;
        }
    }
    syslog {
        host 192.168.10.50 {
            any notice;
            authorization info;
        }
    }
    ntp {
        server 192.168.10.10 prefer;
    }
}`
  },
  fortinet: {
    vendor: 'Fortinet FortiOS',
    role: 'Perimeter Next-Gen Firewall',
    code: `# Fortinet FortiOS Configuration Archetype
config system global
    set hostname "CORP-FW-01"
    set admin-ssh-port 22
    set admin-idle-timeout 10
    set admin-lockout-threshold 3
    set admin-lockout-duration 600
    set admin-ssh-cipher chacha20-poly1305   # [Novel Dialect Syntax -> Handled by Scikit-Learn TF-IDF AI]
end
config log syslogd setting
    set status enable
    set server "192.168.10.50"
    set mode udp
    set facility local7
end
config system ntp
    set type manual
    set server "192.168.10.10"
end
config system admin
    edit "admin"
        set trusthost1 10.0.0.0 255.0.0.0
    next
end`
  }
};

const IngestionTab = ({ auditData, onAuditCreated, onLoadDemo, loadingDemo }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [vendorOverride, setVendorOverride] = useState('Auto');
  const [uploading, setUploading] = useState(false);
  const [previewDevice, setPreviewDevice] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [activeVendorSample, setActiveVendorSample] = useState('cisco');

  const handleFileChange = (e) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });
      if (vendorOverride !== 'Auto') {
        formData.append('vendor', vendorOverride);
      }

      const res = await auditService.uploadConfigs(formData);
      onAuditCreated(res.audit_id);
      setSelectedFiles([]);
    } catch (err) {
      console.error('Upload failed', err);
      alert('Upload failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleInspectDevice = async (deviceId) => {
    setPreviewLoading(true);
    try {
      const devDetails = await auditService.getDeviceDetails(deviceId);
      setPreviewDevice(devDetails);
    } catch (err) {
      console.error('Failed to load device details', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const devices = auditData?.devices || [];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Workflow Stage Banner */}
      <div className="minimal-panel p-6 border-white/[0.08] relative overflow-hidden bg-gradient-to-r from-[#07070a] via-[#0d0d14] to-[#07070a]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="badge badge-cyan text-[10px] tracking-wider uppercase font-mono">
                SIH26155 &middot; Stages 01 & 02
              </span>
              <span className="badge badge-white text-[10px] font-mono">
                Cryptographic Ingestion &amp; Signature Detection
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight pt-1">
              Multi-Vendor CLI Configuration Ingestion
            </h2>
            <p className="text-xs text-white/50 max-w-3xl leading-relaxed">
              Upload raw configuration dumps from heterogeneous enterprise networking equipment. Raw text is hashed with
              SHA-256 for chain-of-custody non-repudiation, partitioned into hierarchical fragments, and mapped into vendor-neutral canonical security properties.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.08] text-[11px] font-mono text-white/60">
              <Hash size={12} className="text-white/40" />
              <span>SHA-256 Integrity Verification Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Zone & Pre-Configured Demo Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Dropzone */}
        <div className="lg:col-span-8 minimal-panel p-6 border-white/[0.08] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Upload size={16} className="text-white" />
                Upload Configuration Files
              </h3>
              <p className="text-xs text-white/40 mt-0.5">
                Cisco IOS/IOS-XE (.cfg, .ios), Juniper Junos (.conf, .set), Fortinet FortiOS (.conf, .txt)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40 font-mono">Vendor Detection:</span>
              <select
                value={vendorOverride}
                onChange={(e) => setVendorOverride(e.target.value)}
                className="minimal-input text-xs px-2.5 py-1 font-mono text-white/80 bg-black/60 border-white/[0.12]"
              >
                <option value="Auto">Auto-Detect Signatures</option>
                <option value="Cisco">Force Cisco IOS-XE</option>
                <option value="Juniper">Force Juniper Junos</option>
                <option value="Fortinet">Force Fortinet FortiOS</option>
              </select>
            </div>
          </div>

          <label className="block border border-dashed border-white/[0.15] hover:border-white/50 rounded-xl p-8 text-center cursor-pointer transition-all bg-black/40 hover:bg-white/[0.02] group">
            <input
              type="file"
              multiple
              accept=".cfg,.conf,.txt,.ios,.set"
              onChange={handleFileChange}
              className="hidden"
            />
            <FileCode size={36} className="mx-auto text-white/30 group-hover:text-white transition-colors mb-3" />
            <div className="text-sm font-medium text-white/90 group-hover:text-white">
              Click to select or drag &amp; drop configuration files
            </div>
            <p className="text-xs text-white/40 mt-1 font-mono">
              Accepted: .cfg &middot; .conf &middot; .txt &middot; .ios &middot; .set (Immediate SHA-256 hashing)
            </p>
          </label>

          {/* Staged files list */}
          {selectedFiles.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="text-xs font-semibold text-white/60 font-mono">
                Staged for Parsing ({selectedFiles.length} files):
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedFiles.map((file, idx) => (
                  <span key={idx} className="badge badge-white text-xs py-1 px-3 flex items-center gap-2 font-mono">
                    <FileText size={12} className="text-cyan-400" />
                    {file.name}
                    <span className="text-[10px] text-white/40">({(file.size / 1024).toFixed(1)} KB)</span>
                  </span>
                ))}
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="px-5 py-2 rounded-full bg-white text-black font-semibold text-xs hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Parsing &amp; Normalizing Fleet...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Ingest &amp; Execute Audit Pipeline</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pre-Configured Demo Fleet Card */}
        <div className="lg:col-span-4 minimal-panel p-6 border-white/[0.08] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Server size={16} className="text-white" />
                SIH26155 Benchmark Fleet
              </h3>
              <span className="badge badge-pass text-[9px] font-mono">4 Devices</span>
            </div>
            <p className="text-xs text-white/50 mt-1.5 leading-relaxed">
              Instantly ingest the authentic multi-vendor enterprise test suite configured with genuine production-grade CLI samples.
            </p>

            <div className="space-y-2 mt-4 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-black/60 border border-white/[0.06] text-white/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  <span>cisco_core_router.cfg</span>
                </div>
                <span className="badge badge-white text-[9px]">Cisco IOS-XE</span>
              </div>
              <div className="p-2.5 rounded-lg bg-black/60 border border-white/[0.06] text-white/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                  <span>juniper_edge_switch.conf</span>
                </div>
                <span className="badge badge-white text-[9px]">Juniper Junos</span>
              </div>
              <div className="p-2.5 rounded-lg bg-black/60 border border-white/[0.06] text-white/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>fortinet_firewall.conf</span>
                </div>
                <span className="badge badge-inc text-[9px]">FortiOS Novel Dialect</span>
              </div>
              <div className="p-2.5 rounded-lg bg-black/60 border border-white/[0.06] text-white/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span>cisco_legacy_vulnerable.cfg</span>
                </div>
                <span className="badge badge-fail text-[9px]">Legacy Non-Compliant</span>
              </div>
            </div>
          </div>

          <button
            onClick={onLoadDemo}
            disabled={loadingDemo}
            className="w-full py-2.5 rounded-full bg-white text-black font-semibold text-xs hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all text-center flex items-center justify-center gap-2"
          >
            {loadingDemo ? (
              <>
                <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Auditing Heterogeneous Fleet...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Load Benchmark Demo Fleet</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Real CLI Archetype Inspector */}
      <div className="minimal-panel p-6 border-white/[0.08] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Terminal size={16} className="text-cyan-400" />
              Vendor CLI Syntax Archetypes (Supported Grammar)
            </h3>
            <p className="text-xs text-white/40 mt-0.5">
              Inspect how Argus parses vendor-specific commands into vendor-neutral canonical security properties.
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-black/60 border border-white/[0.08]">
            {Object.keys(VENDOR_SAMPLE_CLIS).map((key) => {
              const sample = VENDOR_SAMPLE_CLIS[key];
              const isActive = activeVendorSample === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveVendorSample(key)}
                  className={`px-3 py-1 rounded-md text-xs font-mono transition-all ${
                    isActive
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {sample.vendor}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-[#040407] rounded-xl p-4 border border-white/[0.08] font-mono text-xs overflow-x-auto relative">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06] text-white/40 text-[11px]">
            <span>Role: <strong className="text-white/80">{VENDOR_SAMPLE_CLIS[activeVendorSample].role}</strong></span>
            <span className="text-cyan-400">Lexical Sectional Parser Active</span>
          </div>
          <pre className="text-white/80 leading-relaxed font-mono whitespace-pre overflow-x-auto">
            {VENDOR_SAMPLE_CLIS[activeVendorSample].code}
          </pre>
        </div>
      </div>

      {/* Ingested Fleet Inventory Table */}
      <div className="minimal-panel p-6 border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Server size={16} className="text-cyan-400" />
              Active Fleet Device Inventory ({devices.length})
            </h3>
            <p className="text-xs text-white/40 mt-0.5">
              All parsed network appliances with detection certainty scores and SHA-256 audit signatures.
            </p>
          </div>
        </div>

        {devices.length === 0 ? (
          <div className="p-12 text-center text-white/40 text-xs italic">
            No devices ingested in current audit session. Upload files or load demo fleet above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] text-white/40 font-mono uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Hostname</th>
                  <th className="py-3 px-4">Detected Vendor</th>
                  <th className="py-3 px-4">Platform OS</th>
                  <th className="py-3 px-4">Detection Confidence</th>
                  <th className="py-3 px-4">Cryptographic SHA-256</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {devices.map((d) => (
                  <tr key={d.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white font-mono">{d.hostname}</td>
                    <td className="py-3.5 px-4">
                      <span className="badge badge-white font-mono text-[10px]">{d.vendor}</span>
                    </td>
                    <td className="py-3.5 px-4 text-white/70 font-mono">{d.platform}</td>
                    <td className="py-3.5 px-4 font-mono font-bold">
                      <span className={d.confidence >= 0.9 ? 'text-emerald-400' : 'text-amber-400'}>
                        {(d.confidence * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-white/40">
                      {d.source_file_hash ? d.source_file_hash.substring(0, 18) + '...' : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleInspectDevice(d.id)}
                        className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-white text-xs font-medium inline-flex items-center gap-1.5 transition-all"
                      >
                        <Eye size={12} className="text-cyan-400" />
                        <span>Inspect Raw &amp; Properties</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Raw Configuration & Fragment Inspector Modal */}
      <AnimatePresence>
        {previewDevice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="minimal-panel w-full max-w-4xl max-h-[85vh] flex flex-col border-white/[0.12] p-6 overflow-hidden bg-[#08080c]"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                <div>
                  <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                    <Server size={16} className="text-cyan-400" />
                    {previewDevice.hostname} &mdash; Normalized Audit State
                  </h3>
                  <div className="text-xs text-white/50 flex items-center gap-3 pt-1 font-mono">
                    <span>Vendor: <strong className="text-white">{previewDevice.vendor}</strong></span>
                    <span>&bull;</span>
                    <span>Platform: <strong className="text-white">{previewDevice.platform}</strong></span>
                    <span>&bull;</span>
                    <span>Properties Extracted: <strong className="text-emerald-400">{previewDevice.properties?.length || 0}</strong></span>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewDevice(null)}
                  className="p-1.5 rounded-lg bg-white/[0.05] text-white/60 hover:text-white transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="overflow-y-auto my-4 space-y-5 pr-1">
                <div>
                  <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2 font-mono">
                    Canonical Normalized Security Properties (Stage 04)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {previewDevice.properties?.map((p) => (
                      <div key={p.id} className="p-3 rounded-lg bg-black/60 border border-white/[0.06] flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <span className="font-mono text-cyan-400 font-medium">{p.property_id}</span>
                          <div className="text-[10px] text-white/40 truncate max-w-[240px]">
                            {p.raw_text || '// extracted property'}
                          </div>
                        </div>
                        <span className={`badge ${p.state === 'UNKNOWN' ? 'badge-inc' : 'badge-pass'} text-[9px] font-mono py-0.5 px-2`}>
                          {p.state}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2 font-mono">
                    Raw Configuration Source Code (With Line Numbers)
                  </h4>
                  <div className="bg-[#030306] rounded-xl p-4 font-mono text-xs text-white/80 leading-relaxed overflow-x-auto border border-white/[0.08] max-h-[300px]">
                    <pre>{previewDevice.raw_content}</pre>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex justify-end">
                <button
                  onClick={() => setPreviewDevice(null)}
                  className="px-4 py-2 rounded-full bg-white text-black font-semibold text-xs hover:bg-white/90 transition-all"
                >
                  Close Inspector
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IngestionTab;
