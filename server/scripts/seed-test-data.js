/**
 * 添加测试数据（根据实际表结构）
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')
const dbConfig = require('../src/config/database')

async function addTestData() {
  const connection = await mysql.createConnection({
    host: dbConfig.host,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    port: dbConfig.port
  })

  console.log('开始添加测试数据...')
  
  const password = await bcrypt.hash('test123', 10)

  try {
    // ====== 测试社区账号 ======
    await connection.query(`
      INSERT IGNORE INTO communities 
        (username, password, real_name, phone, district, street, community, community_name, position,
         households, family_ratio, elderly_ratio, public_space_area, has_outdoor_plaza, has_commercial,
         has_school, has_park, merchant_count, description, status)
      VALUES
        ('13800138000', ?, '张慧芳', '13800138000', '南山区', '粤海街道', '科技园社区', '科技园第一居委会', '社区书记',
         3200, 62, 18, 800, 1, 1, 1, 0, 45, '南山区核心科技园区，居民以科技从业者为主，消费能力强。', 1),
        ('13800138001', ?, '李明远', '13800138001', '福田区', '华强街道', '华强北社区', '华强北居委会', '社区副书记',
         2800, 55, 22, 600, 1, 1, 0, 1, 38, '福田区电子商贸聚集地，人口密集，商业配套成熟。', 1),
        ('13800138002', ?, '王秀英', '13800138002', '龙华区', '民治街道', '民治社区', '民治居委会', '社区工作者',
         4500, 68, 15, 1200, 1, 1, 1, 1, 62, '龙华区大型居住社区，年轻家庭为主，儿童教育需求旺盛。', 1)
    `, [password, password, password])
    console.log('✓ 社区账号创建成功')

    // ====== 测试商家账号 ======
    await connection.query(`
      INSERT IGNORE INTO merchants
        (username, password, company_name, contact_name, phone, industry, description, 
         member_level, star_rating, status)
      VALUES
        ('13900139000', ?, '星光教育培训中心', '陈志远', '13900139000', '教育培训', 
         '专业K12教育培训机构，提供数学、语文、英语等全科辅导，拥有20名持证教师，服务学生500+。',
         'Lv3', 4, 1),
        ('13900139001', ?, '康乐健身会所', '刘一飞', '13900139001', '体育健身',
         '社区健身连锁品牌，提供瑜伽、搏击操、游泳等课程，会员服务8000+人次。',
         'Lv2', 3, 1),
        ('13900139002', ?, '悦来美业', '徐小丽', '13900139002', '美业',
         '专业美发美甲美睫连锁门店，技师均持国家资格证书，提供上门服务。',
         'Lv2', 4, 1),
        ('13900139003', ?, '鲜之味生鲜超市', '马建国', '13900139003', '生鲜水果',
         '社区生鲜直采超市，产地直供，支持社区团购和定期配送服务。',
         'Lv1', 3, 1),
        ('13900139004', ?, '平安家政服务', '赵美丽', '13900139004', '家政服务',
         '专业家政服务公司，提供保洁、育婴、月嫂、老人陪护等服务，已入驻10个社区。',
         'Lv3', 5, 1),
        ('13900139005', ?, '优品药房', '孙博文', '13900139005', '药店',
         '连锁药房品牌，配备执业药师，支持社区老年人送药上门服务。',
         'Lv2', 4, 1)
    `, [password, password, password, password, password, password])
    console.log('✓ 商家账号创建成功')

    // ====== 测试大使账号 ======
    await connection.query(`
      INSERT IGNORE INTO ambassadors
        (username, password, real_name, phone, total_merchants, total_commission, pending_commission, status)
      VALUES
        ('13900001111', ?, '李志强', '13900001111', 3, 4500.00, 800.00, 1),
        ('13900002222', ?, '王小红', '13900002222', 2, 2000.00, 300.00, 1)
    `, [password, password])
    console.log('✓ 大使账号创建成功')

    // ====== 测试需求数据 ======
    const [communityRows] = await connection.query('SELECT id FROM communities ORDER BY id LIMIT 3')
    if (communityRows.length > 0) {
      const c1 = communityRows[0].id
      const c2 = communityRows[1] ? communityRows[1].id : c1
      const c3 = communityRows[2] ? communityRows[2].id : c1

      await connection.query(`
        INSERT IGNORE INTO demands
          (community_id, demand_type, title, activity_type, target_audience,
           start_time, end_time, content, tags, status)
        VALUES
          (?, 'education', '暑期青少年编程兴趣班', '兴趣班', '["青少年","儿童"]',
           '2026-07-01', '2026-08-31', '社区拟引进优质编程教育资源，面向8-15岁青少年，需要专业教师资质和课程体系，可提供活动室约80平米。',
           '["教育培训","青少年","编程"]', 1),
          (?, 'health', '社区老年人健康体验活动', '公益活动', '["老年人"]',
           '2026-04-15', '2026-04-15', '计划开展系列老年健康活动，包括免费检测、养生讲座、健身操，希望引进专业医疗健康机构，可提供社区广场。',
           '["健康医疗","老年人"]', 1),
          (?, 'community', '社区亲子市集活动', '市集活动', '["儿童","家长"]',
           '2026-04-20', '2026-04-20', '计划举办月度社区亲子市集，希望引进优质商家，包括手工DIY、特色美食、亲子游戏，可提供户外广场约500平米。',
           '["亲子","市集"]', 1)
      `, [c1, c2, c3])
      console.log('✓ 需求数据创建成功')

      // ====== 测试资源数据 ======
      const [merchantRows] = await connection.query('SELECT id FROM merchants ORDER BY id LIMIT 4')
      if (merchantRows.length >= 2) {
        const m1 = merchantRows[0].id
        const m2 = merchantRows[1].id
        const m3 = merchantRows[2] ? merchantRows[2].id : m1
        const m4 = merchantRows[3] ? merchantRows[3].id : m2

        await connection.query(`
          INSERT IGNORE INTO resources
            (merchant_id, resource_type, title, content, tags, status)
          VALUES
            (?, 'activity', '免费少儿编程体验课',
             '提供2课时免费少儿编程体验课，涵盖Scratch可视化编程和Python基础，可安排周末到社区开展，每次可接待50人。',
             '["教育培训","青少年","编程"]', 1),
            (?, 'activity', '社区健身公开课',
             '专业健身教练进社区，包括广场舞、健身操、瑜伽入门等，免费提供1次公开课（2小时），可定期到各社区开展。',
             '["体育健身","老年人","家庭"]', 1),
            (?, 'discount', '上门美甲美睫优惠体验',
             '为社区居民提供上门美甲美睫服务，首次体验享受5折优惠，团体10人以上再享9折。',
             '["美业","女性"]', 1),
            (?, 'service', '家政保洁免费体验',
             '提供3小时免费家政保洁体验服务，包含厨房、卫生间深度清洁，每个社区限前20户预约。',
             '["家政服务","家庭"]', 1)
        `, [m1, m2, m3, m4])
        console.log('✓ 资源数据创建成功')

        // ====== 测试对接意向 ======
        await connection.query(`
          INSERT IGNORE INTO intentions
            (community_id, merchant_id, status, created_at)
          VALUES
            (?, ?, 3, DATE_SUB(NOW(), INTERVAL 15 DAY)),
            (?, ?, 2, DATE_SUB(NOW(), INTERVAL 3 DAY))
        `, [c1, m1, c2, m2])
        console.log('✓ 对接意向创建成功')

        // ====== 测试留言 ======
        const [dm] = await connection.query('SELECT id FROM demands LIMIT 1')
        if (dm.length > 0) {
          await connection.query(`
            INSERT IGNORE INTO comments (demand_id, user_id, user_type, content, status) VALUES
              (?, ?, 2, '我们有专业的青少年编程课程，可提供免费体验课，请问活动室可以容纳多少人？', 1),
              (?, ?, 2, '我们机构有10年教育经验，欢迎合作！', 1)
          `, [dm[0].id, m1, dm[0].id, m2])
          console.log('✓ 留言数据创建成功')
        }
      }
    }

    // ====== 测试轮播图 ======
    await connection.query(`
      INSERT IGNORE INTO banners (title, image_url, link_url, position, sort_order, status) VALUES
        ('邻盟平台正式上线', 'https://picsum.photos/1200/400?random=1', '', 'community', 1, 1),
        ('优质商家资源等你来对接', 'https://picsum.photos/1200/400?random=2', '', 'community', 2, 1),
        ('发布需求 精准匹配 高效对接', 'https://picsum.photos/1200/400?random=3', '', 'community', 3, 1),
        ('商家入驻招募中', 'https://picsum.photos/1200/400?random=4', '', 'merchant', 1, 1),
        ('社区合作 快速对接 拓展业务', 'https://picsum.photos/1200/400?random=5', '', 'merchant', 2, 1)
    `)
    console.log('✓ 轮播图数据创建成功')

    console.log('\n========================================')
    console.log('测试数据添加完成！')
    console.log('========================================')
    console.log('\n测试账号（验证码均为 123456）:')
    console.log('  社区: 13800138000')
    console.log('  商家: 13900139000')
    console.log('  大使: 13900001111 / 验证码: 888888')
    console.log('  管理员: admin / admin123')
    console.log('========================================\n')

  } catch (err) {
    console.error('添加测试数据失败:', err.message)
    console.error('SQL:', err.sql)
    throw err
  } finally {
    await connection.end()
  }
}

addTestData().catch(e => {
  console.error('Fatal error:', e.message)
  process.exit(1)
})
