const mysql = require('mysql2');
const fs = require('fs');

const c = mysql.createConnection({
  host: 'localhost', port: 3306,
  user: 'root', password: 'root', database: 'linmeng'
});

function esc(v) {
  if (v === null || v === undefined) return 'NULL';
  return "'" + String(v).replace(/'/g, "''") + "'";
}
function dt(d) {
  return "'" + d.toISOString().slice(0, 19).replace('T', ' ') + "'";
}

c.query('SELECT * FROM community_compounds', (e, rows) => {
  let sql = '-- community_compounds sync\n';
  sql += 'TRUNCATE TABLE community_compounds;\n';
  rows.forEach(r => {
    sql += `INSERT INTO community_compounds (id,community_id,name,households,sort_order,created_at,updated_at) VALUES (${r.id},${r.community_id},${esc(r.name)},${r.households},${r.sort_order},${dt(r.created_at)},${dt(r.updated_at)});\n`;
  });

  c.query('SELECT * FROM community_spaces', (e2, rows2) => {
    sql += '\n-- community_spaces sync\n';
    sql += 'TRUNCATE TABLE community_spaces;\n';
    rows2.forEach(r => {
      const facs = Array.isArray(r.facilities) ? JSON.stringify(r.facilities) : (r.facilities || '[]');
      const imgs = Array.isArray(r.images) ? JSON.stringify(r.images) : (r.images || '[]');
      sql += `INSERT INTO community_spaces (id,community_id,name,location_type,floor_number,area,capacity,facilities,custom_facilities,available_hours,images,description,sort_order,status,created_at,updated_at) VALUES (${r.id},${r.community_id},${esc(r.name)},${r.location_type},${r.floor_number === null ? 'NULL' : r.floor_number},${esc(r.area)},${r.capacity},${esc(facs)},${esc(r.custom_facilities || '')},${esc(r.available_hours || '')},${esc(imgs)},${esc(r.description || '')},${r.sort_order},${r.status},${dt(r.created_at)},${dt(r.updated_at)});\n`;
    });

    fs.writeFileSync('sync_compounds_spaces.sql', sql, 'utf8');
    console.log('SQL written: sync_compounds_spaces.sql');
    console.log('compounds:', rows.length, ' spaces:', rows2.length);
    c.end();
  });
});
