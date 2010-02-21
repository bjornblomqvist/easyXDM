/*jslint evil: true, browser: true, immed: true, passfail: true, undef: true, newcap: true*/
/*global easyXDM, window, escape, unescape */


function MessageMarshaller(messageMaxSize) {
  this.messages = [];
  this.last_read = -1;
  this.message_id_counter = 0;
	this.bigMessages = {};
	
	if(messageMaxSize == undefined) {
		messageMaxSize = 1500;
	}
  
  this.addMessage = function(message) {
		if(message.length > messageMaxSize) {
			var bmi = this.message_id_counter++;
			var start = 0;
			while(start < message.length) {
				var slice = message.slice(start,start+messageMaxSize);
				
				var toSend = {id:this.message_id_counter++,data:slice,big_message_id:bmi};
			
				this.messages.push(toSend);
				start += messageMaxSize;
			}
			
			this.messages.push({id:this.message_id_counter++,data:"",big_message_id:bmi,done:true});
			
		} else {
			var toSend = {id:this.message_id_counter++,data:message};
    	this.messages.push(toSend);
		}
  };
  
  this.getString = function(max_string_length) {
    // Default to 1900
    if(max_string_length == undefined) {
      max_string_length = 1900;
    }
    
    var toReturn = {last_read:this.last_read,messages:[]}
    for(var i = 0; i < this.messages.length; i++) {
      // Add a message to send if we are not over the limit
      if(escape(JSON.stringify(toReturn)).length < max_string_length) {
        toReturn.messages.push(this.messages[i]);
      } else {
        toReturn.messages.pop();
        return escape(JSON.stringify(toReturn));
      }
    }

		if(escape(JSON.stringify(toReturn)).length < max_string_length) {
      return escape(JSON.stringify(toReturn));
    } else {
      toReturn.messages.pop();
      return escape(JSON.stringify(toReturn));
    }
  };

	this.hasUnreadMessages = function() {
		return messages.length > 0;
	};
  
  this.remove_messages_with_id_less_or_equal = function(id) {
    
    var idsToRemove = [];
    for(var i = 0; i < this.messages.length; i++) {
      if(this.messages[i].id <= id) {
        idsToRemove.push(this.messages[i].id);
      }
    }
    
    for(var i = 0; i < idsToRemove.length; i++) {
			for(var j = 0; j < this.messages.length; j++) {
	      if(this.messages[j].id == idsToRemove[i]) {
					this.messages.splice(j,1);
	      }
	    }
    }
  };
  
  this.read = function(data_to_read) {
    var incoming_messages = JSON.parse(unescape(data_to_read));
    this.remove_messages_with_id_less_or_equal(incoming_messages.last_read);
    
		// Get the messages
    var toReturn = [];
    for(var i = 0; i < incoming_messages.messages.length; i++) {
      if(incoming_messages.messages[i].id > this.last_read) {
				if(incoming_messages.messages[i].big_message_id != undefined) {				
					if(incoming_messages.messages[i].done) {
						this.bigMessages[incoming_messages.messages[i].big_message_id] += incoming_messages.messages[i].data;
						toReturn.push(this.bigMessages[incoming_messages.messages[i].big_message_id]);
						delete this.bigMessages[incoming_messages.messages[i].big_message_id];
					} else {
						if(this.bigMessages[incoming_messages.messages[i].big_message_id] == undefined) {
							this.bigMessages[incoming_messages.messages[i].big_message_id] = "";
						}
						this.bigMessages[incoming_messages.messages[i].big_message_id] += incoming_messages.messages[i].data;
					}
					
				} else {
					toReturn.push(incoming_messages.messages[i].data);
				}
      }
    }
    
		// Update last_read
		for(var i = 0; i < incoming_messages.messages.length; i++) {
      if(incoming_messages.messages[i].id > this.last_read) {
        this.last_read = incoming_messages.messages[i].id;
      }
    }
		
    
    return toReturn;
  };
  
}


