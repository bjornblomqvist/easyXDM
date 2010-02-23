/*jslint evil: true, browser: true, immed: true, passfail: true, undef: true, newcap: true*/
/*global easyTest, easyXDM, window*/
var _remoteUrl = location.href.substring(0, location.href.lastIndexOf("/") + 1);
if (_remoteUrl.indexOf("easyxdm.net") !== -1) {
    _remoteUrl = _remoteUrl.replace("easyxdm.net", "provider.easyxdm.net");
}
if (_remoteUrl.indexOf("localhost") !== -1) {
    _remoteUrl = _remoteUrl.replace("localhost", "127.0.0.1");
}

/*
	Opera changes 127.0.0.1 to localdomain so i use easyxdmhost and easyxdmapi in my hosts file.
*/
if (_remoteUrl.indexOf("easyxdmhost") !== -1) {
    _remoteUrl = _remoteUrl.replace("easyxdmhost", "easyxdmapi");
}
var channelId = 0;
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
    }, {
        name: "test easyXDM.transport.NameTransport",
        failedMessage: "This can fail in some modern browsers like Firefox, but this is OK as it is only needed for older browsers like IE6/IE7.",
        setUp: function(){
            this.expectedMessage = "1abcd1234";
        },
        steps: [{
            name: "onReady is fired",
            timeout: 5000,
            run: function(){
                var scope = this;
                this.transport = new easyXDM.transport.NameTransport({
                    channel: "channel" + (channelId++),
                    local: "../hash.html",
                    remote: _remoteUrl + "test_transport.html",
                    remoteHelper: _remoteUrl + "../hash.html",
                    onMessage: function(message, origin){
                        scope.notifyResult((scope.expectedMessage === message));
                    },
                    container: document.getElementById("embedded")
                }, function(){
                    scope.notifyResult(true);
                });
            }
        }, {
            name: "message is echoed back",
            timeout: 1000,
            run: function(){
                this.transport.postMessage(this.expectedMessage);
            }
        }, {
            name: "destroy",
            run: function(){
                this.transport.destroy();
                return ((document.getElementsByTagName("iframe").length === 0));
            }
        }]
    }, {
        name: "test easyXDM.transport.HashTransport using polling",
        setUp: function(){
            this.expectedMessage = "1abcd1234";
        },
        steps: [{
            name: "onReady is fired",
            timeout: 5000,
            run: function(){
                var scope = this;
                this.transport = new easyXDM.transport.HashTransport({
                    channel: "channel" + (channelId++),
                    local: "../hash.html",
                    remote: _remoteUrl + "test_transport.html",
                    onMessage: function(message, origin){
                        scope.notifyResult((scope.expectedMessage === message));
                    },
                    container: document.getElementById("embedded")
                }, function(){
                    scope.notifyResult(true);
                });
            }
        }, {
            name: "message is echoed back",
            timeout: 1000,
            run: function(){
                this.transport.postMessage(this.expectedMessage);
            }
        }, {
            name: "destroy",
            run: function(){
                this.transport.destroy();
                return ((document.getElementsByTagName("iframe").length === 0));
            }
        }]
    }, {
        name: "test easyXDM.transport.HashTransport using onresize",
        setUp: function(){
            this.expectedMessage = "2abcd1234";
        },
        steps: [{
            name: "onReady is fired",
            timeout: 5000,
            run: function(){
                var scope = this;
                this.transport = new easyXDM.transport.HashTransport({
                    channel: "channel" + (channelId++),
                    local: "../hash.html",
                    remote: _remoteUrl + "test_transport.html",
                    onMessage: function(message, origin){
                        scope.notifyResult(scope.expectedMessage === message);
                    }
                }, function(){
                    scope.notifyResult(true);
                });
            }
        }, {
            name: "message is echoed back",
            timeout: 1000,
            run: function(){
                this.transport.postMessage(this.expectedMessage);
            }
        }, {
            name: "destroy",
            run: function(){
                this.transport.destroy();
                return ((document.getElementsByTagName("iframe").length === 0));
            }
        }]
    }, {
        name: "test easyXDM.transport.HashTransport using parent",
        setUp: function(){
            this.expectedMessage = "2abcd1234";
        },
        steps: [{
            name: "onReady is fired",
            timeout: 5000,
            run: function(){
                var scope = this;
                this.transport = new easyXDM.transport.HashTransport({
                    channel: "channel" + (channelId++),
                    local: window,
                    remote: _remoteUrl + "test_transport.html",
                    onMessage: function(message, origin){
                        scope.notifyResult(scope.expectedMessage === message);
                    }
                }, function(){
                    scope.notifyResult(true);
                });
            }
        }, {
            name: "message is echoed back",
            timeout: 1000,
            run: function(){
                this.transport.postMessage(this.expectedMessage);
            }
        }, {
            name: "destroy",
            run: function(){
                this.transport.destroy();
                return ((document.getElementsByTagName("iframe").length === 0));
            }
        }]
    }, {
        name: "test easyXDM.transport.HashTransport using readyAfter",
        failedMessage: "This can fail in some modern browsers like Firefox, but this is OK as it is only needed for older browsers like IE6/IE7.",
        setUp: function(){
            this.expectedMessage = "2abcd1234";
        },
        steps: [{
            name: "onReady is fired",
            timeout: 5000,
            run: function(){
                var scope = this;
                this.transport = new easyXDM.transport.HashTransport({
                    channel: "channel" + (channelId++),
                    readyAfter: 1000,
                    local: "../changes.txt",
                    remote: _remoteUrl + "test_transport.html",
                    onMessage: function(message, origin){
                        scope.notifyResult(scope.expectedMessage === message);
                    }
                }, function(){
                    scope.notifyResult(true);
                });
            }
        }, {
            name: "message is echoed back",
            timeout: 1000,
            run: function(){
                this.transport.postMessage(this.expectedMessage);
            }
        }, {
            name: "destroy",
            run: function(){
                this.transport.destroy();
                return ((document.getElementsByTagName("iframe").length === 0));
            }
        }]
    }, {
        name: "test easyXDM.transport.PostMessageTransport",
        failedMessage: "This will fail in older browsers like IE6/IE7 as these do not support the postMessage interface.",
        setUp: function(){
            this.expectedMessage = "3abcd1234";
        },
        steps: [{
            name: "onReady is fired",
            timeout: 5000,
            run: function(){
                var scope = this;
                this.transport = new easyXDM.transport.PostMessageTransport({
                    channel: "channel" + (channelId++),
                    local: "../hash.html",
                    remote: _remoteUrl + "test_transport.html",
                    onMessage: function(message, origin){
                        scope.notifyResult((scope.expectedMessage === message));
                    }
                }, function(){
                    scope.notifyResult(true);
                });
            }
        }, {
            name: "message is echoed back",
            timeout: 1000,
            run: function(){
                this.transport.postMessage(this.expectedMessage);
            }
        }, {
            name: "destroy",
            run: function(){
                this.transport.destroy();
                return ((document.getElementsByTagName("iframe").length === 0));
            }
        }]
    }, {
        name: "test easyXDM.transport.BestAvailableTransport",
        setUp: function(){
            this.expectedMessage = "4abcd1234";
        },
        steps: [{
            name: "onReady is fired",
            timeout: 5000,
            run: function(){
                var scope = this;
                this.transport = new easyXDM.transport.BestAvailableTransport({
                    channel: "channel" + (channelId++),
                    local: "../hash.html",
                    remote: _remoteUrl + "test_transport.html",
                    onMessage: function(message, origin){
                        scope.notifyResult((scope.expectedMessage === message));
                    }
                }, function(){
                    scope.notifyResult(true);
                });
            }
        }, {
            name: "message is echoed back",
            timeout: 1000,
            run: function(){
                this.transport.postMessage(this.expectedMessage);
            }
        }, {
            name: "destroy",
            run: function(){
                this.transport.destroy();
                return ((document.getElementsByTagName("iframe").length === 0));
            }
        }]
    }, {
        name: "test easyXDM.transport.BestAvailableTransport with query parameters",
        setUp: function(){
            this.expectedMessage = "5abcd1234";
        },
        steps: [{
            name: "onReady is fired",
            timeout: 5000,
            run: function(){
                var scope = this;
                this.transport = new easyXDM.transport.BestAvailableTransport({
                    channel: "channel" + (channelId++),
                    local: "../hash.html",
                    remote: _remoteUrl + "test_transport.html?a=b&c=d",
                    onMessage: function(message, origin){
                        scope.notifyResult((scope.expectedMessage === message));
                    }
                }, function(){
                    scope.notifyResult(true);
                });
            }
        }, {
            name: "message is echoed back",
            timeout: 1000,
            run: function(){
                this.transport.postMessage(this.expectedMessage);
            }
        }, {
            name: "destroy",
            run: function(){
                this.transport.destroy();
                return ((document.getElementsByTagName("iframe").length === 0));
            }
        }]
    }, {
        name: "test easyXDM.Interface",
        setUp: function(){
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
    },		{
	        name: "test easyXDM.wrapper.MessageQueue wrapping easyXDM.transport.HashTransport using polling",
	        setUp: function(){
	            this.expectedMessage = "1abcd1234";
	        },
	        steps: [{
	            name: "onReady is fired",
	            timeout: 5000,
	            run: function(){
	                var scope = this;
	                this.transport = new easyXDM.wrapper.MessageQueue(easyXDM.transport.HashTransport,{
	                    channel: "channel" + (channelId++),
	                    local: "../hash.html",
	                    remote: _remoteUrl + "test_transport.html?MessageQueue=true",
	                    onMessage: function(message, origin){
	                        scope.notifyResult((scope.expectedMessage === message));
	                    },
	                    container: document.getElementById("embedded")
	                }, function(){
	                    scope.notifyResult(true);
	                });
	            }
	        }, {
	            name: "message is echoed back",
	            timeout: 2000,
	            run: function(){
	                this.transport.postMessage(this.expectedMessage);
	            }
	        },
					     {
		          name: "check that messages arive in order",
		          timeout: 5000,
		          run: function(){
		                            var recivedMessages = [];
		                            var sentMessage  = [];
		                            var scope = this;
		                            this.transport.config.onMessage = function(message, origin) {  recivedMessages.push(message); if(recivedMessages.length == 5) { scope.notifyResult(JSON.stringify(recivedMessages) == JSON.stringify(sentMessage));} };
		              for(var i = 0; i < 5; i++) {
		                                sentMessage.push(""+i);
		                                this.transport.postMessage(""+i);
		                            }
		          }
		      },		{
				          name: "send big message",
				          timeout: 15000,
				          run: function(){


	                     // Create a big message
	                     var bigMessage = ""
	                     for(var i = 0; i < 5000; i++) {
	                         bigMessage += "a";
	                     }

	                     var scope = this;
	                     this.transport.config.onMessage = function(message, origin) { scope.notifyResult((bigMessage === message)); };

	                     this.transport.postMessage(bigMessage);
				          }
				      },
					{
					          name: "check that no messages are droped",
					          timeout: 5000,
					          run: function(){
					                            var recivedMessages = 0;
					                            var scope = this;
					                            this.transport.config.onMessage = function(message, origin) {  if(scope.expectedMessage === message) {recivedMessages++;} if(recivedMessages == 50) { scope.notifyResult(true);} };
					              for(var i = 0; i < 50; i++) {
					                                this.transport.postMessage(this.expectedMessage);
					                            }
					          }
					      }

					, {
	            name: "destroy",
	            run: function(){
	                this.transport.destroy();
	                return ((document.getElementsByTagName("iframe").length === 0));
	            }
	        }]
	    },	{
					name: "MessageMarshaller tests",
	        steps: [
					{
	            name: "Adding messages should result in the getAsString to grow",
	            run: function(){
									var messageMarshaller = new easyXDM.wrapper.util.MessageMarshaller();
					        var currentString = messageMarshaller.getString(2000);
					        messageMarshaller.addMessage("This is a test =)");
					        return currentString.length < messageMarshaller.getString(2000).length;
	            }
	        }, {
	            name: "Limit on getString(200) should not return a string longer than 200",
	            run: function(){
	                var messageMarshaller = new easyXDM.wrapper.util.MessageMarshaller();

					        for(var i = 0; i < 500; i++) {
					          messageMarshaller.addMessage("This is a test =)");
					        }

					        return messageMarshaller.getString(200).length <= 200;
	            }
	        }, {
	            name: "Messages should able to move via two marshallers",
	            run: function(){
	                var messageMarshaller1 = new easyXDM.wrapper.util.MessageMarshaller();
					        var messageMarshaller2 = new easyXDM.wrapper.util.MessageMarshaller();

					        messageMarshaller1.addMessage("This is a test =)");
					        return messageMarshaller2.read(messageMarshaller1.getString())[0] == "This is a test =)";
	            }
	        }, {
	            name: "Messages should be removed after read",
	            run: function(){
	                 var messageMarshaller1 = new easyXDM.wrapper.util.MessageMarshaller();
						        var messageMarshaller2 = new easyXDM.wrapper.util.MessageMarshaller();

						        messageMarshaller1.addMessage("This is a test =)");
						        var before = messageMarshaller1.getString();
						        messageMarshaller2.read(messageMarshaller1.getString());
						        messageMarshaller1.read(messageMarshaller2.getString());

						        return 	(before != messageMarshaller1.getString()) &&
						        				(before.length > messageMarshaller1.getString().length);
	            }
	        }, {
	            name: "Should only be able to read a message once",
	            run: function(){
	                var messageMarshaller1 = new easyXDM.wrapper.util.MessageMarshaller();
					        var messageMarshaller2 = new easyXDM.wrapper.util.MessageMarshaller();

					        messageMarshaller1.addMessage("This is a test =)");
					        var firstRead = messageMarshaller2.read(messageMarshaller1.getString());
					        var secoundRead = messageMarshaller2.read(messageMarshaller1.getString());

					        return firstRead.length != secoundRead.length;
	            }
	        }, {
	            name: "Should come out on the same order the where added",
	            run: function(){
	                var messageMarshaller1 = new easyXDM.wrapper.util.MessageMarshaller();
					        var messageMarshaller2 = new easyXDM.wrapper.util.MessageMarshaller();

					        var local = [];
					        for(var i = 0; i < 5; i++) {
					          messageMarshaller1.addMessage("This is a test =)"+i);
					          local.push("This is a test =)"+i);
					        }
					        var result = messageMarshaller2.read(messageMarshaller1.getString());

					        return result.join("") == local.join("");
	            }
	        }, {
	            name: "Should come out on the same order the where added",
	            run: function(){
	                
					        var messageMarshaller1 = new easyXDM.wrapper.util.MessageMarshaller();
					        var messageMarshaller2 = new easyXDM.wrapper.util.MessageMarshaller();

					        var local = [];
					        for(var i = 0; i < 500; i++) {
					          messageMarshaller1.addMessage(""+i);
					          local.push(""+i);
					        }

					        var result = [];
					        for(var i = 0; i < 50; i++) {
					          result = result.concat(messageMarshaller2.read(messageMarshaller1.getString()));
					          messageMarshaller1.read(messageMarshaller2.getString()); // Inform that we have read some messages
					        }

					        return result.join("") == local.join("");
	            }
	        }, {
	            name: "Should be able to send big messages",
	            run: function(){
	                var messageMarshaller1 = new easyXDM.wrapper.util.MessageMarshaller();
					        var messageMarshaller2 = new easyXDM.wrapper.util.MessageMarshaller();

					        // Create a big message
									var bigMessage = ""
									for(var i = 0; i < 5000; i++) {
										bigMessage += ""+i;
									}

									messageMarshaller1.addMessage(bigMessage);

					        var result = [];
					        for(var i = 0; i < 50; i++) {
					          result = result.concat(messageMarshaller2.read(messageMarshaller1.getString()));
					          messageMarshaller1.read(messageMarshaller2.getString()); // Inform that we have read some messages
					        }

					        return result[0] == bigMessage;
	            }
	        }]
	    }]);
}
