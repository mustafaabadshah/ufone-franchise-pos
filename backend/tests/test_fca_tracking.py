import os
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.models import FCAgent, FCAMonthlyRecord, User
from app.core.security import create_access_token

client = TestClient(app)

@pytest.fixture
def shakeel_token():
    db = SessionLocal()
    shakeel = db.query(User).filter(User.email == "shakeel@pos.com").first()
    db.close()
    token = create_access_token(str(shakeel.id))
    return token

@pytest.fixture
def viewer_token():
    db = SessionLocal()
    islam = db.query(User).filter(User.email == "islambadshah@pos.com").first()
    db.close()
    token = create_access_token(str(islam.id))
    return token

def test_list_fca_agents():
    res = client.get("/api/v1/fca/agents")
    assert res.status_code == 200
    data = res.json()
    assert "agents" in data
    assert "all_months" in data
    assert len(data["agents"]) >= 75
    assert data["summary"]["total_agents"] >= 75
    # Verify OSSAMA is present with BVS UMFDRG0197
    ossama = next((a for a in data["agents"] if a["bvs_id"] == "UMFDRG0197"), None)
    assert ossama is not None
    assert ossama["name"] == "OSSAMA"
    assert ossama["months"]["2026-08"] == 2
    assert ossama["months"]["2026-09"] == 2

def test_fca_summary():
    res = client.get("/api/v1/fca/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["total_registered_bvs"] >= 75
    assert len(data["monthly_trend"]) >= 9
    assert len(data["categories"]) >= 4

def test_shakeel_update_month_sale(shakeel_token):
    headers = {"Authorization": f"Bearer {shakeel_token}"}
    db = SessionLocal()
    agent = db.query(FCAgent).filter(FCAgent.bvs_id == "UMFDRG0197").first()
    agent_id = agent.id
    db.close()

    res = client.post(
        f"/api/v1/fca/agents/{agent_id}/months",
        headers=headers,
        json={"month_key": "2026-09", "sims_sold": 5}
    )
    assert res.status_code == 200
    assert res.json()["sims_sold"] == 5

    # Revert back to 2
    client.post(
        f"/api/v1/fca/agents/{agent_id}/months",
        headers=headers,
        json={"month_key": "2026-09", "sims_sold": 2}
    )

def test_upload_excel_endpoint(shakeel_token):
    headers = {"Authorization": f"Bearer {shakeel_token}"}
    excel_path = "BVS  SEP 2026 FCA.xlsx"
    if not os.path.exists(excel_path):
        excel_path = os.path.join("..", excel_path)
    
    with open(excel_path, "rb") as f:
        res = client.post(
            "/api/v1/fca/upload-monthly-excel",
            headers=headers,
            files={"file": ("BVS  SEP 2026 FCA.xlsx", f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
            data={"month_key": "2026-09", "month_label": "Sep 2026"}
        )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["matched_count"] >= 60
