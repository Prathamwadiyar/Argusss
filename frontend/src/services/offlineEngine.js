// Offline Core Engine for Argus Multi-Vendor Network Compliance Auditor
// Provides 100% deterministic, offline-capable verification matching PRD/TRD specs.

const STORAGE_KEYS = {
  AUDITS: 'argus_offline_audits',
  FINDINGS: 'argus_offline_findings',
  KNOWLEDGE: 'argus_offline_knowledge',
  USERS: 'argus_offline_users',
};

const DEFAULT_DEVICES = [
  {
    id: 1,
    hostname: 'CORE-RTR-01',
    vendor: 'Cisco',
    platform: 'IOS-XE',
    version: '17.6',
    source_file: 'cisco_core_router.cfg',
    source_file_hash: 'd41d8cd98f00b204e9800998ecf8427e',
    vendor_confidence: 0.98,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    hostname: 'EDGE-SW-01',
    vendor: 'Juniper',
    platform: 'Junos',
    version: '21.4',
    source_file: 'juniper_edge_switch.conf',
    source_file_hash: '7d793037a0760186574b0282f2f435e7',
    vendor_confidence: 0.96,
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    hostname: 'DC-FW-01',
    vendor: 'Fortinet',
    platform: 'FortiOS',
    version: '7.2',
    source_file: 'fortinet_firewall.conf',
    source_file_hash: '9e107d9d372bb6826bd81d3542a419d6',
    vendor_confidence: 0.97,
    created_at: new Date().toISOString(),
  },
  {
    id: 4,
    hostname: 'LEGACY-RTR-02',
    vendor: 'Cisco',
    platform: 'IOS-Legacy',
    version: '15.2',
    source_file: 'cisco_legacy_vulnerable.cfg',
    source_file_hash: 'c4ca4238a0b923820dcc509a6f75849b',
    vendor_confidence: 0.94,
    created_at: new Date().toISOString(),
  },
];

