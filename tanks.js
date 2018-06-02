(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var canvas = document.getElementById('game');
    var backgroundCanvas = document.getElementById('background');

    var ws;

    var width = backgroundCanvas.width = canvas.width = window.innerWidth;
    var height = backgroundCanvas.height = canvas.height = window.innerHeight;
    var gravity = height / 10000000;
    var maxPower = height / 2000;
    var maxBombKnockback = height / 4000;

    var userMap = {};
    var particles = [];
    var lastTS = performance.now();

    generateBackground();
    requestAnimationFrame(function drawFrame() {
      var ctx = canvas.getContext('2d');
      var ctx2 = backgroundCanvas.getContext('2d');

      // clear canvas
      ctx.fillStyle = 'rgb(0,0,0)';
      ctx.fillRect(0, 0, width, height);

      // draw the background
      ctx.drawImage(backgroundCanvas, 0, 0, width, height);

      var currentTS = performance.now();
      var elapsed = Math.max(currentTS - lastTS, 20);

      // update particles
      for (var i = particles.length - 1; i >= 0; --i) {
        updateParticle(ctx, ctx2, particles, particles[i], elapsed);
      }

      for (i = particles.length - 1; i >= 0; --i) {
        drawParticle(ctx, particles[i]);
      }

      ctx.strokeStyle = 'black';
      var y = 15;
      ctx.strokeText('FPS: ' + Math.floor(1000 / elapsed), 10, y);
      ctx.strokeText('Commands: ', 10, y += 15);
      ctx.strokeText('!spawn', 10, y += 15);
      ctx.strokeText('!fire [angle] [power]', 10, y += 15);

      lastTS = currentTS;
      requestAnimationFrame(drawFrame);
    });

    function isMoving(particle) {
      return particle.dx !== 0 || particle.dy !== 0 || particle.ddx !== 0 || particle.ddy !== 0;
    }

    function moveParticle(ctx, particles, particle, elapsed) {
      var i;
      var l = Math.max(Math.abs(particle.dx * elapsed), Math.abs(particle.dy * elapsed));
      if (l === 0) {
        particle.dx += particle.ddx * elapsed;
        particle.dy += particle.ddy * elapsed;
        return false;
      }
      var data;
      var x = particle.x;
      var y = particle.y;
      var stopped = false;
      for (i = 0; i <= l; ++i) {
        x = particle.x + particle.dx * elapsed * (i / l);
        y = particle.y + particle.dy * elapsed * (i / l);
        if (!isInBounds(x, y)) {
          particles.splice(particles.indexOf(particle), 1);
          return false;
        }
        data = ctx.getImageData(x, y, 1, 1).data;
        if (!(data[0] === 255 && data[1] === 255 && data[2] === 255)) {
          stopped = true;
          break;
        }
      }
      particle.x = x;
      particle.y = y;
      if (stopped) {
        particle.dx = 0;
        particle.dy = 0;
        particle.ddx = 0;
        particle.ddy = 0;
      } else {
        particle.dx += particle.ddx * elapsed;
        particle.dy += particle.ddy * elapsed;
      }
      return stopped;
    }

    function isInBounds(x, y) {
      return x >= 0 && y >= 0 && x < width && y < height;
    }

    function updateParticle(ctx, ctx2, particles, particle, elapsed) {
      if (isMoving(particle)) {
        var stopped = moveParticle(ctx, particles, particle, elapsed);
        if (stopped && particle.type === 'bomb') {
          explodeBomb(ctx, ctx2, particles, particle);
        }
      } else {
        particle.ddy = gravity;
      }
    }

    function explodeBomb(ctx, ctx2, particles, bomb) {
      var radius = 30;
      var squaredRadius = radius * radius;
      var squaredDistance, i, l, particle, dx, dy;

      particles.splice(particles.indexOf(bomb), 1);

      ctx2.beginPath();
      ctx2.arc(bomb.x, bomb.y, radius, 0, 2 * Math.PI, false);
      ctx2.fillStyle = 'white';
      ctx2.fill();

      for (i = 0, l = particles.length; i < l; ++i) {
        particle = particles[i];
        dx = particle.x - bomb.x;
        dy = particle.y - bomb.y;
        squaredDistance = dx * dx + dy * dy;
        if (squaredDistance < squaredRadius) {
          particle.dx = (dx - radius) / radius * maxBombKnockback;
          particle.dy = (dy - radius) / radius * maxBombKnockback;
        }
      }
    }

    function drawParticle(ctx, particle) {
      switch (particle.type) {
        case 'bomb':
          drawBomb(ctx, particle);
          break;
        case 'player':
          drawPlayer(ctx, particle);
          break;
      }
    }

    function drawBomb(ctx, bomb) {
      ctx.fillStyle = 'black';
      ctx.fillRect(bomb.x - 2, bomb.y - 2, 4, 4);
    }

    function drawPlayer(ctx, player) {
      ctx.strokeStyle = player.color;
      // name
      ctx.font = '12px sans-serif';
      ctx.strokeText(player.username, player.x, player.y - 25);
      // legs
      ctx.beginPath();
      ctx.moveTo(player.x + 2, player.y);
      ctx.lineTo(player.x, player.y - 10);
      ctx.lineTo(player.x - 2, player.y);
      // spine
      ctx.moveTo(player.x, player.y - 15);
      ctx.lineTo(player.x, player.y - 10);
      // arms
      ctx.moveTo(player.x - 3, player.y - 13);
      ctx.lineTo(player.x + 3, player.y - 13);
      ctx.stroke();
      ctx.beginPath();
      // head
      ctx.arc(player.x, player.y - 18, 3, 0, 2 * Math.PI, false);
      ctx.stroke();
    }

    function generateBackground() {
      var ctx = backgroundCanvas.getContext('2d');
      var i, l;

      ctx.fillStyle = 'rgb(255,255,255)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'rgb(160,82,45)';
      ctx.fillRect(0, height / 2, width, height / 2);

      for (i = 0, l = width * height * 0.01; i < l; ++i) {
        if (i < l * (1 / 3)) {
          ctx.fillStyle = 'rgb(' + 158 + Math.round(Math.random() * 4) + ',' + 80 + Math.round(Math.random() * 4) + ',' + 43 + Math.round(Math.random() * 4) + ')';
        }
        ctx.fillRect(Math.random() * width, height / 2 + Math.random() * (height / 2), 1, 1);
      }

      var bw = 40;
      var bh = 20;
      for (i = 0; i < Math.ceil(width / bw) + 1; ++i) {
        drawBrick(ctx, i * bw, height / 2, 40, bh);
        drawBrick(ctx, i * bw - bw / 2, height / 2 + bh, 40, bh);
        drawBrick(ctx, i * bw, height / 2 + bh * 2, 40, bh);
      }
    }

    function drawBrick(ctx, x, y, w, h) {
      ctx.fillStyle = 'rgb(128, 128, 128)';
      ctx.beginPath();
      ctx.moveTo(x + w, y);
      ctx.lineTo(x, y + h);
      ctx.lineTo(x + w, y + h);
      ctx.fill();
      ctx.closePath();

      ctx.fillStyle = 'rgb(240, 240, 240)';
      ctx.beginPath();
      ctx.moveTo(x + w, y);
      ctx.lineTo(x, y + h);
      ctx.lineTo(x, y);
      ctx.fill();
      ctx.closePath();

      ctx.fillStyle = 'rgb(200, 200, 200)';
      ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
    }

    function locateUser(username) {
      username = username.toLowerCase();
      if (userMap.hasOwnProperty(username)) {
        return userMap[username];
      }
      var user = {
        type: 'player',
        x: width * (0.8 * Math.random() + 0.1),
        y: 1,
        dx: 0,
        dy: 0,
        ddx: 0,
        ddy: gravity,
        username: username,
        displayName: username,
        color: 'black',
        health: 1
      };
      userMap[username] = user;
      return user;
    }

    function executeCommand(command, user) {
      var r, m;
      r = /^!s(?:pawn)?\s*$/;
      m = command.match(r);
      if (m) {
        spawnUser(user);
      }
      r = /^!dump\s*$/;
      m = command.match(r);
      if (m) {
        dumpData();
      }
      r = /^!f(?:ire)?\s+(-?\d+)\s+(\d+)\s*$/;
      m = command.match(r);
      if (m) {
        fire(user, parseInt(m[1], 10), parseInt(m[2], 10));
      }

    }

    function dumpData() {
      console.log(JSON.stringify(particles));
    }

    function spawnUser(user) {
      if (!particles.indexOf(user) !== -1) {
        user.x = width * (0.8 * Math.random() + 0.1);
        user.y = 1;
        user.dx = 0;
        user.dy = 0;
        user.ddx = 0;
        user.ddy = gravity;
        user.health = 1;
        particles.push(user);
      }
    }

    function fire(user, angle, power) {
      particles.splice(0, 0, {
        type: 'bomb',
        x: user.x,
        y: user.y - 25,
        dx: Math.cos((90 - angle) * Math.PI / 180) * power * maxPower / 100,
        dy: -Math.sin((90 - angle) * Math.PI / 180) * power * maxPower / 100,
        ddx: 0,
        ddy: gravity
      });
    }

    function connectChat(){
      ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443/', 'irc');

      ws.onmessage = function (message) {
        if (message !== null) {
          var parsed = parseMessage(message.data);
          if (parsed !== null) {
            if (parsed.command === "PRIVMSG") {
              console.log('Got a message ' + JSON.stringify(parsed));
              console.log('MSG: ' + parsed.message + ' from ' + parsed.username);
              user = locateUser(parsed.username, true);
              var colorRegexMatch = parsed.tags.match(/color=(#[0-9A-Fa-f]{6});/);
              if (colorRegexMatch) {
                user.color = colorRegexMatch[1];
              }
              var displayNameRegexMatch = parsed.tags.match(/display-name=([^;]+);/);
              if (displayNameRegexMatch) {
                user.displayName = displayNameRegexMatch[1];
              }

              executeCommand(parsed.message, user);
            } else if (parsed.command === "PING") {
              ws.send("PONG :" + parsed.message);
            }
          }
        }
      };
      ws.onerror = function (message) {
          console.log('Error: ' + message);
      };
      ws.onclose = function () {
          console.log('Disconnected from the chat server.');
      };
      ws.onopen = function () {
        if (ws !== null && ws.readyState === 1) {
          console.log('Connecting and authenticating...');

          ws.send('CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership');
          ws.send('PASS ' + BOT_OAUTH_TOKEN);
          ws.send('NICK ' + BOT_USERNAME);
          ws.send('JOIN ' + CHANNEL);
        }
      };
      document.getElementById('offline-command-field').outerHTML = '';
    }

    function sentMessageToChat(message) {
      if (ws) {
        ws.send("PRIVMSG " + CHANNEL + " :" + message + '\r\n');
      } else {
        console.log(message);
      }
    }

    function parseMessage(rawMessage) {
      var parsedMessage = {
        message: null,
        tags: null,
        command: null,
        original: rawMessage,
        channel: null,
        username: null
      };

      if(rawMessage[0] === '@'){
        var tagIndex = rawMessage.indexOf(' '),
            userIndex = rawMessage.indexOf(' ', tagIndex + 1),
            commandIndex = rawMessage.indexOf(' ', userIndex + 1),
            channelIndex = rawMessage.indexOf(' ', commandIndex + 1),
            messageIndex = rawMessage.indexOf(':', channelIndex + 1);

        parsedMessage.tags = rawMessage.slice(0, tagIndex);
        parsedMessage.username = rawMessage.slice(tagIndex + 2, rawMessage.indexOf('!'));
        parsedMessage.command = rawMessage.slice(userIndex + 1, commandIndex);
        parsedMessage.channel = rawMessage.slice(commandIndex + 1, channelIndex);
        parsedMessage.message = rawMessage.slice(messageIndex + 1);
      } else if(rawMessage.startsWith("PING")) {
        parsedMessage.command = "PING";
        parsedMessage.message = rawMessage.split(":")[1];
      }

      return parsedMessage;
    }




    if (CONNECT_TO_CHAT) {
        connectChat();
    } else {
        document.getElementById('offline-command-field').addEventListener('keydown', function (ev) {
          if (ev.keyCode === 13) {
            // the newline at the end is what we get from twitch chat too so we are better off
            // having a realistic imitation here to avoid discovering bugs in regexes later on
            executeCommand(ev.target.value + '\r\n', locateUser(STREAMER, true));
          }
        });
    }
  });
})();
