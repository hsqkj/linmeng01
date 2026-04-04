process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = 'root';
process.env.DB_NAME = 'linmeng';
process.env.DB_PORT = '3306';

const { pool } = require('./src/config/db');

async function seed() {
  try {
    // Get an existing merchant to use their ID
    const [merchants] = await pool.query('SELECT id, company_name FROM merchants LIMIT 3');
    console.log('Found merchants:', merchants.map(m => m.id + ':' + m.company_name));

    if (merchants.length === 0) {
      console.log('No merchants found, creating test merchant first...');
      const [r] = await pool.query(
        "INSERT INTO merchants (username, password, company_name, industry, description, logo, status, member_level, star_rating) VALUES (?, ?, ?, ?, ?, ?, 1, 2, 4)",
        ['13999999001', '$2a$10$dummy', '武汉市智联文体服务中心', '体育健身', '专业体育健身服务商', null]
      );
      await pool.query(
        "INSERT INTO resources (merchant_id, title, content, resource_type, status, view_count) VALUES (?, ?, ?, ?, 1, 0)",
        [r.insertId, '社区体育赛事赞助计划', '为社区提供体育赛事活动赞助，包括器材、奖品、场地布置等支持，适合社区运动会、亲子运动会等活动。', '活动赞助']
      );
      console.log('Created test merchant and resource');
      await pool.end();
      return;
    }

    const m1 = merchants[0];
    const m2 = merchants[1] || merchants[0];
    const m3 = merchants[2] || merchants[0];

    // Check existing resources
    const [existing] = await pool.query('SELECT COUNT(*) as cnt FROM resources');
    console.log('Current resource count:', existing[0].cnt);

    // resource_type: 0=便民服务, 1=教育培训, 2=健康医疗, 3=体育健身, 4=文化娱乐, 5=养老服务, 6=社区商业, 7=公益活动, 8=活动赞助, 9=技能培训
    const testResources = [
      { merchant_id: m1.id, title: '社区亲子运动会赞助方案', content: '为社区量身定制亲子运动会赞助计划，包含活动策划、器材提供、奖品赞助。全程专业人员现场支持，确保活动圆满成功。适合社区春秋季户外运动会、亲子趣味运动会等场景。', resource_type: 8, view_count: 128 },
      { merchant_id: m1.id, title: '社区健康讲座公益资源', content: '定期在社区举办健康知识讲座，由专业医生和营养师主讲，涵盖老年人慢病管理、儿童健康饮食、家庭急救常识等内容。每场讲座提供场地、宣传物料支持。', resource_type: 7, view_count: 86 },
      { merchant_id: m2.id, title: '社区便民服务日活动', content: '每月在社区开展便民服务日活动，提供家电维修、小家电清洗、手机贴膜、磨刀剪等服务。服务团队专业可靠，价格公道，深受社区居民欢迎。', resource_type: 0, view_count: 204 },
      { merchant_id: m2.id, title: '社区艺术培训课程赞助', content: '为社区儿童和青少年提供免费艺术培训课程，包括绘画、书法、舞蹈等。专业师资，优质课程，帮助社区丰富青少年课余生活。', resource_type: 1, view_count: 152 },
      { merchant_id: m3.id, title: '社区节日庆典活动支持', content: '为社区提供节日庆典活动策划和执行服务，包括春节、中秋、重阳等传统节日活动。提供舞台设备、演出服装、活动物料等一站式支持。', resource_type: 8, view_count: 95 },
      { merchant_id: m3.id, title: '社区智慧养老服务方案', content: '为社区老年人提供智慧养老综合服务，包括智能健康监测设备、紧急呼叫系统、定期上门健康检测等服务。让老人安心，子女放心。', resource_type: 5, view_count: 178 },
    ];

    for (const r of testResources) {
      await pool.query(
        'INSERT INTO resources (merchant_id, title, content, resource_type, status, view_count) VALUES (?, ?, ?, ?, 1, ?)',
        [r.merchant_id, r.title, r.content, r.resource_type, r.view_count]
      );
      console.log('Added resource:', r.title);
    }

    // Update merchant descriptions
    await pool.query("UPDATE merchants SET description='专业社区服务商，深耕社区服务领域10年，服务超过500个社区。专注社区体育赛事、健康讲座、便民服务等。' WHERE id = ?", [m1.id]);
    await pool.query("UPDATE merchants SET description='便民服务连锁品牌，覆盖武汉市100+社区，每周定期开展便民服务日活动。提供家电维修、清洗、小商品服务等。' WHERE id = ?", [m2.id]);
    await pool.query("UPDATE merchants SET description='社区文化活动服务商，专业策划执行各类社区文化活动、节庆庆典、艺术培训等，丰富社区居民精神文化生活。' WHERE id = ?", [m3.id]);

    console.log('Seed completed!');
    await pool.end();
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

seed();
