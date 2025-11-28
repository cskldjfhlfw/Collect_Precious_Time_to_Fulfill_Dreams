# 批量导入字段映射说明

## 🔧 修复说明

已修复专利、竞赛、会议、合作页面的批量导入422错误。

### 问题原因
CSV文件中的字段名与后端API schema要求的字段名不匹配。

---

## 📋 字段映射表

### 1. 会议 (Conferences)

| CSV字段 | API字段 | 说明 |
|---------|---------|------|
| level | category | 会议级别 |
| participation_type | status | 参与类型变为状态 |
| travel_budget | budget | 差旅预算 |
| travel_expense | used | 已用金额 |
| visa_required | *(跳过)* | 不支持此字段 |
| reminder_date | *(跳过)* | 不支持此字段 |
| image_path | *(跳过)* | 不支持此字段 |
| file_path | *(跳过)* | 不支持此字段 |

**CSV模板字段**:
```csv
name,location,start_date,end_date,category,status,submission_status,budget,used,participants,paper_title,description
```

---

### 2. 合作 (Cooperations)

| CSV字段 | API字段 | 说明 |
|---------|---------|------|
| organization | name | 机构名称 |
| cooperation_type | type | 合作类型 |
| cooperation_value | value | 合作价值 |
| start_date | established_date | 开始日期变为建立日期 |
| next_follow_up | last_contact | 下次跟进变为最后联系 |
| content | description | 内容变为描述 |
| contact_email | email | 联系邮箱 |
| contact_phone | phone | 联系电话 |
| pipeline_stage | *(跳过)* | 不支持此字段 |
| image_path | *(跳过)* | 不支持此字段 |
| file_path | *(跳过)* | 不支持此字段 |

**CSV模板字段**:
```csv
name,type,location,status,projects,contact_person,email,phone,established_date,last_contact,value,field,description
```

---

### 3. 竞赛 (Competitions)

| CSV字段 | API字段 | 说明 |
|---------|---------|------|
| image_path | *(跳过)* | 不支持此字段 |
| file_path | *(跳过)* | 不支持此字段 |

**CSV模板字段**:
```csv
name,level,award_level,award_date,registration_deadline,submission_deadline,progress_percent,mentor,team_members,status
```

---

### 4. 专利 (Patents)

| CSV字段 | API字段 | 说明 |
|---------|---------|------|
| image_path | *(跳过)* | 不支持此字段 |
| file_path | *(跳过)* | 不支持此字段 |

**CSV模板字段**:
```csv
name,patent_number,application_date,authorization_date,patent_type,status,technology_field,commercialization_value,maintenance_deadline,inventors,related_projects
```

---

## 🔄 自动转换功能

ImportDialog组件现在会自动执行以下转换：

### 1. **字段名映射**
```javascript
// 会议示例
CSV: level → API: category
CSV: travel_budget → API: budget
```

### 2. **JSON字段转换**
```javascript
// Authors/Inventors/Team_members
CSV: [{"name": "张三"}]
API: {"members": [{"name": "张三"}]}

// Related_projects
CSV: [{"project_id": "xxx"}]
API: {"projects": [{"project_id": "xxx"}]}

// Participants (保持list格式)
CSV: [{"name": "张三"}]
API: ["张三"]
```

### 3. **数组字段分割**
```javascript
// Keywords/Tags
CSV: "机器学习,深度学习,AI"
API: ["机器学习", "深度学习", "AI"]
```

### 4. **跳过不支持的字段**
```javascript
// 这些字段会被自动跳过
image_path, file_path (在某些表中)
visa_required, reminder_date (会议表)
pipeline_stage (合作表)
```

---

## ✅ 使用方法

### 方法1：使用旧的CSV文件（自动映射）

如果你已经有生成的CSV文件，**不需要修改**！

1. 重启前端（应用新代码）
```bash
cd front
npm run dev
```

2. 直接使用现有CSV文件导入
   - 组件会自动进行字段映射
   - 不支持的字段会被跳过
   - 数据会正确转换为API格式

### 方法2：生成新的CSV文件

如果想使用匹配API schema的字段名：

1. 修改 `generate_sample_data.py`（可选）
2. 或手动创建符合API schema的CSV文件
3. 使用"下载模板"功能获取正确的字段列表

---

## 📝 CSV文件示例

### 会议 (conferences.csv)
```csv
name,location,start_date,end_date,category,status,submission_status,budget,used,participants,paper_title,description
国际AI大会,北京,2024-06-01,2024-06-03,国际,即将参加,accepted,10000,9500,"[""张三"",""李四""]",深度学习研究,重要的国际会议
```

### 合作 (cooperations.csv)
```csv
name,type,location,status,projects,contact_person,email,phone,established_date,last_contact,value,field,description
华为公司,研发,深圳,活跃合作,5,张经理,zhang@huawei.com,13800138000,2024-01-01,2024-11-01,高,人工智能,与华为在AI领域的合作
```

### 竞赛 (competitions.csv)
```csv
name,level,award_level,award_date,registration_deadline,submission_deadline,progress_percent,mentor,team_members,status
数学建模竞赛,national,一等奖,2024-05-01,2024-03-01,2024-04-01,100,李老师,"[{""name"":""张三""},{""name"":""李四""}]",completed
```

### 专利 (patents.csv)
```csv
name,patent_number,application_date,authorization_date,patent_type,status,technology_field,commercialization_value,maintenance_deadline,inventors,related_projects
AI图像识别装置,ZL202410001,2024-01-01,2024-06-01,invention,approved,人工智能,1000000,2034-01-01,"[{""name"":""张三""},{""name"":""李四""}]","[{""project_id"":""xxx""}]"
```

---

## 🎯 注意事项

### 1. **JSON格式**
所有JSON字段必须使用**双引号**：
```csv
✅ 正确: "[{""name"":""张三""}]"
❌ 错误: "[{'name':'张三'}]"
```

### 2. **日期格式**
统一使用 YYYY-MM-DD：
```csv
✅ 正确: 2024-11-15
❌ 错误: 15/11/2024
```

### 3. **数字字段**
- progress_percent: 0-100的整数
- budget/used/value: 数字（可以有小数）
- projects: 整数

### 4. **状态值**
参考各表的枚举值：
- 会议status: "待申请", "即将参加", "已参加"
- 合作status: "洽谈中", "活跃合作", "暂停", "终止"
- 竞赛status: "planning", "ongoing", "completed"
- 专利status: "draft", "pending", "approved", "rejected"

---

## 🐛 问题排查

### Q: 导入后显示422错误
**A**: 
1. 检查必填字段是否完整（name, patent_number等）
2. 验证日期格式是否正确
3. 确认JSON字段格式是否使用双引号

### Q: 某些字段没有导入
**A**: 
可能是不支持的字段被自动跳过了，查看上面的映射表确认哪些字段会被跳过。

### Q: 如何查看详细错误信息
**A**: 
1. 打开浏览器开发者工具(F12)
2. 查看Console标签
3. 查看Network标签中的请求详情

---

## 📊 修复结果

- ✅ **会议导入**: 字段自动映射，不支持的字段跳过
- ✅ **合作导入**: 字段自动映射，不支持的字段跳过  
- ✅ **竞赛导入**: 不支持的字段跳过
- ✅ **专利导入**: 不支持的字段跳过

所有页面现在都应该可以正常导入了！🎉

---

**更新时间**: 2024-11-15  
**版本**: v1.1  
**状态**: ✅ 已修复
