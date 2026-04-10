const mysql = require("mysql2");
const c = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "linmeng"
});
c.connect();

const config = {
  firstRate: 30,
  renewRate: 10,
  minWithdraw: 100,
  settlePeriod: "monthly",
  arrivalDays: 3,
  maxPerOrder: 0,
  expirePolicy: "keep_first",
  remark: "招商大使提成政策：成功邀请商家入驻并完成付费后，首次入会按年费的30%结算提成；商家每年续费后，按续费金额的10%追加提成。提成每月1日统一结算，最低提现100元，3个工作日内到账。",
  level_commissions: [
    {level:1, name:"普通会员", fee:0, first_rate:0, renew_rate:0},
    {level:2, name:"银牌会员", fee:999, first_rate:20, renew_rate:10},
    {level:3, name:"金牌会员", fee:2999, first_rate:20, renew_rate:10},
    {level:4, name:"铂金会员", fee:5999, first_rate:20, renew_rate:10},
    {level:5, name:"钻石会员", fee:12000, first_rate:20, renew_rate:10}
  ]
};

const json = JSON.stringify(config);

c.query("DELETE FROM sys_configs WHERE config_key=?", ["ambassador_commission"], (e,r) => {
  c.query("INSERT INTO sys_configs (config_key, config_value, config_type) VALUES (?, ?, ?)",
    ["ambassador_commission", json, "ambassador"],
    (e2, r2) => {
      console.log("Config fixed!");
      // Verify
      c.query("SELECT LEFT(config_value, 50) FROM sys_configs WHERE config_key=?", ["ambassador_commission"], (e3, r3) => {
        if (r3.length) {
          console.log("Verify:", r3[0][Object.keys(r3[0])[0]]);
        }
        c.end();
      });
    }
  );
});
