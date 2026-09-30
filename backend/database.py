from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, ForeignKey, DateTime, JSON, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import datetime
import os

os.makedirs("data", exist_ok=True)
SQLALCHEMY_DATABASE_URL = "sqlite:///./data/compliance.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Audit(Base):
    __tablename__ = "audits"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, default="Multi-Vendor Security Audit")
    input_hash = Column(String, index=True)
    summary_json = Column(JSON, default=dict)
    version = Column(Integer, default=1)
    status = Column(String, default="COMPLETED") # COMPLETED, RE_AUDIT_REQUIRED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    devices = relationship("Device", back_populates="audit", cascade="all, delete-orphan")
    findings = relationship("Finding", back_populates="audit", cascade="all, delete-orphan")

class Device(Base):
    __tablename__ = "devices"
    id = Column(Integer, primary_key=True, index=True)
    audit_id = Column(Integer, ForeignKey("audits.id"), nullable=True)
    hostname = Column(String, index=True)
    vendor = Column(String, index=True)  # Cisco, Juniper, Fortinet, Generic
    platform = Column(String, default="Standard")
    version = Column(String, default="1.0")
    source_file = Column(String)
    source_file_hash = Column(String, index=True)
    raw_content = Column(Text, default="")
    vendor_confidence = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    audit = relationship("Audit", back_populates="devices")
    fragments = relationship("ConfigFragment", back_populates="device", cascade="all, delete-orphan")
    properties = relationship("SecurityProperty", back_populates="device", cascade="all, delete-orphan")
    findings = relationship("Finding", back_populates="device", cascade="all, delete-orphan")

class ConfigFragment(Base):
    __tablename__ = "config_fragments"
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"))
    raw_text = Column(Text)
    line_start = Column(Integer)
    line_end = Column(Integer)
    parser_status = Column(String) # KNOWN, UNKNOWN, REVIEWED

    device = relationship("Device", back_populates="fragments")
    properties = relationship("SecurityProperty", back_populates="source_fragment")

class SecurityProperty(Base):
    __tablename__ = "security_properties"
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"))
    property_id = Column(String, index=True) # e.g., mgmt.ssh_only, logging.central
    category = Column(String, default="General") # Management, Authentication, Logging, Time, SNMP, Service
    state = Column(String) # TRUE, FALSE, RESTRICTED, UNRESTRICTED, ENABLED, DISABLED, UNKNOWN
    confidence = Column(Float, default=1.0)
    source_type = Column(String, default="DETERMINISTIC") # DETERMINISTIC, ML_INFERRED, HUMAN_OVERRIDE
    source_fragment_id = Column(Integer, ForeignKey("config_fragments.id"), nullable=True)

    device = relationship("Device", back_populates="properties")
    source_fragment = relationship("ConfigFragment", back_populates="properties")

class Control(Base):
    __tablename__ = "controls"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True) # e.g. MGMT-01
    name = Column(String)
    category = Column(String, default="General")
    description = Column(Text)
    predicate_json = Column(JSON) # {"property": "mgmt.ssh_only", "expected": ["TRUE", "SSH_ONLY"]}
    severity = Column(String) # CRITICAL, HIGH, MEDIUM, LOW
    standard_refs = Column(JSON, default=list) # ["CIS 4.1", "NIST 800-53 AC-17"]
    remediation = Column(Text, default="")

    findings = relationship("Finding", back_populates="control")

class Finding(Base):
    __tablename__ = "findings"
    id = Column(Integer, primary_key=True, index=True)
    audit_id = Column(Integer, ForeignKey("audits.id"), nullable=True)
    device_id = Column(Integer, ForeignKey("devices.id"))
    control_id = Column(Integer, ForeignKey("controls.id"))
    status = Column(String, index=True) # PASS, FAIL, INCONCLUSIVE
    severity = Column(String) # CRITICAL, HIGH, MEDIUM, LOW
    confidence = Column(Float, default=1.0)
    property_id = Column(String)
    actual_state = Column(String)
    expected_state = Column(String)
    evidence_json = Column(JSON, default=dict) # {"line_start": 12, "line_end": 14, "text": "...", "source": "..."}
    remediation_guidance = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    audit = relationship("Audit", back_populates="findings")
    device = relationship("Device", back_populates="findings")
    control = relationship("Control", back_populates="findings")

class PolicyIntent(Base):
    __tablename__ = "policy_intents"
    id = Column(Integer, primary_key=True, index=True)
    natural_language = Column(Text)
    compiled_json = Column(JSON)
    compiler_version = Column(String, default="1.0")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class KnowledgeMapping(Base):
    __tablename__ = "knowledge_mappings"
    id = Column(Integer, primary_key=True, index=True)
    vendor = Column(String, index=True)
    platform = Column(String, default="Universal")
    version_scope = Column(String, default="All")
    fragment_pattern = Column(Text, index=True)
    property_id = Column(String, index=True)
    property_state = Column(String, default="TRUE")
    confidence = Column(Float, default=1.0)
    review_status = Column(String, default="APPROVED", index=True) # PENDING, APPROVED, REJECTED, REVOKED
    reviewer = Column(String, default="Security Officer")
    version = Column(Integer, default=1)
    provenance_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    revoked_at = Column(DateTime, nullable=True)

class SimulationRecord(Base):
    __tablename__ = "simulations"
    id = Column(Integer, primary_key=True, index=True)
    audit_id = Column(Integer, ForeignKey("audits.id"), nullable=True)
    device_id = Column(Integer, ForeignKey("devices.id"))
    proposed_change_json = Column(JSON)
    predicted_delta_json = Column(JSON)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String)
    org_name = Column(String)
    email = Column(String, unique=True, index=True)
    phone_number = Column(String, nullable=True)
    role = Column(String, default="Lead Security Auditor")
    org_type = Column(String, default="Enterprise Infrastructure")
    password_hash = Column(String, nullable=True)
    firebase_uid = Column(String, index=True, nullable=True)
    photo_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

