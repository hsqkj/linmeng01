require('dotenv').config({ path: '.env' })
const CommunityController = require('../src/controllers/communityController')

// Mock request/response
const mockReq = { params: { id: '1' } }
const mockRes = {
  data: null,
  json(obj) {
    this.data = obj
    return this
  }
}

async function test() {
  console.log('Testing getResourceComments...')
  await CommunityController.getResourceComments(mockReq, mockRes)
  console.log('Result:', JSON.stringify(mockRes.data, null, 2))
}

test().catch(console.error)
