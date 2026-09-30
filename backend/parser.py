import re
from typing import List, Tuple, Dict, Any, Optional

class SecurityPropertyEvidence:
    def __init__(
        self,
        property_id: str,
        category: str,
        value: str,
        line_start: int,
        line_end: int,
        text: str,
        source: str = "DETERMINISTIC",
        confidence: float = 1.0
    ):
        self.property_id = property_id
        self.category = category
        self.value = value
        self.line_start = line_start
        self.line_end = line_end
        self.text = text
        self.source = source
        self.confidence = confidence

    def to_dict(self):
        return {
            "property_id": self.property_id,
            "category": self.category,
            "value": self.value,
            "line_start": self.line_start,
            "line_end": self.line_end,
            "text": self.text,
            "source": self.source,
            "confidence": self.confidence
        }

class VendorDetector:
    """Deterministic signature-based vendor and platform detector with confidence scoring."""
    
    CISCO_SIGNATURES = [
        (r"transport input (ssh|all|none|telnet)", 3.0),
        (r"^service password-encryption", 2.5),
        (r"^line (vty|con|aux)", 2.5),
        (r"^interface (GigabitEthernet|FastEthernet|TenGigabitEthernet|Loopback|Vlan)", 2.0),
        (r"^enable (secret|password)", 2.0),
        (r"^ip http (server|secure-server)", 2.0),
        (r"^no ip (domain-lookup|http)", 1.5),
        (r"^spanning-tree mode", 1.5),
        (r"^router (bgp|ospf|eigrp)", 2.0),
    ]

    JUNIPER_SIGNATURES = [
        (r"set system services (ssh|netconf|web-management)", 3.0),
        (r"set system root-authentication", 3.0),
        (r"set system (login|syslog|ntp|time-zone)", 2.5),
        (r"set interfaces (ge-|xe-|et-|lo0)", 2.5),
        (r"set protocols (bgp|ospf|lldp)", 2.0),
        (r"set snmp (community|v3)", 2.0),
        (r"apply-groups", 2.0),
        (r"system {", 2.0),
    ]

    FORTINET_SIGNATURES = [
        (r"config system (admin|global|interface|ntp|dns)", 3.0),
        (r"set ssh-admin-access (enable|disable)", 3.0),
        (r"config log (syslogd|disk|setting)", 2.5),
        (r"config firewall (policy|address|service)", 2.5),
        (r"config router (bgp|static|ospf)", 2.0),
        (r"set admin-timeout", 2.0),
        (r"set vdom", 1.5),
        (r"^end$", 1.0),
    ]

    @classmethod
    def detect(cls, text: str, filename: str = "") -> Dict[str, Any]:
        cisco_score = 0.0
        juniper_score = 0.0
        fortinet_score = 0.0
        signals = []

        # Check filename hints
        fn_lower = filename.lower()
        if "cisco" in fn_lower or fn_lower.endswith(".ios"):
            cisco_score += 1.5
            signals.append("Filename contains Cisco keyword")
        elif "juniper" in fn_lower or "junos" in fn_lower:
            juniper_score += 1.5
            signals.append("Filename contains Juniper keyword")
        elif "fortinet" in fn_lower or "fortigate" in fn_lower or "fg" in fn_lower:
            fortinet_score += 1.5
            signals.append("Filename contains Fortinet keyword")

        lines = text.splitlines()
        for line in lines:
            line_str = line.strip()
            if not line_str or line_str.startswith("!") or line_str.startswith("#"):
                continue

            for pattern, weight in cls.CISCO_SIGNATURES:
                if re.search(pattern, line_str, re.IGNORECASE):
                    cisco_score += weight
                    if len(signals) < 4:
                        signals.append(f"Cisco pattern match: {pattern}")
                    break

            for pattern, weight in cls.JUNIPER_SIGNATURES:
                if re.search(pattern, line_str, re.IGNORECASE):
                    juniper_score += weight
                    if len(signals) < 4:
                        signals.append(f"Juniper pattern match: {pattern}")
                    break

            for pattern, weight in cls.FORTINET_SIGNATURES:
                if re.search(pattern, line_str, re.IGNORECASE):
                    fortinet_score += weight
                    if len(signals) < 4:
                        signals.append(f"Fortinet pattern match: {pattern}")
                    break

        scores = [
            ("Cisco", cisco_score, "Cisco IOS-XE"),
            ("Juniper", juniper_score, "Junos OS"),
            ("Fortinet", fortinet_score, "FortiOS"),
        ]
        scores.sort(key=lambda x: x[1], reverse=True)
        top_vendor, top_score, platform = scores[0]

        total_score = sum(s[1] for s in scores)
        confidence = min(0.99, max(0.50, top_score / (total_score + 1e-5))) if total_score > 0 else 0.50

        if top_score < 2.0:
            top_vendor = "Generic"
            platform = "Universal Network OS"
            confidence = 0.50

        return {
            "vendor": top_vendor,
            "platform": platform,
            "confidence": round(confidence, 2),
            "signals": signals[:5],
            "score": round(top_score, 1)
        }

