from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.database import Device, SecurityProperty, Control, ConfigFragment

class SemanticDiffEngine:
    """Semantic Diff Engine: Compares configurations at the security property and control compliance
    level rather than raw textual diffs, highlighting real security posture changes across vendor syntax."""

    def compare_devices(self, db: Session, before_device_id: int, after_device_id: int) -> Dict[str, Any]:
        dev_before = db.query(Device).filter(Device.id == before_device_id).first()
        dev_after = db.query(Device).filter(Device.id == after_device_id).first()

        if not dev_before or not dev_after:
            return {"error": "One or both devices not found for semantic comparison"}

        props_before = db.query(SecurityProperty).filter(SecurityProperty.device_id == before_device_id).all()
        props_after = db.query(SecurityProperty).filter(SecurityProperty.device_id == after_device_id).all()

        map_before = {p.property_id: p for p in props_before}
        map_after = {p.property_id: p for p in props_after}

        all_prop_ids = sorted(list(set(map_before.keys()) | set(map_after.keys())))
        property_diffs = []

        added_count = 0
        removed_count = 0
        state_change_count = 0
        evidence_only_count = 0
        unchanged_count = 0

        for p_id in all_prop_ids:
            p_b = map_before.get(p_id)
            p_a = map_after.get(p_id)

            frag_b = db.query(ConfigFragment).filter(ConfigFragment.id == p_b.source_fragment_id).first() if (p_b and p_b.source_fragment_id) else None
            frag_a = db.query(ConfigFragment).filter(ConfigFragment.id == p_a.source_fragment_id).first() if (p_a and p_a.source_fragment_id) else None

            text_b = frag_b.raw_text if frag_b else ""
            text_a = frag_a.raw_text if frag_a else ""

            if p_b and not p_a:
                diff_type = "REMOVED_PROPERTY"
                removed_count += 1
                state_b = p_b.state
                state_a = "NOT_CONFIGURED"
            elif not p_b and p_a:
                diff_type = "ADDED_PROPERTY"
                added_count += 1
                state_b = "NOT_CONFIGURED"
                state_a = p_a.state
            elif p_b.state != p_a.state:
                diff_type = "STATE_CHANGE"
                state_change_count += 1
                state_b = p_b.state
                state_a = p_a.state
            elif text_b != text_a:
                diff_type = "EVIDENCE_ONLY_CHANGE"
                evidence_only_count += 1
                state_b = p_b.state
                state_a = p_a.state
            else:
                diff_type = "UNCHANGED"
                unchanged_count += 1
                state_b = p_b.state
                state_a = p_a.state

            property_diffs.append({
                "property_id": p_id,
                "category": (p_a or p_b).category if (p_a or p_b) else "General",
                "diff_type": diff_type,
                "before": {
                    "state": state_b,
                    "raw_text": text_b,
                    "line": frag_b.line_start if frag_b else None
                },
                "after": {
                    "state": state_a,
                    "raw_text": text_a,
                    "line": frag_a.line_start if frag_a else None
                }
            })

        return {
            "before_device": {
                "id": dev_before.id,
                "hostname": dev_before.hostname,
                "vendor": dev_before.vendor
            },
            "after_device": {
                "id": dev_after.id,
                "hostname": dev_after.hostname,
                "vendor": dev_after.vendor
            },
            "summary": {
                "total_properties_compared": len(all_prop_ids),
                "state_changes": state_change_count,
                "evidence_only_changes": evidence_only_count,
                "added_properties": added_count,
                "removed_properties": removed_count,
                "unchanged": unchanged_count
            },
            "property_diffs": property_diffs
        }

semantic_diff_engine = SemanticDiffEngine()
