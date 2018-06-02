(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var canvas = document.getElementById('game');
    var backgroundCanvas = document.getElementById('background');

    var ws;

    var width = backgroundCanvas.width = canvas.width = window.innerWidth;
    var height = backgroundCanvas.height = canvas.height = window.innerHeight;
    var gravity = height / 10000000;

    var particles = [
      {
        type: 'bomb',
        x: width / 3,
        y: 0,
        dx: 0,
        dy: 0,
        ddx: 0,
        ddy: gravity
      }
    ];
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
      var elapsed = currentTS - lastTS;

      // update particles
      for (var i = particles.length - 1; i >= 0; --i) {
        var particle = particles[i];
        particle.x += particle.dx * elapsed;
        particle.y += particle.dy * elapsed;
        particle.dx += particle.ddx * elapsed;
        particle.dy += particle.ddy * elapsed;
        if (ctx.getImageData(particle.x, particle.y, 1, 1).data[0] !== 255) {
          particle.dx = 0;
          particle.dy = 0;
          particle.ddx = 0;
          particle.ddy = 0;

          ctx2.beginPath();
          ctx2.arc(particle.x, particle.y, 40, 0, 2 * Math.PI, false);
          ctx2.fillStyle = 'white';
          ctx2.fill();

          particle.x = Math.random() * width;
          particle.y = 0;
          particle.ddy = gravity;
        }
      }

      for (var i = particles.length - 1; i >= 0; --i) {
        var particle = particles[i];
        ctx.fillStyle = 'black';
        ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);

      }

      lastTS = currentTS;
      requestAnimationFrame(drawFrame);
    });

    function generateBackground() {
      var ctx = backgroundCanvas.getContext('2d');

      ctx.fillStyle = 'rgb(255,255,255)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'rgb(0,255,0)';
      ctx.fillRect(0, height / 2, width, height / 2);
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
              var colorRegexMatch = parsed.tags.match(/color=(#[0-9A-Fa-f]{6});/);
              if (colorRegexMatch) {
                var color = colorRegexMatch[1];
              }
              var displayNameRegexMatch = parsed.tags.match(/display-name=([^;]+);/);
              if (displayNameRegexMatch) {
                var displayName = displayNameRegexMatch[1];
              }

              //executeCommand(parsed.message, user);
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
      //document.getElementById('offline-command-container').outerHTML = '';
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
        /*document.getElementById('offline-command-field').addEventListener('keydown', function (ev) {
          if (ev.keyCode === 13) {
            // the newline at the end is what we get from twitch chat too so we are better off
            // having a realistic imitation here to avoid discovering bugs in regexes later on
            executeCommand(ev.target.value + '\r\n', locateUser(STREAMER, true));
          }
        });*/
    }
  });
})();
