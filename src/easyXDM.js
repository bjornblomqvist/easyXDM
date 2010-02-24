/*jslint evil: true, browser: true, immed: true, passfail: true, undef: true, newcap: true*/
/*global easyXDM: true, window, escape, unescape */

/** 
 * @class easyXDM
 * A javascript library providing cross-browser, cross-site messaging/method invocation.<br/>
 * easyXDM.Debug and the easyXDM.configuration namespace is only available in the debug version.
 * @version %%version%%
 * @singleton
 */
easyXDM = {
    /**
     * The version of the library
     * @type {String}
     */
    version: "%%version%%",
    /**
     * Applies properties from the source object to the target object
     * @param {Object} target The target of the properties
     * @param {Object} source The source of the properties
     */
    apply: function(target, source){
        if (!source) {
            return;
        }
        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                target[key] = source[key];
            }
        }
    },
    
    // #ifdef debug
    /**
     * @class easyXDM.Debug
     * Utilities for debugging. This class is only precent in the debug version.
     * @singleton
     * @namespace easyXDM
     */
    Debug: {
        /**
         * Logs the message to console.log if available
         * @param {String} msg The message to log
         */
        log: function(msg){
            // Uses memoizing to cache the implementation
            var log;
            if (typeof console === "undefined" || typeof console.log === "undefined") {
                /**
                 * Sets log to be an empty function since we have no output available
                 * @ignore
                 */
                log = function(){
                };
            }
            else {
                /**
                 * Sets log to be a wrapper around console.log
                 * @ignore
                 * @param {String} msg
                 */
                log = function(msg){
                    console.log(location.host + ":" + msg);
                };
            }
            log(msg);
            easyXDM.Debug.log = log;
        },
				logWindow:undefined,
        /**
         * Will try to trace the given message either to a DOMElement with the id "log",
         * or by using console.info.
         * @param {String} msg The message to trace
         */
        trace: function(msg){
	
            /*
						 *	Move the arguments to an array so we can call unshift and join
						 */
						var args = [];
						for(var i = 0; i < arguments.length; i++) {
							args.push(arguments[i]);
						}
						
						// Add the time and domain
						args.unshift((new Date().getTime()+"").slice(-6)+" "+ location.host  + ":\t");
						
						
						/*
						 * Always write to console if we have one
						 */
						if (typeof console === "undefined" || typeof console.info === "undefined") {
							
														
							
								// Fallback is the log window.
								var el = document.getElementById("log");
		            if (el) {
		                /**
		                 * Output the messages to the DOMElement with id "log"
		                 */

		                 try {
		                     el.appendChild(document.createElement("div")).appendChild(document.createTextNode(args.join(" ")));
		                     el.scrollTop = el.scrollHeight;
		                 } 
		                 catch (e) {
		                     //In case we are unloading
		                 }
		            } else {
									
                 /**
                  * As i really want to be able to see what is happening we open a window and write to it
                  * @ignore
                  */
									if(this.logWindow === undefined) {
										this.logWindow = window.open('log.html#'+location.host,(location.host+"logwindow").replace(":","_"));
									}
									try {
	                 	this.logWindow.log(args.join(" "));
	                } 
                 	catch (e2) {
                     //In case the window gets removed
                 	}
								}
             }
             else {
                 /**
                  * Use console.info
                  */
									console.info.apply(console,args);
             }
            
        }
    },
    
    // #endif
    /** 
     * @class easyXDM.Interface
     * Creates an interface that can be used to call methods implemented
     * on the remote end of the channel, and also to provide the implementation
     * of methods to be called from the remote end.
     * @constructor
     * @param {easyXDM.configuration.ChannelConfiguration} channelConfig The underlying channels configuration.
     * @param {easyXDM.configuration.InterfaceConfiguration} config The description of the interface to implement
     * @param {Function} onReady A method that should be called when the interface is ready
     * @namespace easyXDM
     */
    Interface: function(channelConfig, config, onReady){
        // #ifdef debug
        easyXDM.Debug.trace("creating new interface");
        // #endif
        var _channel;
        var _callbackCounter = 0, _callbacks = {};
				this.remote_origin;
				var _this = this;
        
        /**
         * Creates a method that implements the given definition
         * @private
         * @param {easyXDM.configuration.Methods.Method} The method configuration
         * @param {String} name The name of the method
         */
        function _createMethod(definition, name){
            // Add the scope so that calling the methods will work as expected
            if (typeof definition.scope === "undefined") {
                definition.scope = window;
            }
            if (definition.isVoid) {
                // #ifdef debug
                easyXDM.Debug.trace("creating void method " + name);
                // #endif
                // No need to register a callback
                return function(){
                    // #ifdef debug
                    easyXDM.Debug.trace("executing void method " + name);
                    // #endif
                    var params = Array.prototype.slice.call(arguments, 0);
                    // Send the method request
                    window.setTimeout(function(){
                        _channel.sendData({
                            name: name,
                            params: params
                        });
                    }, 0);
                };
            }
            else {
                // #ifdef debug
                easyXDM.Debug.trace("creating method " + name);
                // #endif
                // We need to extract and register the callback
                return function(){
                    // #ifdef debug
                    easyXDM.Debug.trace("executing method " + name);
                    // #endif
                    _callbacks["" + (++_callbackCounter)] = arguments[arguments.length - 1];
                    var request = {
                        name: name,
                        id: (_callbackCounter),
                        params: Array.prototype.slice.call(arguments, 0, arguments.length - 1)
                    };
                    // Send the method request
                    window.setTimeout(function(){
                        _channel.sendData(request);
                    }, 0);
                };
            }
        }
        
        /**
         * Executes the exposed method
         * @private
         * @param {String} name The name of the method
         * @param {Number} id The callback id to use
         * @param {Function} method The exposed implementation
         * @param {Array} params The parameters supplied by the remote end
         */
        function _executeMethod(name, id, method, params){
            if (!method) {
                throw new Error("The method " + name + " is not implemented.");
            }
            if (method.isAsync) {
                // #ifdef debug
                easyXDM.Debug.trace("requested to execute async method " + name);
                // #endif
                // The method is async, we need to add a callback
                params.push(function(result){
                    // Send back the result
                    _channel.sendData({
                        id: id,
                        response: result
                    });
                });
                // Call local method
                method.method.apply(method.scope, params);
            }
            else {
                if (method.isVoid) {
                    // #ifdef debug
                    easyXDM.Debug.trace("requested to execute void method " + name);
                    // #endif
                    // Call local method 
                    method.method.apply(method.scope, params);
                }
                else {
                    // #ifdef debug
                    easyXDM.Debug.trace("requested to execute method " + name);
                    // #endif
                    // Call local method and send back the response
                    _channel.sendData({
                        id: id,
                        response: method.method.apply(method.scope, params)
                    });
                }
            }
        }
        
        channelConfig.converter = config.serializer || JSON;
        
        /**
         * Handles incoming data.<br/>
         * This can be either a request a method invocation, the response to one.
         * @private
         * @param {Object} data The JSON data object
         * @param {String} origin The origin of the message
         */
        channelConfig.onData = function(data, origin){
            if (data.name) {
                // #ifdef debug
                easyXDM.Debug.trace("received request to execute method " + data.name + (data.id ? (" using callback id " + data.id) : ""));
                // #endif
                // A method call from the remote end
								_this.remote_origin = origin;
								window.exsyXDM_current_origin = origin;
                _executeMethod(data.name, data.id, config.local[data.name], data.params);
            }
            else {
                // #ifdef debug
                easyXDM.Debug.trace("received return value destined to callback with id " + data.id);
                // #endif
                // A method response from the other end
                _callbacks[data.id](data.response);
                delete _callbacks[data.id];
            }
        };
        
        /**
         * Tries to destroy the underlying channel and to remove all traces of the interface.
         */
        this.destroy = function(){
            _channel.destroy();
            for (var x in this) {
                if (this.hasOwnProperty(x)) {
                    delete this[x];
                }
            }
        };
        
        if (config.remote) {
            // #ifdef debug
            easyXDM.Debug.trace("creating concrete implementations");
            // #endif
            // Implement the remote sides exposed methods
            for (var name in config.remote) {
                if (config.remote.hasOwnProperty(name)) {
                    this[name] = _createMethod(config.remote[name], name);
                }
            }
        }
        // Delay setting up the channel until the interface has been returned
        window.setTimeout(function(){
            _channel = new easyXDM.Channel(channelConfig, onReady);
        }, 5);
    },
    /**
     * @class easyXDM.Channel
     * A channel wrapping an underlying transport.
     * @constructor
     * @param {easyXDM.ChannelConfiguration} config The channels configuration
     * @cfg {JSON} serializer The object used to serializer/deserialize the data
     * @cfg {Function} onData The method that should handle incoming data.<br/> This method should accept two arguments, the data as an object, and the origin as a string.
     * @param {Function} onReady A method that should be called when the channel is ready
     * @namespace easyXDM
     */
    Channel: function(config, onReady){
        // #ifdef debug
        easyXDM.Debug.trace("easyXDM.Channel.constructor");
        // #endif
        // For compatibility
        config.serializer = config.serializer || config.converter;
        if (!config.serializer) {
            throw new Error("No serializer present. You should use the easyXDM.transport classes directly.");
        }
        /**
         * Wraps the transports onMessage method using the supplied serializer to convert.
         * @param {Object} data
         * @private
         */
        config.onMessage = function(message, origin){
            this.onData(this.serializer.parse(message), origin);
        };
        
        /**
         * The underlying transport used by this channel
         * @type easyXDM.transport.ITransport
         */
        this.transport = null;
        /**
         * Tries to destroy the underlying transport
         */
        this.destroy = function(){
            // #ifdef debug
            easyXDM.Debug.trace("easyXDM.Channel.destroy");
            // #endif
            this.transport.destroy();
        };
        /**
         * Send data using the underlying transport
         * If a serializer is specified then this will be used to serialize the data first.
         * @param {Object} data the data to send
         */
        this.sendData = function(data){
            this.transport.postMessage(config.serializer.stringify(data));
        };
        
        var that = this;
        
        // Delay setting up the transport until the Channel is returned
        window.setTimeout(function(){
            that.transport = new easyXDM.transport.BestAvailableTransport(config, onReady);
        }, 5);
    },
    
    /**
     * @class easyXDM.Fn
     * This contains methods related to function handling, such as storing callbacks.
     * @singleton
     * @namespace easyXDM
     */
    Fn: {
        /**
         * The map containing the stored functions
         * @namespace easyXDM.fn
         */
        map: {},
        /**
         * Stores a function using the given name for reference
         * @param {String} name The name that the function should be referred by
         * @param {Function} fn The function to store
         * @namespace easyXDM.fn
         */
        set: function(name, fn){
            // #ifdef debug
            easyXDM.Debug.trace("storing function " + name);
            // #endif
            this.map[name] = fn;
        },
        /**
         * Retrieves the function referred to by the given name
         * @param {String} name The name of the function to retrieve
         * @param {Boolean} del If the function should be deleted after retrieval
         * @return {Function} The stored function
         * @namespace easyXDM.fn
         */
        get: function(name, del){
            // #ifdef debug
            easyXDM.Debug.trace("retrieving function " + name);
            // #endif
            var fn = this.map[name];
            if (del) {
                delete this.map[name];
            }
            return fn;
        }
    }
};

// #ifdef debug
easyXDM.Debug.log("easyXDM present on '" + location.href);
// #endif