class BaseVendorParser:
    SECURITY_KEYWORDS = [
        "ssh", "telnet", "http", "https", "admin", "login", "password", "secret",
        "timeout", "syslog", "ntp", "snmp", "auth", "radius", "tacacs", "quarantine",
        "cipher", "crypto", "access-list", "acl", "firewall", "isolation", "banner"
    ]

    def is_security_relevant(self, line: str) -> bool:
        line_lower = line.lower()
        return any(kw in line_lower for kw in self.SECURITY_KEYWORDS)

    def extract_unknowns(self, lines: List[str], matched_indices: set) -> List[Tuple[int, int, str]]:
        unknowns = []
        for i, line in enumerate(lines):
            line_str = line.strip()
            if not line_str or line_str.startswith("!") or line_str.startswith("#"):
                continue
            if i not in matched_indices and self.is_security_relevant(line_str):
                unknowns.append((i + 1, i + 1, line_str))
        return unknowns

class CiscoParser(BaseVendorParser):
    def parse(self, text: str) -> Tuple[List[SecurityPropertyEvidence], List[Tuple[int, int, str]]]:
        properties = []
        matched_lines = set()
        lines = text.splitlines()

        # State accumulators for multi-line context
        has_ssh = False
        has_telnet = False
        ssh_line = None
        
        has_logging = False
        logging_line = None
        
        has_ntp = False
        ntp_line = None
        
        has_snmp_v3 = False
        has_snmp_insecure = False
        snmp_line = None
        
        has_pwd_min_len = False
        pwd_len_line = None
        
        has_secret = False
        secret_line = None
        
        has_timeout = False
        timeout_line = None
        timeout_val = None

        has_http_server = False
        no_http_server = False
        http_line = None

        for i, line in enumerate(lines):
            line_str = line.strip()
            
            # 1. SSH / Management Protocol
            if re.search(r"transport input\s+ssh\b", line_str, re.IGNORECASE):
                has_ssh = True
                ssh_line = (i + 1, line_str)
                matched_lines.add(i)
            elif re.search(r"transport input\s+(all|telnet)\b", line_str, re.IGNORECASE):
                has_telnet = True
                ssh_line = (i + 1, line_str)
                matched_lines.add(i)

            # 2. Exec Timeout
            m_timeout = re.search(r"exec-timeout\s+(\d+)\s+(\d+)", line_str, re.IGNORECASE)
            if m_timeout:
                timeout_min = int(m_timeout.group(1))
                has_timeout = True
                timeout_val = timeout_min
                timeout_line = (i + 1, line_str)
                matched_lines.add(i)

            # 3. Password Complexity & Secret
            m_pwd = re.search(r"security passwords min-length\s+(\d+)", line_str, re.IGNORECASE)
            if m_pwd:
                min_len = int(m_pwd.group(1))
                has_pwd_min_len = min_len >= 8
                pwd_len_line = (i + 1, line_str)
                matched_lines.add(i)

            if re.search(r"enable secret\s+", line_str, re.IGNORECASE):
                has_secret = True
                secret_line = (i + 1, line_str)
                matched_lines.add(i)
            elif re.search(r"service password-encryption", line_str, re.IGNORECASE):
                matched_lines.add(i)

            # 4. Central Syslog
            if re.search(r"^logging\s+(host\s+)?(\d+\.\d+\.\d+\.\d+|[a-zA-Z0-9\.\-_]+)", line_str, re.IGNORECASE):
                has_logging = True
                logging_line = (i + 1, line_str)
                matched_lines.add(i)

            # 5. NTP
            if re.search(r"^ntp server\s+(\d+\.\d+\.\d+\.\d+|[a-zA-Z0-9\.\-_]+)", line_str, re.IGNORECASE):
                has_ntp = True
                ntp_line = (i + 1, line_str)
                matched_lines.add(i)

            # 6. SNMP
            if re.search(r"^snmp-server (group|user).*\bv3\b", line_str, re.IGNORECASE):
                has_snmp_v3 = True
                snmp_line = (i + 1, line_str)
                matched_lines.add(i)
            elif re.search(r"^snmp-server community\s+\w+\s+(RW|RO)", line_str, re.IGNORECASE):
                has_snmp_insecure = True
                snmp_line = (i + 1, line_str)
                matched_lines.add(i)

            # 7. Insecure HTTP Services
            if re.search(r"^ip http server\b", line_str, re.IGNORECASE):
                has_http_server = True
                http_line = (i + 1, line_str)
                matched_lines.add(i)
            elif re.search(r"^no ip http server\b", line_str, re.IGNORECASE):
                no_http_server = True
                http_line = (i + 1, line_str)
                matched_lines.add(i)

        # Assemble normalized properties with line citations
        if has_ssh and not has_telnet:
            properties.append(SecurityPropertyEvidence("mgmt.ssh_only", "Management", "SSH_ONLY", ssh_line[0], ssh_line[0], ssh_line[1]))
        elif has_telnet:
            properties.append(SecurityPropertyEvidence("mgmt.ssh_only", "Management", "UNRESTRICTED", ssh_line[0], ssh_line[0], ssh_line[1]))
        else:
            properties.append(SecurityPropertyEvidence("mgmt.ssh_only", "Management", "UNKNOWN", 1, 1, "No transport input config found"))

        if has_timeout:
            state = "RESTRICTED" if (timeout_val is not None and timeout_val <= 10) else "EXCESS"
            properties.append(SecurityPropertyEvidence("mgmt.timeout", "Management", state, timeout_line[0], timeout_line[0], timeout_line[1]))
        else:
            properties.append(SecurityPropertyEvidence("mgmt.timeout", "Management", "UNRESTRICTED", 1, 1, "Default infinite session timeout"))

        if has_pwd_min_len:
            properties.append(SecurityPropertyEvidence("auth.password_complexity", "Authentication", "TRUE", pwd_len_line[0], pwd_len_line[0], pwd_len_line[1]))
        else:
            properties.append(SecurityPropertyEvidence("auth.password_complexity", "Authentication", "FALSE", 1, 1, "No password min-length enforcement"))

        if has_secret:
            properties.append(SecurityPropertyEvidence("auth.root_auth", "Authentication", "REQUIRED", secret_line[0], secret_line[0], secret_line[1]))
        else:
            properties.append(SecurityPropertyEvidence("auth.root_auth", "Authentication", "DISABLED", 1, 1, "No enable secret configured"))

        if has_logging:
            properties.append(SecurityPropertyEvidence("logging.central", "Logging", "CENTRAL_ENABLED", logging_line[0], logging_line[0], logging_line[1]))
        else:
            properties.append(SecurityPropertyEvidence("logging.central", "Logging", "DISABLED", 1, 1, "No central logging host configured"))

        if has_ntp:
            properties.append(SecurityPropertyEvidence("time.ntp", "Time", "NTP_ENABLED", ntp_line[0], ntp_line[0], ntp_line[1]))
        else:
            properties.append(SecurityPropertyEvidence("time.ntp", "Time", "DISABLED", 1, 1, "No NTP synchronization configured"))

        if has_snmp_v3:
            properties.append(SecurityPropertyEvidence("snmp.secure", "SNMP", "SECURE", snmp_line[0], snmp_line[0], snmp_line[1]))
        elif has_snmp_insecure:
            properties.append(SecurityPropertyEvidence("snmp.secure", "SNMP", "INSECURE", snmp_line[0], snmp_line[0], snmp_line[1]))
        else:
            properties.append(SecurityPropertyEvidence("snmp.secure", "SNMP", "DISABLED", 1, 1, "SNMP service not exposed"))

        if no_http_server:
            properties.append(SecurityPropertyEvidence("svc.insecure_services", "Service", "DISABLED", http_line[0], http_line[0], http_line[1]))
        elif has_http_server:
            properties.append(SecurityPropertyEvidence("svc.insecure_services", "Service", "EXCESS", http_line[0], http_line[0], http_line[1]))
        else:
            properties.append(SecurityPropertyEvidence("svc.insecure_services", "Service", "DISABLED", 1, 1, "Insecure HTTP server disabled by default"))

        unknowns = self.extract_unknowns(lines, matched_lines)
        return properties, unknowns

