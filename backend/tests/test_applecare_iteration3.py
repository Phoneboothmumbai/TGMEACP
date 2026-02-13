"""
AppleCare+ Activation System - Backend API Tests (Iteration 3)
Tests for: dealer_email field, form fields, TGME ticket integration
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthCheck:
    """Health check endpoint tests"""
    
    def test_health_endpoint(self):
        """Test health endpoint returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "applecare-activation"
        print("SUCCESS: Health endpoint working")


class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@applecare.com",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == "admin@applecare.com"
        print("SUCCESS: Login working with admin credentials")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401
        print("SUCCESS: Invalid login correctly rejected")


class TestPlansAPI:
    """Plans API endpoint tests"""
    
    def test_get_plans_public(self):
        """Test public plans endpoint"""
        response = requests.get(f"{BASE_URL}/api/plans?public=true")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        # Verify plan structure
        plan = data[0]
        assert "id" in plan
        assert "name" in plan
        assert "part_code" in plan
        print(f"SUCCESS: Got {len(data)} plans from public endpoint")


class TestActivationRequestsAPI:
    """Activation Requests API tests - CRITICAL: dealer_email field"""
    
    @pytest.fixture
    def plan_id(self):
        """Get a valid plan ID for testing"""
        response = requests.get(f"{BASE_URL}/api/plans?public=true")
        plans = response.json()
        return plans[0]["id"] if plans else None
    
    def test_create_activation_request_with_dealer_email(self, plan_id):
        """CRITICAL TEST: Create activation request with dealer_email field"""
        assert plan_id is not None, "No plans available for testing"
        
        request_data = {
            "dealer_name": "TEST_Dealer_Iteration3",
            "dealer_mobile": "9876543210",
            "dealer_email": "test_dealer@iteration3.com",  # NEW FIELD
            "customer_name": "TEST_Customer_Iteration3",
            "customer_mobile": "9123456789",
            "customer_email": "test_customer@iteration3.com",
            "model_id": "iPhone 15 Pro Max",
            "serial_number": "TEST_SERIAL_IT3_001",
            "plan_id": plan_id,
            "device_activation_date": "2026-02-13"
        }
        
        response = requests.post(f"{BASE_URL}/api/activation-requests", json=request_data)
        assert response.status_code == 200, f"Failed to create request: {response.text}"
        
        data = response.json()
        
        # Verify all fields are present in response
        assert data["dealer_name"] == request_data["dealer_name"]
        assert data["dealer_mobile"] == request_data["dealer_mobile"]
        assert data["dealer_email"] == request_data["dealer_email"], "dealer_email field not saved correctly"
        assert data["customer_name"] == request_data["customer_name"]
        assert data["customer_mobile"] == request_data["customer_mobile"]
        assert data["customer_email"] == request_data["customer_email"]
        assert data["model_id"] == request_data["model_id"]
        assert data["serial_number"] == request_data["serial_number"]
        assert data["plan_id"] == request_data["plan_id"]
        assert data["device_activation_date"] == request_data["device_activation_date"]
        
        # Verify hardcoded fields
        assert data["billing_location"] == "F9B4869273B7"
        assert data["payment_type"] == "Insta"
        
        # Verify auto-generated fields
        assert "id" in data
        assert data["status"] == "pending"
        
        print("SUCCESS: Activation request created with dealer_email field")
        return data["id"]
    
    def test_activation_request_requires_dealer_email(self, plan_id):
        """Test that dealer_email is required"""
        assert plan_id is not None, "No plans available for testing"
        
        # Missing dealer_email should fail validation
        request_data = {
            "dealer_name": "TEST_Dealer_NoEmail",
            "dealer_mobile": "9876543210",
            # "dealer_email" is missing
            "customer_name": "TEST_Customer",
            "customer_mobile": "9123456789",
            "customer_email": "customer@test.com",
            "model_id": "iPhone 15",
            "serial_number": "TEST_SERIAL_002",
            "plan_id": plan_id,
            "device_activation_date": "2026-02-13"
        }
        
        response = requests.post(f"{BASE_URL}/api/activation-requests", json=request_data)
        # Should fail with 422 (validation error) since dealer_email is required
        assert response.status_code == 422, f"Expected 422 for missing dealer_email, got {response.status_code}"
        print("SUCCESS: dealer_email is correctly required")
    
    def test_activation_request_validates_dealer_email_format(self, plan_id):
        """Test that dealer_email must be valid email format"""
        assert plan_id is not None, "No plans available for testing"
        
        request_data = {
            "dealer_name": "TEST_Dealer_InvalidEmail",
            "dealer_mobile": "9876543210",
            "dealer_email": "not-a-valid-email",  # Invalid email format
            "customer_name": "TEST_Customer",
            "customer_mobile": "9123456789",
            "customer_email": "customer@test.com",
            "model_id": "iPhone 15",
            "serial_number": "TEST_SERIAL_003",
            "plan_id": plan_id,
            "device_activation_date": "2026-02-13"
        }
        
        response = requests.post(f"{BASE_URL}/api/activation-requests", json=request_data)
        # Should fail with 422 (validation error) for invalid email
        assert response.status_code == 422, f"Expected 422 for invalid dealer_email, got {response.status_code}"
        print("SUCCESS: dealer_email format validation working")


