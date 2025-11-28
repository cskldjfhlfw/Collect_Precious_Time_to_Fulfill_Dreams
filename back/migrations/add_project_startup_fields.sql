-- 添加项目启动相关字段
-- 执行时间：2025-11-27

-- 1. 为projects表添加启动命令相关字段
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS startup_script_path VARCHAR(500),
ADD COLUMN IF NOT EXISTS startup_command TEXT;

COMMENT ON COLUMN projects.startup_script_path IS '启动脚本路径（相对于projects目录）';
COMMENT ON COLUMN projects.startup_command IS '启动命令';

-- 2. 创建项目启动请求表
CREATE TABLE IF NOT EXISTS project_startup_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    request_reason TEXT,
    reject_reason TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    process_id INTEGER,
    is_running BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_status CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'stopped'))
);

-- 添加注释
COMMENT ON TABLE project_startup_requests IS '项目启动请求表';
COMMENT ON COLUMN project_startup_requests.requester_id IS '请求人';
COMMENT ON COLUMN project_startup_requests.approver_id IS '审批人';
COMMENT ON COLUMN project_startup_requests.status IS '状态：pending/approved/rejected/expired/stopped';
COMMENT ON COLUMN project_startup_requests.request_reason IS '请求原因';
COMMENT ON COLUMN project_startup_requests.reject_reason IS '拒绝原因';
COMMENT ON COLUMN project_startup_requests.approved_at IS '审批时间';
COMMENT ON COLUMN project_startup_requests.started_at IS '启动时间';
COMMENT ON COLUMN project_startup_requests.expires_at IS '过期时间（1小时后）';
COMMENT ON COLUMN project_startup_requests.process_id IS '进程ID';
COMMENT ON COLUMN project_startup_requests.is_running IS '是否运行中';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_project_startup_requests_project_id ON project_startup_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_project_startup_requests_requester_id ON project_startup_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_project_startup_requests_status ON project_startup_requests(status);
CREATE INDEX IF NOT EXISTS idx_project_startup_requests_is_running ON project_startup_requests(is_running);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_project_startup_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_startup_requests_updated_at
    BEFORE UPDATE ON project_startup_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_project_startup_requests_updated_at();
