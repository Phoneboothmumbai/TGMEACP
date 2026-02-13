"""
AppleCare+ Activation System - Approval Workflow Tests (Iteration 4)
Tests for: approval workflow, pending_approval status, approve/decline endpoints, stats, approval_email setting
"""
import pytest
import requests
import os
import hashlib

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# JWT Secret for token generation (same as backend)
JWT_SECRET = 'applecare-activation-secret-key-2025'

def generate_approval_token(request_id: str, action: str) -> str:
    """Generate a secure token for approval/decline links (same as backend)"""
    secret = f"{JWT_SECRET}-{request_id}-{action}"
    return hashlib.sha256(secret.encode()).hexdigest()[:32]


class TestHealthCheck:
    """Health check endpoint tests"""
    
    def test_health_endpoint(self):
        """Test health endpoint returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("SUCCESS: Health endpoint working")


class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_login_with_provided_credentials(self):
        """Test login with provided admin credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "ck@motta.in",
            "password": "Charu@123@"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        print("SUCCESS: Login working with ck@motta.in credentials")
    
    def test_login_with_legacy_credentials(self):
        """Test login with legacy admin credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@applecare.com",
            "password": "admin123"
        })
        # This may or may not work depending on if user exists
        if response.status_code == 200:
            print("SUCCESS: Legacy admin credentials also work")
        else:
            print("INFO: Legacy admin credentials not available (expected)")


class TestActivationRequestApprovalWorkflow:
    """CRITICAL: Tests for the new approval workflow"""
    
    @pytest.fixture
    def plan_id(self):
        """Get a valid plan ID for testing"""
        response = requests.get(f"{BASE_URL}/api/plans?public=true")
        plans = response.json()
        return plans[0]["id"] if plans else None
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "ck@motta.in",
            "password": "Charu@123@"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        # Fallback to legacy credentials
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@applecare.com",
            "password": "admin123"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Authentication failed")
    
    def test_create_request_returns_pending_approval_status(self, plan_id):
        """CRITICAL: New requests should have 'pending_approval' status"""
        assert plan_id is not None, "No plans available for testing"
        
        request_data = {
            "dealer_name": "TEST_Approval_Dealer",
            "dealer_mobile": "9876543210",
            "dealer_email": "test_approval_dealer@test.com",
            "customer_name": "TEST_Approval_Customer",
            "customer_mobile": "9123456789",
            "customer_email": "test_approval_customer@test.com",
            "model_id": "iPhone 15 Pro",
            "serial_number": "TEST_APPROVAL_001",
            "plan_id": plan_id,
            "device_activation_date": "2026-01-15"
        }
        
        response = requests.post(f"{BASE_URL}/api/activation-requests", json=request_data)
        assert response.status_code == 200, f"Failed to create request: {response.text}"
        
        data = response.json()
        
        # CRITICAL: Verify status is 'pending_approval' (not 'pending')
        assert data["status"] == "pending_approval", f"Expected 'pending_approval' status, got '{data['status']}'"
        
        print(f"SUCCESS: New request created with 'pending_approval' status (ID: {data['id']})")
        return data["id"]
    
    def test_dashboard_approve_endpoint(self, plan_id, auth_token):
        """Test POST /api/activation-requests/{id}/approve endpoint"""
        assert plan_id is not None, "No plans available for testing"
        
        # Create a new request
        request_data = {
            "dealer_name": "TEST_Dashboard_Approve_Dealer",
            "dealer_mobile": "9876543211",
            "dealer_email": "dashboard_approve@test.com",
            "customer_name": "TEST_Dashboard_Approve_Customer",
            "customer_mobile": "9123456780",
            "customer_email": "dashboard_approve_customer@test.com",
            "model_id": "iPhone 15",
            "serial_number": "TEST_DASHBOARD_APPROVE_001",
            "plan_id": plan_id,
            "device_activation_date": "2026-01-15"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/activation-requests", json=request_data)
        assert create_response.status_code == 200
        request_id = create_response.json()["id"]
        
        # Approve the request via dashboard endpoint
        headers = {"Authorization": f"Bearer {auth_token}"}
        approve_response = requests.post(
            f"{BASE_URL}/api/activation-requests/{request_id}/approve",
            headers=headers
        )
        
        assert approve_response.status_code == 200, f"Approve failed: {approve_response.text}"
        assert "approved" in approve_response.json()["message"].lower()
        
        # Verify status changed to 'pending'
        get_response = requests.get(
            f"{BASE_URL}/api/activation-requests/{request_id}",
            headers=headers
        )
        assert get_response.status_code == 200
        assert get_response.json()["status"] == "pending", "Status should be 'pending' after approval"
        
        print(f"SUCCESS: Dashboard approve endpoint working (request {request_id} -> pending)")
    
    def test_dashboard_decline_endpoint(self, plan_id, auth_token):
        """Test POST /api/activation-requests/{id}/decline endpoint"""
        assert plan_id is not None, "No plans available for testing"
        
        # Create a new request
        request_data = {
            "dealer_name": "TEST_Dashboard_Decline_Dealer",
            "dealer_mobile": "9876543212",
            "dealer_email": "dashboard_decline@test.com",
            "customer_name": "TEST_Dashboard_Decline_Customer",
            "customer_mobile": "9123456781",
            "customer_email": "dashboard_decline_customer@test.com",
            "model_id": "iPhone 15",
            "serial_number": "TEST_DASHBOARD_DECLINE_001",
            "plan_id": plan_id,
            "device_activation_date": "2026-01-15"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/activation-requests", json=request_data)
        assert create_response.status_code == 200
        request_id = create_response.json()["id"]
        
        # Decline the request via dashboard endpoint
        headers = {"Authorization": f"Bearer {auth_token}"}
        decline_response = requests.post(
            f"{BASE_URL}/api/activation-requests/{request_id}/decline",
            headers=headers
        )
        
        assert decline_response.status_code == 200, f"Decline failed: {decline_response.text}"
        assert "declined" in decline_response.json()["message"].lower()
        
        # Verify status changed to 'declined'
        get_response = requests.get(
            f"{BASE_URL}/api/activation-requests/{request_id}",
            headers=headers
        )
        assert get_response.status_code == 200
        assert get_response.json()["status"] == "declined", "Status should be 'declined' after decline"
        
        print(f"SUCCESS: Dashboard decline endpoint working (request {request_id} -> declined)")
    
    def test_cannot_approve_activated_request(self, plan_id, auth_token):
        """Test that approving an already activated request fails"""
        assert plan_id is not None, "No plans available for testing"
        
        # Create a request
        request_data = {
            "dealer_name": "TEST_Already_Activated_Dealer",
            "dealer_mobile": "9876543213",
            "dealer_email": "already_activated@test.com",
            "customer_name": "TEST_Already_Activated_Customer",
            "customer_mobile": "9123456782",
            "customer_email": "already_activated_customer@test.com",
            "model_id": "iPhone 15",
            "serial_number": "TEST_ALREADY_ACTIVATED_001",
            "plan_id": plan_id,
            "device_activation_date": "2026-01-15"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/activation-requests", json=request_data)
        request_id = create_response.json()["id"]
        
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Change status to 'activated' directly
        requests.put(
            f"{BASE_URL}/api/activation-requests/{request_id}/status?status=activated",
            headers=headers
        )
        
        # Try to approve an activated request - should fail
        approve_response = requests.post(
            f"{BASE_URL}/api/activation-requests/{request_id}/approve",
            headers=headers
        )
        
        assert approve_response.status_code == 400, "Should not be able to approve already activated request"
        print("SUCCESS: Cannot approve already activated request")


class TestEmailLinkApproval:
    """Tests for email-based approve/decline links"""
    
    @pytest.fixture
    def plan_id(self):
        """Get a valid plan ID for testing"""
        response = requests.get(f"{BASE_URL}/api/plans?public=true")
        plans = response.json()
        return plans[0]["id"] if plans else None
    
    def test_approve_link_endpoint(self, plan_id):
        """Test GET /api/activation-requests/{id}/approve-link endpoint"""
        assert plan_id is not None, "No plans available for testing"
        
        # Create a new request
        request_data = {
            "dealer_name": "TEST_Email_Approve_Dealer",
            "dealer_mobile": "9876543214",
            "dealer_email": "email_approve@test.com",
            "customer_name": "TEST_Email_Approve_Customer",
            "customer_mobile": "9123456783",
            "customer_email": "email_approve_customer@test.com",
            "model_id": "iPhone 15",
            "serial_number": "TEST_EMAIL_APPROVE_001",
            "plan_id": plan_id,
            "device_activation_date": "2026-01-15"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/activation-requests", json=request_data)
        assert create_response.status_code == 200
        request_id = create_response.json()["id"]
        
        # Generate valid token
        token = generate_approval_token(request_id, 'approve')
        
        # Call approve-link endpoint
        approve_response = requests.get(
            f"{BASE_URL}/api/activation-requests/{request_id}/approve-link?token={token}"
        )
        
        assert approve_response.status_code == 200, f"Approve link failed: {approve_response.text}"
        assert "approved" in approve_response.text.lower() or "Request Approved" in approve_response.text
        
        print(f"SUCCESS: Email approve-link endpoint working (request {request_id})")
    
    def test_decline_link_endpoint(self, plan_id):
        """Test GET /api/activation-requests/{id}/decline-link endpoint"""
        assert plan_id is not None, "No plans available for testing"
        
        # Create a new request
        request_data = {
            "dealer_name": "TEST_Email_Decline_Dealer",
            "dealer_mobile": "9876543215",
            "dealer_email": "email_decline@test.com",
            "customer_name": "TEST_Email_Decline_Customer",
            "customer_mobile": "9123456784",
            "customer_email": "email_decline_customer@test.com",
            "model_id": "iPhone 15",
            "serial_number": "TEST_EMAIL_DECLINE_001",
            "plan_id": plan_id,
            "device_activation_date": "2026-01-15"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/activation-requests", json=request_data)
        assert create_response.status_code == 200
        request_id = create_response.json()["id"]
        
        # Generate valid token
        token = generate_approval_token(request_id, 'decline')
        
        # Call decline-link endpoint
        decline_response = requests.get(
            f"{BASE_URL}/api/activation-requests/{request_id}/decline-link?token={token}"
        )
        
        assert decline_response.status_code == 200, f"Decline link failed: {decline_response.text}"
        assert "declined" in decline_response.text.lower() or "Request Declined" in decline_response.text
        
        print(f"SUCCESS: Email decline-link endpoint working (request {request_id})")
    
    def test_invalid_token_rejected(self, plan_id):
        """Test that invalid tokens are rejected"""
        assert plan_id is not None, "No plans available for testing"
        
        # Create a new request
        request_data = {
            "dealer_name": "TEST_Invalid_Token_Dealer",
            "dealer_mobile": "9876543216",
            "dealer_email": "invalid_token@test.com",
            "customer_name": "TEST_Invalid_Token_Customer",
            "customer_mobile": "9123456785",
            "customer_email": "invalid_token_customer@test.com",
            "model_id": "iPhone 15",
            "serial_number": "TEST_INVALID_TOKEN_001",
            "plan_id": plan_id,
            "device_activation_date": "2026-01-15"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/activation-requests", json=request_data)
        request_id = create_response.json()["id"]
        
        # Use invalid token
        invalid_token = "invalid_token_12345678901234567890"
        
        approve_response = requests.get(
            f"{BASE_URL}/api/activation-requests/{request_id}/approve-link?token={invalid_token}"
        )
        
        assert approve_response.status_code == 400, "Invalid token should be rejected"
        print("SUCCESS: Invalid tokens are correctly rejected")


class TestStatsEndpoint:
    """Tests for stats endpoint with new status counts"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "ck@motta.in",
            "password": "Charu@123@"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@applecare.com",
            "password": "admin123"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Authentication failed")
    
    def test_stats_includes_pending_approval_count(self, auth_token):
        """Test that stats endpoint returns pending_approval count"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/stats", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify all expected fields are present
        assert "total" in data
        assert "pending_approval" in data, "Stats should include 'pending_approval' count"
        assert "pending" in data
        assert "activated" in data
        assert "payment_pending" in data
        assert "declined" in data, "Stats should include 'declined' count"
        
        # Verify values are integers
        assert isinstance(data["pending_approval"], int)
        assert isinstance(data["declined"], int)
        
        print(f"SUCCESS: Stats endpoint returns all counts including pending_approval={data['pending_approval']}, declined={data['declined']}")


class TestApprovalEmailSetting:
    """Tests for approval_email setting in Settings"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "ck@motta.in",
            "password": "Charu@123@"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@applecare.com",
            "password": "admin123"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Authentication failed")
    
    def test_settings_includes_approval_email_field(self, auth_token):
        """Test that settings includes approval_email field"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/settings", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify approval_email field exists
        assert "approval_email" in data, "Settings should include 'approval_email' field"
        
        print(f"SUCCESS: Settings includes approval_email field (current value: '{data.get('approval_email', '')}')")
    
    def test_update_approval_email_setting(self, auth_token):
        """Test updating approval_email setting"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Update approval_email
        test_email = "test_approval@example.com"
        update_response = requests.put(
            f"{BASE_URL}/api/settings",
            json={"approval_email": test_email},
            headers=headers
        )
        
        assert update_response.status_code == 200
        data = update_response.json()
        assert data.get("approval_email") == test_email, "approval_email should be updated"
        
        # Verify by getting settings again
        get_response = requests.get(f"{BASE_URL}/api/settings", headers=headers)
        assert get_response.json().get("approval_email") == test_email
        
        print(f"SUCCESS: approval_email setting can be updated")
        
        # Reset to default
        requests.put(
            f"{BASE_URL}/api/settings",
            json={"approval_email": "contact@thegoodmen.in"},
            headers=headers
        )


class TestStatusFilterWithNewStatuses:
    """Tests for filtering requests by new statuses"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "ck@motta.in",
            "password": "Charu@123@"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@applecare.com",
            "password": "admin123"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Authentication failed")
    
    def test_filter_by_pending_approval_status(self, auth_token):
        """Test filtering requests by pending_approval status"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/activation-requests?status=pending_approval",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # All returned requests should have pending_approval status
        for req in data:
            assert req["status"] == "pending_approval", f"Expected pending_approval, got {req['status']}"
        
        print(f"SUCCESS: Filter by pending_approval status working ({len(data)} requests)")
    
    def test_filter_by_declined_status(self, auth_token):
        """Test filtering requests by declined status"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/activation-requests?status=declined",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # All returned requests should have declined status
        for req in data:
            assert req["status"] == "declined", f"Expected declined, got {req['status']}"
        
        print(f"SUCCESS: Filter by declined status working ({len(data)} requests)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
