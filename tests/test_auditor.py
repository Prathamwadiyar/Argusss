import pytest
import os
import json
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.database import Base, Audit, Device, ConfigFragment, SecurityProperty, Control, Finding, KnowledgeMapping
from backend.parser import VendorDetector, CiscoParser, JuniperParser, FortinetParser
from backend.ai import LocalMLInterpreter, ai_engine
from backend.compliance import ComplianceEngine, compliance_engine
from backend.intent_compiler import IntentCompiler, intent_compiler
from backend.simulator import CounterfactualSimulator, counterfactual_simulator
from backend.semantic_diff import SemanticDiffEngine, semantic_diff_engine
from backend.knowledge import KnowledgeRegistry, knowledge_registry
from backend.report import ReportGenerator, report_generator

@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = Session()
    compliance_engine.ensure_default_controls(db)
    yield db
    db.close()

def test_vendor_detector():
    cisco_cfg = "hostname CORE-RTR\ntransport input ssh\ninterface GigabitEthernet0/0"
    juniper_cfg = "set system services ssh\nset system root-authentication encrypted-password"
    fortinet_cfg = "config system global\nset admin-timeout 10\nconfig system interface"

    res_cisco = VendorDetector.detect(cisco_cfg)
    assert res_cisco["vendor"] == "Cisco"
    assert res_cisco["confidence"] >= 0.70

    res_juniper = VendorDetector.detect(juniper_cfg)
    assert res_juniper["vendor"] == "Juniper"
    assert res_juniper["confidence"] >= 0.70

    res_fortinet = VendorDetector.detect(fortinet_cfg)
    assert res_fortinet["vendor"] == "Fortinet"
    assert res_fortinet["confidence"] >= 0.70

def test_cisco_parser_and_evidence():
    sample = """
    hostname TEST-RTR
    security passwords min-length 12
    enable secret 9 $9$secret
    logging host 192.168.1.50
    ntp server 192.168.1.1
    line vty 0 4
     exec-timeout 10 0
     transport input ssh
    """
    parser = CiscoParser()
    props, unknowns = parser.parse(sample)
    
    prop_map = {p.property_id: p for p in props}
    assert "mgmt.ssh_only" in prop_map
    assert prop_map["mgmt.ssh_only"].value == "SSH_ONLY"
    assert prop_map["mgmt.ssh_only"].line_start > 0

    assert "auth.password_complexity" in prop_map
    assert prop_map["auth.password_complexity"].value == "TRUE"

    assert "logging.central" in prop_map
    assert prop_map["logging.central"].value == "CENTRAL_ENABLED"

def test_dialect_ml_engine():
    interpreter = ai_engine
    
    # Test high-confidence known dialect
    res = interpreter.interpret("transport input ssh")
    assert res["property_id"] == "mgmt.ssh_only"
    assert res["confidence"] > 0.50

    # Test retraining / continuous learning
    custom_fragment = "set proprietary-telemetry-collector 10.0.0.99"
    learn_res = interpreter.learn_mapping(custom_fragment, "logging.central", "CENTRAL_ENABLED")
    assert learn_res["status"] == "LEARNED"

    # Immediately re-test inference on learned dialect
    re_test = interpreter.interpret("set proprietary-telemetry-collector 10.0.0.99")
    assert re_test["property_id"] == "logging.central"

def test_compliance_engine_evaluation(test_db):
    audit = Audit(title="Test Audit", input_hash="abc123hash", version=1)
    test_db.add(audit)
    test_db.commit()

    device = Device(audit_id=audit.id, hostname="TEST-DEVICE", vendor="Cisco", platform="IOS-XE", source_file_hash="hash")
    test_db.add(device)
    test_db.commit()

    # Add compliant properties
    sp1 = SecurityProperty(device_id=device.id, property_id="mgmt.ssh_only", state="SSH_ONLY", confidence=1.0)
    sp2 = SecurityProperty(device_id=device.id, property_id="mgmt.timeout", state="RESTRICTED", confidence=1.0)
    sp3 = SecurityProperty(device_id=device.id, property_id="auth.password_complexity", state="TRUE", confidence=1.0)
    test_db.add_all([sp1, sp2, sp3])
    test_db.commit()

    findings = compliance_engine.evaluate(test_db, device.id, audit.id)
    assert len(findings) >= 8

    passed_findings = [f for f in findings if f["status"] == "PASS"]
    assert len(passed_findings) >= 3

