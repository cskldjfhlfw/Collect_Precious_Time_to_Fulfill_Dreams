# 🚀 智谱AI快速配置（5分钟）

## 步骤1: 获取API密钥

1. 访问 https://open.bigmodel.cn/
2. 点击右上角"登录/注册"
3. 完成注册后进入控制台
4. 左侧菜单 → "API密钥"
5. 点击"创建新的API密钥"
6. **复制密钥**（只显示一次，请保存好）

## 步骤2: 配置API密钥

### 方式1: PowerShell配置（临时，重启后失效）

```powershell
# 在PowerShell中运行
$env:ZHIPU_API_KEY="你的API密钥"

# 验证配置
echo $env:ZHIPU_API_KEY
```

### 方式2: .env文件配置（永久，推荐）

1. 在 `back` 目录创建 `.env` 文件
2. 添加以下内容：

```
ZHIPU_API_KEY=你的API密钥
```

例如：
```
ZHIPU_API_KEY=abc123def456.xyz789
```

## 步骤3: 重启后端

```powershell
# 停止当前运行的后端（Ctrl+C）

# 重新启动
cd d:\desk\React_Tailwind_FastAPI\back
python -m uvicorn app.main:app --reload
```

## 步骤4: 测试AI功能

1. 打开浏览器：http://localhost:3000
2. 进入"统计分析" → "报表"标签
3. 选择：
   - 报告类型：科研成果总结报告
   - 报告格式：详细报告
   - 时间范围：留空（全部时间）
4. 点击"AI生成报告"按钮
5. 等待5-10秒，查看AI生成的专业报告 ✅

## 🎉 完成！

现在您可以：
- ✅ 生成各类科研报告
- ✅ 选择时间范围分析
- ✅ 导出报告内容
- ✅ 完全免费使用

## ⚠️ 注意事项

1. **密钥安全**
   - 不要分享API密钥
   - 不要提交到Git
   - `.env`文件已在`.gitignore`中

2. **免费额度**
   - 智谱AI提供免费调用额度
   - 超限后自动降级为模拟报告
   - 查看额度：https://open.bigmodel.cn/usercenter/apikeys

3. **网络要求**
   - 需要能访问 open.bigmodel.cn
   - 国内用户无需代理

## 🆘 遇到问题？

### 报告生成失败

```powershell
# 检查API密钥
echo $env:ZHIPU_API_KEY

# 查看后端日志
# 终端会显示错误信息
```

### 显示模拟报告

原因：
- API密钥未配置
- 密钥配置错误
- 网络连接问题

解决：
1. 确认密钥正确
2. 重启后端
3. 检查控制台日志

---

💡 **提示**: 智谱AI的GLM-4-Flash模型速度快、质量好，完全免费！
