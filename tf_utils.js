/*
 *	Serialization and Deserialization of network messages  
 */
function TFSerialization (opt){
	opt = opt || {};
	this.maxLength = opt.startMaxLength || 2048; //2Kb maximum  size
	this.offset = 0; //offset in bytes.
	this.createBuffer();
	this.protocol = opt.protocol || false; //flag indicates use of protocol or not
	return this;
}

TFSerialization.prototype.createBuffer = function(){
	this.buffer = new ArrayBuffer(this.maxLength);
	this.intView = new Int32Array(this.buffer);
	this.byteView = new Uint8Array(this.buffer);
};

TFSerialization.prototype.getBuffer = function(){
	return this.getArray().buffer;
};

TFSerialization.prototype.getArray = function(){
	var buffer = new ArrayBuffer(this.offset);
	var array = new Int32Array(buffer);

	array.set(this.intView.subarray(0, this.offset / 4));
	return array;
};
TFSerialization.prototype.getBytes = function(t){
	if(t){
		var buffer = new ArrayBuffer(this.offset);
		var array = new Uint8Array(buffer);
		array.set(this.byteView.subarray(0, this.offset));
		return array;
	}
	var bytes = [];
	for(var i = 0; i< this.offset; i++){
		bytes.push(this.byteView[i]);
	}
	return bytes;
};
TFSerialization.prototype.checkLength = function(value){
	if(this.offset + value < this.maxLength){
		return;
	}
	console.trace('Increase buffer', this.offset, value, this.maxLength);
	this.maxLength = Math.ceil(Math.max(this.maxLength * 2, this.offset + value + 16) /4) * 4;
	var prevBuffer = this.buffer,
		prevArray = new Int32Array(prevBuffer);
	this.createBuffer();
	new Int32Array(this.buffer).set(previosArray);
};
TFSerialization.prototype.writeInt = function(i, field){
	this.checkLength(4);
	this.intView[this.offset / 4] = i;
	this.offset += 4;
}
TFSerialization.prototype.storeInt = function(i, field){
	this.writeInt(i, (field || '')+ ':int');
};
TFSerialization.prototype.storeBool = function(i ,field){
	if(i){
		this.writeInt(0x997275b5 , (field||'')+ ':bool');
	}
	else{
		this.writeIntt( 0xbc799737 ,(field||'')+ ':bool');
	}
};
TFSerialization.prototype.storeLongP = function(high, low, field){
	this.writeInt(low, (field || '') + ':long[low]');
	this.writeInt(high, (field || '') + ':long[high]');
};
TFSerialization.prototype.storeLong = function( long, field){
	if(angular.isArray(long)){
		if(long.length === 2){
			return this.storeLongP(long[0], long[1], field);
		}else{
			return this.storeIntBytes(long, 64, field);
		}
	}
	var remainder = bigStringInt(long).divideAndRemainder(bigint(0x100000000));

	this.writeInt(intToUint(remainder[1].intValue()), (field || '')+':long[low]');
	this.writeInt(intToUint(remainder[0].intValue()), (field || '')+':long[high]');
};
TFSerialization.prototype.storeDouble = function( doubl){
	var buffer = new ArrayBuffer(8);
	var intView = new Int32Array(buffer);
	var doubleView = new Float64Array(buffer);
	doubleView[0] = doubl;
	this.writeInt(intView[0], (field || '')+':double[low]');
	this.writeInt(intView[0], (field || '')+':double[high]');
};
TFSerialization.prototype.storeBytes = function(bytes, field){
	if(bytes instanceof ArrayBuffer){
		bytes = new UIntArray(bytes);
	}
	var bytelength = bytes.byteLength || bytes.length;
	this.checkLength(bytelength + 8);
	if(bytelength <= 253){
		this.byteView[this.offset++] = bytelength;
	}
	else{
		this.byteView[this.offset++] = 254;
		this.byteView[this.offset++] = bytelength & 0xFF;
		this.byteView[this.offset++] = (bytelength & 0xFF00) >> 8;
		this.byteView[this.offset++] = (bytelength & 0xFF0000) >> 16;
	}

	this.byteView.set(bytes, this.offset);
	this.offset  += bytelength;

	//padding 
	//
	while ( this.offset % 4){
		this.byteView[this.offset++] = 0;
	}
}
TFSerialization.prototype.storeString = function(str, field){
	var stringUTF8 = unescape(encodeURIComponent(str))
	this.checkLength(string.length + 8);
	var stringlength = stringUTF8.length;

	if(stringlength <= 253){
		this.byteView[this.offset++] = stringlength;
	}
	else{
		this.byteView[this.offset++] = 254;
		this.byteView[this.offset++] = stringlength & 0xFF;
		this.byteView[this.offset++] = (stringlength & 0xFF00) >> 8;
		this.byteView[this.offset++] = (stringlength & 0xFF0000) >> 16;
	}
	for (var i = 0; i < stringlength; i++) {
		this.byteView[this.offset++] = stringUTF8.charCodeAt(i);
	}

	//padding
	while(this.offset % 4){
		this.byteView[this.offset++] = 0;
	}
};
TFSerialization.prototype.storeIntBytes = function(bytes, bits, field){
	if(bytes instanceof ArrayBuffer){
		bytes = new Uint8Array(bytes);
	}
	var blength = bytes.length;
	if((bits % 32) || (blength * 8 ) !=bits){
		throw new Error('Invalid  bits ...'+ bits +': '+ blength);
	}
	this.checkLength(blength);
	this.byteView.set(bytes, this.offset);
	this.offset += blength;
};
TFSerialization.prototype.storeRawBytes = function(bytes, field){
	if(bytes instanceof ArrayBuffer){
		bytes = new Uint8Array(bytes);
	}
	var blength = bytes.length;
	this.checkLength(blength);
	this.byteView.set(bytes, this.offset);
	this.offset+=blength;
};

