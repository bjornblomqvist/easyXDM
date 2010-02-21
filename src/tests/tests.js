/*jslint evil: true, browser: true, immed: true, passfail: true, undef: true, newcap: true*/
/*global easyTest, easyXDM, window*/
var _remoteUrl = location.href.substring(0, location.href.lastIndexOf("/") + 1);
if (_remoteUrl.indexOf("easyxdm.net") !== -1) {
    _remoteUrl = _remoteUrl.replace("easyxdm.net", "provider.easyxdm.net");
}
if (_remoteUrl.indexOf("localhost") !== -1) {
    _remoteUrl = _remoteUrl.replace("localhost", "127.0.0.1");
}


var channelId = 0;
function createTransportBehaviorTest(config,TransportClass,testName,failureMessage) {
	
	
	config.channel = "channel" + (channelId++);
	
	var toReturn = {
      name: testName,
      failedMessage: failureMessage,
      setUp: function(){
          this.expectedMessage = "1abcd1234";
      },
      steps: [{
          name: "onReady is fired",
          timeout: 5000,
          run: function(){
              var scope = this;
							config.onMessage = function(message, origin) {  };
              this.transport = new TransportClass(config, function(){
                  scope.notifyResult(true);
              });
          }
      }, {
          name: "message is echoed back",
          timeout: 1000,
          run: function(){
							var scope = this;
							config.onMessage = function(message, origin) { scope.notifyResult((scope.expectedMessage === message)); };
              this.transport.postMessage(this.expectedMessage);
          }
      }
			, {
          name: "check that no messages are droped",
          timeout: 5000,
          run: function(){
							var recivedMessages = 0;
							var scope = this;
							config.onMessage = function(message, origin) { recivedMessages++; if(recivedMessages == 10) { scope.notifyResult(true);} };
              for(var i = 0; i < 10; i++) {
								this.transport.postMessage("droped ? "+i);
							}
          }
      },
			{
          name: "check that messages arive in order",
          timeout: 1000,
          run: function(){
							var recivedMessages = [];
							var sentMessage  = [];
							var scope = this;
							config.onMessage = function(message, origin) {  recivedMessages.push(message); if(recivedMessages.length == 5) { scope.notifyResult(JSON.stringify(recivedMessages) == JSON.stringify(sentMessage));} };
              for(var i = 0; i < 5; i++) {
								sentMessage.push(""+i);
								this.transport.postMessage(""+i);
							}
          }
      },{
          name: "send big message",
          timeout: 10000,
          run: function(){
	
					
							// Create a big message
							var bigMessage = ""
							for(var i = 0; i < 20000; i++) {
								bigMessage += "a";
							}
							
							var scope = this;
							config.onMessage = function(message, origin) { scope.notifyResult((bigMessage === message)); };
							
							this.transport.postMessage(bigMessage);
          }
      },{
          name: "destroy",
          run: function(){
              this.transport.destroy();
              return ((document.getElementsByTagName("iframe").length === 0));
          }
      }]
  }

	if(failureMessage) {
		toReturn.failedMessage = failureMessage;
	}

	return toReturn;
}



