const mysql = require('mysql2/promise');

async function insertFaqs() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'linmeng'
  });

  const faqs = [
    {id: 1, question: '社区发布需求需要什么条件？', answer: '社区账号完成认证后即可免费发布需求。建议详细填写需求类型、活动内容、目标人群等信息，便于精准匹配。', keywords: '发布需求,发布,发布需求条件', hits: 0, enabled: true},
    {id: 2, question: '商家入驻需要哪些资料？', answer: '商家入驻需要提供营业执照、法人信息、商家简介等资料。审核通过后即可发布资源。', keywords: '入驻,商家入驻,注册,开店', hits: 0, enabled: true},
    {id: 3, question: '撮合成功后奖励如何发放？', answer: '当社区与商家双方确认合作意向后，平台将自动记录撮合信息。奖励以物资形式发放给社区。', keywords: '奖励发放,奖励怎么发,撮合奖励', hits: 0, enabled: true},
    {id: 4, question: '金牌会员有什么特权？', answer: '金牌会员可查看商家详细联系方式、参与撮合奖励计划、获得优先匹配推荐等。', keywords: '金牌特权,金牌权益,会员特权', hits: 0, enabled: true},
    {id: 5, question: '资源发布后多久能收到反馈？', answer: '资源发布后会即时进入匹配系统。建议完善资源描述和目标人群，可提高匹配效率和曝光度。', keywords: '反馈,多久,什么时候', hits: 0, enabled: true}
  ];

  const faqsJson = JSON.stringify(faqs);
  await pool.execute(
    "INSERT INTO sys_configs (config_key, config_value, config_type, description) VALUES ('service_faqs', ?, 'service', '智能客服FAQ') ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)",
    [faqsJson]
  );
  console.log('FAQ插入成功');

  const [rows] = await pool.execute("SELECT config_key FROM sys_configs WHERE config_key = 'service_faqs'");
  console.log('验证结果:', rows);

  await pool.end();
}

insertFaqs().catch(console.error);