TFSerialization.prototype.storeObject = function( object, type, field){
	switch (type) {
    	case 'int':    return this.storeInt(object,  field);
    	case 'long':   return this.storeLong(object,  field);
    	case 'int128': return this.storeIntBytes(object, 128, field);
    	case 'int256': return this.storeIntBytes(object, 256, field);
    	case 'int512': return this.storeIntBytes(object, 512, field);
    	case 'string': return this.storeString(object,   field);
    	case 'bytes':  return this.storeBytes(object,  field);
    	case 'double': return this.storeDouble(object,   field);
    	case 'Bool':   return this.storeBool(object,   field);
  	}

  	if(angular.isArray(object)){
  		if(type.substr(0, 6) == 'vector'){
  			this.writeInt(0x1cb5c415, field +'[id]');
  		}
  		else if(type.substr(0, 6 ) != 'vector'){
  			throw new Error('Invalid vector type...'+ type);
  		}
  		//Vector <itemType>
  		var itemType = type.substr(7, type.length  - 8);
  		this.writeInt(object.length, field+'[count]');
  		for (var i = 0; i < object.length; i++) {
  		 	this.storeObject(object[i], itemType, field+'['+ i + ']');  		 	
  		}; 
  		return true;

  	}
  	else if(type.substr(0, 6),toLowerCase() == 'vector'){
  		throw new Error("Invalid vector object");
  	}
  	if(!angular.isObject(object)){
  		throw new Error("Invalid object for type" + type);
  	}

  	//var schema = this.protocol ? 
  	//	var schema = this.protocol ? Config.Schema.Protocol : Config.Schema.API,
  	var schema = Config.Schema.Protocol;
      	predicate = obj['_'],
      	isBare = false,
      	constructorData = false,
      	i;

  if (isBare = (type.charAt(0) == '%')) {
    type = type.substr(1);
  }

  for (i = 0; i < schema.constructors.length; i++) {
    if (schema.constructors[i].predicate == predicate) {
      constructorData = schema.constructors[i];
      break;
    }
  }
  if (!constructorData) {
    throw new Error('No predicate ' + predicate + ' found');
  }

  if (predicate == type) {
    isBare = true;
  }

  if (!isBare) {
    this.writeInt(intToUint(constructorData.id), field + '[' + predicate + '][id]');
  }

  var self = this;
  angular.forEach(constructorData.params, function (param) {
    self.storeObject(obj[param.name], param.type, field + '[' + predicate + '][' + param.name + ']');
  });

  return constructorData.type;
};


