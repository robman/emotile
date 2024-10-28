import process from 'node:process';
import path from 'node:path';
import url from 'node:url';
import mime from 'mime';
import http from 'http';
import fs from 'node:fs';

// usage: node server.js $ip $port
//        $ip and $port are optional

let ip = process.argv[2] || '127.0.0.1',
    port = process.argv[3] || '8080',
    server_dir = path.dirname(url.fileURLToPath(new URL(import.meta.url)));

class http_server {

  constructor(io={}) {
    let self = this; 

    self.fs = fs;
    self.process = process;
    self.mime = mime;
    self.http = http;

    if (!io.server_dir) {
      console.error('server_dir required by http_server'); 
      self.process.exit(1);
    } else {
      self.server_dir = io.server_dir;
    }
    self.html_dir = `${self.server_dir}/public`;

    self.ip = io.ip || '127.0.0.1';
    self.port = io.port || '80'; 

    self.server = self.http.createServer(
      {}, 
      (request, response) => { self.request_handler(request, response); }
    );

    self.server.listen(
      self.port, self.ip, function() {
        self.log_comment(`http server listening (port ${self.port})`);
      }
    );

    return self;
  }

  request_handler(request, response) {
    let self = this;
    response.log = `${request.method} http://${request.headers.host}${request.url} from ${request.socket.remoteAddress} - ${request.headers['user-agent']}`;
    return self.respond_with_file(request, response);
  }

  respond_with_file(request, response) {
    let self = this;

    let path = `${self.html_dir}${request.url}`;
    if (request.url == '/') { path = `${self.html_dir}/app.html`; }

    if (self.fs.existsSync(path)) {
      let mime_type = self.mime.getType(path);
      if (mime_type) { response.setHeader("Content-Type", mime_type); }

      let type = undefined;
      if (request.url.match(/\.(html|js|css|json)/)) { type = 'utf8'; }

      self.fs.readFile(path, type, function(error, data) {
        if (error) {
          log_error(error, response);
          self.response_end(request, response, '', 404);
        } else {
          self.response_end(request, response, data);
        }
      });
    } else {
      self.response_end(request, response, '', 404);
    }
  }

  response_end = function(request, response, data='', code=200) {
    let self = this;
    self.log_comment(`${code} ${response.log}`);
    response.statusCode = code;
    response.end(data);
  }

  log_error = function(error, response) {
    let self = this;
    if (error !== 'Connection closed' && error !== undefined) {
      self.log_comment(`ERROR ${response.log} - ${error}`);
    }
  }

  log_comment = function(comment) {
    let self = this;
    console.log((new Date())+' '+comment);
  }

}

new http_server({
  server_dir:server_dir,
  ip:ip,
  port:port,
});

