import requests
import sys
import json
from datetime import datetime

class AppleCareAPITester:
    def __init__(self, base_url="https://activation-hub-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.text else {}
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200]
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "error": str(e)
            })
            return False, {}

    def test_health_check(self):
        """Test health endpoint"""
        return self.run_test("Health Check", "GET", "api/health", 200)

    def test_login(self, email="admin@applecare.com", password="admin123"):
        """Test login and get token"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "api/auth/login",
            200,
            data={"email": email, "password": password}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_get_me(self):
        """Test get current user"""
        return self.run_test("Get Current User", "GET", "api/auth/me", 200)

    def test_get_stats(self):
        """Test dashboard stats"""
        return self.run_test("Get Dashboard Stats", "GET", "api/stats", 200)

    def test_get_plans(self):
        """Test get AppleCare+ plans"""
        success, response = self.run_test("Get AppleCare+ Plans", "GET", "api/plans", 200)
        if success and isinstance(response, list) and len(response) > 0:
            print(f"   Found {len(response)} plans")
            return True, response
        return False, []

    def test_get_activation_requests(self):
        """Test get activation requests"""
        return self.run_test("Get Activation Requests", "GET", "api/activation-requests", 200)

    def test_create_activation_request(self, plan_id):
        """Test creating an activation request"""
        test_data = {
            "dealer_name": "Test Dealer",
            "dealer_mobile": "+1234567890",
            "customer_name": "John Doe",
            "customer_mobile": "+1987654321",
            "customer_email": "john.doe@example.com",
            "model_id": "iPhone 15 Pro Max",
            "serial_number": "TEST123456789",
            "plan_id": plan_id,
            "device_activation_date": "2025-01-15",
            "billing_location": "New York",
            "payment_type": "Insta"
        }
        
        success, response = self.run_test(
            "Create Activation Request",
            "POST",
            "api/activation-requests",
            200,
            data=test_data
        )
        
        if success and 'id' in response:
            print(f"   Created request with ID: {response['id']}")
            return True, response['id']
        return False, None

    def test_get_activation_request_detail(self, request_id):
        """Test get single activation request"""
        return self.run_test(
            "Get Activation Request Detail",
            "GET",
            f"api/activation-requests/{request_id}",
            200
        )

    def test_update_request_status(self, request_id):
        """Test updating request status"""
        return self.run_test(
            "Update Request Status",
            "PUT",
            f"api/activation-requests/{request_id}/status?status=activated",
            200
        )

    def test_get_settings(self):
        """Test get settings"""
        return self.run_test("Get Settings", "GET", "api/settings", 200)

    def test_update_settings(self):
        """Test update settings"""
        settings_data = {
            "apple_email": "test@apple.com",
            "partner_name": "Test Partner",
            "smtp_host": "smtp.gmail.com",
            "smtp_port": 587
        }
        return self.run_test(
            "Update Settings",
            "PUT",
            "api/settings",
            200,
            data=settings_data
        )

    def test_create_plan(self):
        """Test creating a new plan"""
        plan_data = {
            "name": "Test AppleCare+ Plan",
            "part_code": "TEST123",
            "description": "Test plan for API testing"
        }
        success, response = self.run_test(
            "Create New Plan",
            "POST",
            "api/plans",
            200,
            data=plan_data
        )
        
        if success and 'id' in response:
            return True, response['id']
        return False, None

    def test_update_plan(self, plan_id):
        """Test updating a plan"""
        plan_data = {
            "name": "Updated Test Plan",
            "part_code": "TEST123",
            "description": "Updated test plan"
        }
        return self.run_test(
            "Update Plan",
            "PUT",
            f"api/plans/{plan_id}",
            200,
            data=plan_data
        )

    def test_delete_plan(self, plan_id):
        """Test deleting (deactivating) a plan"""
        return self.run_test(
            "Delete Plan",
            "DELETE",
            f"api/plans/{plan_id}",
            200
        )

    def test_change_password(self):
        """Test password change"""
        password_data = {
            "current_password": "admin123",
            "new_password": "newpassword123"
        }
        success, _ = self.run_test(
            "Change Password",
            "POST",
            "api/auth/change-password",
            200,
            data=password_data
        )
        
        # Change it back
        if success:
            revert_data = {
                "current_password": "newpassword123",
                "new_password": "admin123"
            }
            self.run_test(
                "Revert Password",
                "POST",
                "api/auth/change-password",
                200,
                data=revert_data
            )
        
        return success

def main():
    print("🚀 Starting AppleCare+ Activation System API Tests")
    print("=" * 60)
    
    tester = AppleCareAPITester()
    
    # Test sequence
    print("\n📋 Running Basic API Tests...")
    
    # 1. Health check
    if not tester.test_health_check()[0]:
        print("❌ Health check failed - stopping tests")
        return 1
    
    # 2. Login
    if not tester.test_login():
        print("❌ Login failed - stopping tests")
        return 1
    
    # 3. Get current user
    tester.test_get_me()
    
    # 4. Dashboard stats
    tester.test_get_stats()
    
    # 5. Get plans
    plans_success, plans = tester.test_get_plans()
    plan_id = plans[0]['id'] if plans else None
    
    # 6. Get activation requests
    tester.test_get_activation_requests()
    
    # 7. Settings tests
    tester.test_get_settings()
    tester.test_update_settings()
    
    print("\n📋 Running CRUD Tests...")
    
    # 8. Create activation request (if we have a plan)
    request_id = None
    if plan_id:
        success, request_id = tester.test_create_activation_request(plan_id)
        
        # 9. Get request detail
        if request_id:
            tester.test_get_activation_request_detail(request_id)
            tester.test_update_request_status(request_id)
    
    # 10. Plan CRUD tests
    success, new_plan_id = tester.test_create_plan()
    if new_plan_id:
        tester.test_update_plan(new_plan_id)
        tester.test_delete_plan(new_plan_id)
    
    # 11. Password change test
    tester.test_change_password()
    
    # Print results
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.failed_tests:
        print("\n❌ Failed Tests:")
        for failure in tester.failed_tests:
            print(f"   - {failure.get('test', 'Unknown')}: {failure}")
    
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"📈 Success Rate: {success_rate:.1f}%")
    
    return 0 if success_rate >= 80 else 1

if __name__ == "__main__":
    sys.exit(main())