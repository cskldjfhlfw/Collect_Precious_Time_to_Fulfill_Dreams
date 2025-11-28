import requests
import json

# 测试赛事API并获取详细错误
API_BASE = "http://localhost:8000/api"

print("=" * 60)
print("详细测试赛事API")
print("=" * 60)

# 测试获取赛事列表
print("\n获取赛事列表（详细）:")
try:
    response = requests.get(f"{API_BASE}/competitions?page=1&size=10")
    print(f"状态码: {response.status_code}")
    print(f"响应头: {dict(response.headers)}")
    print(f"响应内容: {response.text}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"\n解析后的数据:")
        print(json.dumps(data, ensure_ascii=False, indent=2))
    else:
        print(f"\n错误响应: {response.text}")
        
        # 尝试解析错误详情
        try:
            error_data = response.json()
            print(f"\n错误详情:")
            print(json.dumps(error_data, ensure_ascii=False, indent=2))
        except:
            pass
            
except Exception as e:
    print(f"请求失败: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
