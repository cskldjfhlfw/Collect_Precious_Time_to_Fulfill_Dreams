import requests
import json

# 测试赛事API
API_BASE = "http://localhost:8000/api"

print("=" * 60)
print("测试赛事API")
print("=" * 60)

# 1. 测试获取统计数据
print("\n1. 获取统计数据:")
try:
    response = requests.get(f"{API_BASE}/competitions/stats")
    print(f"状态码: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"统计数据: {json.dumps(data, ensure_ascii=False, indent=2)}")
    else:
        print(f"错误: {response.text}")
except Exception as e:
    print(f"请求失败: {e}")

# 2. 测试获取赛事列表
print("\n2. 获取赛事列表:")
try:
    response = requests.get(f"{API_BASE}/competitions?page=1&size=10")
    print(f"状态码: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"总数: {data.get('total', 0)}")
        print(f"返回项数: {len(data.get('items', []))}")
        if data.get('items'):
            print(f"第一项: {json.dumps(data['items'][0], ensure_ascii=False, indent=2)}")
        else:
            print("列表为空")
    else:
        print(f"错误: {response.text}")
except Exception as e:
    print(f"请求失败: {e}")

# 3. 测试搜索功能
print("\n3. 测试搜索功能:")
try:
    response = requests.get(f"{API_BASE}/competitions?search=test")
    print(f"状态码: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"搜索结果数: {len(data.get('items', []))}")
    else:
        print(f"错误: {response.text}")
except Exception as e:
    print(f"请求失败: {e}")

print("\n" + "=" * 60)
