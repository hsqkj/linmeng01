-- 需求草稿表
CREATE TABLE IF NOT EXISTS demand_drafts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  community_id INT NOT NULL,
  demand_id INT DEFAULT NULL COMMENT '关联的需求ID（重新编辑时）',
  form_data JSON NOT NULL COMMENT '表单数据JSON',
  current_step INT DEFAULT 0 COMMENT '当前步骤',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_community_id (community_id),
  INDEX idx_demand_id (demand_id),
  FOREIGN KEY (community_id) REFERENCES communities(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='需求草稿';