easyXDM.transport = {
	
    /**
     * @class easyXDM.transport.BestAvailableTransport
     * BestAvailableTransport is a transport class that uses the best transport available.<br/>
     * This class will first try to use the PostMessageTransport<br/>
     * then the NameTransport if the <code>remoteHelper</code> parameter is set,<br/>
     * and at last the HashTransport.<br/>
     * The config parameter should contain all parameters needed for the different transports.
     * @constructor
     * @param {easyXDM.configuration.TransportConfiguration} config The transports configuration.
     * @param {Function} onReady A method that should be called when the transport is ready
     * @namespace easyXDM.transport
     */
    BestAvailableTransport: function(config, onReady){
        // #ifdef debug
        easyXDM.Debug.trace("easyXDM.transport.BestAvailableTransport.constructor");
        // #endif
        // If no protocol is set then it means this is the host
        var query = easyXDM.Url.Query();
        var isHost = (typeof query.xdm_p === "undefined");
        var Transport;
        if (isHost) {
            config.channel = (config.channel) ? config.channel : "default";
            if (window.postMessage) {
                Transport = easyXDM.transport.PostMessageTransport;
            }
            else {
                if (config.remoteHelper) {
                    Transport = easyXDM.transport.NameTransport;
                }
                else {
                    Transport = easyXDM.transport.HashTransport;
                }
            }
        }
        else {
            if (typeof query.xdm_e !== "string") {
                throw ("No remote specified");
            }
            config.channel = query.xdm_c;
            config.remote = decodeURIComponent(query.xdm_e);
            switch (query.xdm_p) {
                case "0":
                    Transport = easyXDM.transport.HashTransport;
                    break;
                case "1":
                    Transport = easyXDM.transport.PostMessageTransport;
                    break;
                case "2":
                    Transport = easyXDM.transport.NameTransport;
                    break;
            }
        }
        
        return new Transport(config, onReady);
    },
    /**
     * @class easyXDM.transport.PostMessageTransport
     * PostMessageTransport is a transport class that uses HTML5 postMessage for communication
     * <a href="http://msdn.microsoft.com/en-us/library/ms644944(VS.85).aspx">http://msdn.microsoft.com/en-us/library/ms644944(VS.85).aspx</a>
     * <a href="https://developer.mozilla.org/en/DOM/window.postMessage">https://developer.mozilla.org/en/DOM/window.postMessage</a>
     * @constructor
     * @param {easyXDM.configuration.TransportConfiguration} config The transports configuration.
     * @param {Function} onReady A method that should be called when the transport is ready
     * @cfg {Mixed} local Any value that will evaluate as True
     * @cfg {String} remote The url to the remote document to interface with
     * @cfg {String} channel The name of the channel to use
     * @cfg {Function} onMessage The method that should handle incoming messages.<br/> This method should accept two arguments, the message as a string, and the origin as a string.
     * @namespace easyXDM.transport
     */
    PostMessageTransport: function(config, onReady){
        if (!window.postMessage) {
            throw new Error("This browser does not support window.postMessage");
        }
        // #ifdef debug
        easyXDM.Debug.trace("easyXDM.transport.PostMessageTransport.constructor");
        // #endif
        // If no protocol is set then it means this is the host
        var isHost = (typeof easyXDM.Url.Query().xdm_p === "undefined");
        var _callerWindow, _targetOrigin = easyXDM.Url.getLocation(config.remote), _window_onMessageImplementation;
        
        /**
         * Resolves the origin from the event object
         * @private
         * @param {Object} event The messageevent
         * @return {String} The scheme, host and port of the origin
         */
        function _getOrigin(event){
            if (event.origin) {
                // This is the HTML5 property
                return event.origin;
            }
            if (event.uri) {
                // From earlier implementations 
                return easyXDM.Url.getLocation(event.uri);
            }
            if (event.domain) {
                // This is the last option and will fail if the 
                // origin is not using the same schema as we are
                return location.protocol + "//" + event.domain;
            }
            throw "Unable to retrieve the origin of the event";
        }
        
        /**
         * Delays calling onReady until the class has been returned
         * @private
         */
        function _onReady(){
            if (onReady) {
                window.setTimeout(onReady, 5);
            }
        }
        
        /**
         * The main onMessage handler. This will pass on the event to the real implementation
         * @private
         * @param {Object} event The messageevent
         */
        function _window_onMessage(event){
            // #ifdef debug
            easyXDM.Debug.trace("onMessage");
            // #endif
            _window_onMessageImplementation(event);
        }
        easyXDM.DomHelper.addEventListener(window, "message", _window_onMessage);
        
        /**
         * This is the main implementation for the onMessage event.<br/>
         * It checks the validity of the origin and passes the message on if appropriate.
         * @private
         * @param {Object} event The messageevent
         */
        function _handleMessage(event){
            var origin = _getOrigin(event);
            // #ifdef debug
            easyXDM.Debug.trace("received message '" + event.data + "' from " + origin);
            // #endif
            if (origin == _targetOrigin && event.data.substring(0, config.channel.length + 1) == config.channel + " ") {
                config.onMessage(event.data.substring(config.channel.length + 1), origin);
            }
        }
        
        /**
         * Used by local to fire the onReady method.
         * After being notified by the remote, this method will replace the
         * onMessage handler with _handleMessage and fire onReady
         * @private
         * @param {Object} event The messageevent
         */
        function _waitForReady(event){
            if (event.data == config.channel + "-ready") {
                // #ifdef debug
                easyXDM.Debug.trace("firing onReady");
                // #endif
                // We use memoization to avoid having to run this check each time
                _window_onMessageImplementation = _handleMessage;
                _onReady();
            }
            // #ifdef debug
            else {
                easyXDM.Debug.trace("received unexpected message: " + event.data + ", expected " + config.channel + "-ready");
            }
            // #endif
        }
        /**
         * Destroy all that we can destroy :)
         */
        this.destroy = function(){
            // #ifdef debug
            easyXDM.Debug.trace("destroying transport");
            // #endif
            easyXDM.DomHelper.removeEventListener(window, "message", _window_onMessage);
            if (isHost) {
                _callerWindow.parentNode.removeChild(_callerWindow);
                _callerWindow = null;
            }
        };
        
        
        /** 
         * Sends the message using the postMethod method available on the window object
         * @param {String} message The message to send
         */
        this.postMessage = (function(){
            // Set up the messaging differently dependin on being local or remote
            if (isHost) {
                _window_onMessageImplementation = _waitForReady;
                _callerWindow = easyXDM.DomHelper.createFrame(easyXDM.Url.appendQueryParameters(config.remote, {
                    xdm_e: location.protocol + "//" + location.host,
                    xdm_c: config.channel,
                    xdm_p: 1 // 1 = PostMessage
                }), config.container);
                return function(message){
                    // #ifdef debug
                    easyXDM.Debug.trace("sending message '" + message + "' to iframe " + _targetOrigin);
                    // #endif
                    _callerWindow.contentWindow.postMessage(config.channel + " " + message, _targetOrigin);
                };
            }
            else {
                _window_onMessageImplementation = _handleMessage;
                // #ifdef debug
                easyXDM.Debug.trace("firing onReady");
                // #endif
                window.parent.postMessage(config.channel + "-ready", _targetOrigin);
                _onReady();
                return function(message){
                    // #ifdef debug
                    easyXDM.Debug.trace("sending message '" + message + "' to parent " + _targetOrigin);
                    // #endif
                    window.parent.postMessage(config.channel + " " + message, _targetOrigin);
                };
                
            }
        }());
    },
    
    /**
     * @class easyXDM.transport.HashTransport
     * HashTransport is a transport class that uses the IFrame URL Technique for communication.<br/>
     * This means that the amount of data that is possible to send in each message is limited to the length the browser
     * allows for urls - the length of the url for <code>local</code>.
     * <a href="http://msdn.microsoft.com/en-us/library/bb735305.aspx">http://msdn.microsoft.com/en-us/library/bb735305.aspx</a>
     * @constructor
     * @param {easyXDM.configuration.TransportConfiguration} config The transports configuration.
     * @param {Function} onReady A method that should be called when the transport is ready
     * @cfg {Number} readyAfter The number of milliseconds to wait before firing onReady. To support using passive hash files.
     * @cfg {String/Window} local The url to the local document for calling back, or the local window.
     * @cfg {String} remote The url to the remote document to interface with
     * @cfg {Function} onMessage The method that should handle incoming messages.<br/> This method should accept two arguments, the message as a string, and the origin as a string.
     * @namespace easyXDM.transport
     */
    HashTransport: function(config, onReady){
        // #ifdef debug
        easyXDM.Debug.trace("easyXDM.transport.HashTransport.constructor");
        // #endif
        // If no protocol is set then it means this is the host
        var isHost = (typeof easyXDM.Url.Query().xdm_p === "undefined");
        var _timer, pollInterval = config.interval || 300, usePolling = false, useParent = false, useResize = true;
        var _lastMsg = "#" + config.channel, _msgNr = 0, _listenerWindow, _callerWindow;
        var _remoteUrl, _remoteOrigin = easyXDM.Url.getLocation(config.remote);
				var _messageMarshaller = new MessageMarshaller();
        
        if (isHost) {
            var parameters = {
                xdm_c: config.channel,
                xdm_p: 0 // 0 = HashTransport
            };
            if (config.local === window) {
                // We are using the current window to listen to
                usePolling = true;
                useParent = true;
                parameters.xdm_e = encodeURIComponent(config.local = location.protocol + "//" + location.host + location.pathname + location.search);
                parameters.xdm_pa = 1; // use parent
            }
            else {
                parameters.xdm_e = easyXDM.Url.resolveUrl(config.local);
            }
            if (config.container) {
                useResize = false;
                parameters.xdm_po = 1; // use polling
            }
            _remoteUrl = easyXDM.Url.appendQueryParameters(config.remote, parameters);
        }
        else {
            var query = easyXDM.Url.Query();
            _listenerWindow = window;
            useParent = (typeof query.xdm_pa !== "undefined");
            usePolling = (typeof query.xdm_po !== "undefined");
            _remoteUrl = config.remote + "#" + config.channel;
        }
        // #ifdef debug
        if (usePolling) {
            easyXDM.Debug.trace("using polling to listen");
        }
        if (useResize) {
            easyXDM.Debug.trace("using resizing to call");
        }
        if (useParent) {
            easyXDM.Debug.trace("using current window as " + (config.local ? "listenerWindow" : "callerWindow"));
        }
        // #endif


				function _updateHash() {
					
					var hashValue = _messageMarshaller.getString();
					var srcValue = 	_remoteUrl + "#" + (_msgNr++) + "_" + encodeURIComponent(hashValue);
					
					if (isHost || !useParent) {
              // We are referencing an iframe
							
              _callerWindow.src = srcValue;
              if (useResize) {
                  _callerWindow.width = _callerWindow.width > 75 ? 50 : 100;
              }
          }
          else {
              // We are referencing the parent window
              _callerWindow.location = srcValue;
          }
				};


        /**
         * Checks location.hash for a new message and relays this to the receiver.
         * @private
         */
        function _checkForMessage(){
            try {
								var currentHash = _listenerWindow.location.hash;
                if (currentHash && currentHash != _lastMsg) {
                    _lastMsg = currentHash;
                    // #ifdef debug
                    easyXDM.Debug.trace("received message '" + _lastMsg + "' from " + _remoteOrigin);
                    // #endif	

										var hashValue = decodeURIComponent(_lastMsg.substring(_lastMsg.indexOf("_") + 1));
										var messages = _messageMarshaller.read(hashValue);
										
										for(var i = 0; i < messages.length; i++) {
											easyXDM.Debug.trace("onMessage for message "+messages[i]);
											config.onMessage(messages[i], _remoteOrigin);
										}
                }
								// We update the hash to inform the other side that we have read som messages
								_updateHash();
            } 
            catch (ex) {
                // #ifdef debug
                easyXDM.Debug.trace(ex.message);
                // #endif
            }
        }
        
        /**
         * Calls the supplied onReady method<br/>
         * We delay this so that the the call to createChannel or createTransport will have completed.
         * @private
         */
        function _onReady(){
            if (isHost) {
                if (useParent) {
                    _listenerWindow = window;
                }
                else {
                    if (config.readyAfter) {
                        // We must try obtain a reference to the correct window, this might fail 
                        _listenerWindow = window.open(config.local + "#" + config.channel, "remote_" + config.channel);
                    }
                    else {
                        _listenerWindow = easyXDM.transport.HashTransport.getWindow(config.channel);
                    }
                    if (!_listenerWindow) {
                        // #ifdef debug
                        easyXDM.Debug.trace("Failed to obtain a reference to the window");
                        // #endif
                        throw new Error("Failed to obtain a reference to the window");
                    }
                }
            }
            if (usePolling) {
                // #ifdef debug
                easyXDM.Debug.trace("starting polling");
                // #endif
                _timer = window.setInterval(function(){
                    _checkForMessage();
                }, pollInterval);
            }
            else {
                easyXDM.DomHelper.addEventListener(_listenerWindow, "resize", _checkForMessage);

								// Also use a poll thread as resizeing dosent seam to always work, check for droped messages timesout without this
								_timer = window.setInterval(function(){
                    _checkForMessage();
                }, pollInterval);
            }
            if (onReady) {
                window.setTimeout(onReady, 10);
            }
        }
       

        /** 
         * Sends a message by encoding and placing it in the hash part of _callerWindows url.
         * We include a message number so that identical messages will be read as separate messages.
         * @param {String} message The message to send
         */
        this.postMessage = function(message){
            // #ifdef debug
            easyXDM.Debug.trace("sending message '" + message + "' to " + _remoteOrigin);
            // #endif
							
						_messageMarshaller.addMessage(message);
						_updateHash();
        };
        
        /**
         * Tries to clean up the DOM
         */
        this.destroy = function(){
            // #ifdef debug
            easyXDM.Debug.trace("destroying transport");
            // #endif
            if (_timer) {
                window.clearInterval(_timer);
            }
            else {
                if (_listenerWindow) {
                    easyXDM.DomHelper.removeEventListener(_listenerWindow, "resize", _checkForMessage);
                }
            }
            if (isHost || !useParent) {
                _callerWindow.parentNode.removeChild(_callerWindow);
            }
            _callerWindow = null;
        };
        
        if (isHost) {
            if (config.readyAfter) {
                // Fire the onReady method after a set delay
                window.setTimeout(_onReady, config.readyAfter);
            }
            else {
                // Register onReady callback in the library so that
                // it can be called when hash.html has loaded.
                easyXDM.Fn.set(config.channel, _onReady);
            }
        }
        if (!isHost && useParent) {
            _callerWindow = parent;
            _onReady();
        }
        else {
            _callerWindow = easyXDM.DomHelper.createFrame(_remoteUrl, config.container, (isHost && !useParent) ? null : _onReady, (isHost ? "local_" : "remote_") + config.channel);
        }
    }
};

