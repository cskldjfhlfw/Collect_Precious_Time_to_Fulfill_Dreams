-- 为User表添加phone和region字段的迁移脚本
-- 执行时间: 2025-11-15

-- 添加phone字段（可空，最大20个字符）
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20) NULL;

-- 添加region字段（可空，最大100个字符）
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS region VARCHAR(100) NULL;

-- 添加注释
COMMENT ON COLUMN users.phone IS '用户手机号码';
COMMENT ON COLUMN users.region IS '用户所在地区';

-- 查看修改结果
SELECT column_name, data_type, is_nullable, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('phone', 'region');