class JuniperParser(BaseVendorParser):
    def parse(self, text: str) -> Tuple[List[SecurityPropertyEvidence], List[Tuple[int, int, str]]]:
        properties = []
        matched_lines = set()
        lines = text.splitlines()

        has_ssh = False
        ssh_line = None
        has_telnet = False
        
        has_root_auth = False
        root_line = None
        
        has_pwd_policy = False
        pwd_line = None
        
        has_syslog = False
        syslog_line = None
        
        has_ntp = False
        ntp_line = None
        
        has_snmp_v3 = False
        snmp_line = None
        
        has_timeout = False
        timeout_line = None
        timeout_val = None

        has_web_mgmt = False

        for i, line in enumerate(lines):
            line_str = line.strip()

            # SSH / Telnet
            if re.search(r"set system services ssh\b", line_str, re.IGNORECASE):
                has_ssh = True
                ssh_line = (i + 1, line_str)
                matched_lines.add(i)
            elif re.search(r"set system services telnet\b", line_str, re.IGNORECASE):
                has_telnet = True
                matched_lines.add(i)

            # Root Auth & Password format
            if re.search(r"set system root-authentication (encrypted-password|plain-text-password)", line_str, re.IGNORECASE):
                has_root_auth = True
                root_line = (i + 1, line_str)
                matched_lines.add(i)

            if re.search(r"set system login password (format|minimum-length)", line_str, re.IGNORECASE):
                has_pwd_policy = True
                pwd_line = (i + 1, line_str)
                matched_lines.add(i)

            # Syslog
            if re.search(r"set system syslog host\s+(\d+\.\d+\.\d+\.\d+|[a-zA-Z0-9\.\-_]+)", line_str, re.IGNORECASE):
                has_syslog = True
                syslog_line = (i + 1, line_str)
                matched_lines.add(i)

            # NTP
            if re.search(r"set system ntp server\s+(\d+\.\d+\.\d+\.\d+|[a-zA-Z0-9\.\-_]+)", line_str, re.IGNORECASE):
                has_ntp = True
                ntp_line = (i + 1, line_str)
                matched_lines.add(i)

            # SNMP
            if re.search(r"set snmp (v3|view)", line_str, re.IGNORECASE):
                has_snmp_v3 = True
                snmp_line = (i + 1, line_str)
                matched_lines.add(i)

            # Idle timeout
            m_t = re.search(r"set system login idle-timeout\s+(\d+)", line_str, re.IGNORECASE)
            if m_t:
                has_timeout = True
                timeout_val = int(m_t.group(1))
                timeout_line = (i + 1, line_str)
                matched_lines.add(i)

            # Web management (insecure http)
            if re.search(r"set system services web-management http\b", line_str, re.IGNORECASE):
                has_web_mgmt = True
                matched_lines.add(i)

        # Build properties
        if has_ssh and not has_telnet:
            properties.append(SecurityPropertyEvidence("mgmt.ssh_only", "Management", "SSH_ONLY", ssh_line[0], ssh_line[0], ssh_line[1]))
        elif has_telnet:
            properties.append(SecurityPropertyEvidence("mgmt.ssh_only", "Management", "UNRESTRICTED", 1, 1, "Telnet enabled in system services"))
        else:
            properties.append(SecurityPropertyEvidence("mgmt.ssh_only", "Management", "UNKNOWN", 1, 1, "No SSH service configured"))

        if has_timeout:
            state = "RESTRICTED" if (timeout_val is not None and timeout_val <= 10) else "EXCESS"
            properties.append(SecurityPropertyEvidence("mgmt.timeout", "Management", state, timeout_line[0], timeout_line[0], timeout_line[1]))
        else:
            properties.append(SecurityPropertyEvidence("mgmt.timeout", "Management", "UNRESTRICTED", 1, 1, "No idle-timeout configured"))

        if has_pwd_policy:
            properties.append(SecurityPropertyEvidence("auth.password_complexity", "Authentication", "TRUE", pwd_line[0], pwd_line[0], pwd_line[1]))
        else:
            properties.append(SecurityPropertyEvidence("auth.password_complexity", "Authentication", "FALSE", 1, 1, "Default password policy"))

        if has_root_auth:
            properties.append(SecurityPropertyEvidence("auth.root_auth", "Authentication", "REQUIRED", root_line[0], root_line[0], root_line[1]))
        else:
            properties.append(SecurityPropertyEvidence("auth.root_auth", "Authentication", "DISABLED", 1, 1, "Root authentication missing"))

        if has_syslog:
            properties.append(SecurityPropertyEvidence("logging.central", "Logging", "CENTRAL_ENABLED", syslog_line[0], syslog_line[0], syslog_line[1]))
        else:
            properties.append(SecurityPropertyEvidence("logging.central", "Logging", "DISABLED", 1, 1, "Central syslog host not configured"))

        if has_ntp:
            properties.append(SecurityPropertyEvidence("time.ntp", "Time", "NTP_ENABLED", ntp_line[0], ntp_line[0], ntp_line[1]))
        else:
            properties.append(SecurityPropertyEvidence("time.ntp", "Time", "DISABLED", 1, 1, "NTP server not set"))

        if has_snmp_v3:
            properties.append(SecurityPropertyEvidence("snmp.secure", "SNMP", "SECURE", snmp_line[0], snmp_line[0], snmp_line[1]))
        else:
            properties.append(SecurityPropertyEvidence("snmp.secure", "SNMP", "DISABLED", 1, 1, "SNMP disabled or unconfigured"))

        if has_web_mgmt:
            properties.append(SecurityPropertyEvidence("svc.insecure_services", "Service", "EXCESS", 1, 1, "Insecure HTTP web-management active"))
        else:
            properties.append(SecurityPropertyEvidence("svc.insecure_services", "Service", "DISABLED", 1, 1, "No unencrypted web service"))

        unknowns = self.extract_unknowns(lines, matched_lines)
        return properties, unknowns

