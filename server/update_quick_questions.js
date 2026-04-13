const mysql = require('mysql2/promise');

async function updateQuickQuestions() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'linmeng'
  });

  const questions = [
    {category: 'platform', questions: [
      {id: 1, text: '平台是什么？', sort: 1, enabled: true},
      {id: 2, text: '如何发布需求？', sort: 2, enabled: true},
      {id: 3, text: '如何发布资源？', sort: 3, enabled: true},
      {id: 4, text: '撮合奖励是什么？', sort: 4, enabled: true}
    ]},
    {category: 'member', questions: [
      {id: 5, text: '如何成为金牌会员？', sort: 1, enabled: true},
      {id: 6, text: '会员权益有哪些？', sort: 2, enabled: true},
      {id: 7, text: '如何升级会员？', sort: 3, enabled: true},
      {id: 8, text: '会员到期怎么办？', sort: 4, enabled: true}
    ]},
    {category: 'cooperation', questions: [
      {id: 9, text: '如何联系商家/社区？', sort: 1, enabled: true},
      {id: 10, text: '撮合成功的标准？', sort: 2, enabled: true},
      {id: 11, text: '招商大使是什么？', sort: 3, enabled: true},
      {id: 12, text: '如何成为大使？', sort: 4, enabled: true}
    ]},
    {category: 'common', questions: [
      {id: 13, text: '忘记密码怎么办？', sort: 1, enabled: true},
      {id: 14, text: '如何修改个人信息？', sort: 2, enabled: true},
      {id: 15, text: '如何取消会员？', sort: 3, enabled: true},
      {id: 16, text: '联系方式是多少？', sort: 4, enabled: true}
    ]}
  ];

  const questionsJson = JSON.stringify(questions);
  await pool.execute(
    "UPDATE sys_configs SET config_value = ? WHERE config_key = 'service_quick_questions'",
    [questionsJson]
  );
  console.log('快捷问题更新成功');

  await pool.end();
}

updateQuickQuestions().catch(console.error);
