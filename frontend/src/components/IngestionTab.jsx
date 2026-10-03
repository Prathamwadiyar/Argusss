import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileCode,
  Check,
  X,
  Server,
  Eye,
  FileText,
  Hash,
  Sparkles,
  Terminal
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
    try {
      const devDetails = await auditService.getDeviceDetails(deviceId);
      setPreviewDevice(devDetails);
    } catch (err) {
      console.error('Failed to load device details', err);
    }
  };

  const devices = auditData?.devices || [];

  return (
    <div className="space-y-6 animate-fadeIn text-slate-800">
      {/* Workflow Stage Banner */}
      <div className="rounded-xl p-5 bg-white border border-slate-200 shadow-sm space-y-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                Fleet Ingestion
              </span>
              <h2 className="text-lg font-bold text-slate-900 font-display">
                Multi-Vendor Configuration Ingestion
              </h2>
            </div>
            <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
              Upload raw configuration files from enterprise routers, switches, and firewalls. All files are cryptographically
              hashed with SHA-256 for non-repudiation and parsed into canonical security properties.
            </p>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono font-medium self-start md:self-auto">
            <Hash size={13} className="text-emerald-600" />
            <span>SHA-256 Chain of Custody</span>
          </div>
        </div>
      </div>

      {/* Upload Zone & Pre-Configured Demo Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Dropzone */}
        <div className="lg:col-span-8 rounded-xl p-5 bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 font-mono uppercase tracking-wider">
                <Upload size={15} className="text-slate-700" />
                Upload Configuration Dumps
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cisco IOS/IOS-XE (.cfg), Juniper Junos (.conf, .set), Fortinet FortiOS (.conf, .txt)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-mono">Vendor:</span>
              <select
                value={vendorOverride}
                onChange={(e) => setVendorOverride(e.target.value)}
                className="text-xs px-2.5 py-1 font-mono text-slate-800 bg-white border border-slate-300 rounded shadow-xs focus:outline-none"
              >
                <option value="Auto">Auto-Detect Signatures</option>
                <option value="Cisco">Force Cisco IOS-XE</option>
                <option value="Juniper">Force Juniper Junos</option>
                <option value="Fortinet">Force Fortinet FortiOS</option>
              </select>
            </div>
          </div>

          <label className="block border-2 border-dashed border-slate-300 hover:border-slate-500 rounded-xl p-7 text-center cursor-pointer transition-all bg-slate-50 hover:bg-slate-100/70 group">
            <input
              type="file"
              multiple
              accept=".cfg,.conf,.txt,.ios,.set"
              onChange={handleFileChange}
              className="hidden"
            />
            <FileCode size={32} className="mx-auto text-slate-400 group-hover:text-slate-700 transition-colors mb-2" />
            <div className="text-sm font-medium text-slate-800 group-hover:text-slate-900">
              Click to select or drag &amp; drop configuration files
            </div>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              Accepted: .cfg &middot; .conf &middot; .txt &middot; .ios &middot; .set (Calculates immediate SHA-256)
            </p>
          </label>

          {/* Staged files list */}
          {selectedFiles.length > 0 && (
            <div className="space-y-3 pt-1">
              <div className="text-xs font-semibold text-slate-700 font-mono">
                Staged for Parsing ({selectedFiles.length} files):
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedFiles.map((file, idx) => (
                  <span key={idx} className="bg-slate-100 text-slate-800 border border-slate-200 text-xs py-1 px-2.5 rounded-lg flex items-center gap-1.5 font-mono shadow-xs">
                    <FileText size={12} className="text-slate-600" />
                    {file.name}
                    <span className="text-[10px] text-slate-500">({(file.size / 1024).toFixed(1)} KB)</span>
                  </span>
                ))}
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all flex items-center gap-2 shadow-sm"
                >
                  {uploading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
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

        {/* Pre-Configured Benchmark Fleet Card */}
        <div className="lg:col-span-4 rounded-xl p-5 bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 font-mono uppercase tracking-wider">
                <Server size={15} className="text-slate-700" />
                Benchmark Fleet Suite
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                4 Devices
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              One-click multi-vendor test suite configured with genuine production-grade CLI samples across heterogeneous equipment.
            </p>

            <div className="space-y-1.5 mt-3 text-xs font-mono">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-800 flex items-center justify-between">
                <span className="truncate pr-2">cisco_core_router.cfg</span>
                <span className="px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 text-[10px] shrink-0">Cisco IOS-XE</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-800 flex items-center justify-between">
                <span className="truncate pr-2">juniper_edge_switch.conf</span>
                <span className="px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 text-[10px] shrink-0">Juniper Junos</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-800 flex items-center justify-between">
                <span className="truncate pr-2">fortinet_firewall.conf</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] shrink-0">Fortinet FortiOS</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-800 flex items-center justify-between">
                <span className="truncate pr-2">cisco_legacy_vulnerable.cfg</span>
                <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 text-[10px] shrink-0">Legacy Vulnerable</span>
              </div>
            </div>
          </div>

          <button
            onClick={onLoadDemo}
            disabled={loadingDemo}
            className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm transition-all text-center flex items-center justify-center gap-2"
          >
            {loadingDemo ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Auditing Fleet...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} className="text-emerald-400" />
                <span>Load Benchmark Demo Fleet</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Real CLI Archetype Inspector */}
      <div className="rounded-xl p-5 bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 font-mono uppercase tracking-wider">
              <Terminal size={15} className="text-slate-700" />
              Vendor CLI Syntax Archetypes (Supported Grammar)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect how Argus parses vendor-specific commands into vendor-neutral canonical security properties.
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 border border-slate-200">
            {Object.keys(VENDOR_SAMPLE_CLIS).map((key) => {
              const sample = VENDOR_SAMPLE_CLIS[key];
              const isActive = activeVendorSample === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveVendorSample(key)}
                  className={`px-3 py-1 rounded text-xs font-mono transition-all ${
                    isActive
                      ? 'bg-white text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {sample.vendor}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-slate-100 overflow-x-auto relative">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400 text-[11px]">
            <span>Role: <strong className="text-slate-200">{VENDOR_SAMPLE_CLIS[activeVendorSample].role}</strong></span>
            <span className="text-emerald-400 font-semibold">Lexical AST Parser Active</span>
          </div>
          <pre className="text-slate-200 leading-relaxed font-mono whitespace-pre overflow-x-auto text-[11px]">
            {VENDOR_SAMPLE_CLIS[activeVendorSample].code}
          </pre>
        </div>
      </div>

      {/* Ingested Fleet Inventory Table */}
      <div className="rounded-xl p-5 bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 font-mono uppercase tracking-wider">
              <Server size={15} className="text-slate-700" />
              Active Fleet Device Inventory ({devices.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Parsed network appliances with detection certainty scores and SHA-256 audit signatures.
            </p>
          </div>
        </div>

        {devices.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs italic font-mono bg-slate-50 rounded-lg">
            No devices ingested in current audit session. Upload files or load demo fleet above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-mono uppercase tracking-wider text-[11px] bg-slate-50">
                  <th className="py-2.5 px-3 rounded-l">Hostname</th>
                  <th className="py-2.5 px-3">Vendor</th>
                  <th className="py-2.5 px-3">Platform OS</th>
                  <th className="py-2.5 px-3">Detection Confidence</th>
                  <th className="py-2.5 px-3">Cryptographic SHA-256</th>
                  <th className="py-2.5 px-3 text-right rounded-r">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {devices.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900 font-mono">{d.hostname}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 font-mono text-[10px] font-bold">
                        {d.vendor}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-mono">{d.platform}</td>
                    <td className="py-3 px-3 font-mono font-bold">
                      <span className={d.confidence >= 0.9 ? 'text-emerald-700' : 'text-amber-700'}>
                        {(d.confidence * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                      {d.source_file_hash ? d.source_file_hash.substring(0, 18) + '...' : 'N/A'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleInspectDevice(d.id)}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 transition-all shadow-xs"
                      >
                        <Eye size={12} className="text-slate-600" />
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="w-full max-w-4xl max-h-[85vh] flex flex-col rounded-xl border border-slate-300 p-6 overflow-hidden bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-mono flex items-center gap-2">
                    <Server size={16} className="text-slate-700" />
                    {previewDevice.hostname} &mdash; Normalized Audit State
                  </h3>
                  <div className="text-xs text-slate-500 flex items-center gap-3 pt-0.5 font-mono">
                    <span>Vendor: <strong className="text-slate-800">{previewDevice.vendor}</strong></span>
                    <span>&bull;</span>
                    <span>Platform: <strong className="text-slate-800">{previewDevice.platform}</strong></span>
                    <span>&bull;</span>
                    <span>Properties Extracted: <strong className="text-emerald-700 font-semibold">{previewDevice.properties?.length || 0}</strong></span>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewDevice(null)}
                  className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="overflow-y-auto my-4 space-y-4 pr-1">
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 font-mono">
                    Canonical Normalized Security Properties
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {previewDevice.properties?.map((p) => (
                      <div key={p.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <span className="font-mono text-slate-900 font-semibold">{p.property_id}</span>
                          <div className="text-[10px] text-slate-500 truncate max-w-[240px]">
                            {p.raw_text || '// extracted property'}
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          p.state === 'UNKNOWN' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {p.state}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                    Raw Configuration Source Code
                  </h4>
                  <div className="bg-slate-900 rounded-lg p-3 font-mono text-xs text-slate-100 leading-relaxed overflow-x-auto max-h-[280px]">
                    <pre>{previewDevice.raw_content}</pre>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setPreviewDevice(null)}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all shadow-sm"
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
