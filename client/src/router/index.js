import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  // 角色选择页
  {
    path: '/',
    name: 'RoleSelect',
    component: () => import('@/views/RoleSelect.vue')
  },
  // 社区端
  {
    path: '/legal/terms',
    name: 'Terms',
    component: () => import('@/views/legal/Terms.vue')
  },
  {
    path: '/legal/privacy',
    name: 'Privacy',
    component: () => import('@/views/legal/Privacy.vue')
  },
  {
    path: '/login/community',
    name: 'CommunityLogin',
    component: () => import('@/views/community/Login.vue')
  },
  {
    path: '/register/community',
    name: 'CommunityRegister',
    component: () => import('@/views/community/Register.vue')
  },
  {
    path: '/community',
    name: 'CommunityLayout',
    component: () => import('@/layouts/CommunityLayout.vue'),
    children: [
      { path: '', name: 'CommunityHome', component: () => import('@/views/community/Home.vue') },
      { path: 'demands', name: 'CommunityDemands', component: () => import('@/views/community/Demands.vue') },
      { path: 'demands/publish', name: 'PublishDemand', component: () => import('@/views/community/PublishDemand.vue') },
      { path: 'demands/batch', name: 'BatchImport', component: () => import('@/views/community/BatchImport.vue') },
      { path: 'demands/:id', name: 'CommunityDemandDetail', component: () => import('@/views/community/DemandDetail.vue') },
      { path: 'resources', name: 'CommunityResources', component: () => import('@/views/community/Resources.vue') },
      { path: 'resources/:id', name: 'CommunityResourceDetail', component: () => import('@/views/community/ResourceDetail.vue') },
      { path: 'merchants/:id', name: 'MerchantDetail', component: () => import('@/views/community/MerchantDetail.vue') },
      { path: 'profile', name: 'CommunityProfile', component: () => import('@/views/community/Profile.vue') },
      { path: 'messages', name: 'CommunityMessages', component: () => import('@/views/community/Messages.vue') },
      { path: 'rewards', name: 'CommunityRewards', component: () => import('@/views/community/Rewards.vue') }
    ]
  },
  // 商家端
  {
    path: '/login/merchant',
    name: 'MerchantLogin',
    component: () => import('@/views/merchant/Login.vue')
  },
  {
    path: '/register/merchant',
    name: 'MerchantRegister',
    component: () => import('@/views/merchant/Register.vue')
  },
  {
    path: '/merchant',
    name: 'MerchantLayout',
    component: () => import('@/layouts/MerchantLayout.vue'),
    children: [
      { path: '', name: 'MerchantHome', component: () => import('@/views/merchant/Home.vue') },
      { path: 'resources', name: 'MerchantResources', component: () => import('@/views/merchant/Resources.vue') },
      { path: 'resources/:id', name: 'ResourceDetail', component: () => import('@/views/merchant/ResourceDetail.vue') },
      { path: 'resources/publish', name: 'PublishResource', component: () => import('@/views/merchant/PublishResource.vue') },
      { path: 'demands', name: 'MerchantDemands', component: () => import('@/views/merchant/Demands.vue') },
      { path: 'demands/:id', name: 'DemandDetail', component: () => import('@/views/merchant/DemandDetail.vue') },
      { path: 'profile', name: 'MerchantProfile', component: () => import('@/views/merchant/Profile.vue') },
      { path: 'member', name: 'MerchantMember', component: () => import('@/views/merchant/Member.vue') },
      { path: 'messages', name: 'MerchantMessages', component: () => import('@/views/merchant/Messages.vue') }
    ]
  },
  // 招商大使端
  {
    path: '/login/ambassador',
    name: 'AmbassadorLogin',
    component: () => import('@/views/ambassador/Login.vue')
  },
  {
    path: '/ambassador',
    name: 'AmbassadorLayout',
    component: () => import('@/layouts/AmbassadorLayout.vue'),
    children: [
      { path: '', name: 'AmbassadorHome', component: () => import('@/views/ambassador/Home.vue') },
      { path: 'qrcode', name: 'AmbassadorQRCode', component: () => import('@/views/ambassador/QRCode.vue') },
      { path: 'records', name: 'AmbassadorRecords', component: () => import('@/views/ambassador/Records.vue') },
      { path: 'commission', name: 'AmbassadorCommission', component: () => import('@/views/ambassador/Commission.vue') },
      { path: 'withdraw', name: 'AmbassadorWithdraw', component: () => import('@/views/ambassador/Withdraw.vue') }
    ]
  },
  // 管理后台
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('@/views/admin/Login.vue')
  },
  {
    path: '/admin',
    name: 'AdminLayout',
    component: () => import('@/layouts/AdminLayout.vue'),
    children: [
      { path: '', name: 'AdminDashboard', component: () => import('@/views/admin/Dashboard.vue') },
      { path: 'users/community', name: 'AdminCommunityUsers', component: () => import('@/views/admin/UsersCommunity.vue') },
      { path: 'users/merchant', name: 'AdminMerchantUsers', component: () => import('@/views/admin/UsersMerchant.vue') },
      { path: 'users/ambassador', name: 'AdminAmbassadorUsers', component: () => import('@/views/admin/UsersAmbassador.vue') },
      { path: 'audit/demands', name: 'AdminAuditDemands', component: () => import('@/views/admin/AuditDemands.vue') },
      { path: 'audit/resources', name: 'AdminAuditResources', component: () => import('@/views/admin/AuditResources.vue') },
      { path: 'matching', name: 'AdminMatching', component: () => import('@/views/admin/Matching.vue') },
      { path: 'notifications', name: 'AdminNotifications', component: () => import('@/views/admin/Notifications.vue') },
      { path: 'comments', name: 'AdminComments', component: () => import('@/views/admin/Comments.vue') },
      { path: 'finance', name: 'AdminFinance', component: () => import('@/views/admin/Finance.vue') },
      { path: 'config/basic', name: 'AdminConfigBasic', component: () => import('@/views/admin/ConfigBasic.vue') },
      { path: 'config/member', name: 'AdminConfigMember', component: () => import('@/views/admin/ConfigMember.vue') },
      { path: 'config/rating', name: 'AdminConfigRating', component: () => import('@/views/admin/ConfigRating.vue') },
      { path: 'config/tags', name: 'AdminConfigTags', component: () => import('@/views/admin/ConfigTags.vue') },
      { path: 'config/banner', name: 'AdminConfigBanner', component: () => import('@/views/admin/ConfigBanner.vue') },
      { path: 'config/algorithm', name: 'AdminConfigAlgorithm', component: () => import('@/views/admin/ConfigAlgorithm.vue') },
      { path: 'config/ambassador', name: 'AdminConfigAmbassador', component: () => import('@/views/admin/ConfigAmbassador.vue') },
      { path: 'config/admin', name: 'AdminConfigAdmin', component: () => import('@/views/admin/ConfigAdmin.vue') }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
