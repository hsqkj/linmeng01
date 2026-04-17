const fs = require('fs');

async function testUpload() {
  const fileContent = fs.readFileSync('D:/test_real.png');
  
  const formData = new FormData();
  formData.append('image', new Blob([fileContent]), {
    filename: 'test.png',
    type: 'image/png'
  });

  try {
    console.log('Testing /api/public/upload-native with fetch...');
    const response = await fetch('http://localhost:3000/api/public/upload-native', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Body:', JSON.stringify(data));
  } catch (e) {
    console.error('Error:', e);
  }
}

testUpload();
