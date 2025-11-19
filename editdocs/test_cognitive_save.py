#!/usr/bin/env python3
"""
Quick test script to verify cognitive test save endpoints are working.
This tests the backend endpoints directly without the frontend.
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://127.0.0.1:8000"
TEST_EMAIL = "testing@gmail.com"
TEST_PASSWORD = "test@123"

def login():
    """Login and get JWT token"""
    print("🔐 Logging in...")
    response = requests.post(
        f"{BASE_URL}/token",
        data={
            "username": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
    )
    
    if response.status_code == 200:
        token = response.json()["access_token"]
        print(f"✅ Login successful! Token: {token[:20]}...")
        return token
    else:
        print(f"❌ Login failed: {response.status_code}")
        print(response.text)
        return None

def test_enhanced_cognitive_save(token):
    """Test saving Enhanced Cognitive Test results"""
    print("\n" + "="*60)
    print("Testing Enhanced Cognitive Test Save")
    print("="*60)
    
    payload = {
        "test_type": "Enhanced Cognitive Assessment",
        "score": 85,
        "total_questions": 100,
        "memory_score": 88,
        "attention_score": 82,
        "processing_speed": 90,
        "executive_score": 80
    }
    
    print("📤 Sending payload:")
    print(json.dumps(payload, indent=2))
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    response = requests.post(
        f"{BASE_URL}/cognitive-tests/",
        json=payload,
        headers=headers
    )
    
    print(f"\n📥 Response Status: {response.status_code}")
    
    if response.status_code == 200:
        print("✅ Enhanced Cognitive Test saved successfully!")
        result = response.json()
        print(f"   Test ID: {result.get('id')}")
        print(f"   Score: {result.get('score')}/{result.get('total_questions')}")
        print(f"   Created: {result.get('created_at')}")
        return True
    else:
        print(f"❌ Failed to save test")
        print(f"   Error: {response.text}")
        return False

def test_audio_recall_save(token):
    """Test saving Audio Recall Test results"""
    print("\n" + "="*60)
    print("Testing Audio Recall Test Save")
    print("="*60)
    
    payload = {
        "test_type": "audio_recall",
        "score": 100,
        "total_questions": 3,
        "average_similarity": 95.5,
        "correct_recalls": 3,
        "total_rounds": 3,
        "round_details": [
            {
                "round": 1,
                "originalText": "The quick brown fox jumps over the lazy dog.",
                "spokenText": "The quick brown fox jumps over the lazy dog.",
                "similarityScore": 98.5,
                "correct": True
            },
            {
                "round": 2,
                "originalText": "A journey of a thousand miles begins with a single step.",
                "spokenText": "A journey of a thousand miles begins with a step.",
                "similarityScore": 92.0,
                "correct": True
            },
            {
                "round": 3,
                "originalText": "In the middle of difficulty lies opportunity for growth and learning.",
                "spokenText": "In the middle of difficulty lies opportunity for learning.",
                "similarityScore": 96.0,
                "correct": True
            }
        ]
    }
    
    print("📤 Sending payload:")
    print(json.dumps(payload, indent=2))
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    response = requests.post(
        f"{BASE_URL}/cognitive-tests/audio-recall",
        json=payload,
        headers=headers
    )
    
    print(f"\n📥 Response Status: {response.status_code}")
    
    if response.status_code == 200:
        print("✅ Audio Recall Test saved successfully!")
        result = response.json()
        print(f"   Test ID: {result.get('id')}")
        print(f"   Score: {result.get('score')}/{result.get('total_questions')}")
        print(f"   Average Similarity: {result.get('average_similarity')}%")
        print(f"   Correct Recalls: {result.get('correct_recalls')}/{result.get('total_rounds')}")
        print(f"   Created: {result.get('created_at')}")
        return True
    else:
        print(f"❌ Failed to save test")
        print(f"   Error: {response.text}")
        return False

def test_retrieve_tests(token):
    """Test retrieving saved tests"""
    print("\n" + "="*60)
    print("Testing Retrieve Cognitive Tests")
    print("="*60)
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Get Enhanced Cognitive Tests
    print("\n📋 Retrieving Enhanced Cognitive Tests...")
    response = requests.get(
        f"{BASE_URL}/cognitive-tests/",
        headers=headers
    )
    
    if response.status_code == 200:
        tests = response.json()
        print(f"✅ Found {len(tests)} Enhanced Cognitive Tests")
        if tests:
            latest = tests[0]
            print(f"   Latest test:")
            print(f"   - Score: {latest.get('score')}/{latest.get('total_questions')}")
            print(f"   - Created: {latest.get('created_at')}")
    else:
        print(f"❌ Failed to retrieve tests: {response.text}")
    
    # Get Audio Recall Tests
    print("\n📋 Retrieving Audio Recall Tests...")
    response = requests.get(
        f"{BASE_URL}/cognitive-tests/audio-recall",
        headers=headers
    )
    
    if response.status_code == 200:
        tests = response.json()
        print(f"✅ Found {len(tests)} Audio Recall Tests")
        if tests:
            latest = tests[0]
            print(f"   Latest test:")
            print(f"   - Score: {latest.get('score')}/{latest.get('total_questions')}")
            print(f"   - Average Similarity: {latest.get('average_similarity')}%")
            print(f"   - Created: {latest.get('created_at')}")
    else:
        print(f"❌ Failed to retrieve tests: {response.text}")

def main():
    """Main test execution"""
    print("=" * 60)
    print("Cognitive Test Save Endpoint Testing")
    print("=" * 60)
    print(f"Testing endpoints at: {BASE_URL}")
    print(f"Test user: {TEST_EMAIL}")
    print("=" * 60)
    
    # Step 1: Login
    token = login()
    if not token:
        print("\n❌ Cannot proceed without authentication token")
        return
    
    # Step 2: Test Enhanced Cognitive Save
    enhanced_success = test_enhanced_cognitive_save(token)
    
    # Step 3: Test Audio Recall Save
    audio_success = test_audio_recall_save(token)
    
    # Step 4: Retrieve Tests
    test_retrieve_tests(token)
    
    # Summary
    print("\n" + "="*60)
    print("Test Summary")
    print("="*60)
    print(f"Enhanced Cognitive Test Save: {'✅ PASS' if enhanced_success else '❌ FAIL'}")
    print(f"Audio Recall Test Save: {'✅ PASS' if audio_success else '❌ FAIL'}")
    
    if enhanced_success and audio_success:
        print("\n🎉 All tests passed! Cognitive test save functionality is working.")
    else:
        print("\n⚠️ Some tests failed. Check the output above for details.")
    
    print("="*60)

if __name__ == "__main__":
    try:
        main()
    except requests.exceptions.ConnectionError:
        print("\n❌ Cannot connect to backend server.")
        print("Please ensure the backend is running at http://127.0.0.1:8000")
        print("Start it with: cd Modelapi && uvicorn main:app --reload")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
