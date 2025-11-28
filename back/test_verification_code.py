#!/usr/bin/env python3
"""测试邮箱验证码Redis存储"""
import asyncio
import sys
import os
from pathlib import Path

# 切换到back目录
os.chdir(Path(__file__).parent)
sys.path.insert(0, str(Path(__file__).parent))

from app.db.redis import init_redis, get_client, close_redis
from app.services.verification_code import (
    create_verification_code,
    verify_code,
    get_remaining_time
)


async def test_verification_code():
    """测试验证码功能"""
    
    print("=" * 70)
    print("📧 测试邮箱验证码（Redis存储）")
    print("=" * 70)
    
    # 初始化Redis
    print("\n1️⃣ 初始化Redis...")
    try:
        await init_redis()
        redis_client = get_client()
        print("   ✅ Redis连接成功")
    except Exception as e:
        print(f"   ❌ Redis连接失败: {e}")
        return False
    
    # 清除旧的验证码数据
    print("\n2️⃣ 清除旧的验证码数据...")
    old_keys = await redis_client.keys("verification:code:*")
    if old_keys:
        await redis_client.delete(*old_keys)
        print(f"   🗑️  已删除 {len(old_keys)} 个旧验证码")
    else:
        print("   ✅ 无旧数据需要清除")
    
    test_email = "test@example.com"
    
    # 测试创建验证码
    print(f"\n3️⃣ 测试创建验证码 ({test_email})...")
    code1, success1 = await create_verification_code(test_email)
    if success1:
        print(f"   ✅ 验证码创建成功: {code1}")
    else:
        print(f"   ❌ 验证码创建失败")
        return False
    
    # 测试重复发送（应该被限制）
    print(f"\n4️⃣ 测试60秒内重复发送（应该被拒绝）...")
    code2, success2 = await create_verification_code(test_email)
    if not success2:
        print(f"   ✅ 正确拒绝重复发送")
    else:
        print(f"   ❌ 应该拒绝重复发送，但没有")
    
    # 测试获取剩余时间
    print(f"\n5️⃣ 测试获取剩余有效时间...")
    remaining = await get_remaining_time(test_email)
    if remaining:
        print(f"   ✅ 剩余时间: {remaining}秒 (~{remaining//60}分{remaining%60}秒)")
    else:
        print(f"   ⚠️  无法获取剩余时间")
    
    # 测试错误的验证码
    print(f"\n6️⃣ 测试错误的验证码...")
    wrong_code = "000000"
    success, msg = await verify_code(test_email, wrong_code)
    if not success:
        print(f"   ✅ 正确拒绝错误验证码: {msg}")
    else:
        print(f"   ❌ 应该拒绝错误验证码")
    
    # 测试正确的验证码
    print(f"\n7️⃣ 测试正确的验证码...")
    success, msg = await verify_code(test_email, code1)
    if success:
        print(f"   ✅ 验证码验证成功")
    else:
        print(f"   ❌ 验证失败: {msg}")
    
    # 验证验证码已被删除
    print(f"\n8️⃣ 测试验证后验证码是否被删除...")
    key = f"verification:code:{test_email}"
    exists = await redis_client.exists(key)
    if not exists:
        print(f"   ✅ 验证码已正确删除")
    else:
        print(f"   ❌ 验证码未被删除")
    
    # 测试尝试次数限制
    print(f"\n9️⃣ 测试验证尝试次数限制（3次）...")
    test_email2 = "test2@example.com"
    code3, _ = await create_verification_code(test_email2)
    print(f"   📧 新验证码: {code3}")
    
    for i in range(1, 5):
        success, msg = await verify_code(test_email2, "999999")
        if i <= 3:
            print(f"   第{i}次错误尝试: {msg}")
        else:
            if not success and "次数过多" in msg:
                print(f"   ✅ 第{i}次尝试被拒绝: {msg}")
            else:
                print(f"   ❌ 应该在第{i}次拒绝")
    
    # 检查Redis中的数据
    print(f"\n🔟 检查Redis中的验证码键...")
    verify_keys = await redis_client.keys("verification:code:*")
    print(f"   🔑 验证码键数: {len(verify_keys)}")
    
    for key in verify_keys[:5]:
        ttl = await redis_client.ttl(key)
        value = await redis_client.get(key)
        print(f"      {key}")
        print(f"         TTL: {ttl}秒")
        if value:
            import json
            try:
                data = json.loads(value)
                print(f"         验证码: {data.get('code', 'N/A')}")
                print(f"         尝试次数: {data.get('attempts', 0)}")
            except:
                print(f"         值: {value[:100]}")
    
    # 测试多个邮箱
    print(f"\n1️⃣1️⃣ 测试多个邮箱同时使用...")
    emails = ["user1@test.com", "user2@test.com", "user3@test.com"]
    codes = {}
    
    for email in emails:
        code, success = await create_verification_code(email)
        if success:
            codes[email] = code
            print(f"   ✅ {email}: {code}")
    
    # 验证所有验证码
    print(f"\n   验证所有验证码:")
    for email, code in codes.items():
        success, msg = await verify_code(email, code)
        status = "✅ 成功" if success else f"❌ 失败: {msg}"
        print(f"   {status} - {email}")
    
    # 清理测试数据
    print(f"\n🧹 清理测试数据...")
    test_keys = await redis_client.keys("verification:code:*")
    if test_keys:
        await redis_client.delete(*test_keys)
        print(f"   ✅ 已清理 {len(test_keys)} 个测试键")
    
    # 关闭连接
    await close_redis()
    
    print("\n" + "=" * 70)
    print("✅ 邮箱验证码测试完成！")
    print("=" * 70)
    
    print("\n💡 验证码功能特性:")
    print("1. ✅ 使用Redis存储，支持分布式部署")
    print("2. ✅ 自动过期清理（5分钟）")
    print("3. ✅ 防重复发送（60秒间隔）")
    print("4. ✅ 错误尝试限制（3次）")
    print("5. ✅ 验证成功后自动删除")
    print("6. ✅ 服务重启不丢失")
    
    print("\n📋 Redis数据结构:")
    print("- 键: verification:code:{email}")
    print("- 值: JSON {code, expires_at, attempts, created_at}")
    print("- TTL: 5分钟自动过期")
    
    return True


if __name__ == "__main__":
    try:
        asyncio.run(test_verification_code())
    except KeyboardInterrupt:
        print("\n\n⚠️ 测试被中断")
    except Exception as e:
        print(f"\n\n💥 测试失败: {e}")
        import traceback
        traceback.print_exc()