class FortinetParser(BaseVendorParser):
    def parse(self, text: str) -> Tuple[List[SecurityPropertyEvidence], List[Tuple[int, int, str]]]:
        properties = []
        matched_lines = set()
        lines = text.splitlines()

        has_ssh = False
        ssh_line = None
        
        has_pwd_policy = False
        pwd_line = None
        
        has_syslog = False
        syslog_line = None
        
        has_ntp = False
        ntp_line = None
        
        has_snmp_v3 = False
        snmp_line = None
        
        has_timeout = False
        timeout_line = None
        timeout_val = None

        has_http = False

        for i, line in enumerate(lines):
            line_str = line.strip()

            # SSH Admin access
            if re.search(r"set ssh-admin-access enable\b", line_str, re.IGNORECASE) or re.search(r"set allowaccess .*ssh", line_str, re.IGNORECASE):
                has_ssh = True
                ssh_line = (i + 1, line_str)
                matched_lines.add(i)

            # Password policy
            if re.search(r"set (password-policy|min-password-length|apply-to-admin)", line_str, re.IGNORECASE):
                has_pwd_policy = True
                pwd_line = (i + 1, line_str)
                matched_lines.add(i)

            # Syslog
            if re.search(r"(config log syslogd|set (server|status enable))", line_str, re.IGNORECASE):
                if "server" in line_str or "status enable" in line_str:
                    has_syslog = True
                    syslog_line = (i + 1, line_str)
                matched_lines.add(i)

            # NTP
            if re.search(r"(config system ntp|set (server-mode|ntpserver|status enable))", line_str, re.IGNORECASE):
                if "server" in line_str or "status enable" in line_str:
                    has_ntp = True
                    ntp_line = (i + 1, line_str)
                matched_lines.add(i)

            # SNMP
            if re.search(r"config system snmp (user|sysinfo|community)", line_str, re.IGNORECASE) or re.search(r"set security-level auth-priv", line_str, re.IGNORECASE):
                has_snmp_v3 = True
                snmp_line = (i + 1, line_str)
                matched_lines.add(i)

            # Admin timeout
            m_t = re.search(r"set (admin-timeout|admintimeout)\s+(\d+)", line_str, re.IGNORECASE)
            if m_t:
                has_timeout = True
                timeout_val = int(m_t.group(2))
                timeout_line = (i + 1, line_str)
                matched_lines.add(i)

            # HTTP in allowaccess
            if re.search(r"set allowaccess .*http\b", line_str, re.IGNORECASE) and not "https" in line_str:
                has_http = True
                matched_lines.add(i)

        # Properties
        if has_ssh:
            properties.append(SecurityPropertyEvidence("mgmt.ssh_only", "Management", "SSH_ONLY", ssh_line[0], ssh_line[0], ssh_line[1]))
        else:
            properties.append(SecurityPropertyEvidence("mgmt.ssh_only", "Management", "UNKNOWN", 1, 1, "SSH admin access disabled or missing"))

        if has_timeout:
            state = "RESTRICTED" if (timeout_val is not None and timeout_val <= 10) else "EXCESS"
            properties.append(SecurityPropertyEvidence("mgmt.timeout", "Management", state, timeout_line[0], timeout_line[0], timeout_line[1]))
        else:
            properties.append(SecurityPropertyEvidence("mgmt.timeout", "Management", "UNRESTRICTED", 1, 1, "Default 300m admin timeout"))

        if has_pwd_policy:
            properties.append(SecurityPropertyEvidence("auth.password_complexity", "Authentication", "TRUE", pwd_line[0], pwd_line[0], pwd_line[1]))
        else:
            properties.append(SecurityPropertyEvidence("auth.password_complexity", "Authentication", "FALSE", 1, 1, "No password policy set"))

        properties.append(SecurityPropertyEvidence("auth.root_auth", "Authentication", "REQUIRED", 1, 1, "FortiOS enforces admin auth by default"))

        if has_syslog:
            properties.append(SecurityPropertyEvidence("logging.central", "Logging", "CENTRAL_ENABLED", syslog_line[0], syslog_line[0], syslog_line[1]))
        else:
            properties.append(SecurityPropertyEvidence("logging.central", "Logging", "DISABLED", 1, 1, "Syslog logging not enabled"))

        if has_ntp:
            properties.append(SecurityPropertyEvidence("time.ntp", "Time", "NTP_ENABLED", ntp_line[0], ntp_line[0], ntp_line[1]))
        else:
            properties.append(SecurityPropertyEvidence("time.ntp", "Time", "DISABLED", 1, 1, "NTP synchronization disabled"))

        if has_snmp_v3:
            properties.append(SecurityPropertyEvidence("snmp.secure", "SNMP", "SECURE", snmp_line[0], snmp_line[0], snmp_line[1]))
        else:
            properties.append(SecurityPropertyEvidence("snmp.secure", "SNMP", "DISABLED", 1, 1, "SNMP service unconfigured"))

        if has_http:
            properties.append(SecurityPropertyEvidence("svc.insecure_services", "Service", "EXCESS", 1, 1, "Unencrypted HTTP admin access exposed"))
        else:
            properties.append(SecurityPropertyEvidence("svc.insecure_services", "Service", "DISABLED", 1, 1, "Plain HTTP admin access disabled"))

        unknowns = self.extract_unknowns(lines, matched_lines)
        return properties, unknowns

