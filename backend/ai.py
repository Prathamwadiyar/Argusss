from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
import numpy as np
import joblib
import os
import json
from typing import Tuple, Optional, Dict, Any, List

MODEL_DIR = "data/training"
MODEL_PATH = os.path.join(MODEL_DIR, "dialect_model.joblib")
VEC_PATH = os.path.join(MODEL_DIR, "dialect_vectorizer.joblib")
DATASET_PATH = os.path.join(MODEL_DIR, "training_dataset.json")

# Ground truth seed dictionary for Multi-Vendor Security Dialects
DEFAULT_TRAINING_CORPUS = [
    # Management Access (mgmt.ssh_only)
    ("transport input ssh", "mgmt.ssh_only", "SSH_ONLY"),
    ("set system services ssh", "mgmt.ssh_only", "SSH_ONLY"),
    ("set ssh-admin-access enable", "mgmt.ssh_only", "SSH_ONLY"),
    ("ssh-server enable", "mgmt.ssh_only", "SSH_ONLY"),
    ("set admin-ssh-cipher chacha20-poly1305", "mgmt.ssh_only", "SSH_ONLY"),
    ("crypto key generate rsa modulus 4096", "mgmt.ssh_only", "SSH_ONLY"),
    ("system ssh-server algorithm kex", "mgmt.ssh_only", "SSH_ONLY"),
    ("ip ssh version 2", "mgmt.ssh_only", "SSH_ONLY"),
    ("service sshd restart", "mgmt.ssh_only", "SSH_ONLY"),
    ("transport input telnet", "mgmt.ssh_only", "UNRESTRICTED"),
    ("set system services telnet", "mgmt.ssh_only", "UNRESTRICTED"),

    # Password / Authentication (auth.password_complexity & auth.root_auth)
    ("security passwords min-length 12", "auth.password_complexity", "TRUE"),
    ("set system login password minimum-length 10", "auth.password_complexity", "TRUE"),
    ("set password-policy min-length 12", "auth.password_complexity", "TRUE"),
    ("password-attributes min-length 14", "auth.password_complexity", "TRUE"),
    ("user admin password-policy strict-entropy", "auth.password_complexity", "TRUE"),
    ("enable secret 9 $9$xyzComplexPass", "auth.root_auth", "REQUIRED"),
    ("set system root-authentication encrypted-password", "auth.root_auth", "REQUIRED"),
    ("aaa authentication login default group tacacs+ local", "auth.root_auth", "REQUIRED"),
    ("set authentication-order [ tacacs radius password ]", "auth.root_auth", "REQUIRED"),

    # Central Logging / Syslog (logging.central)
    ("logging host 192.168.10.50 transport udp port 514", "logging.central", "CENTRAL_ENABLED"),
    ("set system syslog host 10.10.10.20 any any", "logging.central", "CENTRAL_ENABLED"),
    ("config log syslogd setting set status enable", "logging.central", "CENTRAL_ENABLED"),
    ("logging server 172.16.1.100 facility local7", "logging.central", "CENTRAL_ENABLED"),
    ("set log-server 10.0.0.99 protocol tls", "logging.central", "CENTRAL_ENABLED"),
    ("no logging on", "logging.central", "DISABLED"),
    ("logging buffered 4096", "logging.central", "LOCAL_ONLY"),

    # NTP Time Sync (time.ntp)
    ("ntp server 192.168.1.1 prefer", "time.ntp", "NTP_ENABLED"),
    ("set system ntp server 10.0.0.10", "time.ntp", "NTP_ENABLED"),
    ("config system ntp set ntpserver 1.1.1.1", "time.ntp", "NTP_ENABLED"),
    ("timesync ntp unicast 10.10.0.1", "time.ntp", "NTP_ENABLED"),
    ("sntp server 10.20.30.40", "time.ntp", "NTP_ENABLED"),

    # SNMP Security (snmp.secure)
    ("snmp-server group SECURE_GROUP v3 priv", "snmp.secure", "SECURE"),
    ("set snmp v3 usm local-user secadmin authentication-sha privacy-aes", "snmp.secure", "SECURE"),
    ("config system snmp user set security-level auth-priv", "snmp.secure", "SECURE"),
    ("snmp-server community public RO", "snmp.secure", "INSECURE"),
    ("set snmp community public authorization read-only", "snmp.secure", "INSECURE"),

    # Idle Session Timeout (mgmt.timeout)
    ("exec-timeout 5 0", "mgmt.timeout", "RESTRICTED"),
    ("set system login idle-timeout 10", "mgmt.timeout", "RESTRICTED"),
    ("set admin-timeout 5", "mgmt.timeout", "RESTRICTED"),
    ("console timeout 300", "mgmt.timeout", "RESTRICTED"),
    ("exec-timeout 0 0", "mgmt.timeout", "UNRESTRICTED"),

    # Insecure Services (svc.insecure_services)
    ("no ip http server", "svc.insecure_services", "DISABLED"),
    ("ip http server", "svc.insecure_services", "EXCESS"),
    ("set system services web-management http", "svc.insecure_services", "EXCESS"),
    ("set allowaccess http", "svc.insecure_services", "EXCESS"),
]