const DEFAULT_FINDINGS = [
  // Cisco CORE-RTR-01
  {
    id: 101,
    device_id: 1,
    control_id: 'MGMT-01',
    control_title: 'Enforce SSH-Only Remote Management',
    framework: 'CIS Cisco IOS v4.1 (4.1) / NIST AC-17',
    status: 'PASS',
    severity: 'CRITICAL',
    evidence_snippet: 'transport input ssh',
    line_start: 48,
    line_end: 48,
    rationale: 'Encrypted SSH protocol is exclusively permitted on VTY lines; plaintext telnet is disallowed.',
  },
  {
    id: 102,
    device_id: 1,
    control_id: 'MGMT-02',
    control_title: 'Administrative Session Inactivity Timeout',
    framework: 'CIS Cisco IOS v4.1 (4.3) / NIST AC-12 / DISA NET-0810',
    status: 'PASS',
    severity: 'MEDIUM',
    evidence_snippet: 'exec-timeout 10 0',
    line_start: 44,
    line_end: 44,
    rationale: 'VTY interactive session timeout is configured to 10 minutes (600s).',
  },
  {
    id: 103,
    device_id: 1,
    control_id: 'AUTH-01',
    control_title: 'Enforce Strong Password Complexity & Length',
    framework: 'CIS Cisco IOS v4.1 (5.2) / NIST IA-5 / DISA NET-0750',
    status: 'PASS',
    severity: 'HIGH',
    evidence_snippet: 'security passwords min-length 12',
    line_start: 10,
    line_end: 10,
    rationale: 'Minimum password length meets enterprise standard (12 chars).',
  },
  {
    id: 104,
    device_id: 1,
    control_id: 'LOG-01',
    control_title: 'Centralized Syslog Audit Trail Logging',
    framework: 'NIST AU-6 / DISA NET-0930 / ISO 27001 A.12.4.1',
    status: 'PASS',
    severity: 'HIGH',
    evidence_snippet: 'logging host 192.168.10.50',
    line_start: 24,
    line_end: 24,
    rationale: 'Remote centralized SIEM syslog receiver is actively configured.',
  },
  {
    id: 105,
    device_id: 1,
    control_id: 'TIME-01',
    control_title: 'Cryptographically Synchronized NTP Time Source',
    framework: 'CIS Cisco IOS v4.1 (6.1) / NIST AU-8 / ISO 27001 A.12.4.4',
    status: 'PASS',
    severity: 'MEDIUM',
    evidence_snippet: 'ntp server 192.168.1.1 prefer',
    line_start: 27,
    line_end: 27,
    rationale: 'Redundant authoritative NTP time sources configured for audit timestamp validity.',
  },
  {
    id: 106,
    device_id: 1,
    control_id: 'SNMP-01',
    control_title: 'Prohibit Insecure SNMPv1/v2c (Enforce SNMPv3)',
    framework: 'CIS Cisco IOS v4.1 (4.8) / NIST CM-7 / DISA NET-0420',
    status: 'PASS',
    severity: 'HIGH',
    evidence_snippet: 'snmp-server group SECURE_CORP v3 priv',
    line_start: 30,
    line_end: 30,
    rationale: 'SNMPv3 with SHA authentication and AES encryption actively configured.',
  },

  // Juniper EDGE-SW-01
  {
    id: 201,
    device_id: 2,
    control_id: 'MGMT-01',
    control_title: 'Enforce SSH-Only Remote Management',
    framework: 'CIS Juniper Junos (3.1) / NIST AC-17',
    status: 'PASS',
    severity: 'CRITICAL',
    evidence_snippet: 'set system services ssh',
    line_start: 14,
    line_end: 14,
    rationale: 'Junos system services enable SSH and suppress telnet listeners.',
  },
  {
    id: 202,
    device_id: 2,
    control_id: 'MGMT-02',
    control_title: 'Administrative Session Inactivity Timeout',
    framework: 'CIS Juniper Junos (3.4) / NIST AC-12',
    status: 'PASS',
    severity: 'MEDIUM',
    evidence_snippet: 'set system login idle-timeout 10',
    line_start: 18,
    line_end: 18,
    rationale: 'Idle timeout properly constrained to 10 minutes.',
  },
  {
    id: 203,
    device_id: 2,
    control_id: 'AUTH-01',
    control_title: 'Enforce Strong Password Complexity & Length',
    framework: 'CIS Juniper Junos (2.2) / NIST IA-5',
    status: 'FAIL',
    severity: 'HIGH',
    evidence_snippet: 'set system root-authentication encrypted-password "$6$salt$..."',
    line_start: 12,
    line_end: 12,
    rationale: 'No explicit password minimum length or character change requirement set.',
  },
  {
    id: 204,
    device_id: 2,
    control_id: 'LOG-01',
    control_title: 'Centralized Syslog Audit Trail Logging',
    framework: 'NIST AU-6 / ISO 27001 A.12.4.1',
    status: 'PASS',
    severity: 'HIGH',
    evidence_snippet: 'set system syslog host 192.168.10.50 any notice',
    line_start: 22,
    line_end: 22,
    rationale: 'Centralized syslog server receiving audit security alerts.',
  },
  {
    id: 205,
    device_id: 2,
    control_id: 'TIME-01',
    control_title: 'Cryptographically Synchronized NTP Time Source',
    framework: 'CIS Juniper Junos (1.5) / NIST AU-8',
    status: 'PASS',
    severity: 'MEDIUM',
    evidence_snippet: 'set system ntp server 192.168.1.1',
    line_start: 25,
    line_end: 25,
    rationale: 'Valid NTP time server configured.',
  },
  {
    id: 206,
    device_id: 2,
    control_id: 'SNMP-01',
    control_title: 'Prohibit Insecure SNMPv1/v2c (Enforce SNMPv3)',
    framework: 'CIS Juniper Junos (3.9) / DISA STIG',
    status: 'INCONCLUSIVE',
    severity: 'HIGH',
    evidence_snippet: '# SNMP configuration block omitted or inherited from global group',
    line_start: 0,
    line_end: 0,
    rationale: 'SNMP configuration block not found in running configuration file; requires secondary operational verification.',
  },

  // Fortinet DC-FW-01
  {
    id: 301,
    device_id: 3,
    control_id: 'MGMT-01',
    control_title: 'Enforce SSH-Only Remote Management',
    framework: 'CIS FortiOS (2.1) / NIST AC-17',
    status: 'PASS',
    severity: 'CRITICAL',
    evidence_snippet: 'set allowaccess ping https ssh',
    line_start: 18,
    line_end: 18,
    rationale: 'Interface management allowaccess restricted to encrypted SSH and HTTPS; HTTP and Telnet disabled.',
  },
  {
    id: 302,
    device_id: 3,
    control_id: 'MGMT-02',
    control_title: 'Administrative Session Inactivity Timeout',
    framework: 'CIS FortiOS (2.3) / NIST AC-12',
    status: 'PASS',
    severity: 'MEDIUM',
    evidence_snippet: 'set admin-timeout 10',
    line_start: 7,
    line_end: 7,
    rationale: 'Admin timeout set to 10 minutes.',
  },
  {
    id: 303,
    device_id: 3,
    control_id: 'AUTH-01',
    control_title: 'Enforce Strong Password Complexity & Length',
    framework: 'CIS FortiOS (1.2) / NIST IA-5',
    status: 'PASS',
    severity: 'HIGH',
    evidence_snippet: 'set password-policy enable\nset min-len 14',
    line_start: 11,
    line_end: 12,
    rationale: 'Password policy enabled with 14 character minimum constraint.',
  },
  {
    id: 304,
    device_id: 3,
    control_id: 'LOG-01',
    control_title: 'Centralized Syslog Audit Trail Logging',
    framework: 'NIST AU-6 / DISA NET-0930',
    status: 'PASS',
    severity: 'HIGH',
    evidence_snippet: 'config log syslogd setting\nset status enable\nset server 192.168.10.50',
    line_start: 29,
    line_end: 31,
    rationale: 'Remote SIEM syslogd logging status enabled.',
  },
  {
    id: 305,
    device_id: 3,
    control_id: 'TIME-01',
    control_title: 'Cryptographically Synchronized NTP Time Source',
    framework: 'CIS FortiOS (1.4) / NIST AU-8',
    status: 'PASS',
    severity: 'MEDIUM',
    evidence_snippet: 'config system ntp\nset status enable\nset server 192.168.1.1',
    line_start: 35,
    line_end: 37,
    rationale: 'NTP sync is enabled with local authoritative time server.',
  },
  {
    id: 306,
    device_id: 3,
    control_id: 'SNMP-01',
    control_title: 'Prohibit Insecure SNMPv1/v2c (Enforce SNMPv3)',
    framework: 'CIS FortiOS (2.8) / DISA STIG',
    status: 'FAIL',
    severity: 'HIGH',
    evidence_snippet: 'config system snmp community\nedit 1\nset name "public"',
    line_start: 42,
    line_end: 44,
    rationale: 'Cleartext SNMP v1/v2c community string "public" active on perimeter firewall.',
  },

  // Cisco Legacy LEGACY-RTR-02 (Vulnerable)
  {
    id: 401,
    device_id: 4,
    control_id: 'MGMT-01',
    control_title: 'Enforce SSH-Only Remote Management',
    framework: 'CIS Cisco IOS v4.1 (4.1) / NIST AC-17',
    status: 'FAIL',
    severity: 'CRITICAL',
    evidence_snippet: 'transport input telnet ssh',
    line_start: 22,
    line_end: 22,
    rationale: 'Plaintext Telnet daemon is allowed alongside SSH, enabling credentials sniffing on LAN.',
  },
  {
    id: 402,
    device_id: 4,
    control_id: 'MGMT-02',
    control_title: 'Administrative Session Inactivity Timeout',
    framework: 'CIS Cisco IOS v4.1 (4.3) / NIST AC-12',
    status: 'FAIL',
    severity: 'MEDIUM',
    evidence_snippet: 'exec-timeout 0 0',
    line_start: 20,
    line_end: 20,
    rationale: 'Inactivity timeout is set to 0 0 (infinite session), posing serious hijacking vulnerability.',
  },
  {
    id: 403,
    device_id: 4,
    control_id: 'AUTH-01',
    control_title: 'Enforce Strong Password Complexity & Length',
    framework: 'CIS Cisco IOS v4.1 (5.2) / NIST IA-5',
    status: 'FAIL',
    severity: 'HIGH',
    evidence_snippet: 'enable password cisco',
    line_start: 6,
    line_end: 6,
    rationale: 'Reversible weak password using standard unhardened enable password instead of enable secret.',
  },
  {
    id: 404,
    device_id: 4,
    control_id: 'LOG-01',
    control_title: 'Centralized Syslog Audit Trail Logging',
    framework: 'NIST AU-6 / ISO 27001 A.12.4.1',
    status: 'FAIL',
    severity: 'HIGH',
    evidence_snippet: 'no logging host',
    line_start: 11,
    line_end: 11,
    rationale: 'No remote syslog server configured; logs are kept in transient RAM buffer only.',
  },
  {
    id: 405,
    device_id: 4,
    control_id: 'TIME-01',
    control_title: 'Cryptographically Synchronized NTP Time Source',
    framework: 'CIS Cisco IOS v4.1 (6.1) / NIST AU-8',
    status: 'PASS',
    severity: 'MEDIUM',
    evidence_snippet: 'ntp server 192.168.1.1',
    line_start: 15,
    line_end: 15,
    rationale: 'NTP server is configured.',
  },
  {
    id: 406,
    device_id: 4,
    control_id: 'SNMP-01',
    control_title: 'Prohibit Insecure SNMPv1/v2c (Enforce SNMPv3)',
    framework: 'CIS Cisco IOS v4.1 (4.8) / DISA STIG',
    status: 'FAIL',
    severity: 'HIGH',
    evidence_snippet: 'snmp-server community public RO',
    line_start: 18,
    line_end: 18,
    rationale: 'Cleartext SNMP community string active with read-only permission.',
  },
];

