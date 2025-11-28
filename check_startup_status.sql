-- 检查项目启动状态
SELECT 
    p.id,
    p.name,
    p.startup_script_path,
    psr.status,
    psr.is_running,
    psr.process_id,
    psr.started_at,
    psr.expires_at,
    psr.created_at
FROM projects p
LEFT JOIN project_startup_requests psr ON p.id = psr.project_id
WHERE p.name LIKE '%测试%' OR p.name LIKE '%test%' OR p.name LIKE '%Test%'
ORDER BY psr.created_at DESC
LIMIT 5;
