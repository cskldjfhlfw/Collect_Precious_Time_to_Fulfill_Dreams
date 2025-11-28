-- 检查项目启动请求表的结构和数据
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'project_startup_requests' 
ORDER BY ordinal_position;

-- 查看最新的启动记录
SELECT 
    id,
    project_id,
    status,
    started_at,
    expires_at,
    is_running,
    created_at
FROM project_startup_requests 
ORDER BY created_at DESC 
LIMIT 3;
