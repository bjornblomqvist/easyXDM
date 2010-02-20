/*jslint evil: true, browser: true, immed: true, passfail: true, undef: true, newcap: true*/
/*global easyTest, easyXDM, window*/
var _remoteUrl = location.href.substring(0, location.href.lastIndexOf("/") + 1);
if (_remoteUrl.indexOf("easyxdm.net") !== -1) {
    _remoteUrl = _remoteUrl.replace("easyxdm.net", "provider.easyxdm.net");
}
if (_remoteUrl.indexOf("localhost") !== -1) {
    _remoteUrl = _remoteUrl.replace("localhost", "127.0.0.1");
}
if (_remoteUrl.indexOf("git.bits2life.com:3001") !== -1) {
    _remoteUrl = _remoteUrl.replace("git.bits2life.com:3001", "darwin.bits2life.com");
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
    }, 		{
		        name: "test easyXDM.transport.HashTransport using polling",
		        setUp: function(){
		            this.expectedMessage = "1abcd1234";
		        },
		        steps: [{
		            name: "onReady is fired",
		            timeout: 9000,
		            run: function(){
		                var scope = this;
		                this.transport = new easyXDM.transport.HashTransport({
		                    channel: "default1",
		                    local: "../hash.html",
		                    remote: _remoteUrl + "test_transport.html",
		                    onMessage: function(message, origin){
		                        scope.notifyResult((scope.expectedMessage === message));
		                    },
		                    container: document.getElementById("embedded")
		                }, function(){
												alert("done ?");
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
		    }
]);
}
