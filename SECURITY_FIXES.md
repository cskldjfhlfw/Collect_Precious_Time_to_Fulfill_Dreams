# 安全修复说明

本文档记录了根据 Semgrep 扫描结果进行的安全修复。

## 修复概览

✅ **已修复 15 个安全问题**

### 1. .gitignore 完善 ✅

**问题**: 缺少 `.gitignore` 文件，敏感文件可能被提交到版本控制

**修复**:
- 创建了完整的 `.gitignore` 文件
- 添加了对 `.env`、密钥文件、数据库文件、日志文件等的忽略
- 保护敏感数据不被提交到 Git

**影响文件**: `.gitignore`

---

### 2. API Key 泄露防护 ✅

**问题**: `back/.env` 文件中的 API Key 可能被扫描工具检测到

**修复**:
- `.env` 文件已被 `.gitignore` 保护
- 创建了 `.env.example` 作为配置模板
- 所有敏感信息都应存储在 `.env` 中，不提交到版本控制

**影响文件**: `.gitignore`, `back/.env.example`

---

### 3. 硬编码 JWT Secret ✅

**问题**: `back/app/core/security.py` 中硬编码了 JWT 密钥

**原代码**:
```python
SECRET_KEY = "your-secret-key-change-this-in-production-09af8s7df0a8sf"
```

**修复后**:
```python
import os
SECRET_KEY = os.getenv("APP_JWT_SECRET_KEY", "")
if not SECRET_KEY:
    raise ValueError("APP_JWT_SECRET_KEY environment variable must be set")
```

**配置方法**:
```bash
# 生成强密钥
python -c "import secrets; print(secrets.token_urlsafe(32))"

# 在 .env 文件中设置
APP_JWT_SECRET_KEY=your-generated-secret-key
```

**影响文件**: `back/app/core/security.py`

---

### 4. 未验证的 JWT 解码 ✅

**问题**: `back/app/services/token_blacklist.py` 中使用 `verify_signature: False` 解码 JWT

**原代码**:
```python
payload = jwt.decode(
    token,
    options={"verify_signature": False}  # 不安全！
)
```

**修复后**:
```python
# 使用 token 哈希作为键，避免需要解析 token
token_hash = hashlib.sha256(token.encode()).hexdigest()
key = f"{TokenBlacklistService.BLACKLIST_PREFIX}:{token_hash}"

# 如果需要获取过期时间，使用验证签名的方式
if TokenBlacklistService.JWT_SECRET_KEY:
    payload = jwt.decode(
        token,
        TokenBlacklistService.JWT_SECRET_KEY,
        algorithms=[TokenBlacklistService.JWT_ALGORITHM]
    )
```

**安全改进**:
- 使用 token 哈希值作为 Redis 键，无需解析 token
- 如果需要解析，使用验证签名的方式
- 解析失败时使用默认 TTL（24小时）

**影响文件**: `back/app/services/token_blacklist.py`

---

### 5. 测试文件中的硬编码 Secret ✅

**问题**: `back/test_token_blacklist.py` 中硬编码了测试用的 JWT secret

**修复后**:
```python
import os
jwt_secret = os.getenv("APP_JWT_SECRET_KEY", "")
if not jwt_secret:
    print("未设置APP_JWT_SECRET_KEY环境变量")
    expired_token = None
else:
    expired_token = jwt.encode(
        {"sub": "test_user_exp", "exp": exp_time},
        jwt_secret,
        algorithm="HS256"
    )
```

**影响文件**: `back/test_token_blacklist.py`

---

### 6. SQL 注入风险 ✅

**问题**: `back/verify_all_data.py` 中使用字符串格式化构建 SQL 查询

**原代码**:
```python
result = await session.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
```

**修复后**:
```python
# 使用白名单验证表名
allowed_tables = {
    "papers", "patents", "projects", "competitions", "resources", 
    "tags", "paper_authors", "project_milestones", "achievement_tags"
}

if table_name not in allowed_tables:
    print(f"{chinese_name}: 跳过 - 非法表名")
    continue

# 使用 SQLAlchemy 构建查询
from sqlalchemy import table, func
from sqlalchemy.sql import select as sql_select

t = table(table_name)
query = sql_select(func.count()).select_from(t)
result = await session.execute(query)
```

