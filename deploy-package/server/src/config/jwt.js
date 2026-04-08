// JWT配置
module.exports = {
  secret: process.env.JWT_SECRET || 'linmeng_jwt_secret_key_2026',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
}
