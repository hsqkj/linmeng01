/**
 * 数据库初始化脚本
 * 创建所有必要的表结构和初始数据
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')
const dbConfig = require('../src/config/database')

async function initDatabase() {
  console.log('开始初始化数据库...')
  
  // 先连接MySQL服务器（不指定数据库）
  const connection = await mysql.createConnection({
    host: dbConfig.host,
    user: dbConfig.user,
    password: dbConfig.password,
    port: dbConfig.port,
    charset: 'utf8mb4'
  })
  
  try {
    // 创建数据库
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
    console.log(`数据库 ${dbConfig.database} 创建成功`)
    
    // 选择数据库
    await connection.query(`USE \`${dbConfig.database}\``)
    
    // ============ 创建数据表 ============
    
    // 1. 管理员表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        real_name VARCHAR(50) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(20) DEFAULT 'admin',
        permissions JSON,
        status TINYINT DEFAULT 1 COMMENT '0禁用 1启用',
        last_login_at DATETIME,
        last_login_ip VARCHAR(50),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员表'
    `)
    console.log('表 admins 创建成功')
    
    // 2. 社区用户表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS communities (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) NOT NULL UNIQUE COMMENT '手机号',
        password VARCHAR(255) NOT NULL,
        real_name VARCHAR(50) NOT NULL COMMENT '真实姓名',
        phone VARCHAR(20) NOT NULL,
        district VARCHAR(100) COMMENT '区',
        street VARCHAR(100) COMMENT '街道',
        community VARCHAR(100) COMMENT '社区',
        community_name VARCHAR(100) COMMENT '小区名称',
        position VARCHAR(50) COMMENT '职务',
        households INT COMMENT '小区户数',
        family_ratio DECIMAL(5,2) COMMENT '亲子家庭占比',
        elderly_ratio DECIMAL(5,2) COMMENT '老年群体占比',
        public_space_area DECIMAL(10,2) COMMENT '公共空间面积',
        has_outdoor_plaza TINYINT COMMENT '是否有户外广场',
        has_commercial TINYINT COMMENT '是否有商业体',
        has_school TINYINT COMMENT '是否有学校',
        has_park TINYINT COMMENT '是否有公园',
        merchant_count INT COMMENT '社区商户数',
        logo VARCHAR(255) COMMENT '社区Logo',
        description TEXT COMMENT '社区简介',
        images JSON COMMENT '场地图片',
        map_location POINT COMMENT '地图定位',
        address VARCHAR(255) COMMENT '详细地址',
        proof_images JSON COMMENT '证明材料',
        tags JSON COMMENT '标签',
        status TINYINT DEFAULT 0 COMMENT '0待审核 1通过 2拒绝',
        reject_reason VARCHAR(500),
        last_login_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='社区用户表'
    `)
    console.log('表 communities 创建成功')
    
    // 3. 商家用户表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS merchants (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) NOT NULL UNIQUE COMMENT '手机号',
        password VARCHAR(255) NOT NULL,
        company_name VARCHAR(200) NOT NULL COMMENT '企业名称',
        credit_code VARCHAR(50) COMMENT '统一社会信用代码',
        business_license VARCHAR(255) COMMENT '营业执照',
        logo VARCHAR(255) COMMENT '企业Logo',
        description TEXT COMMENT '企业简介',
        company_type VARCHAR(50) COMMENT '企业类型',
        industry VARCHAR(50) COMMENT '行业分类',
        resource_types JSON COMMENT '可提供资源类型',
        contact_name VARCHAR(50) NOT NULL COMMENT '联系人姓名',
        phone VARCHAR(20) NOT NULL COMMENT '联系人手机号',
        address VARCHAR(255) COMMENT '企业地址',
        map_location POINT COMMENT '地图定位',
        images JSON COMMENT '场地/门店图片',
        website VARCHAR(255) COMMENT '官网/公众号链接',
        tags JSON COMMENT '标签',
        member_level INT DEFAULT 1 COMMENT '会员等级 1-5',
        star_rating DECIMAL(2,1) DEFAULT 0 COMMENT '平台五星评级',
        rating_updated_at DATETIME COMMENT '评级更新时间',
        ambassador_id INT COMMENT '招商大使ID',
        status TINYINT DEFAULT 0 COMMENT '0待审核 1通过 2拒绝',
        reject_reason VARCHAR(500),
        last_login_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商家用户表'
    `)
    console.log('表 merchants 创建成功')
    
    // 4. 招商大使表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS ambassadors (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) NOT NULL UNIQUE COMMENT '手机号',
        password VARCHAR(255) NOT NULL,
        real_name VARCHAR(50) NOT NULL COMMENT '真实姓名',
        phone VARCHAR(20) NOT NULL,
        id_card VARCHAR(50) COMMENT '身份证号',
        qr_code VARCHAR(255) COMMENT '二维码',
        commission_rate DECIMAL(5,2) DEFAULT 20.00 COMMENT '提成比例%',
        total_merchants INT DEFAULT 0 COMMENT '发展商家数',
        total_commission DECIMAL(10,2) DEFAULT 0 COMMENT '累计提成',
        pending_commission DECIMAL(10,2) DEFAULT 0 COMMENT '待结算提成',
        withdraw_amount DECIMAL(10,2) DEFAULT 0 COMMENT '已提现金额',
        status TINYINT DEFAULT 0 COMMENT '0待审核 1通过 2拒绝',
        reject_reason VARCHAR(500),
        last_login_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='招商大使表'
    `)
    console.log('表 ambassadors 创建成功')
    
    // 5. 社区需求表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS demands (
        id INT PRIMARY KEY AUTO_INCREMENT,
        community_id INT NOT NULL,
        demand_type TINYINT NOT NULL COMMENT '1活动赞助 2专家服务 3空间运营',
        title VARCHAR(200) NOT NULL COMMENT '标题',
        activity_type VARCHAR(50) COMMENT '活动类型',
        target_audience JSON COMMENT '目标人群',
        start_time DATETIME COMMENT '开始时间',
        end_time DATETIME COMMENT '结束时间',
        location_type TINYINT COMMENT '1室内 2室外',
        location_name VARCHAR(200) COMMENT '活动地点名称',
        expected_count INT COMMENT '预计参与人数',
        content TEXT COMMENT '需求详情',
        attachment VARCHAR(255) COMMENT '策划方案附件',
        required_types JSON COMMENT '所需赞助类型',
        budget_min DECIMAL(10,2) COMMENT '预算最低',
        budget_max DECIMAL(10,2) COMMENT '预算最高',
        material_details JSON COMMENT '物资详情',
        human_details JSON COMMENT '人力详情',
        tech_details JSON COMMENT '技术支持详情',
        media_details JSON COMMENT '媒体报道详情',
        return_ways JSON COMMENT '回报方式',
        return_value TEXT COMMENT '回报价值说明',
        images JSON COMMENT '活动图片',
        tags JSON COMMENT '标签',
        deadline DATETIME COMMENT '截止日期',
        match_score DECIMAL(5,2) COMMENT '匹配度',
        view_count INT DEFAULT 0,
        status TINYINT DEFAULT 0 COMMENT '0待审核 1通过 2拒绝 3下架',
        reject_reason VARCHAR(500),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (community_id) REFERENCES communities(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='社区需求表'
    `)
    console.log('表 demands 创建成功')
    
    // 6. 商家资源表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS resources (
        id INT PRIMARY KEY AUTO_INCREMENT,
        merchant_id INT NOT NULL,
        resource_type TINYINT NOT NULL COMMENT '1资金 2物资 3人力 4技术 5服务 6媒体',
        title VARCHAR(200) NOT NULL COMMENT '标题',
        content TEXT COMMENT '资源详情',
        images JSON COMMENT '资源图片',
        tags JSON COMMENT '标签',
        min_amount DECIMAL(10,2) COMMENT '最低金额',
        max_amount DECIMAL(10,2) COMMENT '最高金额',
        quantity VARCHAR(100) COMMENT '物资数量',
        specs VARCHAR(200) COMMENT '规格要求',
        pickup_way VARCHAR(50) COMMENT '领取方式',
        staff_count INT COMMENT '人员数量',
        work_duration VARCHAR(100) COMMENT '工作时长',
        skill_requirements TEXT COMMENT '技能要求',
        service_scope VARCHAR(100) COMMENT '服务范围',
        certification VARCHAR(200) COMMENT '资质证明',
        price_range VARCHAR(100) COMMENT '收费标准',
        media_type VARCHAR(50) COMMENT '媒体类型',
        coverage VARCHAR(100) COMMENT '覆盖范围',
        match_score DECIMAL(5,2) COMMENT '匹配度',
        view_count INT DEFAULT 0,
        status TINYINT DEFAULT 0 COMMENT '0待审核 1通过 2拒绝 3下架',
        reject_reason VARCHAR(500),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (merchant_id) REFERENCES merchants(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商家资源表'
    `)
    console.log('表 resources 创建成功')
    
    // 7. 意向对接表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS intentions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        demand_id INT COMMENT '需求ID（商家发起时）',
        resource_id INT COMMENT '资源ID（社区发起时）',
        community_id INT NOT NULL,
        merchant_id INT NOT NULL,
        intro TEXT COMMENT '自我介绍/意向说明',
        status TINYINT DEFAULT 0 COMMENT '0待处理 1已接受 2已拒绝 3已完成 4已取消',
        response TEXT COMMENT '社区回复',
        completed_at DATETIME COMMENT '完成时间',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (demand_id) REFERENCES demands(id),
        FOREIGN KEY (resource_id) REFERENCES resources(id),
        FOREIGN KEY (community_id) REFERENCES communities(id),
        FOREIGN KEY (merchant_id) REFERENCES merchants(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='意向对接表'
    `)
    console.log('表 intentions 创建成功')
    
    // 8. 留言表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        demand_id INT COMMENT '需求ID',
        resource_id INT COMMENT '资源ID',
        user_type TINYINT NOT NULL COMMENT '1社区 2商家',
        user_id INT NOT NULL,
        content TEXT NOT NULL COMMENT '留言内容',
        parent_id INT DEFAULT NULL COMMENT '回复ID',
        status TINYINT DEFAULT 1 COMMENT '0隐藏 1显示',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='留言表'
    `)
    console.log('表 comments 创建成功')
    
    // 9. 会员缴费记录表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS member_payments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        merchant_id INT NOT NULL,
        level INT NOT NULL COMMENT '缴费等级',
        amount DECIMAL(10,2) NOT NULL COMMENT '缴费金额',
        payment_way VARCHAR(50) COMMENT '支付方式',
        payment_no VARCHAR(100) COMMENT '支付流水号',
        start_date DATE COMMENT '开始日期',
        end_date DATE COMMENT '结束日期',
        status TINYINT DEFAULT 0 COMMENT '0待支付 1已支付 2已退款',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (merchant_id) REFERENCES merchants(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='会员缴费记录表'
    `)
    console.log('表 member_payments 创建成功')
    
    // 10. 招商大使提成记录表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS commission_records (
        id INT PRIMARY KEY AUTO_INCREMENT,
        ambassador_id INT NOT NULL,
        merchant_id INT NOT NULL,
        payment_id INT COMMENT '对应缴费记录ID',
        commission_rate DECIMAL(5,2) NOT NULL COMMENT '提成比例',
        commission_amount DECIMAL(10,2) NOT NULL COMMENT '提成金额',
        payment_type TINYINT COMMENT '1首次 2续费',
        status TINYINT DEFAULT 0 COMMENT '0待结算 1已结算 2已提现',
        settled_at DATETIME COMMENT '结算时间',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ambassador_id) REFERENCES ambassadors(id),
        FOREIGN KEY (merchant_id) REFERENCES merchants(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='提成记录表'
    `)
    console.log('表 commission_records 创建成功')
    
    // 11. 撮合奖励记录表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS reward_records (
        id INT PRIMARY KEY AUTO_INCREMENT,
        intention_id INT NOT NULL,
        community_id INT NOT NULL,
        reward_type VARCHAR(50) COMMENT '奖励类型',
        reward_value DECIMAL(10,2) COMMENT '奖励价值',
        reward_content TEXT COMMENT '奖励内容',
        status TINYINT DEFAULT 0 COMMENT '0待发放 1已发放 2已确认',
        shipped_at DATETIME COMMENT '发货时间',
        confirmed_at DATETIME COMMENT '确认时间',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (intention_id) REFERENCES intentions(id),
        FOREIGN KEY (community_id) REFERENCES communities(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='撮合奖励记录表'
    `)
    console.log('表 reward_records 创建成功')
    
    // 12. 系统配置表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sys_configs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        config_key VARCHAR(100) NOT NULL UNIQUE,
        config_value TEXT,
        config_type VARCHAR(50) COMMENT 'config/article/member/ambassador/rating',
        description VARCHAR(200),
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统配置表'
    `)
    console.log('表 sys_configs 创建成功')
    
    // 13. 轮播图表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS banners (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(100) NOT NULL,
        image_url VARCHAR(255) NOT NULL,
        link_url VARCHAR(255),
        position VARCHAR(50) DEFAULT 'all' COMMENT 'all/both/community/merchant',
        sort_order INT DEFAULT 0,
        status TINYINT DEFAULT 1 COMMENT '0禁用 1启用',
        start_time DATETIME,
        end_time DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='轮播图表'
    `)
    console.log('表 banners 创建成功')
    
    // 14. 标签表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tags (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(50) NOT NULL,
        type TINYINT NOT NULL COMMENT '1社区标签 2商家标签',
        category VARCHAR(50) COMMENT '分类',
        is_system TINYINT DEFAULT 1 COMMENT '1系统标签 0自定义',
        status TINYINT DEFAULT 1 COMMENT '0禁用 1启用',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='标签表'
    `)
    console.log('表 tags 创建成功')
    
    // 15. 行政区划表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS regions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        level TINYINT NOT NULL COMMENT '1省 2市 3区 4街道 5社区',
        parent_id INT DEFAULT 0,
        sort_order INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='行政区划表'
    `)
    console.log('表 regions 创建成功')
    
    // ============ 插入初始数据 ============
    
    // 创建超级管理员
    const hashedPassword = await bcrypt.hash('admin123', 10)
    await connection.query(`
      INSERT IGNORE INTO admins (username, password, real_name, role, permissions) VALUES 
      ('admin', ?, '超级管理员', 'superadmin', '["all"]')
    `, [hashedPassword])
    console.log('超级管理员创建成功 (admin/admin123)')
    
    // 创建运营管理员
    await connection.query(`
      INSERT IGNORE INTO admins (username, password, real_name, role, permissions) VALUES 
      ('operator', ?, '运营管理员', 'operator', '["users","content","matching","config_rating","config_member","config_ambassador","config_reward","config_banner","config_tag","config_basic"]')
    `, [hashedPassword])
    console.log('运营管理员创建成功 (operator/admin123)')
    
    // 插入系统配置默认数据
    const configs = [
      ['match_algorithm', '{"region":25,"type":20,"tag":15,"community_profile":15,"merchant_profile":10,"semantic":10,"reputation":5}', 'match', '匹配算法权重配置'],
      ['member_levels', '{"Lv1":{"name":"普通会员","fee":0},"Lv2":{"name":"银牌会员","fee":999},"Lv3":{"name":"金牌会员","fee":2999},"Lv4":{"name":"铂金会员","fee":5999},"Lv5":{"name":"钻石会员","fee":12000}}', 'member', '会员等级配置'],
      ['member_benefits', '{"Lv3":{"view_contact":true,"intent_limit":0,"priority":true,"customer_service":true}}', 'member', '会员权益配置'],
      ['ambassador_commission', '{"first":20,"renewal":10}', 'ambassador', '招商大使提成配置'],
      ['match_reward', '{"per_success":200}', 'reward', '撮合奖励配置'],
      ['anti_flying_level', 'Lv3', 'reward', '防飞单等级门槛配置'],
      ['rating_config', '{"dimensions":[{"name":"服务质量","weight":30},{"name":"响应速度","weight":20},{"name":"活跃程度","weight":25},{"name":"合作表现","weight":25}],"starRules":[{"star":5,"minScore":90},{"star":4,"minScore":75},{"star":3,"minScore":60},{"star":2,"minScore":40},{"star":1,"minScore":0}]}', 'rating', '商家评级标准配置']
    ]
    
    for (const config of configs) {
      await connection.query(`
        INSERT IGNORE INTO sys_configs (config_key, config_value, config_type, description) VALUES (?, ?, ?, ?)
      `, config)
    }
    console.log('系统配置默认数据插入成功')
    
    // 插入默认标签
    const communityTags = [
      ['老旧小区', '人口结构'], ['新建社区', '人口结构'], ['青年社区', '人口结构'], ['老龄化社区', '人口结构'], ['亲子社区', '人口结构'],
      ['学区社区', '地理位置'], ['商圈社区', '地理位置'], ['产业园区', '地理位置'], ['交通枢纽', '地理位置'], ['景区周边', '地理位置'],
      ['文化社区', '社区特色'], ['体育社区', '社区特色'], ['绿色社区', '社区特色'], ['智慧社区', '社区特色'], ['志愿社区', '社区特色'],
      ['商业密集', '资源禀赋'], ['公共空间丰富', '资源禀赋'], ['学校密集', '资源禀赋'], ['公园环绕', '资源禀赋']
    ]
    
    for (const [name, category] of communityTags) {
      await connection.query(`INSERT IGNORE INTO tags (name, type, category) VALUES (?, 1, ?)`, [name, category])
    }
    console.log('社区标签插入成功')
    
    const merchantTags = [
      ['连锁品牌', '企业规模'], ['本地企业', '企业规模'], ['小微企业', '企业规模'], ['初创企业', '企业规模'], ['上市公司', '企业规模'],
      ['高端品牌', '品牌定位'], ['大众品牌', '品牌定位'], ['性价比品牌', '品牌定位'], ['年轻化品牌', '品牌定位'], ['家庭品牌', '品牌定位'],
      ['公益导向', '合作偏好'], ['品牌曝光', '合作偏好'], ['精准获客', '合作偏好'], ['社会责任', '合作偏好'], ['长期合作', '合作偏好'],
      ['全国服务', '服务能力'], ['区域服务', '服务能力'], ['本地服务', '服务能力'], ['上门服务', '服务能力'], ['线上服务', '服务能力']
    ]
    
    for (const [name, category] of merchantTags) {
      await connection.query(`INSERT IGNORE INTO tags (name, type, category) VALUES (?, 2, ?)`, [name, category])
    }
    console.log('商家标签插入成功')
    
    // 插入默认轮播图
    const banners = [
      ['邻盟平台上线啦！', '/banners/banner1.jpg', '/', 'both', 1],
      ['金牌会员限时优惠', '/banners/banner2.jpg', '/member', 'merchant', 2],
      ['社区活动精彩瞬间', '/banners/banner3.jpg', '/cases', 'community', 3],
      ['招商大使火热招募中', '/banners/banner4.jpg', '/ambassador/join', 'both', 4]
    ]
    
    for (const banner of banners) {
      await connection.query(`INSERT IGNORE INTO banners (title, image_url, link_url, position, sort_order) VALUES (?, ?, ?, ?, ?)`, banner)
    }
    console.log('轮播图插入成功')
    
    // 插入默认行政区划
    const regions = [
      ['北京市', 1, 0, 1], ['朝阳区', 3, 1, 1], ['海淀区', 3, 1, 2], ['西城区', 3, 1, 3],
      ['望京街道', 4, 2, 1], ['中关村街道', 4, 3, 1], ['金融街街道', 4, 4, 1],
      ['阳光花园社区', 5, 5, 1], ['望京西园社区', 5, 5, 2]
    ]
    
    for (const region of regions) {
      await connection.query(`INSERT IGNORE INTO regions (name, level, parent_id, sort_order) VALUES (?, ?, ?, ?)`, region)
    }
    console.log('行政区划插入成功')
    
    console.log('\n========================================')
    console.log('数据库初始化完成！')
    console.log('========================================')
    console.log('\n管理员账号:')
    console.log('  超级管理员: admin / admin123')
    console.log('  运营管理员: operator / admin123')
    console.log('========================================\n')
    
  } catch (error) {
    console.error('数据库初始化失败:', error)
    throw error
  } finally {
    await connection.end()
  }
}

// 运行初始化
initDatabase().catch(console.error)
