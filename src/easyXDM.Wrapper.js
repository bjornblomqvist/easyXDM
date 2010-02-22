

easyXDM.wrapper = {
	
	MessageMarshaller: function(messageMaxSize) {
	  this.messages = [];
	  this.last_read = -1;
	  this.message_id_counter = 0;
		this.bigMessages = {};

		if(messageMaxSize == undefined) {
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

	,MessageQueue: function(TransportToWrap,config,onReady) {
	
	
		// #ifdef debug
	  easyXDM.Debug.trace("easyXDM.wrapper.MessageQueue.constructor");
	  // #endif
	
		


		function _clone(obj)
		 { var clone = {};
		   clone.prototype = obj.prototype;
		   for (property in obj) clone[property] = obj[property];
		   return clone;
		 };
		
		var _this = this;
		var _messageMarshaller = new easyXDM.wrapper.MessageMarshaller();
		this.config = _clone(config);
		var lastMessage = "";
	
		config.onMessage = function(message, origin) {
			// #ifdef debug
		  easyXDM.Debug.trace("reading",message);
		  // #endif
			var messages = _messageMarshaller.read(message);
			// #ifdef debug
		  easyXDM.Debug.trace("read result",messages);
		  // #endif
			for(var i = 0; i < messages.length; i++) {
				_this.config.onMessage(messages[i],origin);
			}
			// Inform the other side that we have read the message
			if(lastMessage != message || messages.length > 0) {
				_this.inner_transport.postMessage(_messageMarshaller.getString());
			}
			lastMessage = message;
		}
	
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
}

