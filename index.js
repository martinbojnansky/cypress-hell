const http = require('http')
const fs = require('fs')

const server = http.createServer((req, res) => {
	res.writeHead(200, { 'content-type': 'text/html' })
	fs.createReadStream('index.html').pipe(res);
})

server.listen(3000);

console.log(`Cypress-Hell demo app is now running on port 3000.`);