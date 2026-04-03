=== 邻盟平台全面测试开始 ===
时间: 2026/4/3 01:44:08

========== 首页测试 ==========
  ✅ Loaded: http://localhost:5173/

=== 社区 登录页 ===
  ✅ Loaded: http://localhost:5173/community/login
  页面标题: 邻盟 - 社区资源智能匹配助手
  输入框: 0 个, 按钮: 0 个
  包含"登录": false, 包含"邻盟": false

=== 商家 登录页 ===
  ✅ Loaded: http://localhost:5173/merchant/login
  页面标题: 邻盟 - 社区资源智能匹配助手
  输入框: 0 个, 按钮: 0 个
  包含"登录": false, 包含"邻盟": false

=== 招商大使 登录页 ===
  ✅ Loaded: http://localhost:5173/ambassador/login
  页面标题: 邻盟 - 社区资源智能匹配助手
  输入框: 0 个, 按钮: 0 个
  包含"登录": false, 包含"邻盟": false

=== 管理后台 登录页 ===
  ✅ Loaded: http://localhost:5173/admin/login
  页面标题: 邻盟 - 社区资源智能匹配助手
  输入框: 2 个, 按钮: 1 个
  包含"登录": true, 包含"邻盟": true

========== 社区端测试 ==========

=== 社区 登录测试 ===
  ✅ Loaded: http://localhost:5173/community/login
  ✅ Loaded: http://localhost:5173/community/home
[ERROR] Console Error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  ✅ Loaded: http://localhost:5173/community/demands
[ERROR] Console Error: Failed to load resource: the server responded with a status of 500 (Internal Server Error)
  ✅ Loaded: http://localhost:5173/community/resources
  ✅ Loaded: http://localhost:5173/community/messages
[ERROR] Console Error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  ✅ Loaded: http://localhost:5173/community/profile

========== 商家端测试 ==========

=== 商家 登录测试 ===
  ✅ Loaded: http://localhost:5173/merchant/login
  ✅ Loaded: http://localhost:5173/merchant/home
[ERROR] Console Error: Failed to load resource: the server responded with a status of 500 (Internal Server Error)
[WARN] Failed request: net::ERR_ABORTED - http://localhost:5173/src/views/merchant/Demands.vue
[ERROR] Console Error: TypeError: Failed to fetch dynamically imported module: http://localhost:5173/src/views/merchant/Demands.vue
  ✅ Loaded: http://localhost:5173/merchant/demands
[ERROR] Console Error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  ✅ Loaded: http://localhost:5173/merchant/resources
[ERROR] Console Error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  ✅ Loaded: http://localhost:5173/merchant/messages
[ERROR] Console Error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  ✅ Loaded: http://localhost:5173/merchant/profile
  ✅ Loaded: http://localhost:5173/merchant/publish

========== 招商大使端测试 ==========

=== 招商大使 登录测试 ===
  ✅ Loaded: http://localhost:5173/ambassador/login
  ✅ Loaded: http://localhost:5173/ambassador/home
  ✅ Loaded: http://localhost:5173/ambassador/demands
  ✅ Loaded: http://localhost:5173/ambassador/resources
  ✅ Loaded: http://localhost:5173/ambassador/profile

========== 管理后台测试 ==========
  ✅ Loaded: http://localhost:5173/admin/login
  ✅ Loaded: http://localhost:5173/admin/home
[ERROR] Console Error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
[ERROR] Console Error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
[WARN] Failed request: net::ERR_ABORTED - http://localhost:5173/admin/login
[WARN] Failed request: net::ERR_ABORTED - https://ui-avatars.com/api/?name=%E8%B6%85%E7%BA%A7%E7%AE%A1%E7%90%86%E5%91%98&background=409EFF&color=fff
[WARN] Failed request: net::ERR_ABORTED - https://ui-avatars.com/api/?name=%E8%B6%85%E7%AE%A1&background=409EFF&color=fff
  ✅ Loaded: http://localhost:5173/admin/users/community
[ERROR] Console Error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
[WARN] Failed request: net::ERR_ABORTED - https://ui-avatars.com/api/?name=%E8%B6%85%E7%BA%A7%E7%AE%A1%E7%90%86%E5%91%98&background=409EFF&color=fff
[WARN] Failed request: net::ERR_ABORTED - https://ui-avatars.com/api/?name=%E8%B6%85%E7%AE%A1&background=409EFF&color=fff
  ✅ Loaded: http://localhost:5173/admin/users/merchant
[ERROR] Console Error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
[WARN] Failed request: net::ERR_ABORTED - https://ui-avatars.com/api/?name=%E8%B6%85%E7%AE%A1&background=409EFF&color=fff
[WARN] Failed request: net::ERR_ABORTED - https://ui-avatars.com/api/?name=%E8%B6%85%E7%BA%A7%E7%AE%A1%E7%90%86%E5%91%98&background=409EFF&color=fff
  ✅ Loaded: http://localhost:5173/admin/users/ambassador
