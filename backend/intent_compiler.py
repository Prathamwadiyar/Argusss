import re
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.database import Device, SecurityProperty

class IntentCompiler:
    """Universal Security Intent Compiler: Translates human-readable security policy requirements
    into vendor-neutral predicates and evaluates them against heterogeneous multi-vendor fleets."""

    INTENT_SLOTS = [
        {
            "patterns": [r"management.*ssh", r"ssh.*only", r"remote.*access.*ssh", r"secure.*management"],
            "property_id": "mgmt.ssh_only",
            "required_state": "SSH_ONLY",
            "description": "Enforce SSH-only administrative access across devices",
            "category": "Management"
        },
        {
            "patterns": [r"session.*timeout", r"idle.*timeout", r"exec.*timeout", r"timeout.*10.*min"],
            "property_id": "mgmt.timeout",
            "required_state": "RESTRICTED",
            "description": "Restrict interactive session idle timeout to 10 minutes or less",
            "category": "Management"
        },
        {
            "patterns": [r"password.*complex", r"password.*length", r"min.*password", r"strong.*password"],
            "property_id": "auth.password_complexity",
            "required_state": "TRUE",
            "description": "Enforce minimum password length and complexity",
            "category": "Authentication"
        },
        {
            "patterns": [r"root.*auth", r"privileged.*exec", r"enable.*secret", r"aaa.*auth"],
            "property_id": "auth.root_auth",
            "required_state": "REQUIRED",
            "description": "Require cryptographic root/privileged authentication",
            "category": "Authentication"
        },
        {
            "patterns": [r"syslog", r"central.*log", r"remote.*log", r"siem.*log"],
            "property_id": "logging.central",
            "required_state": "CENTRAL_ENABLED",
            "description": "Stream audit logs to a centralized remote Syslog/SIEM server",
            "category": "Logging"
        },
        {
            "patterns": [r"ntp", r"time.*sync", r"network.*time", r"clock.*sync"],
            "property_id": "time.ntp",
            "required_state": "NTP_ENABLED",
            "description": "Synchronize system clocks using authoritative NTP sources",
            "category": "Time"
        },
        {
            "patterns": [r"snmp.*v3", r"secure.*snmp", r"snmp.*encrypt", r"disable.*snmp.*v2"],
            "property_id": "snmp.secure",
            "required_state": "SECURE",
            "description": "Mandate SNMPv3 authenticated and encrypted transport",
            "category": "SNMP"
        },
        {
            "patterns": [r"disable.*(telnet|http)", r"insecure.*services", r"no.*http.*server", r"plaintext.*protocols"],
            "property_id": "svc.insecure_services",
            "required_state": "DISABLED",
            "description": "Prohibit plaintext and legacy services (Telnet/HTTP)",
            "category": "Service"
        }
    ]

    def compile(self, natural_language_text: str) -> Dict[str, Any]:
        text_lower = natural_language_text.lower().strip()
        matched_predicates = []

        for slot in self.INTENT_SLOTS:
            for pat in slot["patterns"]:
                if re.search(pat, text_lower):
                    matched_predicates.append({
                        "property_id": slot["property_id"],
                        "expected_state": slot["required_state"],
                        "category": slot["category"],
                        "description": slot["description"],
                        "predicate_expression": f"{slot['property_id']} == '{slot['required_state']}'"
                    })
                    break

        if not matched_predicates:
            # Fallback semantic keyword match
            if "ssh" in text_lower:
                matched_predicates.append({
                    "property_id": "mgmt.ssh_only",
                    "expected_state": "SSH_ONLY",
                    "category": "Management",
                    "description": "Enforce SSH protocol for management",
                    "predicate_expression": "mgmt.ssh_only == 'SSH_ONLY'"
                })
            elif "log" in text_lower:
                matched_predicates.append({
                    "property_id": "logging.central",
                    "expected_state": "CENTRAL_ENABLED",
                    "category": "Logging",
                    "description": "Enable central logging",
                    "predicate_expression": "logging.central == 'CENTRAL_ENABLED'"
                })

        compiled_ast = {
            "version": "1.0-bounded",
            "source_intent": natural_language_text,
            "predicates_count": len(matched_predicates),
            "predicates": matched_predicates,
            "is_valid": len(matched_predicates) > 0,
            "operator": "AND" if len(matched_predicates) > 1 else "SINGLE"
        }
        return compiled_ast

    def evaluate_fleet(self, db: Session, compiled_intent: Dict[str, Any], audit_id: Optional[int] = None) -> Dict[str, Any]:
        devices_query = db.query(Device)
        if audit_id:
            devices_query = devices_query.filter(Device.audit_id == audit_id)
        devices = devices_query.all()

        predicates = compiled_intent.get("predicates", [])
        if not predicates:
            return {
                "compiled_intent": compiled_intent,
                "fleet_summary": {"total_devices": len(devices), "passed": 0, "failed": 0, "inconclusive": len(devices)},
                "device_evaluations": []
            }

        device_results = []
        fleet_passed = 0
        fleet_failed = 0
        fleet_inconclusive = 0

        for dev in devices:
            props = db.query(SecurityProperty).filter(SecurityProperty.device_id == dev.id).all()
            prop_map = {p.property_id: p for p in props}
            
            dev_pred_results = []
            dev_status = "PASS"

            for pred in predicates:
                p_id = pred["property_id"]
                expected = pred["expected_state"]
                sec_prop = prop_map.get(p_id)

                if not sec_prop or sec_prop.state == "UNKNOWN":
                    p_status = "INCONCLUSIVE"
                    actual = "UNKNOWN"
                elif sec_prop.state == expected:
                    p_status = "PASS"
                    actual = sec_prop.state
                else:
                    p_status = "FAIL"
                    actual = sec_prop.state

                if p_status == "FAIL":
                    dev_status = "FAIL"
                elif p_status == "INCONCLUSIVE" and dev_status != "FAIL":
                    dev_status = "INCONCLUSIVE"

                dev_pred_results.append({
                    "property_id": p_id,
                    "expected": expected,
                    "actual": actual,
                    "status": p_status,
                    "description": pred["description"]
                })

            if dev_status == "PASS":
                fleet_passed += 1
            elif dev_status == "FAIL":
                fleet_failed += 1
            else:
                fleet_inconclusive += 1

            device_results.append({
                "device_id": dev.id,
                "hostname": dev.hostname,
                "vendor": dev.vendor,
                "overall_status": dev_status,
                "predicates": dev_pred_results
            })

        return {
            "compiled_intent": compiled_intent,
            "fleet_summary": {
                "total_devices": len(devices),
                "passed": fleet_passed,
                "failed": fleet_failed,
                "inconclusive": fleet_inconclusive,
                "compliance_rate": round((fleet_passed / max(1, len(devices))) * 100, 1)
            },
            "device_evaluations": device_results
        }

intent_compiler = IntentCompiler()
