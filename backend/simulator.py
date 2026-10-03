from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.database import Device, SecurityProperty, Control, Finding, SimulationRecord

VENDOR_REMEDIATION_SNIPPETS = {
    "Cisco": {
        "mgmt.ssh_only": "! Enforce SSH-only transport\nline vty 0 4\n transport input ssh\n ip ssh version 2",
        "mgmt.timeout": "! Configure session idle timeout to 10 minutes\nline vty 0 4\n exec-timeout 10 0\nline console 0\n exec-timeout 10 0",
        "auth.password_complexity": "! Enforce minimum password length\nsecurity passwords min-length 12",
        "auth.root_auth": "! Enforce strong enable secret\nenable secret 9 $9$SaltedCryptographicHashExample",
        "logging.central": "! Configure central SIEM syslog host\nlogging host 192.168.10.50\nlogging trap informational",
        "time.ntp": "! Synchronize with authoritative NTP server\nntp server 192.168.1.1 prefer",
        "snmp.secure": "! Enable SNMPv3 encrypted user\nsnmp-server group SECURE_GRP v3 priv\nsnmp-server user secadmin SECURE_GRP v3 auth sha StrongAuthPass priv aes 128 StrongPrivPass",
        "svc.insecure_services": "! Disable insecure plaintext protocols\nno ip http server\nno service telnet"
    },
    "Juniper": {
        "mgmt.ssh_only": "# Enable SSH management service\nset system services ssh protocol-version v2\ndelete system services telnet",
        "mgmt.timeout": "# Set administrative idle timeout to 10 minutes\nset system login idle-timeout 10",
        "auth.password_complexity": "# Enforce password minimum length\nset system login password minimum-length 12\nset system login password format sha-512",
        "auth.root_auth": "# Configure encrypted root authentication\nset system root-authentication encrypted-password \"$6$Salt$Hash...\"",
        "logging.central": "# Configure remote syslog logging\nset system syslog host 10.10.10.20 any informational",
        "time.ntp": "# Configure authoritative NTP time source\nset system ntp server 10.0.0.1 prefer",
        "snmp.secure": "# Configure SNMPv3 USM user with SHA/AES\nset snmp v3 usm local-user secadmin authentication-sha StrongPass privacy-aes StrongPriv",
        "svc.insecure_services": "# Disable plaintext web management\ndelete system services web-management http\nset system services web-management https"
    },
    "Fortinet": {
        "mgmt.ssh_only": "# Restrict administrative interface to SSH\nconfig system interface\n edit \"mgmt\"\n set allowaccess ssh https\nnext\nend",
        "mgmt.timeout": "# Set administrative idle timeout to 10 minutes\nconfig system global\n set admin-timeout 10\nend",
        "auth.password_complexity": "# Enforce global administrator password policy\nconfig system password-policy\n set status enable\n set min-length 12\n set apply-to-admin enable\nend",
        "auth.root_auth": "# FortiOS default enforces administrator authentication",
        "logging.central": "# Configure central FortiAnalyzer/Syslog logging\nconfig log syslogd setting\n set status enable\n set server \"192.168.10.50\"\n set mode udp\nend",
        "time.ntp": "# Enable NTP time synchronization\nconfig system ntp\n set status enable\n set ntpserver \"1.1.1.1\"\nend",
        "snmp.secure": "# Configure secure SNMPv3 user\nconfig system snmp user\n edit \"secadmin\"\n set security-level auth-priv\n set auth-proto sha\n set priv-proto aes\nnext\nend",
        "svc.insecure_services": "# Disable plain HTTP admin access\nconfig system interface\n edit \"mgmt\"\n set allowaccess ssh https ping\nnext\nend"
    }
}

VENDOR_ROLLBACK_SNIPPETS = {
    "Cisco": {
        "mgmt.ssh_only": "! Rollback SSH-only transport\nline vty 0 4\n transport input all",
        "mgmt.timeout": "! Rollback idle timeout\nline vty 0 4\n no exec-timeout\nline console 0\n no exec-timeout",
        "auth.password_complexity": "! Rollback password length\nno security passwords min-length",
        "auth.root_auth": "! Rollback enable secret\nno enable secret",
        "logging.central": "! Rollback central syslog host\nno logging host 192.168.10.50",
        "time.ntp": "! Rollback NTP server\nno ntp server 192.168.1.1",
        "snmp.secure": "! Rollback SNMPv3 user\nno snmp-server user secadmin SECURE_GRP",
        "svc.insecure_services": "! Re-enable default services\nip http server"
    },
    "Juniper": {
        "mgmt.ssh_only": "# Rollback SSH-only enforcement\ndelete system services ssh protocol-version v2\nset system services telnet",
        "mgmt.timeout": "# Rollback idle timeout\ndelete system login idle-timeout",
        "auth.password_complexity": "# Rollback password minimum length\ndelete system login password minimum-length",
        "auth.root_auth": "# Rollback root authentication\ndelete system root-authentication",
        "logging.central": "# Rollback remote syslog logging\ndelete system syslog host 10.10.10.20",
        "time.ntp": "# Rollback NTP server\ndelete system ntp server 10.0.0.1",
        "snmp.secure": "# Rollback SNMPv3 user\ndelete snmp v3 usm local-user secadmin",
        "svc.insecure_services": "# Re-enable HTTP\nset system services web-management http"
    },
    "Fortinet": {
        "mgmt.ssh_only": "# Rollback admin interface restrictions\nconfig system interface\n edit \"mgmt\"\n set allowaccess ssh https http telnet\nnext\nend",
        "mgmt.timeout": "# Rollback admin timeout\nconfig system global\n unset admin-timeout\nend",
        "auth.password_complexity": "# Rollback password policy\nconfig system password-policy\n set status disable\nend",
        "auth.root_auth": "# FortiOS default",
        "logging.central": "# Rollback syslog setting\nconfig log syslogd setting\n set status disable\nend",
        "time.ntp": "# Rollback NTP\nconfig system ntp\n set status disable\nend",
        "snmp.secure": "# Rollback SNMP user\nconfig system snmp user\n delete \"secadmin\"\nend",
        "svc.insecure_services": "# Re-enable HTTP access\nconfig system interface\n edit \"mgmt\"\n set allowaccess ssh https http ping\nnext\nend"
    }
}