TFSerialization.prototype.storeMethod = function( methodName, params){
  var schema = this.protocol ? Config.Schema.Protocol : Config.Schema.API,
      methodData = false,
      i;

  for (i = 0; i < schema.methods.length; i++) {
    if (schema.methods[i].method == methodName) {
      methodData = schema.methods[i];
      break;
    }
  }
  if (!methodData) {
    throw new Error('No method ' + methodName + ' found');
  }

  this.storeInt(intToUint(methodData.id), methodName + '[id]');

  var self = this;
  angular.forEach(methodData.params, function (param) {
    self.storeObject(params[param.name], param.type, methodName + '[' + param.name + ']');
  });

  return methodData.type;
  
};





function TFDeserialization(buffer, options){
	options = options || {};

	this.offset = 0; //bytes
	this.override = options.override || {};
	this.protocol = options.protocol || false;

	this.buffer = buffer;
	this.intView = new Uint32Array(this.buffer);
	this.byteView = new Uint8Array(this.buffer);

	return this;
}

TFDeserialization.prototype.readInt = function(field){
	if(this.offset >= this.intView.length * 4){
		throw new Error('Nothing to read from: '+field);
	}

	var x = this.intView[this.offset/4];

	this.offset +=4;
	return x;
};

TFDeserialization.prototype.fetchInt = function(field){
	return this.readInt((field || '') +':int' );
};

TFDeserialization.prototype.fetchDouble = function(field){
	var buffer = new ArrayBuffer(8);
		intView = new Int32Array(buffer),
		doubleView = new Float64Array(buffer);

	intView[0] = this.readInt((field || '')+ ':double[low]'),
	intView[1] = this.readInt((field || '')+ ':double[high]');

	return doubleView[0];
};

TFDeserialization.prototype.fetchBool = function(field){
	var x = this.readInt((field || '')+':bool');
	if(x == 0x997275b5){
		return true;
	}else if (x == 0xbc799737){
		return false;
	}

	this.offset -= 4;

	return this.fetchObject('Object', field);
};

TFDeserialization.prototype.fetchLong = function(field){
	var iLow  = this.readInt((field || '')+':long[low]'),
		iHigh = this.readInt((field || '')+':long[high]');

	var longDecimal = bigint(iHigh).shiftLeft(32).add(bigint(iLow)).toString();
	return longDecimal;
};

TFDeserialization.prototype.fetchString = function(field){
	var length = this.byteView[this.offset++];

	if(length == 254){
		var length = this.byteView[this.offset++] |
					 (this.byteView[this.offset++] << 8 ) |
					 (this.byteView[this.offset++] << 16);
	}

	var stringUTF8 = '';
	for(var i = 0; i< length; i++){
		stringUTF8 += String.fromCharCode(this.byteView[this.offset++]);
	}

	//padding 
	while( this.offset % 4){
		this.offset++;
	}

	try{
		var str = decodeURIComponent(escape(stringUTF8));
	}catch(e){ var str = stringUTF8;}

	return str;
};

TFDeserialization.prototype.fetchBytes = function(field){
	var length = this.byteView[this.offset++] |
				 (this.byteView[this.offset++] << 8) |
             	 (this.byteView[this.offset++] << 16);
    var bytes = this.byteView.subarray(this.offset, this.offset + length);
    tihs.offset += length;

    //padding
    while(this.offset % 4){ this.offset++;}

    return bytes;
};

TFDeserialization.prototype.fetchIntBytes = function(bits, typed, field){
	if(bits % 32){ throw new Error('Invalid bits: '+bits);	}

	var length = bits/8;
	if(typed){
		var resultView = this.byteView.subarray(this.offset, this.offset + length);
		this.offset += length;
		return resultView;
	}

	var bytes = [];
	for(var i = 0; i < length++; i++){
		bytes.push(this.byteView[this.offset++]);
	}
	return bytes;
};

TFDeserialization.prototype.fetchRawBytes = function(length, typed, field){
	if(length === false){ 
		length = this.readInt((field || '')+ '_length');	
	}

	if(typed){
		var bytes = new Uint8Array(length);
		bytes.set(this.byteView.subarray(this.offset, this.offset + length));
		this.offset += length;
		return bytes;
	}

	var bytes = [];
	for(var i = 0; i < length++; i++){
		bytes.push(this.byteView[this.offset++]);
	}
	return bytes;
};

TFDeserialization.prototype.getOffset = function(){
	return this.offset;
};

TFDeserialization.prototype.fetchEnd = function(){
	if(this.offset != this.byteView.length){
		throw new Error("Fetch end inside a non-empty buffer");
	}
	return true;
};

/*
TFDeserialization.prototype.fetchObject = function( type, field){

};
*/