function runTests(){

    easyTest.test([/**Tests for the presence of namespaces and classes*/{
        name: "Check that the library is complete",
        steps: [{
            name: "check for the presence of easyXDM",
            run: function(){
                if (this.Assert.isObject(easyXDM) && this.Assert.isString(easyXDM.version)) {
                    this.log("found easyXDM, version=" + easyXDM.version);
                    return true;
                }
                return false;
            }
        }, {
            name: "check for the presence of easyXDM.transport",
            run: function(){
                return this.Assert.isObject(easyXDM.transport);
            }
        }, {
            name: "check for the presence of easyXDM.serializing",
            run: function(){
                return this.Assert.isObject(easyXDM.serializing);
            }
        }, {
            name: "check for the presence of easyXDM.configuration",
            run: function(){
                return this.Assert.isObject(easyXDM.configuration);
            }
        }, {
            name: "check for the presence of easyXDM.Channel",
            run: function(){
                return this.Assert.isFunction(easyXDM.Channel);
            }
        }, {
            name: "check for the presence of easyXDM.transport.HashTransport",
            run: function(){
                return this.Assert.isFunction(easyXDM.transport.HashTransport);
            }
        }, {
            name: "check for the presence of easyXDM.transport.PostMessageTransport",
            run: function(){
                return this.Assert.isFunction(easyXDM.transport.PostMessageTransport);
            }
        }, {
            name: "check for the presence of easyXDM.transport.NameTransport",
            run: function(){
                return this.Assert.isFunction(easyXDM.transport.NameTransport);
            }
        }, {
            name: "check for the presence of easyXDM.Debug",
            run: function(){
                return this.Assert.isObject(easyXDM.Debug);
            }
        }, {
            name: "check for the presence of easyXDM.DomHelper",
            run: function(){
                return this.Assert.isObject(easyXDM.DomHelper);
            }
        }, {
            name: "check for the presence of easyXDM.Url",
            run: function(){
                return this.Assert.isObject(easyXDM.Url);
            }
        }]
    }
		,createTransportBehaviorTest({local: "../hash.html",remote: _remoteUrl + "test_transport.html",remoteHelper: _remoteUrl + "../hash.html",container: document.getElementById("embedded")},easyXDM.transport.NameTransport,"test easyXDM.transport.NameTransport","This can fail in some modern browsers like Firefox, but this is OK as it is only needed for older browsers like IE6/IE7.")
		,createTransportBehaviorTest({local: "../hash.html",remote: _remoteUrl + "test_transport.html",container: document.getElementById("embedded")},easyXDM.transport.HashTransport,"test easyXDM.transport.HashTransport using polling")
		,createTransportBehaviorTest({local: "../hash.html",remote: _remoteUrl + "test_transport.html"},easyXDM.transport.HashTransport,"test easyXDM.transport.HashTransport using onresize")
		,createTransportBehaviorTest({local: window,remote: _remoteUrl + "test_transport.html"},easyXDM.transport.HashTransport,"test easyXDM.transport.HashTransport using parent")
		,createTransportBehaviorTest({readyAfter: 1000,local: "../changes.txt",remote: _remoteUrl + "test_transport.html"},easyXDM.transport.HashTransport,"test easyXDM.transport.HashTransport using readyAfter","This can fail in some modern browsers like Firefox, but this is OK as it is only needed for older browsers like IE6/IE7.")
		,createTransportBehaviorTest({local: "../hash.html",remote: _remoteUrl + "test_transport.html"},easyXDM.transport.PostMessageTransport,"test easyXDM.transport.PostMessageTransport","This will fail in older browsers like IE6/IE7 as these do not support the postMessage interface.")
		,createTransportBehaviorTest({local: "../hash.html",remote: _remoteUrl + "test_transport.html"},easyXDM.transport.BestAvailableTransport,"test easyXDM.transport.BestAvailableTransport")
		,createTransportBehaviorTest({local: "../hash.html",remote: _remoteUrl + "test_transport.html?a=b&c=d"},easyXDM.transport.BestAvailableTransport,"test easyXDM.transport.BestAvailableTransport with query parameters")
		, {
        name: "test easyXDM.Interface",
        setUp: function() {
            this.expectedMessage = "6abcd1234";
        },
        steps: [{
            name: "onReady is fired",
            timeout: 5000,
            run: function(){
                var scope = this;
                this.remote = new easyXDM.Interface({
                    channel: "channel" + (channelId++),
                    local: "../hash.html",
                    remote: _remoteUrl + "test_interface.html"
                }, {
                    remote: {
                        voidMethod: {
                            isVoid: true
                        },
                        asyncMethod: {},
                        method: {}
                    },
                    local: {
                        voidCallback: {
                            method: function(message){
                                scope.notifyResult((scope.expectedMessage === message));
                            },
                            isVoid: true
                        }
                    }
                }, function(){
                    scope.notifyResult(true);
                });
            }
        }, {
            name: "void method",
            timeout: 1000,
            run: function(){
                this.remote.voidMethod(this.expectedMessage);
            }
        }, {
            name: "async method",
            timeout: 1000,
            run: function(){
                var scope = this;
                this.remote.asyncMethod(this.expectedMessage, function(message){
                    scope.notifyResult((scope.expectedMessage === message));
                });
            }
        }, {
            name: "regular method",
            timeout: 1000,
            run: function(){
                var scope = this;
                this.remote.method(this.expectedMessage, function(message){
                    scope.notifyResult((scope.expectedMessage === message));
                });
            }
        }, {
            name: "destroy",
            run: function(){
                this.remote.destroy();
                return ((document.getElementsByTagName("iframe").length === 0));
            }
        }]
    }]);
}
