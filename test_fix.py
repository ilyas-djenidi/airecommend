import requests
import json

url = "http://localhost:8000/api/maps/generate"
payload = {
    "date": "2026-01-08",
    "include_zones": True,
    "include_containers": True,
    "include_routes": True,
    "include_wpi": True,
    "include_tracking": True
}
headers = {
    "Content-Type": "application/json"
}

try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("Success! Map generated.")
        with open("test_verify.html", "w", encoding="utf-8") as f:
            f.write(response.text)
        print("Saved to test_verify.html")
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Failed to connect: {e}")
