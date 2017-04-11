(function(ext) {

    let hostURL = "poppy.local";
    let connectionURL = hostURL + "ip/";
    let motorsURL = hostURL + "motors/motors";
    let motorsPositionURL = hostURL + "motors/set/goto/";
    let motorRegisterURL = hostURL + "motors/set/registers/";
    let moveRecordURL = hostURL + "primitive/MoveRecorder/";
    let movePlayerURL = hostURL + "primitive/MovePlayer/";
    let primitivesURL = hostURL + "primitive/";
    let detectURL = hostURL + "detect/";
    let connected = false;
    let motors = [];
    $.getScript('https://eesh.github.io/scratch-test/digit_recognition.js', checkDigitRecognitionLibrary);

    function checkDigitRecognitionLibrary() {
      if (math == undefined) {
        console.log("digit_recognition.js is not loaded");
      } else {
        console.log("digit_recognition.js loaded.");
      }
    }

    function setMotors(m) {
      motors = m;
    }

    function getMotorsList(callback) {
      sendRequest(motorsURL, null, function(response) {
        if(response.length == 0) {
          callback();
          return;
        } else {
          motors = response.split("/");
          setMotors(motors);
          callback();
        }
      });
    }

    function setHost(host) {
      hostURL = host;
      connectionURL = hostURL + "ip/";
      motorsURL = hostURL + "motors/motors";
      motorsPositionURL = hostURL + "motors/set/goto/";
      motorRegisterURL = hostURL + "motors/set/registers/";
      moveRecordURL = hostURL + "primitive/MoveRecorder/";
      movePlayerURL = hostURL + "primitive/MovePlayer/";
      primitivesURL = hostURL + "primitive/"
      detectURL = hostURL + "detect/";
    }

    function sendRequest(requestURL, params, callback) {
      let request = new XMLHttpRequest();
      request.onreadystatechange = function() {
        if (request.readyState == 4) {
          if(callback != undefined) {
              callback(request.responseText);
          }
        }
      }
      if(params != null) {
        request.open("GET", requestURL+params, true);
      } else {
        request.open("GET", requestURL, true);
      }
      request.send();
    }

    ext.connectErgo = function (host, callback) {
      setHost(host);
      sendRequest(connectionURL, null, function(e) {
        if(e.length > 0) {
          connected = true;
          getMotorsList(callback);
        } else {
          connected = false;
          callback();
        }
      });
    };


    ext.turnBy = function (selectedMotors, position, time, callback) {
      selectedMotors.trim();
      selectedMotors = selectedMotors.split(" ");
      let paramPart = ":"+position+":"+time;
      let params = "";
      selectedMotors.forEach(function(m) {
        params += m + paramPart + ';';
      });
      params = params.slice(0, params.length-1);
      sendRequest(motorsPositionURL, params, function(response) {
        console.log("Turn",selectedMotors,position, time);
        callback();
      });
    };


    ext.turnTo = function (direction, callback) {
      let angle = 0;
      if(direction == 'Left') {
        angle = 90;
      } else if (direction == 'Right') {
        angle = -90;
      } else if (direction == 'Front') {
        angle = 0;
      } else {
        angle = 180;
      }
      let params = "m1:goal_position:"+angle;
      sendRequest(motorRegisterURL, params, function(response) {
        console.log("Turn ergo to", direction);
        callback();
      });
    };


    ext.setLED = function (selectedMotors, color, callback) {
      selectedMotors.trim();
      selectedMotors = selectedMotors.split(" ");
      let paramPart = ":led:"+color;
      let params = "";
      selectedMotors.forEach(function(m) {
        params += m + paramPart + ';';
      });
      params = params.slice(0, params.length-1);
      sendRequest(motorRegisterURL, params, function (response) {
        console.log("Set LED of", selectedMotors, "to", color)
        callback();
      });
    };

    setRegisterValues = function (selectedMotors, register, values, callback) {
      if(selectedMotors.length != values.length) {
        console.error("Number of motors and number of values do not match");
        callback();
        return false;
      } else {
        var params = "";
        for(var index = 0; index < selectedMotors.length; index++) {
          params += selectedMotors[index] + ":" + register + ":" + values[index] + ";";
        }
        params = params.slice(0, params.length-1);
        sendRequest(motorRegisterURL, params, function(response) {
          console.log("set register", register, "of", selectedMotors, "to", values);
          if(callback != undefined) {
            callback();
          }
          return;
        });
      }
    };

    setPrimitive = function(primitiveName, behavior, callback) {
      sendRequest(primitivesURL, primitiveName + '/' + behavior, callback);
    }

    setCompliance = function (selectedMotors, value, callback) {
      values = [];
      selectedMotors = selectedMotors.trim();
      selectedMotors = selectedMotors.split(" ");
      selectedMotors.forEach(function (motor) {
        if(motors.indexOf(motor) != -1) {
          values.push(value*1);
        }
      });
      console.log(values);
      setRegisterValues(selectedMotors, "compliant", values, callback);
    }

    ext.recordMove = function (selectedMotors, moveName, callback) {
      setCompliance(selectedMotors, true, undefined);
      selectedMotors = selectedMotors.trim();
      selectedMotors = selectedMotors.split(" ");
      var params = "";
      for(var index = 0; index < selectedMotors.length; index++) {
        params += selectedMotors[index] + ";"
      }
      params = params.slice(0, params.length-1);
      let url = moveRecordURL + moveName + "/start/";
      sendRequest(url, params, function (response) {
        callback();
      });
    };

    getRecordingMotors = function (moveName, after) {
      let url = moveRecordURL + moveName + "/get_motors";
      sendRequest(url, null, function (response) {
        after(response);
      });
    };

    ext.stopRecordingMove = function (moveName, callback) {
      var afterRequest = function (response) {
        callback();
      }
      var stopRecording = function(selectedMotors) {
        motors = selectedMotors.split("/");
        motors = motors.join(" ");
        setCompliance(motors, false, undefined);
        let url = moveRecordURL + moveName + "/stop";
        sendRequest(url, null, afterRequest);
      }
      getRecordingMotors(moveName, stopRecording);
    };


    ext.playRecording = function(behavior, recordingName, callback) {
      if(behavior == 'Play') {
        behavior = 'start';
      } else {
        behavior = 'stop';
      }
      var params = recordingName + '/' + behavior.toLowerCase();
      sendRequest(movePlayerURL, params, callback);
    };

    ext.dance = function (behavior, callback) {
      setPrimitive('dance', behavior, callback);
    }

    ext.setPosture = function (posture, callback) {
      let primitiveName = posture + '_posture';
      setPrimitive(primitiveName, 'start', undefined);
      setTimeout(function() {
        setPrimitive(primitiveName, 'stop', callback);
      }, 3000);
    };

    ext.setMarkerDetection = function (toggle, callback) {
      setPrimitive('tracking_feedback', toggle, callback);
    };

    ext.isCaribou = function (callback) {
      console.log("caribou", callback);
      sendRequest(detectURL, 'caribou', function (res) {
        callback(res);
      });
    };

    ext.isTetris = function (callback) {
      console.log("tetris",callback);
      sendRequest(detectURL, 'tetris', function (res) {
        callback(res);
      });
    };

    ext.isLapin = function (callback) {
      console.log("lapin", callback);
      sendRequest(detectURL, 'lapin', function (res) {
        callback(res);
      });
    }

    // Cleanup function when the extension is unloaded
    ext._shutdown = function() {};

    // Status reporting code
    // Use this to report missing hardware, plugin or unsupported browser
    ext._getStatus = function() {
      if(connected == false) {
        return {status:1, msg: 'Not connected to Poppy Ergo Jr.'};
      } else {
        return {status:2, msg: 'Connected to Poppy Ergo Jr.'};
      }
    };

    // Block and block menu descriptions
    var descriptor = {
        blocks: [
          ['w', 'Call Ergo Jr. at %s', 'connectErgo', 'http://localhost:6969/'],
          ['w', 'Turn blocks %s to %n position in %n seconds', 'turnBy'],
          ['w', 'Turn %m.motorDirection', 'turnTo', 'Left'],
          ['w', 'Set light of blocks %s to %m.lights', 'setLED', '', 'off'],
          ['w', 'Record movement of blocks %s as %s', 'recordMove', '', 'move_name'],
          ['w', 'Stop recording move %s', 'stopRecordingMove', 'move_name'],
          ['w', '%m.danceMenu dance', 'dance', 'start'],
          ['w', '%m.playMenu recording %s', 'playRecording', 'Play', 'move_name'],
          ['w', 'Set %m.postures posture', 'setPosture', 'rest'],
          ['w', '%m.markerDetection tracking', 'setMarkerDetection', 'start'],
          ['R', 'Caribou', 'isCaribou'],
          ['R', 'Lapin', 'isLapin'],
          ['R', 'Tetris', 'isTetris']
        ],
        menus: {
          motorDirection: ['Left', 'Right', 'Front', 'Back'],
          lights: ['off', 'red', 'green', 'blue', 'yellow', 'pink', 'cyan', 'white'],
          danceMenu: ['start', 'stop', 'pause', 'resume'],
          playMenu: ['Play', 'Stop'],
          postures: ['rest', 'curious', 'tetris', 'base'],
          markerDetection: ['start', 'stop']
        }
    };

    // Register the extension
    ScratchExtensions.register('Poppy Ergo Jr.', descriptor, ext);
})({});
