# AI 大模型配置指南

本系统支持使用AI大模型生成智能科研报告。

## 🎯 支持的大模型

### 1. 智谱AI（推荐 - 免费额度充足）

**获取API密钥：**
1. 访问 https://open.bigmodel.cn/
2. 注册/登录账号
3. 进入控制台 → API密钥
4. 创建新的API密钥
5. 复制密钥

**配置方法：**

#### Windows PowerShell
```powershell
$env:ZHIPU_API_KEY="your-api-key-here"
```

#### Windows CMD
```cmd
set ZHIPU_API_KEY=your-api-key-here
```

#### Linux/Mac
```bash
export ZHIPU_API_KEY="your-api-key-here"
```

#### 永久配置（推荐）
创建 `back/.env` 文件：
```
ZHIPU_API_KEY=your-api-key-here
```

### 2. OpenAI（备选）

**获取API密钥：**
1. 访问 https://platform.openai.com/
2. 注册/登录账号  
3. 进入 API Keys
4. 创建新密钥

**配置方法：**
```powershell
$env:OPENAI_API_KEY="sk-your-key-here"
```

或在 `back/.env` 文件中：
```
OPENAI_API_KEY=sk-your-key-here
```

## 📝 使用说明

### 1. 配置API密钥

**方式一：环境变量（临时）**
```powershell
# 智谱AI
$env:ZHIPU_API_KEY="your-api-key-here"

# 重启后端
cd d:\desk\React_Tailwind_FastAPI\back
python -m uvicorn app.main:app --reload
```

**方式二：.env文件（永久）**
```bash
# 复制示例文件
cd d:\desk\React_Tailwind_FastAPI\back
cp .env.example .env

# 编辑 .env 文件，填入你的API密钥
# ZHIPU_API_KEY=your-actual-api-key
```

### 2. 测试API配置

```python
# 在后端目录运行
python -c "import os; print('智谱AI:', os.getenv('ZHIPU_API_KEY'))"
```

### 3. 使用报告生成功能

1. 打开前端：http://localhost:3000
2. 进入"统计分析" → "报表"
3. 选择报告类型和时间范围
4. 点击"AI生成报告"
5. 等待3-10秒获取AI生成的报告

## 🎁 智谱AI优势

- ✅ **免费额度充足** - 每日免费调用额度
- ✅ **响应速度快** - 国内服务器，低延迟
- ✅ **中文优化好** - 专为中文场景优化
- ✅ **模型能力强** - GLM-4系列性能优秀

## 🔧 模型选择

系统默认使用：
- **智谱AI**: `glm-4-flash` - 快速免费模型
- **OpenAI**: `gpt-3.5-turbo` - 备选模型

## ❗ 注意事项

1. **API密钥安全**
   - 不要提交到Git仓库
   - 不要分享给他人
   - 定期更换密钥

2. **调用限制**
   - 免费版有每日调用次数限制
   - 超限后会降级为模拟报告

3. **网络要求**
   - 需要稳定的网络连接
   - 智谱AI需访问 open.bigmodel.cn
   - OpenAI需访问 api.openai.com（可能需要代理）

## 🆘 故障排除

### 问题1：报告生成失败

**检查项：**
```bash
# 1. 检查API密钥是否配置
echo $env:ZHIPU_API_KEY

# 2. 检查后端日志
# 查看终端输出的错误信息

# 3. 测试网络连接
curl https://open.bigmodel.cn/
```

### 问题2：返回模拟报告

**原因：**
- API密钥未配置
- API密钥错误
- 网络连接失败
- 超出调用限制

**解决：**
1. 确认API密钥正确
2. 重启后端服务
3. 检查网络连接

## 📚 更多资源

- 智谱AI文档: https://open.bigmodel.cn/dev/api
- OpenAI文档: https://platform.openai.com/docs
- 系统文档: README.md