PROPERTY_METADATA = {
    "mgmt.ssh_only": {"name": "Management SSH Only", "category": "Management", "default_state": "SSH_ONLY"},
    "auth.password_complexity": {"name": "Password Complexity / Min Length", "category": "Authentication", "default_state": "TRUE"},
    "auth.root_auth": {"name": "Root / AAA Authentication Enforced", "category": "Authentication", "default_state": "REQUIRED"},
    "logging.central": {"name": "Centralized Syslog Ingestion", "category": "Logging", "default_state": "CENTRAL_ENABLED"},
    "time.ntp": {"name": "NTP Time Synchronization", "category": "Time", "default_state": "NTP_ENABLED"},
    "snmp.secure": {"name": "Secure SNMP Protocol (v3 / Encrypted)", "category": "SNMP", "default_state": "SECURE"},
    "mgmt.timeout": {"name": "Session Inactivity Timeout", "category": "Management", "default_state": "RESTRICTED"},
    "svc.insecure_services": {"name": "Insecure Protocols Exposure (Telnet/HTTP)", "category": "Service", "default_state": "DISABLED"},
}

class LocalMLInterpreter:
    def __init__(self):
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.model: Optional[LogisticRegression] = None
        self.corpus: List[Dict[str, str]] = []
        os.makedirs(MODEL_DIR, exist_ok=True)
        self.load_or_train()

    def load_or_train(self):
        if os.path.exists(DATASET_PATH):
            try:
                with open(DATASET_PATH, "r", encoding="utf-8") as f:
                    self.corpus = json.load(f)
            except Exception:
                self._seed_corpus()
        else:
            self._seed_corpus()

        if os.path.exists(MODEL_PATH) and os.path.exists(VEC_PATH):
            try:
                self.model = joblib.load(MODEL_PATH)
                self.vectorizer = joblib.load(VEC_PATH)
            except Exception:
                self._train_model()
        else:
            self._train_model()

    def _seed_corpus(self):
        self.corpus = [
            {"fragment": item[0], "property_id": item[1], "state": item[2]}
            for item in DEFAULT_TRAINING_CORPUS
        ]
        with open(DATASET_PATH, "w", encoding="utf-8") as f:
            json.dump(self.corpus, f, indent=2)

    def _train_model(self):
        X = [item["fragment"] for item in self.corpus]
        y = [item["property_id"] for item in self.corpus]

        # Hybrid Char-WB (2-5) + Word (1-2) N-Grams for high-precision dialect classification
        self.vectorizer = TfidfVectorizer(
            analyzer='char_wb',
            ngram_range=(2, 5),
            min_df=1,
            sublinear_tf=True
        )
        X_vec = self.vectorizer.fit_transform(X)
        self.model = LogisticRegression(C=5.0, max_iter=500, random_state=42)
        self.model.fit(X_vec, y)

        joblib.dump(self.model, MODEL_PATH)
        joblib.dump(self.vectorizer, VEC_PATH)

    def interpret(self, fragment: str) -> Dict[str, Any]:
        """Interprets unknown syntax and produces property classification with calibrated confidence."""
        if not self.model or not self.vectorizer:
            self._train_model()

        clean_text = fragment.strip()
        if not clean_text:
            return {"property_id": None, "state": "UNKNOWN", "confidence": 0.0, "high_confidence": False}

        vec = self.vectorizer.transform([clean_text])
        probs = self.model.predict_proba(vec)[0]
        max_idx = int(np.argmax(probs))
        confidence = float(probs[max_idx])
        property_id = str(self.model.classes_[max_idx])

        # Get top 2 class alternatives for explainability
        top_indices = np.argsort(probs)[::-1][:3]
        alternatives = [
            {"property_id": str(self.model.classes_[i]), "confidence": round(float(probs[i]), 3)}
            for i in top_indices if i != max_idx and probs[i] > 0.05
        ]

        # Determine implied state from seed rules or default
        meta = PROPERTY_METADATA.get(property_id, {})
        category = meta.get("category", "General")
        default_state = meta.get("default_state", "TRUE")

        # Specific syntax state overrides
        frag_lower = clean_text.lower()
        if "disable" in frag_lower or "no " in frag_lower:
            if property_id == "svc.insecure_services":
                state = "DISABLED"
            else:
                state = "DISABLED"
        elif "telnet" in frag_lower or "unrestricted" in frag_lower:
            state = "UNRESTRICTED"
        elif "http" in frag_lower and not "https" in frag_lower and property_id == "svc.insecure_services":
            state = "EXCESS"
        else:
            state = default_state

        high_confidence = confidence >= 0.75

        return {
            "property_id": property_id,
            "property_name": meta.get("name", property_id),
            "category": category,
            "state": state,
            "confidence": round(confidence, 3),
            "high_confidence": high_confidence,
            "alternatives": alternatives
        }

    def learn_mapping(self, fragment: str, property_id: str, state: str = "TRUE") -> Dict[str, Any]:
        """Adds human-approved dialect mapping to training set and retrains local model immediately."""
        entry = {"fragment": fragment.strip(), "property_id": property_id, "state": state}
        self.corpus.append(entry)
        
        with open(DATASET_PATH, "w", encoding="utf-8") as f:
            json.dump(self.corpus, f, indent=2)
            
        self._train_model()
        return {
            "status": "LEARNED",
            "total_examples": len(self.corpus),
            "fragment": fragment,
            "property_id": property_id
        }

ai_engine = LocalMLInterpreter()
