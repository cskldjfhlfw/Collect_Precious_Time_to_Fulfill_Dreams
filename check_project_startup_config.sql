-- 检查项目启动配置
SELECT 
    id,
    name,
    startup_script_path,
    startup_command,
    image_path,
    file_path,
    created_at
FROM projects 
WHERE id = '812907f7-11f5-4a9c-b0b9-daf654203c29';
