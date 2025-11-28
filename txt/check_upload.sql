-- 检查最近更新的项目
SELECT id, name, image_path, updated_at 
FROM projects 
ORDER BY updated_at DESC 
LIMIT 5;

-- 检查特定项目
SELECT id, name, image_path, startup_command 
FROM projects 
WHERE id = 'a734c830-0389-4d8d-9585-edb71c5a5b5f';

-- 检查所有有图片的项目
SELECT id, name, image_path 
FROM projects 
WHERE image_path IS NOT NULL;