/**
 * Contains the proxy windows used to read messages from remote when
 * using HashTransport.
 * @static
 * @namespace easyXDM.transport
 */
easyXDM.transport.HashTransport.windows = {};

/**
 * Notify that a channel is ready and register a window to be used for reading messages
 * for on the channel.
 * @static
 * @param {String} channel
 * @param {Window} contentWindow
 * @namespace easyXDM.transport
 */
easyXDM.transport.HashTransport.channelReady = function(channel, contentWindow){
    var ht = easyXDM.transport.HashTransport;
    ht.windows[channel] = contentWindow;
    // #ifdef debug
    easyXDM.Debug.trace("executing onReady callback for channel " + channel);
    // #endif
    easyXDM.Fn.get(channel, true)();
};

/**
 * Returns the window associated with a channel
 * @static
 * @param {String} channel
 * @return {Window} The window
 * @namespace easyXDM.transport
 */
easyXDM.transport.HashTransport.getWindow = function(channel){
    return easyXDM.transport.HashTransport.windows[channel];
};


/**
 * @class easyXDM.transport.NameTransport
 * NameTransport uses the window.name property to relay data - this means it can transport large amounts of data
 * @constructor
 * @param {easyXDM.configuration.TransportConfiguration} config The transports configuration.
 * @param {Function} onReady A method that should be called when the transport is ready
 * @cfg {String} local The url to the local instance of hash.html
 * @cfg {String} remote The url to the remote document to interface with
 * @cfg {String} remoteHelper The url to the remote instance of hash.html - this is only needed for the host.
 * @cfg {Function} onMessage The method that should handle incoming messages.<br/> This method should accept two arguments, the message as a string, and the origin as a string.
 * @namespace easyXDM.transport
 */