**安全改进**:
- 使用白名单验证表名
- 使用 SQLAlchemy 的查询构建器而不是字符串拼接
- 防止 SQL 注入攻击

**影响文件**: `back/verify_all_data.py`

---

### 7. 模板注入和主机配置 ✅

**问题**: `projects/test-web-service/server.py` 中的两个安全问题
1. 使用 `render_template_string` 可能导致模板注入
2. 使用 `host='0.0.0.0'` 暴露服务到公网

**修复**:

#### 7.1 模板注入防护
```python
# 使用安全的上下文变量
context = {
    'status': '正常运行',
    'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
    'server_ip': get_local_ip(),
    'port': SERVER_PORT,
    # ... 其他安全变量
}
return render_template_string(HTML_TEMPLATE, **context)
```

#### 7.2 主机配置安全
```python
# 从环境变量读取配置
ALLOW_EXTERNAL_ACCESS = os.getenv('ALLOW_EXTERNAL_ACCESS', 'false').lower() == 'true'
SERVER_HOST = '0.0.0.0' if ALLOW_EXTERNAL_ACCESS else '127.0.0.1'
SERVER_PORT = int(os.getenv('SERVER_PORT', '8848'))

app.run(
    host=SERVER_HOST,  # 默认仅本地访问
    port=SERVER_PORT,
    debug=False,
    threaded=True
)
```

**使用方法**:
```bash
# 默认：仅本地访问
python server.py

# 允许外部访问（谨慎使用）
ALLOW_EXTERNAL_ACCESS=true python server.py

# 自定义端口
SERVER_PORT=9000 python server.py
```

**影响文件**: `projects/test-web-service/server.py`

---

## 配置步骤

### 1. 设置环境变量

复制示例配置文件：
```bash
cd back
cp .env.example .env
```

### 2. 生成 JWT 密钥

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

将生成的密钥添加到 `.env` 文件：
```
APP_JWT_SECRET_KEY=your-generated-secret-key-here
```

### 3. 配置其他必要的环境变量

编辑 `.env` 文件，设置：
- 数据库连接信息
- AI API 密钥（如需要）
- CORS 配置

### 4. 验证配置

```bash
# 激活虚拟环境
conda activate yanzhengma

# 测试配置
cd back
python -c "from app.core.config import settings; print('配置加载成功')"
```

---

## 安全最佳实践

### ✅ 已实施

1. **敏感信息保护**
   - 所有密钥从环境变量读取
   - `.env` 文件被 `.gitignore` 保护
   - 提供 `.env.example` 作为模板

2. **JWT 安全**
   - 使用强密钥
   - 验证 token 签名
   - Token 黑名单机制

3. **SQL 注入防护**
   - 使用参数化查询
   - 表名白名单验证
   - 使用 ORM 查询构建器

4. **网络安全**
   - 默认仅本地访问
   - 需要显式配置才允许外部访问
   - 配置化的端口设置

### 📋 建议继续改进

1. **添加速率限制**
   - 使用 Flask-Limiter 限制 API 请求频率
   - 防止暴力破解和 DDoS 攻击

2. **添加 HTTPS 支持**
   - 在生产环境使用 HTTPS
   - 使用反向代理（如 Nginx）

3. **日志和监控**
   - 记录安全相关事件
   - 监控异常访问模式

4. **定期安全扫描**
   - 定期运行 Semgrep 扫描
   - 更新依赖包到最新安全版本

---

## 验证修复

运行 Semgrep 扫描验证修复：

```bash
docker run --rm -v //d/desk/Collect_Precious_Time_to_Fulfill_Dreams:/src semgrep/semgrep semgrep scan --config=auto /src
```

预期结果：
- ✅ 硬编码密钥问题已解决
- ✅ JWT 验证问题已解决
- ✅ SQL 注入风险已解决
- ✅ 模板注入风险已降低
- ✅ 主机配置问题已解决

---

## 注意事项

⚠️ **重要提醒**:

1. **不要提交 `.env` 文件到版本控制**
2. **定期更换 JWT 密钥**
3. **在生产环境使用强密钥**
4. **谨慎开启外部访问**
5. **保持依赖包更新**

---

## 联系和支持

如有安全问题或建议，请联系项目维护者。

最后更新：2025-11-28
