import http from 'http';

http.get('http://localhost:5174/', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log("STATUS:", res.statusCode);
    console.log("HEADERS:", res.headers);
    console.log("DATA LENGTH:", data.length);
  });
}).on('error', (err) => {
  console.error("ERROR:", err.message);
});
