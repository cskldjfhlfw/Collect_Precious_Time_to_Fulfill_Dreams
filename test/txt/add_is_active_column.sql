-- 添加用户账户激活状态字段
-- 用于软删除和账户禁用功能

-- 添加is_active列，默认值为true
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 更新现有用户为激活状态
UPDATE users SET is_active = true WHERE is_active IS NULL;

-- 添加注释
COMMENT ON COLUMN users.is_active IS '账户是否激活（false表示账户被禁用）';
