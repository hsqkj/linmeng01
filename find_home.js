var fs = require('fs');
var dir = 'D:/WorkBuddy/20260331205655/client/dist/assets';
fs.readdirSync(dir).filter(function(f){return f.startsWith('Home-')}).forEach(function(f){
  var c = fs.readFileSync(dir+'/'+f,'utf8');
  console.log(f, c.includes('real_name') ? 'HAS real_name' : 'no');
});
