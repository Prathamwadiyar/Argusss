import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.database import KnowledgeMapping, Audit, Device, Finding, SecurityProperty

class KnowledgeRegistry:
    """Knowledge Registry and Reversal Engine: Maintains versioned, auditable records of learned
    syntax interpretations, with full governance and instant reversal impact propagation."""

    def list_mappings(self, db: Session, status: Optional[str] = None) -> List[Dict[str, Any]]:
        query = db.query(KnowledgeMapping)
        if status:
            query = query.filter(KnowledgeMapping.review_status == status)
        mappings = query.order_by(KnowledgeMapping.id.desc()).all()

        return [
            {
                "id": m.id,
                "vendor": m.vendor,
                "platform": m.platform,
                "version_scope": m.version_scope,
                "fragment_pattern": m.fragment_pattern,
                "property_id": m.property_id,
                "property_state": m.property_state,
                "confidence": m.confidence,
                "review_status": m.review_status,
                "reviewer": m.reviewer,
                "version": m.version,
                "provenance": m.provenance_json,
                "created_at": m.created_at.isoformat() if m.created_at else None,
                "revoked_at": m.revoked_at.isoformat() if m.revoked_at else None
            }
            for m in mappings
        ]

    def create_or_approve_mapping(
        self,
        db: Session,
        vendor: str,
        fragment: str,
        property_id: str,
        property_state: str = "TRUE",
        confidence: float = 1.0,
        reviewer: str = "Security Admin",
        platform: str = "Universal",
        provenance: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        # Check if identical active mapping exists
        existing = db.query(KnowledgeMapping).filter(
            KnowledgeMapping.vendor == vendor,
            KnowledgeMapping.fragment_pattern == fragment.strip(),
            KnowledgeMapping.review_status == "APPROVED"
        ).first()

        if existing:
            existing.property_id = property_id
            existing.property_state = property_state
            existing.confidence = confidence
            existing.reviewer = reviewer
            existing.version += 1
            existing.provenance_json = provenance or {}
            db.commit()
            db.refresh(existing)
            target = existing
        else:
            target = KnowledgeMapping(
                vendor=vendor,
                platform=platform,
                fragment_pattern=fragment.strip(),
                property_id=property_id,
                property_state=property_state,
                confidence=confidence,
                review_status="APPROVED",
                reviewer=reviewer,
                version=1,
                provenance_json=provenance or {}
            )
            db.add(target)
            db.commit()
            db.refresh(target)

        return {
            "status": "APPROVED",
            "mapping_id": target.id,
            "version": target.version,
            "property_id": target.property_id,
            "fragment": target.fragment_pattern
        }

    def revoke_mapping(self, db: Session, mapping_id: int, revoker: str = "Security Auditor") -> Dict[str, Any]:
        mapping = db.query(KnowledgeMapping).filter(KnowledgeMapping.id == mapping_id).first()
        if not mapping:
            return {"error": "Knowledge mapping not found"}

        mapping.review_status = "REVOKED"
        mapping.revoked_at = datetime.datetime.utcnow()
        mapping.provenance_json = {
            **(mapping.provenance_json or {}),
            "revoked_by": revoker,
            "revocation_reason": "Security model reversal requested by administrator"
        }

        # Identify impacted devices and audits that use this property & vendor
        impacted_properties = db.query(SecurityProperty).join(Device).filter(
            Device.vendor == mapping.vendor,
            SecurityProperty.property_id == mapping.property_id,
            SecurityProperty.source_type == "ML_INFERRED"
        ).all()

        impacted_device_ids = list(set([p.device_id for p in impacted_properties]))
        impacted_devices = db.query(Device).filter(Device.id.in_(impacted_device_ids)).all() if impacted_device_ids else []
        
        impacted_audit_ids = list(set([d.audit_id for d in impacted_devices if d.audit_id]))
        impacted_audits = db.query(Audit).filter(Audit.id.in_(impacted_audit_ids)).all() if impacted_audit_ids else []

        # Mark affected audits as RE_AUDIT_REQUIRED
        for audit in impacted_audits:
            audit.status = "RE_AUDIT_REQUIRED"

        db.commit()

        return {
            "status": "REVOKED",
            "mapping_id": mapping.id,
            "fragment_pattern": mapping.fragment_pattern,
            "property_id": mapping.property_id,
            "impact_analysis": {
                "impacted_properties_count": len(impacted_properties),
                "impacted_devices_count": len(impacted_devices),
                "impacted_audits_count": len(impacted_audits),
                "impacted_audits": [
                    {"id": a.id, "title": a.title, "status": a.status, "created_at": a.created_at.isoformat()}
                    for a in impacted_audits
                ],
                "impacted_devices": [
                    {"id": d.id, "hostname": d.hostname, "vendor": d.vendor}
                    for d in impacted_devices
                ],
                "recommendation": "Execute /api/audits/{id}/re-audit on all flagged audits to re-evaluate without revoked mapping."
            }
        }

knowledge_registry = KnowledgeRegistry()
