=== 邻盟平台全面测试 2026/4/3 02:24:04 ===

===== 社区 端 =====
  登录后URL: http://localhost:5173/community/login
  ⚠️ /community/home (0 errors)
  ⚠️ /community/demands (1 errors)
      → 401 /api/community/my/demands?page=1&pageSize=10
  ⚠️ /community/resources (1 errors)
      → 500 /api/community/resources?page=1&pageSize=9&sort=match
  ✅ /community/messages (0 errors)
  ⚠️ /community/profile (1 errors)
      → 401 /api/community/profile

===== 商家 端 =====
  登录后URL: http://localhost:5173/merchant/login
  ⚠️ /merchant/home (0 errors)
  ✅ /merchant/demands (0 errors)
  ⚠️ /merchant/resources (1 errors)
      → 401 /api/merchant/my/resources?page=1&pageSize=10
  ⚠️ /merchant/messages (1 errors)
      → 401 /api/merchant/my/intentions?page=1&pageSize=10
  ⚠️ /merchant/profile (1 errors)
      → 401 /api/merchant/profile
  ⚠️ /merchant/publish (0 errors)

===== 招商大使 端 =====
  登录后URL: http://localhost:5173/ambassador/login
  ⚠️ /ambassador/home (0 errors)
  ⚠️ /ambassador/demands (0 errors)
  ⚠️ /ambassador/resources (0 errors)
  ⚠️ /ambassador/profile (0 errors)

===== 管理后台 端 =====
  登录后URL: http://localhost:5173/admin
  ⚠️ /admin/home (0 errors)
  ✅ /admin/users/community (0 errors)
  ✅ /admin/users/merchant (0 errors)
  ✅ /admin/users/ambassador (0 errors)
  ✅ /admin/config/basic (0 errors)
  ⚠️ /admin/config/banner (4 errors)
      → 404 /banners/banner1.jpg
      → 404 /banners/banner2.jpg
      → 404 /banners/banner3.jpg
      → 404 /banners/banner4.jpg
  ⚠️ /admin/config/tag (0 errors)
  ✅ /admin/config/member (0 errors)
  ✅ /admin/config/rating (0 errors)
  ✅ /admin/config/algorithm (0 errors)
  ⚠️ /admin/notification (0 errors)

========== 测试完成 ==========
总 HTTP 错误数: 10