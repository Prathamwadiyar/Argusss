import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import get_db, User

client = TestClient(app)

@pytest.fixture(autouse=True)
def cleanup_test_users():
    db = next(get_db())
    test_emails = [
        "brand_new_auditor_2026@testcorp.com",
        "new.google.user@gmail.com",
        "temp_first_time@compliance.gov"
    ]
    db.query(User).filter(User.email.in_(test_emails)).delete(synchronize_session=False)
    db.commit()
    yield
    db.query(User).filter(User.email.in_(test_emails)).delete(synchronize_session=False)
    db.commit()

def test_first_time_email_login_is_gated():
    """Verify that an unknown first-time email is NOT allowed to directly log in."""
    res = client.post("/api/auth/login", json={
        "email": "brand_new_auditor_2026@testcorp.com",
        "password": "anypassword"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is False
    assert data["is_first_time"] is True
    assert data["profile_completed"] is False
    assert "Mandatory" in data["message"] or "First-time" in data["message"]

def test_manual_register_organization():
    """Verify that manual registration with complete organization details succeeds and grants access."""
    res = client.post("/api/auth/register", json={
        "email": "brand_new_auditor_2026@testcorp.com",
        "full_name": "Auditor Vikram Batra",
        "org_name": "Strategic Cyber Infrastructure",
        "phone_number": "+91 98765 88888",
        "role": "auditor",
        "org_type": "Defense & Critical Infrastructure",
        "department": "Security Ops",
        "password": "Password@2026"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["profile_completed"] is True
    assert data["is_first_time"] is False
    assert data["user"]["email"] == "brand_new_auditor_2026@testcorp.com"

def test_complete_onboarding_validation_rejects_missing_fields():
    """Verify server-side validation rejects incomplete onboarding submissions."""
    # Missing org_name and invalid phone
    res = client.post("/api/auth/complete-onboarding", json={
        "email": "new.google.user@gmail.com",
        "full_name": "AB", # too short
        "org_name": "", # empty
        "phone_number": "123", # too short
        "role": "invalid_role"
    })
    assert res.status_code == 400

def test_complete_onboarding_succeeds_with_mandatory_details():
    """Verify submitting full details successfully completes onboarding and grants clearance."""
    res = client.post("/api/auth/complete-onboarding", json={
        "email": "new.google.user@gmail.com",
        "full_name": "Commander Vikram Batra",
        "org_name": "Strategic Forces Cyber Command",
        "department": "Directorate of Sovereign Defense",
        "phone_number": "+91 98765 99999",
        "org_type": "Defense & Critical Infrastructure",
        "role": "admin",
        "password": "SecretPassphrase2026",
        "firebase_uid": "test_google_uid_101"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["profile_completed"] is True
    assert data["is_first_time"] is False
    assert data["user"]["full_name"] == "Commander Vikram Batra"
    assert data["user"]["org_name"] == "Strategic Forces Cyber Command"
    assert data["user"]["role"] == "admin"

def test_login_after_onboarding_proceeds_directly():
    """Verify that after onboarding is completed, subsequent login succeeds directly."""
    # First complete onboarding
    client.post("/api/auth/complete-onboarding", json={
        "email": "new.google.user@gmail.com",
        "full_name": "Commander Vikram Batra",
        "org_name": "Strategic Forces Cyber Command",
        "department": "Directorate of Sovereign Defense",
        "phone_number": "+91 98765 99999",
        "org_type": "Defense & Critical Infrastructure",
        "role": "admin",
        "password": "SecretPassphrase2026",
        "firebase_uid": "test_google_uid_101"
    })

    # Now attempt login
    res = client.post("/api/auth/login", json={
        "email": "new.google.user@gmail.com",
        "password": "SecretPassphrase2026"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["profile_completed"] is True
    assert data["is_first_time"] is False
    assert data["user"]["email"] == "new.google.user@gmail.com"

def test_preseeded_demo_admin_and_auditor_are_preverified():
    """Verify evaluator 1-click demo accounts retain pre-verified status."""
    admin_res = client.post("/api/auth/login", json={
        "email": "auditor@enterprise-defense.org",
        "password": "demo",
        "role": "admin"
    })
    assert admin_res.status_code == 200
    admin_data = admin_res.json()
    assert admin_data["success"] is True
    assert admin_data["profile_completed"] is True
    assert admin_data["user"]["role"] == "admin"

    auditor_res = client.post("/api/auth/login", json={
        "email": "field.auditor@enterprise-defense.org",
        "password": "demo",
        "role": "auditor"
    })
    assert auditor_res.status_code == 200
    auditor_data = auditor_res.json()
    assert auditor_data["success"] is True
    assert auditor_data["profile_completed"] is True
    assert auditor_data["user"]["role"] == "auditor"
