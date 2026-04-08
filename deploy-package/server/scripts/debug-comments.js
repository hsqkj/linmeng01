require('dotenv').config({ path: '.env' })
const mysql = require('mysql2/promise')

async function test() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  })

  // Test demand comments query (from communityController)
  console.log('=== Testing demand comments query ===')
  const [dRows] = await pool.query(
    `SELECT c.*, 
     (SELECT company_name FROM merchants WHERE id = c.user_id AND c.user_type = 2) as user_name,
     (SELECT logo FROM merchants WHERE id = c.user_id AND c.user_type = 2) as user_logo
     FROM comments c
     WHERE c.demand_id = ? AND c.status = 1 AND c.parent_id = 0
     ORDER BY c.created_at DESC`,
    [1]
  )
  console.log('Demand comments:', JSON.stringify(dRows))

  // Test resource comments query
  console.log('\n=== Testing resource comments query ===')
  const [rRows] = await pool.query(
    `SELECT c.id, c.content, c.created_at, c.user_type,
     (SELECT community_name FROM communities WHERE id = c.user_id AND c.user_type = 1) as user_name,
     (SELECT logo FROM communities WHERE id = c.user_id AND c.user_type = 1) as user_logo
     FROM comments c
     WHERE c.resource_id = ? AND c.status = 1 AND c.parent_id = 0
     ORDER BY c.created_at DESC`,
    [1]
  )
  console.log('Resource comments:', JSON.stringify(rRows))

  // Check the raw data in comments table
  console.log('\n=== All comments in DB ===')
  const [all] = await pool.query('SELECT * FROM comments')
  console.log(JSON.stringify(all))

  await pool.end()
}

test().catch(console.error)