class TestSettingsAPI:
    """Settings API tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@applecare.com",
            "password": "admin123"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Authentication failed")
    
    def test_get_settings(self, auth_token):
        """Test getting settings"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/settings", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify settings structure includes TGME fields
        assert "tgme_url" in data or "osticket_url" in data
        assert "tgme_api_key" in data or "osticket_api_key" in data
        print("SUCCESS: Settings endpoint working with TGME fields")
    
    def test_update_tgme_settings(self, auth_token):
        """Test updating TGME settings"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        update_data = {
            "tgme_url": "https://test-tgme.example.com",
            "tgme_api_key": "test-api-key-12345"
        }
        
        response = requests.put(f"{BASE_URL}/api/settings", json=update_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify TGME settings were updated
        assert data.get("tgme_url") == update_data["tgme_url"] or data.get("osticket_url") == update_data["tgme_url"]
        print("SUCCESS: TGME settings can be updated")


class TestTGMETicketIntegration:
    """Tests for TGME Support Ticket integration using dealer details"""
    
    def test_tgme_ticket_uses_dealer_info(self):
        """Verify TGME ticket creation uses dealer details (not customer)"""
        # This is a code review test - verify the backend code uses dealer info
        # The actual ticket creation is mocked, but we verify the data structure
        
        # Get a plan ID
        response = requests.get(f"{BASE_URL}/api/plans?public=true")
        plans = response.json()
        plan_id = plans[0]["id"]
        
        # Create activation request with distinct dealer and customer info
        request_data = {
            "dealer_name": "TGME_Test_Dealer",
            "dealer_mobile": "9999888877",
            "dealer_email": "tgme_dealer@test.com",
            "customer_name": "TGME_Test_Customer",
            "customer_mobile": "1111222233",
            "customer_email": "tgme_customer@test.com",
            "model_id": "iPhone 15",
            "serial_number": "TGME_TEST_SERIAL",
            "plan_id": plan_id,
            "device_activation_date": "2026-02-13"
        }
        
        response = requests.post(f"{BASE_URL}/api/activation-requests", json=request_data)
        assert response.status_code == 200
        
        data = response.json()
        # Verify dealer info is stored correctly for TGME ticket
        assert data["dealer_name"] == "TGME_Test_Dealer"
        assert data["dealer_email"] == "tgme_dealer@test.com"
        assert data["dealer_mobile"] == "9999888877"
        
        print("SUCCESS: Activation request stores dealer info for TGME ticket")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
