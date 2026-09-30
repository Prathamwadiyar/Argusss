from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.database import SecurityProperty, Control, Finding, Device, ConfigFragment

DEFAULT_CONTROLS = [
    {
        "code": "MGMT-01",
        "name": "Enforce SSH-Only Remote Management",
        "category": "Management",
        "description": "Ensure only encrypted SSH protocol is permitted for remote administrative access; legacy plaintext protocols like Telnet must be completely prohibited.",
        "predicate": {"property": "mgmt.ssh_only", "expected": ["TRUE", "SSH_ONLY"]},
        "severity": "CRITICAL",
        "standard_refs": [
            "CIS Cisco IOS Benchmark v4.1 (4.1)",
            "NIST SP 800-53 Rev. 5 AC-17",
            "DISA STIG NET-0420",
            "ISO/IEC 27001:2022 A.9.4.2",
            "NCIIPC Sec 4.2 / 5.1 Remote Access"
        ],
        "remediation": "Configure 'transport input ssh' (Cisco IOS-XE), 'set system services ssh' (Juniper Junos), or enable ssh-admin-access on management interface (Fortinet FortiOS)."
    },
    {
        "code": "MGMT-02",
        "name": "Administrative Session Inactivity Timeout",
        "category": "Management",
        "description": "Configure administrative interactive session timeout to 10 minutes (600 seconds) or less to prevent unauthorized physical or terminal hijacking.",
        "predicate": {"property": "mgmt.timeout", "expected": ["RESTRICTED"]},
        "severity": "MEDIUM",
        "standard_refs": [
            "CIS Cisco IOS Benchmark v4.1 (4.3)",
            "NIST SP 800-53 Rev. 5 AC-12",
            "DISA STIG NET-0810",
            "ISO/IEC 27001:2022 A.9.4.2",
            "NCIIPC Sec 4.3 Session Management"
        ],
        "remediation": "Set executive session timeout: 'exec-timeout 10 0' (Cisco IOS-XE), 'set system login idle-timeout 10' (Juniper Junos), or 'set admin-timeout 10' (Fortinet FortiOS)."
    },
    {
        "code": "AUTH-01",
        "name": "Enforce Strong Password Complexity & Length",
        "category": "Authentication",
        "description": "Enforce minimum password length of at least 12 characters and enable complexity requirements across all local accounts.",
        "predicate": {"property": "auth.password_complexity", "expected": ["TRUE"]},
        "severity": "HIGH",
        "standard_refs": [
            "CIS Cisco IOS Benchmark v4.1 (5.2)",
            "NIST SP 800-53 Rev. 5 IA-5",
            "DISA STIG NET-0750",
            "ISO/IEC 27001:2022 A.9.2.1",
            "NCIIPC Sec 3.1 Credential Hardening"
        ],
        "remediation": "Enable password length restrictions: 'security passwords min-length 12' (Cisco IOS-XE), 'set system login password minimum-length 12' (Juniper Junos), or 'config system password-policy set min-length 12' (Fortinet FortiOS)."
    },
    {
        "code": "AUTH-02",
        "name": "Privileged Execution & Root Authentication",
        "category": "Authentication",
        "description": "Ensure privileged execution mode and root administrator access are protected by salted cryptographic hashes or centralized AAA authentication.",
        "predicate": {"property": "auth.root_auth", "expected": ["REQUIRED", "TRUE"]},
        "severity": "CRITICAL",
        "standard_refs": [
            "CIS Cisco IOS Benchmark v4.1 (5.1)",
            "NIST SP 800-53 Rev. 5 IA-2",
            "DISA STIG NET-0710",
            "ISO/IEC 27001:2022 A.9.4.3",
            "NCIIPC Sec 3.2 Privileged Access"
        ],
        "remediation": "Configure 'enable secret <strong-hash>' on Cisco IOS-XE, set 'root-authentication encrypted-password' on Juniper Junos, or restrict super_admin privileges on Fortinet FortiOS."
    },
    {
        "code": "LOG-01",
        "name": "Centralized Syslog Ingestion Configured",
        "category": "Logging",
        "description": "Audit events, administrative logins, and security violations must be forwarded in real time to a centralized remote SIEM/Syslog server.",
        "predicate": {"property": "logging.central", "expected": ["CENTRAL_ENABLED"]},
        "severity": "HIGH",
        "standard_refs": [
            "CIS Cisco IOS Benchmark v4.1 (6.3)",
            "NIST SP 800-53 Rev. 5 AU-6",
            "DISA STIG NET-0930",
            "ISO/IEC 27001:2022 A.12.4.1",
            "NCIIPC Sec 6.3 Audit Trails & Logging"
        ],
        "remediation": "Add remote syslog target: 'logging host <siem-ip>' (Cisco IOS-XE), 'set system syslog host <siem-ip>' (Juniper Junos), or 'config log syslogd setting set server <siem-ip>' (Fortinet FortiOS)."
    },
    {
        "code": "TIME-01",
        "name": "Network Time Protocol (NTP) Synchronization",
        "category": "Time",
        "description": "System clocks must be synchronized with authoritative internal or external NTP time sources for defensible log correlation and audit provenance.",
        "predicate": {"property": "time.ntp", "expected": ["NTP_ENABLED"]},
        "severity": "MEDIUM",
        "standard_refs": [
            "CIS Cisco IOS Benchmark v4.1 (6.1)",
            "NIST SP 800-53 Rev. 5 AU-8",
            "DISA STIG NET-0950",
            "ISO/IEC 27001:2022 A.12.4.4",
            "NCIIPC Sec 7.1 Time Synchronization"
        ],
        "remediation": "Configure synchronized NTP source: 'ntp server <ip>' (Cisco IOS-XE), 'set system ntp server <ip>' (Juniper Junos), or 'config system ntp set ntpserver <ip>' (Fortinet FortiOS)."
    },
    {
        "code": "SNMP-01",
        "name": "Secure SNMP Configuration (v3 Encryption Only)",
        "category": "SNMP",
        "description": "SNMP monitoring must use SNMPv3 with authNoPriv or authPriv SHA/AES encryption; cleartext community strings (public/private) must be removed.",
        "predicate": {"property": "snmp.secure", "expected": ["SECURE", "DISABLED"]},
        "severity": "HIGH",
        "standard_refs": [
            "CIS Cisco IOS Benchmark v4.1 (4.8)",
            "NIST SP 800-53 Rev. 5 SC-8",
            "DISA STIG NET-1010",
            "ISO/IEC 27001:2022 A.13.1.1",
            "NCIIPC Sec 4.6 Secure Monitoring"
        ],
        "remediation": "Migrate to SNMPv3 USM groups with SHA authentication and AES encryption, and remove SNMPv1/v2c communities ('no snmp-server community')."
    },
    {
        "code": "SVC-01",
        "name": "Disable Insecure Legacy Protocols (HTTP/Telnet)",
        "category": "Service",
        "description": "Plaintext legacy daemons like unencrypted HTTP web server and Telnet server must be completely disabled.",
        "predicate": {"property": "svc.insecure_services", "expected": ["DISABLED"]},
        "severity": "HIGH",
        "standard_refs": [
            "CIS Cisco IOS Benchmark v4.1 (4.2)",
            "NIST SP 800-53 Rev. 5 CM-7",
            "DISA STIG NET-0410",
            "ISO/IEC 27001:2022 A.13.1.3",
            "NCIIPC Sec 4.1 Insecure Protocol Elimination"
        ],
        "remediation": "Issue 'no ip http server' on Cisco IOS-XE, disable 'web-management http' on Juniper Junos, or disable HTTP on Fortinet FortiOS interfaces."
    }
]