def test_intent_compiler(test_db):
    intent_text = "Management access must use SSH only and central syslog logging must be enabled."
    compiled = intent_compiler.compile(intent_text)
    assert compiled["is_valid"] is True
    assert len(compiled["predicates"]) >= 2
    
    prop_ids = [p["property_id"] for p in compiled["predicates"]]
    assert "mgmt.ssh_only" in prop_ids
    assert "logging.central" in prop_ids

def test_counterfactual_simulator(test_db):
    dev = Device(hostname="SIM-TEST", vendor="Cisco", platform="IOS-XE", source_file_hash="simhash")
    test_db.add(dev)
    test_db.commit()

    # Device initially fails SSH
    sp = SecurityProperty(device_id=dev.id, property_id="mgmt.ssh_only", state="UNRESTRICTED", confidence=1.0)
    test_db.add(sp)
    test_db.commit()

    res = counterfactual_simulator.simulate(test_db, dev.id, {"mgmt.ssh_only": "SSH_ONLY"})
    assert res["summary"]["score_gain"] > 0
    assert "generated_cli_script" in res
    assert "transport input ssh" in res["generated_cli_script"]
    assert "generated_rollback_script" in res
    assert "transport input all" in res["generated_rollback_script"]

def test_temporal_drift_analysis(test_db):
    dev1 = Device(hostname="BASELINE-RTR", vendor="Cisco", platform="IOS-XE", raw_content="transport input ssh\nexec-timeout 10 0", source_file_hash="hash1")
    dev2 = Device(hostname="DRIFTED-RTR", vendor="Cisco", platform="IOS-XE", raw_content="transport input telnet ssh\nexec-timeout 0 0", source_file_hash="hash2")
    test_db.add_all([dev1, dev2])
    test_db.commit()

    sp1 = SecurityProperty(device_id=dev1.id, property_id="mgmt.ssh_only", state="SSH_ONLY", confidence=1.0)
    sp2 = SecurityProperty(device_id=dev2.id, property_id="mgmt.ssh_only", state="TELNET_ALLOWED", confidence=1.0)
    test_db.add_all([sp1, sp2])
    test_db.commit()

    from backend.main import analyze_temporal_drift, DriftRequest
    req = DriftRequest(baseline_device_id=dev1.id, target_device_id=dev2.id)
    res = analyze_temporal_drift(req, test_db)

    assert res["baseline_device"]["hostname"] == "BASELINE-RTR"
    assert res["current_device"]["hostname"] == "DRIFTED-RTR"
    assert res["summary"]["drifted_properties_count"] >= 1
    assert len(res["line_diffs"]) >= 1

def test_knowledge_reversal(test_db):
    # Register mapping
    mapping = knowledge_registry.create_or_approve_mapping(
        db=test_db,
        vendor="Cisco",
        fragment="set custom-cipher aes256",
        property_id="mgmt.ssh_only",
        property_state="SSH_ONLY",
        reviewer="Audit Lead"
    )
    assert mapping["status"] == "APPROVED"

    # Revoke mapping
    rev_res = knowledge_registry.revoke_mapping(test_db, mapping["mapping_id"], "Chief Security Officer")
    assert rev_res["status"] == "REVOKED"
    assert "impact_analysis" in rev_res

def test_executive_report_generation(test_db):
    audit = Audit(title="Full Test Audit", input_hash="9f86d081884c7d65", version=1)
    test_db.add(audit)
    test_db.commit()

    dev = Device(audit_id=audit.id, hostname="RTR-01", vendor="Cisco", platform="IOS-XE", source_file_hash="9f86d081884c7d65")
    test_db.add(dev)
    test_db.commit()

    compliance_engine.evaluate(test_db, dev.id, audit.id)
    html = report_generator.generate_html_report(test_db, audit.id)
    assert "SIH26155 Security Compliance Audit" in html
    assert "9f86d081884c7d65" in html