class GenericParser(BaseVendorParser):
    def parse(self, text: str) -> Tuple[List[SecurityPropertyEvidence], List[Tuple[int, int, str]]]:
        # Fallback generic line scanner
        properties = []
        matched_lines = set()
        lines = text.splitlines()

        for i, line in enumerate(lines):
            line_str = line.strip()
            if "ssh" in line_str.lower():
                properties.append(SecurityPropertyEvidence("mgmt.ssh_only", "Management", "SSH_ONLY", i+1, i+1, line_str))
                matched_lines.add(i)
            elif "syslog" in line_str.lower() or "logging" in line_str.lower():
                properties.append(SecurityPropertyEvidence("logging.central", "Logging", "CENTRAL_ENABLED", i+1, i+1, line_str))
                matched_lines.add(i)
            elif "ntp" in line_str.lower():
                properties.append(SecurityPropertyEvidence("time.ntp", "Time", "NTP_ENABLED", i+1, i+1, line_str))
                matched_lines.add(i)

        unknowns = self.extract_unknowns(lines, matched_lines)
        return properties, unknowns

def get_parser(vendor: str) -> BaseVendorParser:
    v_norm = vendor.strip().lower()
    if "cisco" in v_norm:
        return CiscoParser()
    elif "juniper" in v_norm or "junos" in v_norm:
        return JuniperParser()
    elif "fortinet" in v_norm or "fortigate" in v_norm:
        return FortinetParser()
    return GenericParser()
