=== 邻盟平台全面测试 2026/4/3 02:19:24 ===

===== 社区端 =====

--- 社区 login page: 0 inputs, 0 buttons ---
  ✅ /community/home
[ERROR] Console: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  ✅ /community/demands
[ERROR] Console: Failed to load resource: the server responded with a status of 500 (Internal Server Error)
  ✅ /community/resources
  ✅ /community/messages
[ERROR] Console: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  ✅ /community/profile

===== 商家端 =====

--- 商家 login page: 0 inputs, 0 buttons ---
  ✅ /merchant/home
  ✅ /merchant/demands
[ERROR] Console: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  ✅ /merchant/resources
[ERROR] Console: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  ✅ /merchant/messages
[ERROR] Console: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  ✅ /merchant/profile
  ✅ /merchant/publish

===== 招商大使端 =====

--- 招商大使 login page: 0 inputs, 0 buttons ---
  ✅ /ambassador/home
  ✅ /ambassador/demands
  ✅ /ambassador/resources
  ✅ /ambassador/profile

===== 管理后台 =====

--- 管理员 login page: 2 inputs, 1 buttons ---
  After login: http://localhost:5173/admin
  After admin login: http://localhost:5173/admin
  ✅ /admin/home
  ✅ /admin/users/community
  ✅ /admin/users/merchant
  ✅ /admin/users/ambassador
  ✅ /admin/config/basic
[ERROR] Console: Failed to load resource: the server responded with a status of 404 (Not Found)
[ERROR] Console: Failed to load resource: the server responded with a status of 404 (Not Found)
[ERROR] Console: Failed to load resource: the server responded with a status of 404 (Not Found)
[ERROR] Console: Failed to load resource: the server responded with a status of 404 (Not Found)
  ✅ /admin/config/banner
  ✅ /admin/config/tag
[WARN] ElementPlus: ElementPlusError: [el-checkbox] [API] label act as value is about to be deprecated in version 3.0.0, please use value instead.
For more detail, please visit: https://element-plus.org/en-US/component/c
[WARN] ElementPlus: ElementPlusError: [el-checkbox] [API] label act as value is about to be deprecated in version 3.0.0, please use value instead.
For more detail, please visit: https://element-plus.org/en-US/component/c
[WARN] ElementPlus: ElementPlusError: [el-checkbox] [API] label act as value is about to be deprecated in version 3.0.0, please use value instead.
For more detail, please visit: https://element-plus.org/en-US/component/c
[WARN] ElementPlus: ElementPlusError: [el-checkbox] [API] label act as value is about to be deprecated in version 3.0.0, please use value instead.
For more detail, please visit: https://element-plus.org/en-US/component/c
  ✅ /admin/config/member
  ✅ /admin/config/rating
[WARN] ElementPlus: ElementPlusError: [el-radio] [API] label act as value is about to be deprecated in version 3.0.0, please use value instead.
For more detail, please visit: https://element-plus.org/en-US/component/radi
[WARN] ElementPlus: ElementPlusError: [el-radio] [API] label act as value is about to be deprecated in version 3.0.0, please use value instead.
For more detail, please visit: https://element-plus.org/en-US/component/radi
[WARN] ElementPlus: ElementPlusError: [el-radio] [API] label act as value is about to be deprecated in version 3.0.0, please use value instead.
For more detail, please visit: https://element-plus.org/en-US/component/radi
[WARN] ElementPlus: ElementPlusError: [el-radio] [API] label act as value is about to be deprecated in version 3.0.0, please use value instead.
For more detail, please visit: https://element-plus.org/en-US/component/radi
  ✅ /admin/config/algorithm
  ✅ /admin/notification

===== 首页 =====

========== 测试完成 ==========
错误: 10, 警告: 8