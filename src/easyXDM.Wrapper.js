/*jslint evil: true, browser: true, immed: true, passfail: true, undef: true, newcap: true*/
/*global easyXDM, window, escape, unescape */


easyXDM.wrapper = {
	
	MessageQueue: function(TransportToWrap,config,onReady) {
	
	
		// #ifdef debug
	  easyXDM.Debug.trace("easyXDM.wrapper.MessageQueue.constructor");
	  // #endif
	
		

		
		var _this = this;
		var _messageMarshaller = new easyXDM.wrapper.util.MessageMarshaller();
		
		
		/*
		 * We need to create a copy of the config so that the behaviour
		 * of letting the user of the transport change the onMessage function 
		 * at any time is intact.
		 */
		this.config = {};
		this.config.prototype = config.prototype;
		for (var i in config) {
			if (true) { this.config[i] = config[i]; } // Had to wrap it in a if statement to make jslint accept it
		}
		
		
		var _lastMessageRead = "";
	
		config.onMessage = function(message, origin) {

			/*
			 * Get messages and inform the other side that they
			 * are read by sending a new message to the other side
			 * with the latests last_read value.
			 */
			var messages = _messageMarshaller.read(message);
			if(_lastMessageRead != message) { // We only inform the other side if its a message we havent read before
				_this.inner_transport.postMessage(_messageMarshaller.getString());
			}

			/*
			 * Push out all the messages to the onMessage function
			 */
			for(var i = 0; i < messages.length; i++) {
				_this.config.onMessage(messages[i],origin);
			}
			
			_lastMessageRead = message;
		};
	
		/** 
	   * Sends the message using the postMethod method available on the window object
	   * @param {String} message The message to send
	   */
	  this.postMessage = function(message) {
				_messageMarshaller.addMessage(message);
	      this.inner_transport.postMessage(_messageMarshaller.getString());
	  };

		/**
	   * Destroy all that we can destroy :)
	   */
	  this.destroy = function(){
	      this.inner_transport.destroy();
	  };

	
		this.inner_transport = new TransportToWrap(config, onReady);
	

		return this;
	}
};


easyXDM.wrapper.util = {
	/**
   * @class easyXDM.wrapper.util.MessageMarshaller
	 * MessageMarshaller is a queue and message fragmenter to be used to send
	 * data over a unreliable transport. It takes messages and gives a string that can be sent
	 * to the other side. Messages are numbered and both ends send over last read message witch is
	 * used when removing messages from the queue.
   * @constructor
	 * @param {Integer} messageMaxSize the max size a message can be before we slit it into framgments, defaults to 1700
   * @namespace easyXDM.wrapper.util
   */
	MessageMarshaller: function(messageMaxSize) {
	  this.messages = [];
	  this.last_read = -1;
	  this.message_id_counter = 0;
		this.bigMessages = {};

		if(messageMaxSize === undefined) {
			messageMaxSize = 1700;
		}

	  this.addMessage = function(message) {
			if(message.length > messageMaxSize) {
				var bmi = this.message_id_counter++;
				var start = 0;
				while(start < message.length) {
					var slice = message.slice(start,start+messageMaxSize);
					this.messages.push({id:this.message_id_counter++,data:slice,big_message_id:bmi});
					start += messageMaxSize;
				}
				this.messages.push({id:this.message_id_counter++,data:"",big_message_id:bmi,done:true});

			} else {
	    	this.messages.push({id:this.message_id_counter++,data:message});
			}
	  };

	  this.getString = function(max_string_length) {
	    // Default to 1900
	    if(max_string_length === undefined) {
	      max_string_length = 1900;
	    }

	    var toReturn = {last_read:this.last_read,messages:[]};
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

	  this.remove_messages_with_id_less_or_equal = function(id) {

	    var idsToRemove = [];
			
	    for(var i = 0; i < this.messages.length; i++) {
	      if(this.messages[i].id <= id) {
	        idsToRemove.push(this.messages[i].id);
	      }
	    }

	    for(var i2 = 0; i2 < idsToRemove.length; i2++) {
				for(var j = 0; j < this.messages.length; j++) {
		      if(this.messages[j].id == idsToRemove[i2]) {
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

					if(incoming_messages.messages[i].big_message_id !== undefined) {				
						if(incoming_messages.messages[i].done) {
							this.bigMessages[incoming_messages.messages[i].big_message_id] += incoming_messages.messages[i].data;
							toReturn.push(this.bigMessages[incoming_messages.messages[i].big_message_id]);
							delete this.bigMessages[incoming_messages.messages[i].big_message_id];
						} else {
							if(this.bigMessages[incoming_messages.messages[i].big_message_id] === undefined) {
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
			for(var i2 = 0; i2 < incoming_messages.messages.length; i2++) {
	      if(incoming_messages.messages[i2].id > this.last_read) {
	        this.last_read = incoming_messages.messages[i2].id;
	      }
	    }


	    return toReturn;
	  };
	}
};


