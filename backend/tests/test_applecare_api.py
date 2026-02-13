"""
AppleCare+ Activation System - Backend API Tests
Tests for: Auth, Plans, Activation Requests, Settings, Excel Upload/Download
"""
import pytest
import requests
import os
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@applecare.com"
ADMIN_PASSWORD = "admin123"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def auth_token(api_client):
    """Get authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json().get("access_token")


@pytest.fixture(scope="module")
def authenticated_client(api_client, auth_token):
    """Session with auth header"""
    api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_client


class TestHealthCheck:
    """Health check endpoint tests"""
    
    def test_health_endpoint(self, api_client):
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "applecare-activation"


class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_login_success(self, api_client):
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["token_type"] == "bearer"
    
    def test_login_invalid_credentials(self, api_client):
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401
    
    def test_get_current_user(self, authenticated_client):
        response = authenticated_client.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == ADMIN_EMAIL
        assert "id" in data
        assert "name" in data


class TestPlans:
    """AppleCare+ Plans endpoint tests"""
    
    def test_get_plans_public(self, api_client):
        """Test public plans endpoint (no auth required)"""
        response = api_client.get(f"{BASE_URL}/api/plans?public=true")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        # Verify plan structure
        plan = data[0]
        assert "id" in plan
        assert "name" in plan
        assert "part_code" in plan
        assert "description" in plan
        assert "active" in plan
    
    def test_get_plans_authenticated(self, authenticated_client):
        """Test authenticated plans endpoint with all plans"""
        response = authenticated_client.get(f"{BASE_URL}/api/plans?active_only=false")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_create_plan(self, authenticated_client):
        """Test creating a new plan"""
        plan_data = {
            "name": "TEST_AppleCare+ Test Plan",
            "part_code": "TEST_SR999HN/A",
            "sku": "TEST_S9999ZM/A",
            "description": "Test plan for automated testing",
            "mrp": 19900
        }
        response = authenticated_client.post(f"{BASE_URL}/api/plans", json=plan_data)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == plan_data["name"]
        assert data["sku"] == plan_data["sku"]
        assert data["mrp"] == plan_data["mrp"]
        assert "id" in data
        return data["id"]
    
    def test_sample_excel_download(self, authenticated_client):
        """Test downloading sample Excel file"""
        response = authenticated_client.get(f"{BASE_URL}/api/plans/sample")
        assert response.status_code == 200
        assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in response.headers.get("content-type", "")


class TestActivationRequests:
    """Activation Request endpoint tests"""
    
    @pytest.fixture(scope="class")
    def plan_id(self, api_client):
        """Get a valid plan ID for testing"""
        response = api_client.get(f"{BASE_URL}/api/plans?public=true")
        plans = response.json()
        return plans[0]["id"] if plans else None
    
    def test_create_activation_request_without_billing_payment(self, api_client, plan_id):
        """Test creating activation request WITHOUT billing_location and payment_type fields"""
        request_data = {
            "dealer_name": "TEST_Dealer",
            "dealer_mobile": "9876543210",
            "customer_name": "TEST_Customer",
            "customer_mobile": "9876543211",
            "customer_email": "test@example.com",
            "model_id": "iPhone 15 Pro Max",
            "serial_number": "TEST_SERIAL123",
            "plan_id": plan_id,
            "device_activation_date": "2026-01-15"
        }
        # Note: billing_location and payment_type are NOT included - they should be hardcoded in backend
        response = api_client.post(f"{BASE_URL}/api/activation-requests", json=request_data)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify hardcoded values are set by backend
        assert data["billing_location"] == "F9B4869273B7", "billing_location should be hardcoded"
        assert data["payment_type"] == "Insta", "payment_type should be hardcoded"
        assert data["customer_name"] == request_data["customer_name"]
        assert "id" in data
        return data["id"]
    
    def test_get_activation_requests(self, authenticated_client):
        """Test getting all activation requests"""
        response = authenticated_client.get(f"{BASE_URL}/api/activation-requests")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_stats(self, authenticated_client):
        """Test getting dashboard stats"""
        response = authenticated_client.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "pending" in data
        assert "activated" in data
        assert "payment_pending" in data


class TestSettings:
    """Settings endpoint tests"""
    
    def test_get_settings(self, authenticated_client):
        """Test getting settings"""
        response = authenticated_client.get(f"{BASE_URL}/api/settings")
        assert response.status_code == 200
        data = response.json()
        assert "apple_email" in data
        assert "smtp_host" in data
        assert "smtp_port" in data
    
    def test_update_settings(self, authenticated_client):
        """Test updating settings with multiple Apple emails"""
        settings_data = {
            "apple_email": "apple1@apple.com, apple2@apple.com",
            "partner_name": "TEST_Partner"
        }
        response = authenticated_client.put(f"{BASE_URL}/api/settings", json=settings_data)
        assert response.status_code == 200
        data = response.json()
        assert data["apple_email"] == settings_data["apple_email"]
        assert data["partner_name"] == settings_data["partner_name"]


class TestExcelUpload:
    """Excel upload functionality tests"""
    
    def test_upload_excel_invalid_file(self, authenticated_client):
        """Test uploading non-Excel file should fail"""
        files = {"file": ("test.txt", io.BytesIO(b"test content"), "text/plain")}
        # Remove content-type header for multipart
        headers = {"Authorization": authenticated_client.headers["Authorization"]}
        response = requests.post(
            f"{BASE_URL}/api/plans/upload",
            files=files,
            headers=headers
        )
        assert response.status_code == 400


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
