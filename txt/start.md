# 启动指南

## 前置条件

1. **创建前端环境变量文件**
   在 `front` 目录下创建 `.env.local` 文件：
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   ```

2. **确保数据库服务运行**
   - PostgreSQL: localhost:5432
   - Neo4j: localhost:7687  
   - MongoDB: localhost:27017
   - Redis: localhost:6379

## 启动步骤

### 1. 启动后端服务
```bash
cd back
conda activate yanzhengma
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. 生成测试数据（可选）
```bash
cd back
conda activate yanzhengma
python generate_multi_db_data.py
```

### 3. 启动前端服务
```bash
cd front
npm run dev
# 或者
yarn dev
# 或者
pnpm dev
```

## 访问地址

- **前端**: http://localhost:3000
- **后端API**: http://localhost:8000
- **API文档**: http://localhost:8000/docs

## 数据库连接信息

### PostgreSQL
- 主机: localhost
- 端口: 5432
- 数据库: research
- 用户名: postgres
- 密码: 123456

### Neo4j
- 浏览器: http://localhost:7474
- 连接URL: bolt://localhost:7687
- 用户名: neo4j
- 密码: 12345678
- 数据库: search

### MongoDB
- 连接字符串: mongodb://localhost:27017
- 数据库: research

### Redis
- 主机: localhost
- 端口: 6379
- 数据库: 0

## 故障排除

### 后端启动失败
1. 确保已激活conda环境: `conda activate yanzhengma`
2. 检查依赖是否安装: `pip install -r requirements.txt`
3. 确保数据库服务正在运行

### 前端API调用失败
1. 确保后端服务已启动
2. 检查 `.env.local` 文件是否正确创建
3. 确认API地址: http://localhost:8000/api

### 数据库连接失败
1. 检查数据库服务状态
2. 验证连接参数
3. 运行 `python connection_test.py` 测试连接

## 开发提示

- 后端修改会自动重载（--reload 参数）
- 前端修改会自动热更新
- 可以通过 http://localhost:8000/docs 查看API文档
- 使用 `python show_db_info.py` 查看数据库配置信息