class ComplianceEngine:
    def ensure_default_controls(self, db: Session):
        for c_data in DEFAULT_CONTROLS:
            existing = db.query(Control).filter(Control.code == c_data["code"]).first()
            if not existing:
                ctrl = Control(
                    code=c_data["code"],
                    name=c_data["name"],
                    category=c_data["category"],
                    description=c_data["description"],
                    predicate_json=c_data["predicate"],
                    severity=c_data["severity"],
                    standard_refs=c_data["standard_refs"],
                    remediation=c_data["remediation"]
                )
                db.add(ctrl)
            else:
                existing.name = c_data["name"]
                existing.category = c_data["category"]
                existing.description = c_data["description"]
                existing.predicate_json = c_data["predicate"]
                existing.severity = c_data["severity"]
                existing.standard_refs = c_data["standard_refs"]
                existing.remediation = c_data["remediation"]
        db.commit()

    def evaluate(self, db: Session, device_id: int, audit_id: Optional[int] = None) -> List[Dict[str, Any]]:
        self.ensure_default_controls(db)
        
        device = db.query(Device).filter(Device.id == device_id).first()
        if not device:
            return []

        properties = db.query(SecurityProperty).filter(SecurityProperty.device_id == device_id).all()
        controls = db.query(Control).all()

        # Map properties by property_id -> (state, confidence, source_fragment)
        prop_map: Dict[str, SecurityProperty] = {p.property_id: p for p in properties}
        findings_data = []

        # Clear old findings for this device/audit to ensure clean idempotency
        if audit_id:
            db.query(Finding).filter(Finding.audit_id == audit_id, Finding.device_id == device_id).delete()
        else:
            db.query(Finding).filter(Finding.device_id == device_id).delete()

        for control in controls:
            pred = control.predicate_json or {}
            prop_id = pred.get("property")
            expected_vals = pred.get("expected", [])
            if isinstance(expected_vals, str):
                expected_vals = [expected_vals]

            sec_prop = prop_map.get(prop_id)

            if not sec_prop or sec_prop.state == "UNKNOWN":
                status = "INCONCLUSIVE"
                actual_state = "UNKNOWN"
                confidence = 0.50 if not sec_prop else sec_prop.confidence
                evidence = {
                    "line_start": 1,
                    "line_end": 1,
                    "text": f"No unambiguous configuration statement found for {prop_id}",
                    "source": "INCONCLUSIVE_GAP"
                }
            elif sec_prop.state in expected_vals:
                status = "PASS"
                actual_state = sec_prop.state
                confidence = sec_prop.confidence
                frag = db.query(ConfigFragment).filter(ConfigFragment.id == sec_prop.source_fragment_id).first() if sec_prop.source_fragment_id else None
                evidence = {
                    "line_start": frag.line_start if frag else 1,
                    "line_end": frag.line_end if frag else 1,
                    "text": frag.raw_text if frag else f"Property {prop_id} matches expected state {sec_prop.state}",
                    "source": sec_prop.source_type
                }
            else:
                status = "FAIL"
                actual_state = sec_prop.state
                confidence = sec_prop.confidence
                frag = db.query(ConfigFragment).filter(ConfigFragment.id == sec_prop.source_fragment_id).first() if sec_prop.source_fragment_id else None
                evidence = {
                    "line_start": frag.line_start if frag else 1,
                    "line_end": frag.line_end if frag else 1,
                    "text": frag.raw_text if frag else f"Observed non-compliant state: {sec_prop.state}",
                    "source": sec_prop.source_type
                }

            finding = Finding(
                audit_id=audit_id or device.audit_id,
                device_id=device.id,
                control_id=control.id,
                status=status,
                severity=control.severity,
                confidence=confidence,
                property_id=prop_id,
                actual_state=actual_state,
                expected_state=", ".join(expected_vals),
                evidence_json=evidence,
                remediation_guidance=control.remediation
            )
            db.add(finding)
            db.flush()

            findings_data.append({
                "id": finding.id,
                "control_id": control.id,
                "control_code": control.code,
                "control_name": control.name,
                "category": control.category,
                "status": status,
                "severity": control.severity,
                "confidence": confidence,
                "property_id": prop_id,
                "actual_state": actual_state,
                "expected_state": ", ".join(expected_vals),
                "standard_refs": control.standard_refs,
                "evidence": evidence,
                "remediation": control.remediation
            })

        db.commit()
        return findings_data

compliance_engine = ComplianceEngine()