easyXDM.transport.NameTransport = function(config, onReady){
    var me = this;
    // #ifdef debug
    easyXDM.Debug.trace("easyXDM.transport.NameTransport.constructor");
    // #endif
    // If no protocol is set then it means this is the host
    var isHost = (typeof easyXDM.Url.Query().xdm_p === "undefined");
    
    var callerWindow, remoteWindow, readyCount = 0;
    var remoteOrigin = easyXDM.Url.getLocation(config.remote), remoteUrl;
    config.local = easyXDM.Url.resolveUrl(config.local);
    
    function _onReady(){
        if (isHost) {
            if (++readyCount === 2 || !isHost && onReady) {
                window.setTimeout(onReady, 10);
            }
        }
        else {
            if (!isHost) {
                me.postMessage("ready");
            }
            if (onReady) {
                // #ifdef debug
                easyXDM.Debug.trace("calling onReady");
                // #endif
                window.setTimeout(onReady, 10);
            }
        }
        
    }
    
    if (isHost) {
        // Register the callback
        easyXDM.Fn.set(config.channel, function(message){
            if (isHost && message === "ready") {
                // Replace the handler
                easyXDM.Fn.set(config.channel, function(message){
                    config.onMessage(message, remoteOrigin);
                });
                _onReady();
            }
        });
        
        // Set up the frame that points to the remote instance
        remoteUrl = easyXDM.Url.appendQueryParameters(config.remote, {
            xdm_e: config.local,
            xdm_c: config.channel,
            xdm_p: 2
        });
        
        remoteWindow = easyXDM.DomHelper.createFrame(remoteUrl + '#' + config.channel, config.container, null, config.channel);
    }
    else {
        config.remoteHelper = config.remote;
        easyXDM.Fn.set(config.channel, function(message){
            config.onMessage(message, remoteOrigin);
        });
    }
    // Set up the iframe that will be used for the transport
    callerWindow = easyXDM.DomHelper.createFrame(config.local, null, function(){
        // Remove the handler
        easyXDM.DomHelper.removeEventListener(callerWindow, "load", callerWindow.loadFn);
        _onReady();
    });
    
    /** 
     * Sends a message by placing it in the <code>name</code> property of the callerWindow and then
     * redirecting the window to the remote instance of hash.html.<br/>
     * hash.html will send the document back after having passed on the message.
     * @param {String} message The message to send
     */
    this.postMessage = function(message){
        // #ifdef debug
        easyXDM.Debug.trace("sending message '" + message + "' to " + remoteOrigin);
        // #endif
        callerWindow.name = message;
        if (isHost) {
            // #ifdef debug
            easyXDM.Debug.trace("navigating to '" + config.remoteHelper + "#_3" + encodeURIComponent(remoteUrl + "#" + config.channel) + "'");
            // #endif
            callerWindow.src = config.remoteHelper + "#_3" + encodeURIComponent(remoteUrl + "#" + config.channel);
        }
        else {
            // #ifdef debug
            easyXDM.Debug.trace("navigating to  '" + config.remoteHelper + "#_2" + config.channel + "'");
            // #endif
            callerWindow.src = config.remoteHelper + "#_2" + config.channel;
        }
    };
    
    /**
     * Tries to clean up the DOM
     */
    this.destroy = function(){
        // #ifdef debug
        easyXDM.Debug.trace("destroying transport");
        // #endif
        callerWindow.parentNode.removeChild(callerWindow);
        callerWindow = null;
        if (isHost) {
            remoteWindow.parentNode.removeChild(remoteWindow);
            remoteWindow = null;
        }
    };
};