class CounterfactualSimulator:
    """Counterfactual Security Simulator: Evaluates what-if remediation changes against current security
    state and predicts exact compliance deltas before applying changes to network hardware."""

    def simulate(self, db: Session, device_id: int, proposed_changes: Dict[str, str]) -> Dict[str, Any]:
        device = db.query(Device).filter(Device.id == device_id).first()
        if not device:
            return {"error": "Device not found"}

        current_props = db.query(SecurityProperty).filter(SecurityProperty.device_id == device_id).all()
        controls = db.query(Control).all()

        current_state_map = {p.property_id: p.state for p in current_props}
        predicted_state_map = dict(current_state_map)

        # Apply proposed deltas in counterfactual sandbox
        for p_id, new_state in proposed_changes.items():
            predicted_state_map[p_id] = new_state

        control_deltas = []
        before_passed = 0
        after_passed = 0
        total_controls = len(controls)

        vendor = device.vendor if device.vendor in VENDOR_REMEDIATION_SNIPPETS else "Cisco"
        vendor_snippets = VENDOR_REMEDIATION_SNIPPETS.get(vendor, VENDOR_REMEDIATION_SNIPPETS["Cisco"])
        vendor_rollback_snippets = VENDOR_ROLLBACK_SNIPPETS.get(vendor, VENDOR_ROLLBACK_SNIPPETS["Cisco"])

        generated_cli_commands = []
        generated_rollback_commands = []

        for ctrl in controls:
            pred = ctrl.predicate_json or {}
            p_id = pred.get("property")
            expected_vals = pred.get("expected", [])
            if isinstance(expected_vals, str):
                expected_vals = [expected_vals]

            # Before state evaluation
            before_val = current_state_map.get(p_id, "UNKNOWN")
            if before_val in expected_vals:
                status_before = "PASS"
                before_passed += 1
            elif before_val == "UNKNOWN":
                status_before = "INCONCLUSIVE"
            else:
                status_before = "FAIL"

            # After state evaluation
            after_val = predicted_state_map.get(p_id, "UNKNOWN")
            if after_val in expected_vals:
                status_after = "PASS"
                after_passed += 1
            elif after_val == "UNKNOWN":
                status_after = "INCONCLUSIVE"
            else:
                status_after = "FAIL"

            is_changed = (status_before != status_after)
            if p_id in proposed_changes and p_id in vendor_snippets:
                generated_cli_commands.append({
                    "property_id": p_id,
                    "control_code": ctrl.code,
                    "cli_snippet": vendor_snippets[p_id]
                })
                if p_id in vendor_rollback_snippets:
                    generated_rollback_commands.append({
                        "property_id": p_id,
                        "control_code": ctrl.code,
                        "cli_snippet": vendor_rollback_snippets[p_id]
                    })

            control_deltas.append({
                "control_code": ctrl.code,
                "control_name": ctrl.name,
                "category": ctrl.category,
                "severity": ctrl.severity,
                "property_id": p_id,
                "before_state": before_val,
                "after_state": after_val,
                "status_before": status_before,
                "status_after": status_after,
                "is_improved": (status_before != "PASS" and status_after == "PASS"),
                "is_changed": is_changed
            })

        before_score = round((before_passed / max(1, total_controls)) * 100, 1)
        after_score = round((after_passed / max(1, total_controls)) * 100, 1)
        score_gain = round(after_score - before_score, 1)

        sim_result = {
            "device_id": device.id,
            "hostname": device.hostname,
            "vendor": device.vendor,
            "summary": {
                "before_score": before_score,
                "after_score": after_score,
                "score_gain": score_gain,
                "controls_fixed": sum(1 for d in control_deltas if d["is_improved"]),
                "total_controls": total_controls,
                "mode": "DRY_RUN_COUNTERFACTUAL",
                "device_applied": False
            },
            "control_deltas": control_deltas,
            "proposed_changes": proposed_changes,
            "generated_cli_script": "\n\n".join([f"// Remediation for {c['control_code']}:\n{c['cli_snippet']}" for c in generated_cli_commands]),
            "generated_rollback_script": "\n\n".join([f"// Rollback for {c['control_code']}:\n{c['cli_snippet']}" for c in generated_rollback_commands])
        }

        # Store simulation record
        rec = SimulationRecord(
            audit_id=device.audit_id,
            device_id=device.id,
            proposed_change_json=proposed_changes,
            predicted_delta_json=sim_result["summary"]
        )
        db.add(rec)
        db.commit()

        return sim_result

counterfactual_simulator = CounterfactualSimulator()
