-- 检查项目的图片路径
SELECT id, name, image_path, startup_command, startup_script_path
FROM projects 
WHERE id = 'a734c830-0389-4d8d-9585-edb71c5a5b5f';

-- 查看所有项目的图片路径
SELECT id, name, image_path 
FROM projects 
ORDER BY created_at DESC 
LIMIT 10;
