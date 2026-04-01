const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 模拟数据存储
const mockData = {
  communities: [],
  merchants: [],
  ambassadors: [],
  demands: [],
  resources: [],
  matches: [],
  messages: []
};

// 测试数据
const testData = {
  communities: [
    {
      id: 'comm_001',
      name: '阳光花园社区',
      district: '朝阳区',
      street: '望京街道',
      households: 2800,
      parentRatio: 40,
      elderlyRatio: 20,
      publicSpace: 3500,
      hasSquare: true,
      hasCommercial: true,
      hasSchool: true,
      hasPark: true,
      merchantCount: 120,
      logo: '/uploads/community1.jpg',
      description: '新建高品质社区，亲子家庭多，商业配套完善',
      tags: ['新建社区', '亲子社区', '商业密集']
    },
    {
      id: 'comm_002',
      name: '幸福里社区',
      district: '海淀区',
      street: '中关村街道',
      households: 1500,
      parentRatio: 25,
      elderlyRatio: 35,
      publicSpace: 1200,
      hasSquare: false,
      hasCommercial: false,
      hasSchool: true,
      hasPark: false,
      merchantCount: 45,
      logo: '/uploads/community2.jpg',
      description: '学区老社区，老年人口较多，文化氛围浓厚',
      tags: ['学区社区', '老龄化社区']
    },
    {
      id: 'comm_003',
      name: '翠竹苑社区',
      district: '西城区',
      street: '金融街街道',
      households: 3200,
      parentRatio: 30,
      elderlyRatio: 28,
      publicSpace: 2800,
      hasSquare: true,
      hasCommercial: true,
      hasSchool: false,
      hasPark: true,
      merchantCount: 200,
      logo: '/uploads/community3.jpg',
      description: '商圈核心社区，青年白领多，消费能力强',
      tags: ['商圈社区', '青年社区']
    }
  ],
  merchants: [
    {
      id: 'merch_001',
      name: '星巴克咖啡',
      type: '餐饮',
      logo: '/uploads/merchant1.jpg',
      resources: ['资金', '物资', '场地'],
      tags: ['连锁品牌', '高端品牌', '年轻化品牌'],
      level: 4
    },
    {
      id: 'merch_002',
      name: '新东方教育',
      type: '教育',
      logo: '/uploads/merchant2.jpg',
      resources: ['资金', '人力', '专业服务'],
      tags: ['连锁品牌', '亲子品牌', '长期合作'],
      level: 4
    },
    {
      id: 'merch_003',
      name: '京东健康',
      type: '医疗',
      logo: '/uploads/merchant3.jpg',
      resources: ['资金', '物资', '专业服务'],
      tags: ['上市公司', '公益导向', '全国服务'],
      level: 5
    },
    {
      id: 'merch_004',
      name: '华润万家',
      type: '零售',
      logo: '/uploads/merchant4.jpg',
      resources: ['资金', '物资', '媒体报道'],
      tags: ['连锁品牌', '大众品牌', '公益导向'],
      level: 3
    },
    {
      id: 'merch_005',
      name: '中国移动',
      type: '科技',
      logo: '/uploads/merchant5.jpg',
      resources: ['资金', '技术支持', '人力'],
      tags: ['上市公司', '全国服务', '长期合作'],
      level: 5
    },
    {
      id: 'merch_006',
      name: '平安保险',
      type: '金融',
      logo: '/uploads/merchant6.jpg',
      resources: ['资金', '专业服务', '专家'],
      tags: ['上市公司', '高端品牌', '社会责任'],
      level: 4
    }
  ],
  demands: [
    {
      id: 'demand_001',
      title: '六一儿童节亲子嘉年华',
      type: '活动赞助',
      targetGroups: ['青少年/儿童', '宝妈'],
      communityId: 'comm_001',
      sponsorTypes: ['资金', '物资', '人力', '媒体报道'],
      amountRange: '30000-50000',
      rewards: ['活动冠名权', '现场展台/展位', '网格群/小区业主群宣传', '荣誉证书', '媒体报道'],
      deadline: '2026-05-15',
      status: 'published',
      matchScore: 95
    },
    {
      id: 'demand_002',
      title: '社区健康义诊活动',
      type: '专家服务',
      targetGroups: ['中老年', '全体居民'],
      communityId: 'comm_002',
      sponsorTypes: ['专业服务', '物资'],
      expertType: '医疗',
      rewards: ['品牌露出', '宣传栏长期展示', '现场宣传横幅'],
      deadline: '2026-04-20',
      status: 'published',
      matchScore: 88
    },
    {
      id: 'demand_003',
      title: '社区广场周末市集',
      type: '空间运营',
      targetGroups: ['全体居民', '青年'],
      communityId: 'comm_003',
      sponsorTypes: ['资金', '运营支持'],
      rewards: ['场地使用权', '商户资源对接', '媒体报道'],
      deadline: '2026-04-30',
      status: 'published',
      matchScore: 82
    }
  ],
  resources: [
    {
      id: 'res_001',
      title: '咖啡文化节赞助',
      merchantId: 'merch_001',
      type: '资金赞助',
      content: '提供5万元活动资金，用于社区文化节',
      status: 'published',
      matchScore: 95
    },
    {
      id: 'res_002',
      title: '亲子教育讲座',
      merchantId: 'merch_002',
      type: '专业服务',
      content: '提供教育专家团队，开展亲子讲座',
      status: 'published',
      matchScore: 92
    },
    {
      id: 'res_003',
      title: '健康义诊服务',
      merchantId: 'merch_003',
      type: '专业服务',
      content: '提供医生团队、体检设备',
      status: 'published',
      matchScore: 88
    },
    {
      id: 'res_004',
      title: '节日物资捐赠',
      merchantId: 'merch_004',
      type: '物资提供',
      content: '提供米面油500份，价值3万元',
      status: 'published',
      matchScore: 85
    },
    {
      id: 'res_005',
      title: '智慧社区建设',
      merchantId: 'merch_005',
      type: '技术支持',
      content: '提供智能门禁、监控系统',
      status: 'published',
      matchScore: 80
    },
    {
      id: 'res_006',
      title: '金融知识普及',
      merchantId: 'merch_006',
      type: '专业服务',
      content: '提供理财专家、防诈骗讲座',
      status: 'published',
      matchScore: 78
    }
  ]
};