[ERROR] Console Error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
[ERROR] Console Error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
[WARN] Failed request: net::ERR_ABORTED - http://localhost:5173/admin/login
[WARN] Failed request: net::ERR_ABORTED - https://ui-avatars.com/api/?name=%E8%B6%85%E7%BA%A7%E7%AE%A1%E7%90%86%E5%91%98&background=409EFF&color=fff
[WARN] Failed request: net::ERR_ABORTED - https://ui-avatars.com/api/?name=%E8%B6%85%E7%AE%A1&background=409EFF&color=fff
  ✅ Loaded: http://localhost:5173/admin/config/basic
[ERROR] Console Error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
[WARN] Failed request: net::ERR_ABORTED - https://ui-avatars.com/api/?name=%E8%B6%85%E7%BA%A7%E7%AE%A1%E7%90%86%E5%91%98&background=409EFF&color=fff
[WARN] Failed request: net::ERR_ABORTED - https://ui-avatars.com/api/?name=%E8%B6%85%E7%AE%A1&background=409EFF&color=fff
  ✅ Loaded: http://localhost:5173/admin/config/banner
  ✅ Loaded: http://localhost:5173/admin/config/tag
[WARN] Console Warning: ElementPlusError: [el-checkbox] [API] label act as value is about to be deprecated in version 3.0.0, please use value instead.
For more detail, please visit: https://element-plus.org/en-US/component/checkbox.html

    at debugWarn (http://localhost:5173/node_modules/.vite/deps/element-plus.js?v=1e2222ae:9111:37)
    at watch.immediate (http://localhost:5173/node_modules/.vite/deps/element-plus.js?v=1e2222ae:10133:7)
    at callWithErrorHandling (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:2370:19)
    at callWithAsyncErrorHandling (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:2377:17)
    at baseWatchOptions.call (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:3066:47)
    at job (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:2097:18)
    at watch (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:2133:7)
    at doWatch (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:3094:23)
    at watch2 (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:3026:10)
    at useDeprecated (http://localhost:5173/node_modules/.vite/deps/element-plus.js?v=1e2222ae:10131:3)
[WARN] Console Warning: ElementPlusError: [el-checkbox] [API] label act as value is about to be deprecated in version 3.0.0, please use value instead.
For more detail, please visit: https://element-plus.org/en-US/component/checkbox.html

    at debugWarn (http://localhost:5173/node_modules/.vite/deps/element-plus.js?v=1e2222ae:9111:37)
    at watch.immediate (http://localhost:5173/node_modules/.vite/deps/element-plus.js?v=1e2222ae:10133:7)
    at callWithErrorHandling (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:2370:19)
    at callWithAsyncErrorHandling (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:2377:17)
    at baseWatchOptions.call (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:3066:47)
    at job (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:2097:18)
    at watch (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:2133:7)
    at doWatch (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:3094:23)
    at watch2 (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:3026:10)
    at useDeprecated (http://localhost:5173/node_modules/.vite/deps/element-plus.js?v=1e2222ae:10131:3)
[WARN] Console Warning: ElementPlusError: [el-checkbox] [API] label act as value is about to be deprecated in version 3.0.0, please use value instead.
For more detail, please visit: https://element-plus.org/en-US/component/checkbox.html

    at debugWarn (http://localhost:5173/node_modules/.vite/deps/element-plus.js?v=1e2222ae:9111:37)
    at watch.immediate (http://localhost:5173/node_modules/.vite/deps/element-plus.js?v=1e2222ae:10133:7)
    at callWithErrorHandling (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:2370:19)
    at callWithAsyncErrorHandling (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:2377:17)
    at baseWatchOptions.call (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:3066:47)
    at job (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:2097:18)
    at watch (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:2133:7)
    at doWatch (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:3094:23)
    at watch2 (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:3026:10)
    at useDeprecated (http://localhost:5173/node_modules/.vite/deps/element-plus.js?v=1e2222ae:10131:3)
[WARN] Console Warning: ElementPlusError: [el-checkbox] [API] label act as value is about to be deprecated in version 3.0.0, please use value instead.
For more detail, please visit: https://element-plus.org/en-US/component/checkbox.html

    at debugWarn (http://localhost:5173/node_modules/.vite/deps/element-plus.js?v=1e2222ae:9111:37)
    at watch.immediate (http://localhost:5173/node_modules/.vite/deps/element-plus.js?v=1e2222ae:10133:7)
    at callWithErrorHandling (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:2370:19)
    at callWithAsyncErrorHandling (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:2377:17)
    at baseWatchOptions.call (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:3066:47)
    at job (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:2097:18)
    at watch (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:2133:7)
    at doWatch (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:3094:23)
    at watch2 (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:3026:10)
    at useDeprecated (http://localhost:5173/node_modules/.vite/deps/element-plus.js?v=1e2222ae:10131:3)
[ERROR] Console Error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
[WARN] Failed request: net::ERR_ABORTED - https://ui-avatars.com/api/?name=%E8%B6%85%E7%AE%A1&background=409EFF&color=fff
[WARN] Failed request: net::ERR_ABORTED - https://ui-avatars.com/api/?name=%E8%B6%85%E7%BA%A7%E7%AE%A1%E7%90%86%E5%91%98&background=409EFF&color=fff
  ✅ Loaded: http://localhost:5173/admin/config/member
[ERROR] Console Error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
[WARN] Failed request: net::ERR_ABORTED - https://ui-avatars.com/api/?name=%E8%B6%85%E7%BA%A7%E7%AE%A1%E7%90%86%E5%91%98&background=409EFF&color=fff
[WARN] Failed request: net::ERR_ABORTED - https://ui-avatars.com/api/?name=%E8%B6%85%E7%AE%A1&background=409EFF&color=fff
  ✅ Loaded: http://localhost:5173/admin/config/rating
[WARN] Console Warning: ElementPlusError: [el-radio] [API] label act as value is about to be deprecated in version 3.0.0, please use value instead.
For more detail, please visit: https://element-plus.org/en-US/component/radio.html

    at debugWarn (http://localhost:5173/node_modules/.vite/deps/element-plus.js?v=1e2222ae:9111:37)
    at watch.immediate (http://localhost:5173/node_modules/.vite/deps/element-plus.js?v=1e2222ae:10133:7)
    at callWithErrorHandling (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:2370:19)
    at callWithAsyncErrorHandling (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:2377:17)
    at baseWatchOptions.call (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:3066:47)
    at job (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:2097:18)
    at watch (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:2133:7)
    at doWatch (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:3094:23)
    at watch2 (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:3026:10)
    at useDeprecated (http://localhost:5173/node_modules/.vite/deps/element-plus.js?v=1e2222ae:10131:3)
[WARN] Console Warning: ElementPlusError: [el-radio] [API] label act as value is about to be deprecated in version 3.0.0, please use value instead.
For more detail, please visit: https://element-plus.org/en-US/component/radio.html

    at debugWarn (http://localhost:5173/node_modules/.vite/deps/element-plus.js?v=1e2222ae:9111:37)
    at watch.immediate (http://localhost:5173/node_modules/.vite/deps/element-plus.js?v=1e2222ae:10133:7)
    at callWithErrorHandling (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:2370:19)
    at callWithAsyncErrorHandling (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:2377:17)
    at baseWatchOptions.call (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:3066:47)
    at job (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:2097:18)
    at watch (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:2133:7)
    at doWatch (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:3094:23)
    at watch2 (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:3026:10)
    at useDeprecated (http://localhost:5173/node_modules/.vite/deps/element-plus.js?v=1e2222ae:10131:3)
[WARN] Console Warning: ElementPlusError: [el-radio] [API] label act as value is about to be deprecated in version 3.0.0, please use value instead.
For more detail, please visit: https://element-plus.org/en-US/component/radio.html

    at debugWarn (http://localhost:5173/node_modules/.vite/deps/element-plus.js?v=1e2222ae:9111:37)
    at watch.immediate (http://localhost:5173/node_modules/.vite/deps/element-plus.js?v=1e2222ae:10133:7)
    at callWithErrorHandling (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:2370:19)
    at callWithAsyncErrorHandling (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:2377:17)
    at baseWatchOptions.call (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:3066:47)
    at job (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:2097:18)
    at watch (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:2133:7)
    at doWatch (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:3094:23)
    at watch2 (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:3026:10)
    at useDeprecated (http://localhost:5173/node_modules/.vite/deps/element-plus.js?v=1e2222ae:10131:3)
[WARN] Console Warning: ElementPlusError: [el-radio] [API] label act as value is about to be deprecated in version 3.0.0, please use value instead.
For more detail, please visit: https://element-plus.org/en-US/component/radio.html

    at debugWarn (http://localhost:5173/node_modules/.vite/deps/element-plus.js?v=1e2222ae:9111:37)
    at watch.immediate (http://localhost:5173/node_modules/.vite/deps/element-plus.js?v=1e2222ae:10133:7)
    at callWithErrorHandling (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:2370:19)
    at callWithAsyncErrorHandling (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:2377:17)
    at baseWatchOptions.call (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:3066:47)
    at job (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:2097:18)
    at watch (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:2133:7)
    at doWatch (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:3094:23)
    at watch2 (http://localhost:5173/node_modules/.vite/deps/chunk-H5K7BSWS.js?v=1e2222ae:3026:10)
    at useDeprecated (http://localhost:5173/node_modules/.vite/deps/element-plus.js?v=1e2222ae:10131:3)
[ERROR] Console Error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
[WARN] Failed request: net::ERR_ABORTED - https://ui-avatars.com/api/?name=%E8%B6%85%E7%AE%A1&background=409EFF&color=fff
[WARN] Failed request: net::ERR_ABORTED - https://ui-avatars.com/api/?name=%E8%B6%85%E7%BA%A7%E7%AE%A1%E7%90%86%E5%91%98&background=409EFF&color=fff
  ✅ Loaded: http://localhost:5173/admin/config/algorithm
  ✅ Loaded: http://localhost:5173/admin/notification

========== 测试完成 ==========
总错误数: 18
总警告数: 27