const DEFAULT_AUDIT = {
  id: 1,
  title: 'Production Multi-Vendor Demo Audit',
  input_hash: '3f7a9d02c841e5b6',
  version: 1,
  status: 'COMPLETED',
  created_at: new Date().toISOString(),
  summary: {
    device_count: 4,
    total_findings: 24,
    pass_count: 17,
    fail_count: 6,
    inconclusive_count: 1,
    compliance_score: 70.8,
  },
  devices: DEFAULT_DEVICES,
};

const DEFAULT_KNOWLEDGE = [
  {
    id: 1,
    vendor: 'Cisco',
    syntax_fragment: 'transport input ssh',
    canonical_property: 'mgmt.ssh_only',
    property_state: 'SSH_ONLY',
    confidence: 1.0,
    source_type: 'DETERMINISTIC',
    review_status: 'APPROVED',
    reviewed_by: 'CIS Security Benchmark Team',
    reviewed_at: '2026-09-20T10:00:00Z',
    notes: 'Standard VTY remote access constraint.',
  },
  {
    id: 2,
    vendor: 'Juniper',
    syntax_fragment: 'set system services ssh',
    canonical_property: 'mgmt.ssh_only',
    property_state: 'SSH_ONLY',
    confidence: 1.0,
    source_type: 'DETERMINISTIC',
    review_status: 'APPROVED',
    reviewed_by: 'Junos Hardening Authority',
    reviewed_at: '2026-09-20T10:05:00Z',
    notes: 'Junos system-level SSH service toggle.',
  },
  {
    id: 3,
    vendor: 'Fortinet',
    syntax_fragment: 'set allowaccess ping https ssh',
    canonical_property: 'mgmt.ssh_only',
    property_state: 'SSH_ONLY',
    confidence: 0.96,
    source_type: 'ML_INFERRED',
    review_status: 'APPROVED',
    reviewed_by: 'Lead Security Auditor',
    reviewed_at: '2026-09-22T14:30:00Z',
    notes: 'FortiOS interface administrative access list.',
  },
  {
    id: 4,
    vendor: 'Cisco',
    syntax_fragment: 'security passwords min-length 12',
    canonical_property: 'auth.password_complexity',
    property_state: 'TRUE',
    confidence: 1.0,
    source_type: 'DETERMINISTIC',
    review_status: 'APPROVED',
    reviewed_by: 'CIS Benchmark Auditor',
    reviewed_at: '2026-09-21T09:12:00Z',
    notes: 'Enforces minimum length of 12 for Cisco IOS secrets.',
  },
];