// 初始化测试数据
mockData.communities = testData.communities;
mockData.merchants = testData.merchants;
mockData.demands = testData.demands;
mockData.resources = testData.resources;

// API路由
// 获取社区列表
app.get('/api/communities', (req, res) => {
  res.json({ success: true, data: mockData.communities });
});

// 获取商家列表
app.get('/api/merchants', (req, res) => {
  res.json({ success: true, data: mockData.merchants });
});

// 获取需求列表
app.get('/api/demands', (req, res) => {
  res.json({ success: true, data: mockData.demands });
});

// 获取资源列表
app.get('/api/resources', (req, res) => {
  res.json({ success: true, data: mockData.resources });
});

// 获取匹配结果
app.get('/api/matches/demands', (req, res) => {
  const demands = mockData.demands.map(d => ({
    ...d,
    community: mockData.communities.find(c => c.id === d.communityId)
  })).sort((a, b) => b.matchScore - a.matchScore);
  res.json({ success: true, data: demands });
});

app.get('/api/matches/resources', (req, res) => {
  const resources = mockData.resources.map(r => ({
    ...r,
    merchant: mockData.merchants.find(m => m.id === r.merchantId)
  })).sort((a, b) => b.matchScore - a.matchScore);
  res.json({ success: true, data: resources });
});

// 登录（测试版自动通过）
app.post('/api/auth/login', (req, res) => {
  const { phone, role } = req.body;
  res.json({
    success: true,
    data: {
      token: 'mock_token_' + Date.now(),
      user: {
        id: 'user_' + Date.now(),
        phone,
        role,
        name: role === 'community' ? '张主任' : role === 'merchant' ? '李经理' : '王大使'
      }
    }
  });
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 邻盟服务器运行在 http://localhost:${PORT}`);
});
