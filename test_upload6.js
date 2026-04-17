const fs = require('fs');
const axios = require('./server/node_modules/axios');

async function testUpload() {
  try {
    console.log('Testing /api/upload/single with axios...');
    const formData = new FormData();
    formData.append('file', fs.createReadStream('D:/test_real.png'), {
      filename: 'test.png',
      contentType: 'image/png'
    });
    
    const response = await axios.default.post(
      'http://localhost:3000/api/upload/single',
      formData,
      { headers: formData.getHeaders() }
    );
    
    console.log('Status:', response.status);
    console.log('Body:', JSON.stringify(response.data));
  } catch (e) {
    console.error('Error:', e.response?.status, e.response?.data);
  }
}

testUpload();