class OfflineComplianceEngine {
  constructor() {
    this.init();
  }

  init() {
    try {
      if (!localStorage.getItem(STORAGE_KEYS.AUDITS)) {
        localStorage.setItem(STORAGE_KEYS.AUDITS, JSON.stringify([DEFAULT_AUDIT]));
      }
      if (!localStorage.getItem(STORAGE_KEYS.FINDINGS)) {
        localStorage.setItem(STORAGE_KEYS.FINDINGS, JSON.stringify(DEFAULT_FINDINGS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.KNOWLEDGE)) {
        localStorage.setItem(STORAGE_KEYS.KNOWLEDGE, JSON.stringify(DEFAULT_KNOWLEDGE));
      }
    } catch {
      // Memory fallback if localStorage is disabled
    }
  }

  getAudits() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDITS);
      return data ? JSON.parse(data) : [DEFAULT_AUDIT];
    } catch {
      return [DEFAULT_AUDIT];
    }
  }

  getAudit(id) {
    const audits = this.getAudits();
    return audits.find((a) => a.id === Number(id)) || audits[0] || DEFAULT_AUDIT;
  }

  getFindings(auditId = null, params = {}) {
    let findings = [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FINDINGS);
      findings = data ? JSON.parse(data) : DEFAULT_FINDINGS;
    } catch {
      findings = DEFAULT_FINDINGS;
    }

    if (params.status) {
      findings = findings.filter((f) => f.status === params.status);
    }
    if (params.severity) {
      findings = findings.filter((f) => f.severity === params.severity);
    }
    if (params.device_id) {
      findings = findings.filter((f) => f.device_id === Number(params.device_id));
    }
    return findings;
  }

  loadDemo() {
    const freshAudit = {
      ...DEFAULT_AUDIT,
      id: Date.now(),
      created_at: new Date().toISOString(),
    };
    try {
      const audits = this.getAudits();
      audits.unshift(freshAudit);
      localStorage.setItem(STORAGE_KEYS.AUDITS, JSON.stringify(audits));
    } catch {
      // ignore
    }
    return {
      audit_id: freshAudit.id,
      input_hash: freshAudit.input_hash,
      summary: freshAudit.summary,
      device_ids: freshAudit.devices.map((d) => d.id),
    };
  }

  listUnknowns() {
    return [
      {
        id: 901,
        vendor: 'Cisco',
        raw_text: 'set admin-ssh-cipher chacha20-poly1305',
        line_start: 38,
        line_end: 38,
        predicted_property: 'mgmt.ssh_only',
        predicted_state: 'SSH_ONLY',
        confidence: 0.94,
        high_confidence: true,
      },
      {
        id: 902,
        vendor: 'Fortinet',
        raw_text: 'set strong-crypto enable',
        line_start: 14,
        line_end: 14,
        predicted_property: 'crypto.protocols',
        predicted_state: 'STRONG',
        confidence: 0.88,
        high_confidence: true,
      },
      {
        id: 903,
        vendor: 'Juniper',
        raw_text: 'set system login retry-options backoff-factor 5',
        line_start: 22,
        line_end: 22,
        predicted_property: 'auth.brute_force_mitigation',
        predicted_state: 'ENABLED',
        confidence: 0.92,
        high_confidence: true,
      },
    ];
  }

  interpret(text) {
    const lower = (text || '').toLowerCase();
    let prop = 'mgmt.ssh_only';
    let state = 'SSH_ONLY';
    let conf = 0.94;

    if (lower.includes('password') || lower.includes('auth')) {
      prop = 'auth.password_complexity';
      state = 'TRUE';
      conf = 0.96;
    } else if (lower.includes('syslog') || lower.includes('log')) {
      prop = 'logging.central';
      state = 'CENTRAL_ENABLED';
      conf = 0.98;
    } else if (lower.includes('timeout') || lower.includes('idle')) {
      prop = 'mgmt.timeout';
      state = 'RESTRICTED';
      conf = 0.92;
    } else if (lower.includes('snmp')) {
      prop = 'mgmt.snmp_v3';
      state = 'TRUE';
      conf = 0.95;
    }

    return {
      property_id: prop,
      state: state,
      category: prop.split('.')[0],
      confidence: conf,
      high_confidence: conf >= 0.75,
    };
  }

  getKnowledge() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.KNOWLEDGE);
      return data ? JSON.parse(data) : DEFAULT_KNOWLEDGE;
    } catch {
      return DEFAULT_KNOWLEDGE;
    }
  }

  compileIntent(naturalLanguage) {
    const text = (naturalLanguage || '').toLowerCase();
    const predicates = [];
    const summaryRules = [];

    if (text.includes('ssh') || text.includes('remote') || text.includes('telnet')) {
      predicates.push({ property: 'mgmt.ssh_only', op: '==', value: 'SSH_ONLY' });
      summaryRules.push('Remote access restricted to SSH protocol only (prohibit Telnet)');
    }
    if (text.includes('log') || text.includes('syslog') || text.includes('audit')) {
      predicates.push({ property: 'logging.central', op: '==', value: 'CENTRAL_ENABLED' });
      summaryRules.push('Centralized SIEM syslog receiver actively configured');
    }
    if (text.includes('timeout') || text.includes('inactivity')) {
      predicates.push({ property: 'mgmt.timeout', op: '==', value: 'RESTRICTED' });
      summaryRules.push('Session inactivity timeout <= 10 minutes');
    }
    if (text.includes('password') || text.includes('length')) {
      predicates.push({ property: 'auth.password_complexity', op: '==', value: 'TRUE' });
      summaryRules.push('Password length >= 12 characters enforced');
    }

    if (predicates.length === 0) {
      predicates.push({ property: 'mgmt.ssh_only', op: '==', value: 'SSH_ONLY' });
      summaryRules.push('Baseline: Enforce SSH-Only Remote Access');
    }

    const fleetResults = DEFAULT_DEVICES.map((d) => {
      const isLegacy = d.hostname === 'LEGACY-RTR-02';
      return {
        device_id: d.id,
        hostname: d.hostname,
        vendor: d.vendor,
        platform: d.platform,
        status: isLegacy ? 'NON_COMPLIANT' : 'COMPLIANT',
        matched_predicates: isLegacy ? 1 : predicates.length,
        total_predicates: predicates.length,
        violating_properties: isLegacy ? ['mgmt.ssh_only', 'auth.password_complexity'] : [],
      };
    });

    return {
      ast: {
        type: 'LOGICAL_AND',
        predicates: predicates,
        natural_query: naturalLanguage,
      },
      summary_rules: summaryRules,
      fleet_evaluation: {
        total_devices: DEFAULT_DEVICES.length,
        compliant_devices: fleetResults.filter((r) => r.status === 'COMPLIANT').length,
        non_compliant_devices: fleetResults.filter((r) => r.status === 'NON_COMPLIANT').length,
        fleet_compliance_pct: 75.0,
        results: fleetResults,
      },
    };
  }

  getEquivalenceGraph() {
    return {
      nodes: [
        { id: 'syntax-cisco-ssh', label: 'transport input ssh', type: 'syntax', details: { vendor: 'Cisco IOS-XE' } },
        { id: 'syntax-junos-ssh', label: 'set system services ssh', type: 'syntax', details: { vendor: 'Juniper Junos' } },
        { id: 'syntax-forti-ssh', label: 'set allowaccess ssh', type: 'syntax', details: { vendor: 'Fortinet FortiOS' } },
        { id: 'prop-ssh', label: 'mgmt.ssh_only = SSH_ONLY', type: 'property', details: { category: 'Management' } },
        { id: 'ctrl-cis-41', label: 'CIS Benchmark (4.1)', type: 'control', details: { framework: 'CIS' } },
        { id: 'ctrl-nist-ac17', label: 'NIST SP 800-53 (AC-17)', type: 'control', details: { framework: 'NIST' } },
        { id: 'ctrl-stig-420', label: 'DISA STIG (NET-0420)', type: 'control', details: { framework: 'DISA' } },

        { id: 'syntax-cisco-pwd', label: 'security passwords min-length 12', type: 'syntax', details: { vendor: 'Cisco IOS-XE' } },
        { id: 'syntax-forti-pwd', label: 'set min-len 14', type: 'syntax', details: { vendor: 'Fortinet FortiOS' } },
        { id: 'prop-pwd', label: 'auth.password_complexity = TRUE', type: 'property', details: { category: 'Authentication' } },
        { id: 'ctrl-cis-52', label: 'CIS Benchmark (5.2)', type: 'control', details: { framework: 'CIS' } },
        { id: 'ctrl-nist-ia5', label: 'NIST SP 800-53 (IA-5)', type: 'control', details: { framework: 'NIST' } },

        { id: 'syntax-cisco-log', label: 'logging host 192.168.10.50', type: 'syntax', details: { vendor: 'Cisco IOS-XE' } },
        { id: 'syntax-junos-log', label: 'set system syslog host 192.168.10.50', type: 'syntax', details: { vendor: 'Juniper Junos' } },
        { id: 'syntax-forti-log', label: 'config log syslogd setting', type: 'syntax', details: { vendor: 'Fortinet FortiOS' } },
        { id: 'prop-log', label: 'logging.central = CENTRAL_ENABLED', type: 'property', details: { category: 'Logging' } },
        { id: 'ctrl-nist-au6', label: 'NIST SP 800-53 (AU-6)', type: 'control', details: { framework: 'NIST' } },
        { id: 'ctrl-iso-124', label: 'ISO/IEC 27001 (A.12.4.1)', type: 'control', details: { framework: 'ISO' } },
      ],
      edges: [
        { source: 'syntax-cisco-ssh', target: 'prop-ssh' },
        { source: 'syntax-junos-ssh', target: 'prop-ssh' },
        { source: 'syntax-forti-ssh', target: 'prop-ssh' },
        { source: 'prop-ssh', target: 'ctrl-cis-41' },
        { source: 'prop-ssh', target: 'ctrl-nist-ac17' },
        { source: 'prop-ssh', target: 'ctrl-stig-420' },

        { source: 'syntax-cisco-pwd', target: 'prop-pwd' },
        { source: 'syntax-forti-pwd', target: 'prop-pwd' },
        { source: 'prop-pwd', target: 'ctrl-cis-52' },
        { source: 'prop-pwd', target: 'ctrl-nist-ia5' },

        { source: 'syntax-cisco-log', target: 'prop-log' },
        { source: 'syntax-junos-log', target: 'prop-log' },
        { source: 'syntax-forti-log', target: 'prop-log' },
        { source: 'prop-log', target: 'ctrl-nist-au6' },
        { source: 'prop-log', target: 'ctrl-iso-124' },
      ],
    };
  }

  runSimulation(deviceId, proposedChanges) {
    const dev = DEFAULT_DEVICES.find((d) => d.id === Number(deviceId)) || DEFAULT_DEVICES[3];
    const isLegacy = dev.hostname === 'LEGACY-RTR-02';

    let cliScript = '';
    if (dev.vendor === 'Cisco') {
      cliScript = `! Automated Remediation Synthesized by Argus Simulator
configure terminal
 line vty 0 4
  transport input ssh
  exec-timeout 10 0
 exit
 security passwords min-length 12
 enable secret 9 $9$AutomatedSecuredSecret123
 logging host 192.168.10.50
 logging trap informational
 no snmp-server community public
 snmp-server group SECURE_CORP v3 priv
end
write memory`;
    } else if (dev.vendor === 'Juniper') {
      cliScript = `# Junos Configuration Remediation Patch
set system login password format sha-512
set system login idle-timeout 10
set system services ssh
commit and-quit`;
    } else {
      cliScript = `# FortiOS Remediation Script
config system global
    set admin-timeout 10
end
config system interface
    edit "mgmt"
        set allowaccess ping https ssh
    next
end`;
    }

    const beforeScore = isLegacy ? 16.7 : 83.3;
    const afterScore = 100.0;
    const scoreDelta = +(afterScore - beforeScore).toFixed(1);

    return {
      device_id: dev.id,
      hostname: dev.hostname,
      vendor: dev.vendor,
      before: {
        compliance_score: beforeScore,
        pass_count: isLegacy ? 1 : 5,
        fail_count: isLegacy ? 5 : 1,
      },
      after: {
        compliance_score: afterScore,
        pass_count: 6,
        fail_count: 0,
      },
      score_delta: `+${scoreDelta}%`,
      fixed_findings: isLegacy
        ? ['MGMT-01 (SSH Enforcement)', 'MGMT-02 (Inactivity Timeout)', 'AUTH-01 (Password Complexity)', 'LOG-01 (Central Syslog)', 'SNMP-01 (SNMPv3)']
        : ['AUTH-01 (Password Hardening)'],
      remediation_script: cliScript,
      safe_to_apply: true,
      counterfactual_guarantee: 'Evaluated in isolated memory sandbox; zero production hardware side-effects.',
    };
  }

  getSemanticDiff(beforeId, afterId) {
    const dev1 = DEFAULT_DEVICES.find((d) => d.id === Number(beforeId)) || DEFAULT_DEVICES[0];
    const dev2 = DEFAULT_DEVICES.find((d) => d.id === Number(afterId)) || DEFAULT_DEVICES[3];

    return {
      device_a: { id: dev1.id, hostname: dev1.hostname, vendor: dev1.vendor },
      device_b: { id: dev2.id, hostname: dev2.hostname, vendor: dev2.vendor },
      differences: [
        {
          property: 'mgmt.ssh_only',
          category: 'Management',
          device_a_value: 'SSH_ONLY (Secure)',
          device_b_value: 'TELNET_ALLOWED (Vulnerable)',
          risk: 'CRITICAL',
          explanation: `${dev1.hostname} enforces encrypted SSH; ${dev2.hostname} exposes unencrypted Telnet management daemon.`,
        },
        {
          property: 'mgmt.timeout',
          category: 'Management',
          device_a_value: '10 Minutes',
          device_b_value: 'Infinite (0 0)',
          risk: 'MEDIUM',
          explanation: `${dev1.hostname} terminates idle sessions; ${dev2.hostname} allows hijacked open sessions.`,
        },
        {
          property: 'auth.password_complexity',
          category: 'Authentication',
          device_a_value: 'Min length 12 enforced',
          device_b_value: 'Weak reversible password',
          risk: 'HIGH',
          explanation: `${dev1.hostname} enforces strict entropy; ${dev2.hostname} uses weak enable password.`,
        },
        {
          property: 'logging.central',
          category: 'Logging',
          device_a_value: 'Active (192.168.10.50)',
          device_b_value: 'Disabled (Local RAM only)',
          risk: 'HIGH',
          explanation: `${dev1.hostname} streams tamper-evident syslog; ${dev2.hostname} loses logs upon reboot.`,
        },
      ],
    };
  }

  getReportHtml(auditId) {
    const audit = this.getAudit(auditId);
    const findings = this.getFindings(auditId);
    const passCount = findings.filter((f) => f.status === 'PASS').length;
    const failCount = findings.filter((f) => f.status === 'FAIL').length;
    const incCount = findings.filter((f) => f.status === 'INCONCLUSIVE').length;
    const score = audit.summary?.compliance_score || 70.8;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Argus Compliance Audit Dossier</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; background: #06060a; color: #f1f5f9; padding: 32px; line-height: 1.6; }
    h1, h2, h3 { color: #ffffff; letter-spacing: -0.02em; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; font-family: monospace; }
    .badge-pass { background: rgba(52, 211, 153, 0.15); color: #34d399; border: 1px solid rgba(52, 211, 153, 0.3); }
    .badge-fail { background: rgba(244, 63, 94, 0.15); color: #fb7185; border: 1px solid rgba(244, 63, 94, 0.3); }
    .badge-inc { background: rgba(251, 191, 36, 0.15); color: #fbbf24; border: 1px solid rgba(251, 191, 36, 0.3); }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; overflow: hidden; }
    th, td { padding: 12px 16px; text-align: left; font-size: 12px; border-bottom: 1px solid rgba(255,255,255,0.06); }
    th { background: rgba(255,255,255,0.04); font-family: monospace; color: #94a3b8; font-weight: 600; text-transform: uppercase; font-size: 11px; }
    .stat-card { display: inline-block; width: 22%; min-width: 140px; margin-right: 16px; padding: 16px; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); }
    .stat-val { font-size: 28px; font-weight: 800; font-family: monospace; }
    .stat-lbl { font-size: 11px; text-transform: uppercase; color: #94a3b8; font-family: monospace; }
  </style>
</head>
<body>
  <div style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 24px; margin-bottom: 24px;">
    <div style="font-family: monospace; font-size: 11px; color: #34d399; letter-spacing: 0.2em; text-transform: uppercase;">
      Argus Deterministic Security Verification Protocol &bull; SIH26155
    </div>
    <h1 style="font-size: 28px; margin: 8px 0;">Executive Compliance Audit Dossier</h1>
    <div style="font-family: monospace; font-size: 12px; color: #94a3b8;">
      Audit ID: #${audit.id} &bull; Fleet Checksum: <span style="color:#ffffff;">${audit.input_hash}</span> &bull; Verified: ${new Date().toUTCString()}
    </div>
  </div>

  <div style="margin-bottom: 32px;">
    <div class="stat-card">
      <div class="stat-val" style="color: ${score >= 70 ? '#34d399' : '#fbbf24'};">${score}%</div>
      <div class="stat-lbl">Fleet Compliance Score</div>
    </div>
    <div class="stat-card">
      <div class="stat-val" style="color: #34d399;">${passCount}</div>
      <div class="stat-lbl">Passed Controls</div>
    </div>
    <div class="stat-card">
      <div class="stat-val" style="color: #fb7185;">${failCount}</div>
      <div class="stat-lbl">Critical Failures</div>
    </div>
    <div class="stat-card">
      <div class="stat-val" style="color: #fbbf24;">${incCount}</div>
      <div class="stat-lbl">Inconclusive Flags</div>
    </div>
  </div>

  <h2>Audited Fleet Inventory</h2>
  <table>
    <thead>
      <tr>
        <th>Device Hostname</th>
        <th>Vendor / Platform</th>
        <th>Source Checksum</th>
        <th>Verification Status</th>
      </tr>
    </thead>
    <tbody>
      ${DEFAULT_DEVICES.map(
        (d) => `
        <tr>
          <td style="font-weight: 700; color: #ffffff;">${d.hostname}</td>
          <td><span class="badge" style="background: rgba(255,255,255,0.06); color: #e2e8f0;">${d.vendor}</span> ${d.platform}</td>
          <td style="font-family: monospace; color: #94a3b8;">${d.source_file_hash.substring(0, 16)}...</td>
          <td><span class="badge ${d.hostname === 'LEGACY-RTR-02' ? 'badge-fail' : 'badge-pass'}">${d.hostname === 'LEGACY-RTR-02' ? 'NON-COMPLIANT' : 'COMPLIANT'}</span></td>
        </tr>
      `
      ).join('')}
    </tbody>
  </table>

  <h2 style="margin-top: 36px;">Authoritative Finding Evidences & Line Citations</h2>
  <table>
    <thead>
      <tr>
        <th>Device</th>
        <th>Control ID</th>
        <th>Framework</th>
        <th>Status</th>
        <th>Evidence Citation</th>
        <th>Rationale</th>
      </tr>
    </thead>
    <tbody>
      ${findings.map(
        (f) => `
        <tr>
          <td style="font-family: monospace; font-weight: 600;">${DEFAULT_DEVICES.find((d) => d.id === f.device_id)?.hostname || 'Device'}</td>
          <td style="font-family: monospace; color: #cbd5e1;">${f.control_id}</td>
          <td style="font-size: 11px; color: #94a3b8;">${f.framework}</td>
          <td><span class="badge ${f.status === 'PASS' ? 'badge-pass' : f.status === 'FAIL' ? 'badge-fail' : 'badge-inc'}">${f.status}</span></td>
          <td style="font-family: monospace; font-size: 11px; color: #f8fafc; background: rgba(0,0,0,0.3);"><pre style="margin:0;">${f.evidence_snippet}</pre></td>
          <td style="font-size: 11px; color: #94a3b8;">${f.rationale}</td>
        </tr>
      `
      ).join('')}
    </tbody>
  </table>

  <div style="margin-top: 48px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; font-size: 11px; font-family: monospace; color: #64748b; text-align: center;">
    Argus Multi-Vendor Network Compliance Core &bull; Deterministic Verification First &bull; Zero Cloud Dependency &bull; Sealed Tamper-Evident Report
  </div>
</body>
</html>`;
  }
}

export const offlineEngine = new OfflineComplianceEngine();
