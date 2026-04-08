// 为现有大使生成渠道码
const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

async function updateAmbassadorCodes() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'linmeng'
  });

  // 查询现有大使
  const [rows] = await pool.query('SELECT id, username, qr_code FROM ambassadors');
  console.log('Total ambassadors:', rows.length);

  for (const amb of rows) {
    if (!amb.qr_code) {
      // 生成唯一渠道码
      const qrCode = 'AMB' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
      await pool.query('UPDATE ambassadors SET qr_code = ? WHERE id = ?', [qrCode, amb.id]);
      console.log(`Generated QR code for ${amb.username}: ${qrCode}`);
    } else {
      console.log(`Ambassador ${amb.username} already has QR code: ${amb.qr_code}`);
    }
  }

  await pool.end();
  console.log('Done!');
}

updateAmbassadorCodes().catch(console.error);
