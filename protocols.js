angular.module( 'tellefile.protocol', ['tellefile.services'])

.factory('DataCenterChooser', function(){
	//will expand to config.production level when lauching
	var dcOptions = [
		{id: 1, host: '10.0.2.2', port: 8000},
		{id: 2, host: '10.0.2.2', port: 8000},
		{id: 3, host: '10.0.2.2', port: 8000}
	];

	var chosenServers = {};

	function chooseServer(id, upload){
		if(chosenServers[id] === undefined){
			var chosenServer = false;
			var dataCenterOptions, i , dcOption;
			var ssl = location.search.indexOf('ssl=1') > 0 || location.protocol == 'https:' && location.search.indexOf('ssl=0') == -1;
			
				for(i = 0; i < dcOptions.length; i++){
					dcOption = dcOptions[i];
					if(dcOption.id == id){
						chosenServer = 'https://'+ dcOption.host + ( dcOption.port != 80 ? ':' + dcOption.port : '') + ( upload ? '/upload' : '');
						console.log("The chosen data center access url is: "+chosenServer);
						break;
					}
				}
				chosenServers[id] = chosenServer;
			
		}
		return chosenServers[id];
	}

	return {
		chooseServer : chooseServer
	};
})

.factory('SecureRandom', function($window){ 
	return new SecureRandom();
})

.factory ('TimeManager', function(Storage) {
	var  timeOffset = 0;
	var lastMsgID = [0,0];

	Storage.get('server_time_offset').then(function(tOffset){
		if(tOffset){
			timeOffset = tOffset;
		}
	});

	function createMessageID(){
		var timeTicks = tsecondsNow();
		var tSec = Math.floor(timeTicks/1000)+ timeOffset,
			tMilliSec = timeTicks % 1000,
			random = nextRandomInt(0xFFFF);

		var msgID = [tSec, (tMilliSec << 21) | (random << 3) | 4];
		if( lastMsgID[0] > msgID[0] ||
			lastMsgID[0] == msgID[0] && lastMsgID[1] >= msgID[1] ){

			msgID = [lastMsgID[0], lastMsgID[1]+4];
		}

		lastMsgID = msgID;

		console.log("Generating message ID ... " + longFromInts(msgID[0], msgID[1]));

		return longFromInts(msgID[0], msgID[1])
	}

	function applyServerTime( serverTime, localTime){
		var newTimeOffset = serverTime - Math.floor((localTime || tsecondsNow())/1000);
		var changed = Math.abs(timeOffset - newTimeOffset) > 10;
		Storage.set({server_time_offset: newTimeOffset});

		lastMsgID = [0,0];
		timeOffset = newTimeOffset;

		console.log(dt(), "Apply server time ... ", serverTime, localTime);
		
		return changed;
	}

	return{
		generateID: createMessageID,
		applyServerTime : applyServerTime
	};
})

.factory('RSAKeysManager', function(){

	/**
  *  Server public key, obtained from here:
  *
  * -----BEGIN RSA PUBLIC KEY-----
  * MIIBCgKCAQEAwVACPi9w23mF3tBkdZz+zwrzKOaaQdr01vAbU4E1pvkfj4sqDsm6
  lyDONS789sVoD/xCS9Y0hkkC3gtL1tSfTlgCMOOul9lcixlEKzwKENj1Yz/s7daS
  an9tqw3bfUV/nqgbhGX81v/+7RFAEd+RwFnK7a+XYl9sluzHRyVVaTTveB2GazTw
  Efzk2DWgkBluml8OREmvfraX3bkHZJTKX4EQSjBbbdJ2ZXIsRrYOXfaA+xayEGB+
  8hdlLmAjbCVfaigxX0CDqWeR1yFL9kwd9P0NsZRPsmoqVwMbMu7mStFai6aIhc3n
  Slv8kg9qv1m6XHVQY3PnEw+QQtqSIXklHwIDAQAB
  * -----END RSA PUBLIC KEY-----
  */
	var publicKeysHex = [
	{
		//long string of alphanumeric characters
		modulus: 'c150023e2f70db7985ded064759cfecf0af328e69a41daf4d6f01b538135a6f91f8f8b2a0ec9ba9720ce352efcf6c5680ffc424bd634864902de0b4bd6d49f4e580230e3ae97d95c8b19442b3c0a10d8f5633fecedd6926a7f6dab0ddb7d457f9ea81b8465fcd6fffeed114011df91c059caedaf97625f6c96ecc74725556934ef781d866b34f011fce4d835a090196e9a5f0e4449af7eb697ddb9076494ca5f81104a305b6dd27665722c46b60e5df680fb16b210607ef217652e60236c255f6a28315f4083a96791d7214bf64c1df4fd0db1944fb26a2a57031b32eee64ad15a8ba68885cde74a5bfc920f6abf59ba5c75506373e7130f9042da922179251f', 
		exponent: '010001'
	}];

	var parsedPublicKeys = {};
	var keysReady = false; //keys are prepared
	function createRSAKeys(){
		if(keysReady){
			return;
		}
		for (var i = 0; i< publicKeysHex.length; i++){
			var parsedKey = publicKeysHex[i];

			var RSAPublicKey = new TFSerialization();
			RSAPublicKey.storeBytes(bytesFromHex(parsedKey.modulus), 'n');
			RSAPublicKey.storeBytes(bytesFromHex(parsedKey.exponent), 'e');
			
			var buffer = RSAPublicKey.getBuffer();

			var fingerprint = sha1BytesSync(buffer).slice(-8);
			fingerprint.reverse();

			parsedPublicKeys[bytesToHex(fingerprint)] = {
				modulus: parsedKey.modulus,
				exponent: parsedKey.exponent
			};
		}
		keysReady = true; //now prepared.
	}

	function chooseRSAKey (fingerprint){ //select RSA keys by fingerprint
		createRSAKeys();
		var fingerprintInHex;
		var i;
		var foundKey;

		for(i = 0; i < fingerprintInHex; i++){
			fingerprintInHex = bigStringInt(fingerprint[i].toString(16));
			if(foundKey = parsedPublicKeys[fingerprintInHex]){
				return angular.extend({fingerprint: fingerprint[i]}, foundKey);
			}
		}

		return false;
	}

	return {
		create: createRSAKeys,
		choose: chooseRSAKey
	};
})

.factory('Authorizer', function($http, $q, $timeout, SecureRandom,
 TimeManager, DataCenterChooser, RSAKeysManager, CryptoWorker){
	var chrome = navigator.userAgent.match(/Chrome\/(\d+(\.\d+)?)/);
	var version = chrome && parseFloat(chrome[1]) || false;
	var xhrSendBuffer = !('ArrayBufferView' in window) && (!version || version < 30);

	//delete $http.defaults.headers.post['Content-Type'];
	//delete $http.defaults.headers.common['Accept'];

	function sendPlainRequest (id, reqBuffer){
		var requestLength = reqBuffer.byteLength,
			requestArray = new Int32Array(reqBuffer);

		var header = new TFSerialization();
		header.storeLongP(0, 0, 'auth_key_id'); //Authorization Key
		header.storeLong(TimeManager.generateID(), 'msg_id'); //messageID
		header.storeInt(requestLength, 'request_length');

		var headerBuffer = header.getBuffer(),
			headerArray = new Int32Array(headerBuffer),
			headerLength = headerBuffer.byteLength;
		var resultBuffer = new ArrayBuffer(headerLength + requestLength),
			resultArray = new Int32Array(resultBuffer);
		resultArray.set(headerArray);
		resultArray.set(requestArray, headerArray.length);

		var requestData = xhrSendBuffer ?  resultBuffer : resultArray,
			requestPromise;
		try{
			//start the eurica.io RPC connection
			/*
			var rpcClient = new Eureca.Client(DataCenterChooser.chooseServer(id));
			rpcClient.ready( function(proxy){
				proxy.helloServer().onReady( function(result){
					console.log(dt(), "Server responded: "+result);
				});
			});
				*/
			requestPromise = $http.post(DataCenterChooser.chooseServer(id)+'/init', requestData,
			 {
			 	responseType: 'arraybuffer',
			 	transformRequest: null
			 });
			console.log("POST DATA: "+ JSON.stringify(requestData));

		}catch(e){
			requestPromise = $q.reject({code: 406, type: 'NETWORK_BAD_RESPONSE', originalError: e});
		}

		return requestPromise.then(function(result){
			if(!result.data || !result.data.byteLength){
				return $q.reject({code: 406 , type: 'NETWORK_BAD_RESPONSE'});
			}

			try{ 
				//fetch authKey(long), msgId(long), and its length(int)
				
				var deserializer = new TFDeserialization(result.data, { protocol: true});
				var auth_key_id = deserializer.fetchLong('auth_key_id');
				var msg_id = deserializer.fetchLong('msg_id');
				var msg_length = deserializer.fetchInt('msg_len');
			}catch(e){
				return $q.reject({code:406, type:'NETWORK_BAD_RESPONSE', originalError: e});
			}
			return deserializer;

		}, function(error){
			if(!error.message && !error.type){
				error = {code:406, type: 'NETWORK_BAD_REQUEST', originalError: error};	
			}
			return $q.reject(error);
		});
	}

	function sendRequestPQ(auth){
		var deferred = auth.deferred;

		var request = new TFSerialization({protocol: true});
		request.storeMethod('request_pq', {nonce: auth.nonce});
		//request
		sendPlainRequest(auth.id, request.getBuffer()).then(function(serial){
			var response = serial.fetchObject('ResPQ');
			if(response._ !="resPQ"){
				throw new Error('resPQ' + response._ +'is invalid');
			}
			//comparing bytes not matching ?
			if(!bytesCmp(auth.nonce,  response.nonce)){
				throw new Error('responsePQ mismatch');
			}

			//got response PQ
			auth.serverNonce = response.server_nonce;
			auth.pq = response.pq;
			auth.fingerprints = response.server_public_key_fingerprints;

			auth.publicKey = RSAKeysManager.choose(auth.fingerprints);

			if(!auth.publicKey){
				throw new Error('Public Key absent! ');
			}

			//begin PQ factorization 
			//
			CryptoWorker.factorize(auth.pq).then(function(p_q){
				auth.p  = p_q[0];
				auth.q  = p_q[1];

				//done with factorization
				sendRequestDHParams(auth);

			}, function(error){
				deferred.reject(error);
			});
		}, function(err){
			deferred.reject(err);
		});

		$timeout(function(){
			RSAKeysManager.create();
		});
	}

	function sendRequestDHParams(auth){
		var deferred = auth.deferred;
		auth.newNonce = new Array(32);
		SecureRandom.nextBytes(auth.newNonce);

		var data = new TFSerialization({protocol:  true});
		data.storeObject({
			_ : 'p_q_inner_data',
			pq: auth.pq,
			p : auth.p,
			q : auth.q,
		nonce : auth.nonce,
		server_nonce : auth.serverNonce,
		new_nonce : auth.newNonce
		}, 'P_Q_inner_data', 'DECRYPTED_DATA');

		var hashedData = sha1BytesSync(data.getBuffer()).concat(data.getBytes());
		var request = new TFSerialization({ protocol:true});
		request.storeMethod('req_DH_params', {
			nonce : auth.nonce,
			server_nonce : auth.serverNonce,
			p : auth.p, q: auth.q,
			public_key_fingerprint : auth.publicKey.fingerprint,
			encrypted_data : rsaEncrypt(auth.publicKey, hashedData)
		});

		//send dh parameters 
		sendPlainRequest(auth.dcID, request.getBuffer()).then(function(deserializer){
			//response{
			//	_ : 'server_DH_params_fail' &&v 'server_DH_params_ok',
			//	nonce : bytes,
			//	server_nonce : bytes,
			//	new_nonce_hash : bytes,
			//	encrypted_answer : bytes
			//}
			var res = deserializer.fetchObject('Server_DH_Params', 'RESPONSE')
			if(res._ != 'server_DH_params_fail' && res._ != 'server_DH_params_ok'){
				deferred.reject(new Error('Server_DH parameters invalid: '+ res._));
				return false;
			}
			if(!bytesCmp(auth.nonce, res.nonce)){
				deferred.reject(new Error('Server_DH and nonce parameters mismatch'));
				return false;
			}
			if(!bytesCmp(auth.serverNonce, res.server_nonce)){
				deferred.reject(new Error('Server_DH and server_nonce  mismatch'));
				return false;
			}
			if(res._ == 'server_DH_params_fail'){
				var newNonceHash = sha1BytesSync(auth.newNonce).slice(-16);
				if(!bytesCmp(newNonceHash, res.new_nonce_hash)){
					deferred.reject(new Error("server_DH_params_fail"));
					return false;
				}
			}
			try{
				decryptServerDHResponse(auth, res.encrypted_answer);
			}catch(e){
				deferred.reject(e);
				return false;
			}
			//finally send the client DH parameters 
			sendSetClientDHParams(auth);
		
		}, function(error){
			deferred.reject(error);
		});
	}

	function decryptServerDHResponse ( auth, encryptedResponse ){
		auth.localTime = tsNow();
		//get the temporary aesKey and initialization vector: derived from serverNonce,newNonce
		auth.tempAesKey = sha1BytesSync(auth.newNonce.concat(auth.serverNonce)).concat(sha1BytesSync(auth.serverNonce.concat(auth.newNonce)).slice(0, 12));
		auth.tempAesInitVector = sha1BytesSync(auth.serverNonce.concat(auth.newNonce)).slice(12).concat(sha1BytesSync([].concat(auth.newNonce, auth.newNonce)), auth.newNonce.slice(0,4));

		var responseWithHash = aesDecryptSync( encryptedResponse, auth.tempAesKey, auth.tempAesInitVector );
		var hash = responseWithHash.slice(0, 20);
		var resWithPadding = responseWithHash.slice(20);
		var answerBuffer = bytesToArrayBuffer(resWithPadding);

		var deserializer = new TFDeserialization(answerBuffer, {protocol: true});
		var response = deserializer.fetchObject('Server_DH_inner_data');

		if(!bytesCmp(auth.nonce, response.nonce)){
			throw new Error('server_DH inner data nonce mismatch');
		}
		if(!bytesCmp(auth.serverNonce, response.server_nonce)){
			throw new Error("Server_DH and server_nonce mismatch");
		}

		//done decryptin: collect decrypted data
		auth.g = response.g;
		auth.dhPrime = response.dh_prime;
		auth.gA = response.g_a;
		auth.serverTime = response.server_time;
		auth.retry = 0;

		var offset = deserializer.getOffset();
		if(!bytesCmp(hash, sha1BytesSync(resWithPadding.slice(0, offset)))){
			throw new Error('Server_DH_inner_data and  SHA1-hash mismatch');
		}
		TimeManager.applyServerTime(auth.serverTime, auth.localTime);
	}

	function sendSetClientDHParams(auth){
		var deferred= auth.deferred.
			g = bytesToHex(auth.g.toString(16));
		auth.b = new Array(256);
		SecureRandom.nextBytes(auth.b);
		CryptoWorker.modPow(g, auth.b, auth.dhPrime).then(function(g_b) {
			var serializer = new TLSerialization({protocol: true});
			serializer.storeObject({
				_: 'client_DH_inner_data',
				nonce: auth.nonce,
				server_nonce : auth.serverNonce,
				retry_id : [0, auth.retry++],
				g_b : g_b,
			}, 'Client_DH_Inner_Data');

			var dataAndHash = sha1BytesSync(serializer.getBuffer()).concat(serializer.getBytes());
			var encryptedData = aesEncryptSync(dataAndHash, auth.tempAesKey, auth.tempAesInitVector);
			
			var request = new TFSerialization({protocol:true});
			request.storeMethod('set_client_DH_params', {
				nonce : auth.nonce,
				server_nonce : auth.serverNonce,
				encrypted_data : encryptedData
			});

			//now send the Clients DH parameters
			sendPlainRequest(auth.dcID, request.getBuffer()).then(function(response){
				//response
				//{
				//		          _: 'dh_gen_ok'|| 'dh_gen_retry' || 'dh_gen_fail',
				//			  nonce: (bytes),
				//	   server_nonce: (bytes),
				//	new_nonce_hash1: (bytes),
				//	new_nonce_hash2: (bytes),
				//	new_nonce_hash3: (bytes),
				//						
				// }
				//				

				var res = response.fetchObject('Set_client_DH_params_answer');

				if(res._ != 'dh_gen_ok' && res._ != 'dh_gen_retry' && res._ != 'den_gen_fail'){
					deferred.reject(new Error('Set_client_DH_params_answer  invalid response for: ' + res._));
					return false;		
				}
				if(!bytesCmp(auth.nonce, res.nonce)){
					deferred.reject(new Error("Set_client_DH_params_answer nonce mismatch"));
					return false;
				}
				if(!bytesCmp(auth.serverNonce, res.server_nonce)){
					deferred.reject(new Error('Set_client_DH_params_answer server_nonce mismatch'));
          			return false;
				}

				CryptoWorker.modPow(auth.gA, auth.b, auth.dhPrime).then(function(authKey){
					var authKeyHash = sha1BytesSync(authKey),		
						authKeyAux = authKeyHash.slice(0,8),
						authKeyID = authKeyHash.slice(-8); //weird
					//handle DH data response
					switch(res._){
						case 'dh_gen_ok':
							var newNonceHash1 = sha1BytesSync(auth.newNonce.concat([1], authKeyAux)).slice(-16);
							if(!bytesCmp(newNonceHash1, res.new_nonce_hash1)){
								deferred.reject(new Error("Set_client_DH_params_answer new_nonce_hash1 mismatch"));
								return false;
							}
							//authorization successful: derive server salt from auth
							var serverSalt =bytesXor(auth.newNonce.slice(0,8), auth.serverNonce.slice(0, 8 ));

							auth.authKeyID = authKeyID;
							auth.authKey = authKey;
							auth.serverSalt = serverSalt;

							deferred.resolve(auth);
							break;

						case 'dh_gen_retry':
              				var newNonceHash2 = sha1BytesSync(auth.newNonce.concat([2], authKeyAux)).slice(-16);
              				if (!bytesCmp(newNonceHash2, response.new_nonce_hash2)) {
                			deferred.reject(new Error('Set_client_DH_params_answer new_nonce_hash2 mismatch'));
                			return false;
              			}

              			return sendSetClientDhParams(auth);

						case 'dh_gen_fail':
							var newNonceHash3 = sha1BytesSync(auth.newNonce.concat([3], authKeyAux)).slice(-16);
							if(!bytesCmp(newNonceHash3, res.new_nonce_hash3)){
								deferred.reject(new Error('Set_client_DH_params_answer new_nonce_hash_3 mismatch'));
								return false;
							}
							deferred.reject(new Error('Set_client_DH_param answer failed'));
							return false;
					}
				}, function(error){
					deferred.reject(error);
				});
			},function(err){
				deferred.reject(err);
			});
		}, function(error){
			deferred.reject(error);
		});
	}

	var cached = {};

	function authorize(id){
		if(cached[id] !== undefined){
			return cached[id];
		}
		var nonce = [];
		for(var i = 0; i < 16; i++){
			nonce.push(nextRandomInt(0xFF)); //255 max value
		}
		console.log("Nonce: "+nonce);
		if(!DataCenterChooser.chooseServer(id)){
			return $q.reject(new Error('No server found for DC: '+ id));
		}

		var auth = {
			dcID : id,
			nonce: nonce,
			deferred : $q.defer()
		};

		$timeout(function(){
			sendRequestPQ(auth);
		});

		cached[id] = auth.deferred.promise;
		cached[id]['catch']( function(){
			delete cached[id];
		});

		return cached[id];
	}

	return {
		auth : authorize
	};
})


.factory('TFNetworkerFactory', function(DataCenterChooser, TimeManager, 
	SecureRandom, Storage, CryptoWorker, AppRuntimeManager, $http, $q, $timeout, 
	$rootScope, $interval) {

	var updatesProcessor,
		increment = 0,
		offline,
		offlineInited = false,
		akStopped = false,
		chromeMatch = navigator.userAgent.match(/Chrome\/(\d+(\.\d+)?)/),
		chromeVersion = chromeMatch && parseFloat(chromeMatch[1]) || false,
		xhrSendBuffer = !('ArrayBufferView' in window) && (!chromeVersion || chromeVersion < 30);

	$rootScope.retryOnline = function(){
		$(document.body).trigger('online');
	};

	function TFNetworker ( dcID, authKey, serverSalt, options ){
		options = options || {};
		this.dcID = dcID;
		this.increment = increment++;

		this.authKey = authKey;
		this.authKeyBuffer = convertToArrayBuffer(authKey);
		this.authKeyUint8 = convertToUint8Array(authKey);
		this.authKeyID = sha1BytesSync(authKey).slice(-8);

		this.serverSalt = serverSalt;
		this.upload = options.fileUpload || options.fileDownload || false;
		this.updateSession();

		this.currentRequests = 0;
		this.checkConnectionPeriod = 0;

		this.sentMessages = {};
		this.serverMessages = [];
		this.clientMessages = [];

		this.pendingMessages = {};
		this.pendingAcks = [];
		this.pendingResends = [];
		this.connectionInit = false;

		this.pendingTimeouts = [];
		this.longPollInt = $interval(this.checkLongPoll.bind(this), 10000);
		this.checkLongPoll();

		this.setMobileSleep();
	};

	TFNetworker.prototype.setMobileSleep = function(){
		var self = this;
		$rootScope.$watch('idle.isIDLE', function(isIDLE){
			if(isIDLE){
				self.sleepAfter = tsNow() + 30000;
			}
			else{
				delete self.sleepAfter;
				self.checkLongPoll();
			}
		});
		$rootScope.$on('push_received', function(){
			if(self.sleepAfter){
				self.sleepAfter  = tsNow() + 3000;
				self.checkLongPoll();
			}
		});
	};

	TFNetworker.prototype.updateSession = function(){
		this.sequenceNo = 0;
		this.sessionID = new Array(8);
		SecureRandom.nextBytes(this.sessionID);

		if(false){
			this.sessionID[0] = 0xAB;
			this.sessionID[1] = 0xCD;
		}
	};

	TFNetworker.prototype.updateSentMessage = function(sentMessageID){
		var sentMessage = this.sentMessages[sendMessageID];

		if(!sentMessage){
			return false;
		}
		var self = this;
		if(sentMessage.container){
			var newInner = [];
			angular.forEach( sentMessage.inner, function(innerSentMessageID){
				var innerSentMessage = self.updateSentMessage(innerSentMessageID);
				if(innerSentMessage){
					newInner.push(innerSentMessage.msg_id);
				}
			});
			sentMessage.inner = newInner;
		}
		sentMessage.msg_id = TimeManager.generateID;
		sentMessage.seq_no = this.generateSequenceNo(sentMessage.notContentRelated || sentMessage.container);
		this.sentMessages[sentMessage.msg_id] = sentMessage;
		delete self.sentMessages[sentMessageID];

		return sentMessage;
	};

	TFNetworker.prototype.generateSequenceNo = function(notContentRelated){
		var sequenceNo = this.sequenceNo * 2;

		if(!notContentRelated){
			sequenceNo++;
			this.sequenceNo++;
		}
		return sequenceNo;
	};

	TFNetworker.prototype.wrapTFPCall = function( method, params, options){
		var serializer = new TFSerialization();
		serializer.storeMethod(method, params);

		var messageID = TimeManager.generateID(),
			sequenceNo = this.generateSequenceNo(),
			message = {
				msg_id : messageID,
				seq_no : sequenceNo,
				body   : serializer.getBytes()
			};

		return this.pushMessage(message, options);
	};

	TFNetworker.prototype.wrapTFPMessage = function( obj, options){
		options = options || {};
		var serializer  = new TFSerialization({tfprotocol : true});
		serializer.storeObject(obj, 'Object');

		var messageID  = TimeManager.generateID(),
			sequenceNo = this.generateSequenceNo(options.notContentRelated),
			message    = {
				msg_id : messageID,
				seq_no : sequenceNo,
				body   : serializer.getBytes()
			};
		return this.pushMessage(message, options);
	};

	TFNetworker.prototype.wrapAPICall = function( method, params, options){
		var serializer = new TFSerialization(options);

		if(!this.connectionInit){
			serializer.storeInt(0xda9b0d0d, 'invokeWithLayer');
			serializer.storeInt(Config.Schema.API.layer, 'layer');
			serializer.storeInt(0x69796de9, 'initConnection');
			serializer.storeInt(Config.App.id, 'api_id');
			serializer.storeString(navigator.userAgent || 'Unknown UserAgent' , 'device_model');
			serializer.storeString(navigator.platform || 'Unknown Platform' , 'system_version');
			serializer.storeString(Config.App.version , 'app_version');
			serializer.storeString(navigator.language || 'en' , 'lang_code');
		}

		if(options.afterMessageID){
			serializer.storeInt(0xcb9f372d, 'invokeAfterMsg');
			serilizer.storeLong(options.afterMessageID, 'mdg_id');
		}

		options.resultType = serializer.storeMethod(method, params);

		var messageID = TimeManager.generateID(),
			sequenceNo = this.generateSequenceNo(),
			message = {
				msg_id : messageID,
				seq_no : sequenceNo,
				body   : serializer.getBytes(true),
				isAPI  : true
			};

		return this.pushMessage(message, options);
	};

 	TFNetworker.prototype.cleanupSentMessages = function(){
 		var self = this;
 		var notEmpty = false;
 		console.log(dt(), 'start cleaning ...', this.dcID, this.sentMessages);
 		angular.forEach(this.sentMessages, function(message, msgID){
 			console.log('Clean each with iteration:', msgID, message);
 			if(message.notContentRelated && self.pendingMessages[msgID] === undefined){
 				console.log('cleaning notContentRelated message:', msgID);
 				delete self.sentMessages[msgID];
 			}else if(message.container){
 				for(var i = 0; i < message.inner.length; i++){
 					if(self.sentMessages[message.inner[i]] !== undefined){
 						console.log('Cleanup failed: Found : ', msgID, message.inner[i]);
 						notEmpty = true;
 						return;
 					}
 				}
 				console.log('cleaning container: ' , msgID);
 				delete self.sentMessages[msgID];
 			}else{
 				notEmpty = true;
 			}
 		});

 		return !notEmpty;
 	};

	TFNetworker.prototype.checkLongPoll = function(f){
		var isClean = this.cleanupSentMessages();
		if(this.longPollPending && tsNow() < this.LongPollPending || this.offline || akStopped){
			return false;
		}
		var self = this;
		Storage.get('dc').then(function(dcID){
			if(isClean && (dcID != self.dcID || self.upload || self.sleepAfter && tsNow() > self.sleepAfter)){
				return;
			}
			self.sendLongPoll();
		});
	};

	TFNetworker.prototype.sendLongPoll = function(){
		var maxWait = 25000,
			self 	= this;
		this.LongPollPending = tsNow() + maxWait;
		this.wrapTFPCall('http_wait', {
			max_delay : 0,
			wait_after: 0,
			max_wait  : maxWait
		}, {
			noResponse : true,
			longPoll   : true
		}).then(function(){
			delete self.LongPollPending;
			setZeroTimeout(self.checkLongPoll.bind(self)); //console-polyfill func
		}, function(){
			console.log('Long-poll failed');
		});
	};

	TFNetworker.prototype.pushMessage = function( message, options){
		var deferred = $q.defer();
		this.sentMessages[message.msg_id] = angular.extend(message, options || {}, {deferred : deferred});
		this.pendingMessages[message.msg_id] = 0;

		if(!options || !options.noSchedule){
			this.scheduleRequest();
		}
		if(angular.isObject(options)){
			options.messageID = message.msg_id;
		}
		return deferred.promise;
	};

	TFNetworker.prototype.pushResend = function (messageID, delay){
		var value = delay ? tsNow() + delay : 0;
		var sendMsg = this.sentMessages[messageID];

		if(sendMsg.container){
			for(var i = 0; i < sentMsg.inner.length; i++){
				this.pendingMessages[sentMessage.inner[i]] = value;
			}
		}else{
			this.pendingMessages[messageID] = value;
		}

		console.log('Resend is due', messageID, this.pendingMessages);
		this.scheduleRequest(delay);
	};

	TFNetworker.prototype.getMessageKeyInitVector = function(msgKey, isOut){
		var authKey   = this.authKeyUint8,
			x         = isOut ? 0 : 8,
			sha1aText = new Uint8Array(48),
			sha1bText = new Uint8Array(48),
        	sha1cText = new Uint8Array(48),
       		sha1dText = new Uint8Array(48),
       		promises  = {};

       	sha1aText.set(msgKey, 0);
       	sha1aText.set(authKey.subarray(x, x + 32 ), 16);
       	promises.sha1a = CryptoWorker.sha1Hash(sha1aText);

       	sha1bText.set(authKey.subarray(x + 32 , x + 48 ), 0 );
       	sha1bText.set(msgKey, 16);
       	sha1bText.set(authKey.subarray(x + 48, x + 64), 32);
       	promises.sha1b = CryptoWorker.sha1Hash(sha1bText);

       	sha1cText.set(authKey.subarray(x + 64, x + 96 ), 0);
       	sha1cText.set(msgKey, 32);
       	promises.sha1c = CryptoWorker.sha1Hash(sha1cText);

       	sha1dText.set(msgKey, 0);
       	sha1dText.set(authKey.subarray(x + 96, x + 128 ), 16);
       	promises.sha1d = CryptoWorker.sha1Hash(sha1dText);

       	return $q.all(promises).then(function (result){
       		var aesKey = new Uint8Array(32),
       			aesIV  = new Uint8Array(32),
       			sha1a  = new Uint8Array(result.sha1a),
       			sha1b  = new Uint8Array(result.sha1b),
       			sha1c  = new Uint8Array(result.sha1c),
       			sha1d  = new Uint8Array(result.sha1d);

       		aesKey.set(sha1a.subarray(0, 8));
       		aesKey.set(sha1b.subarray(8, 20), 8);
       		aesKey.set(sha1c.subarray(4, 16), 20);

       		aesIV.set(sha1a.subarray(8, 20));
       		aesIV.set(sha1b.subarray(0, 8) , 12);
       		aesIV.set(sha1c.subarray(16, 20), 20);
       		aesIV.set(sha1d.subarray(0, 8), 24);

       		return [aesKey, aesIV];
       	});
	};

	TFNetworker.prototype.checkConnection = function( event ){
		$rootScope.offlineConnecting = true;
		console.log(dt(), 'Checking connection...' , event);
		$timeout.cancel(this.checkConnectionPromise);

		var serializer = new TFSerialization(),
			pingID     = [nextRandomInt(0xFFFFFFFF), nextRandomInt(0xFFFFFFFF)];
		serializer.storeMethod('ping', {ping_id : pingID});

		var pingMessage = {
			msg_id : TimeManager.generateID,
			seq_no : this.generateSequenceNo(true),
			body   : serializer.getBytes()
		};

		var self = this;
		this.sendEncryptedRequest(pingMessage, {timeout : 15000}).then(function(result){
			delete $rootScope.offlineConnecting;
			self.toggleOffline(false);

		}, function(){
			console.log(dt(), 'Delay', self.checkConnectionPeriod * 1000);
			self.checkConnectionPromise = $timeout(self.checkConnection.bind(self), parseInt(self.checkConnectionPeriod * 1000));
			self.checkConnectionPeriod  = Math.min(60, self.checkConnectionPeriod * 1.5);
			$timeout(function(){
				delete $rootScope.offlineConnecting;
			}, 1000);
		});
	};

	TFNetworker.prototype.toggleOffline = function(enabled){
		console.log('toggle' , enabled, this.dcID, this.increment);
		if(this.offline !== undefined && this.offline === enabled){
			return false;
		}

		this.offline = enabled;
		$rootScope.offline = enabled;
		$rootScope.offlineConnecting = false;

		if(this.offline){
			$timeout.cancel(this.nextReqPromise);
			delete this.nextReq;
			if(this.checkConnectionPeriod < 1.5){
				this.checkConnectionPeriod = 0;
			}

			this.checkConnectionPromise = $timeout(this.checkConnection.bind(this), parseInt(this.checkConnectionPeriod * 1000));
			this.checkConnectionPeriod  = Math.min(30, (1 + this.checkConnectionPeriod) * 1.5);
			
			this.onOnlineCb = this.checkConnection.bind(this);
			$(document.body).on('online focus', this.onOnlineCb);	
		}else{
			delete this.LongPollPending;
			this.checkLongPoll();
			this.scheduleRequest();

			if(this.onOnlineCb){
				$(document.body).off('online focus', this.onOnlineCb);
			}
			$timeout.cancel(this.checkConnectionPromise);
		}
	};

	TFNetworker.prototype.getEncryptedMessage = function(bytes){
		var self = this;
		console.log(dt(), "start encrypt...", bytes.bytesLength);

		return CryptoWorker.sha1Hash(bytes).then(function(bytesHash){
			console.log(dt(), 'getting bytes hash');
			var messageKey = new Uint8Array(bytesHash).subarray(4, 20);

			return self.getMessageKeyInitVector(messageKey, true).then(function(keyIV){
				console.log(dt(), 'getting message key initialization vector')
				return CryptoWorker.aesEncrypt(bytes, keyIV[0], keyIV[1]).then(function(encryptedBytes){
					return {
						bytes  : encryptedBytes,
						msgKey : messageKey
					};
				});
			});

		});
	};

	TFNetworker.prototype.getDecryptedMessage = function(msgKey, encryptedData){
		console.log(dt(), 'Start decrypting...');
		return this.getMessageKeyInitVector(msgKey, false).then(function(keyIV){
			console.log(dt(), "Got the messageKey init vector");
			return CryptoWorker.aesDecrypt(encryptedData, keyIV[0], keyIV[1]);
		});
	};

	TFNetworker.prototype.sendEncryptedRequest = function (message, options){
		var self = this; 
		options  = options || {};

		var data = new TFSerialization({startMaxLength : message.body.length + 64});

		//64 bits of server salt and sessionID
		data.storeIntBytes(this.serverSalt, 64, 'salt');
		data.storeIntBytes(this.sessionID, 64, 'session_id');
		//store the messageID and sequenceNo.
		data.storeLong(message.msg_id, 'message_id');
		data.storeInt(message.seq_no, 'seq_no');
		//store the message data length + actual raw data
		data.storeInt(message.body.length, 'message_data_length');
		data.storeRawBytes(message.body, 'message_data');

		//now encrypt the message to be sent( data buffer )
		return this.getEncryptedMessage(data.getBuffer()).then(function( cypher){
			console.log(dt(), 'Now got the encrypted cypher to be sent', cypher);
			var request = new TFSerialization({startMaxLength : cypher.bytes.byteLength + 256});
			request.storeIntBytes(self.authKeyID, 64, 'auth_key_id'); //64bits
			request.storeIntBytes(cypher.msgKey, 128, 'msg_key'); //128bits
			request.storeRawBytes(cypher.bytes, 'encrypted_data');

			var requestData = xhrSendBuffer ? request.getBuffer() :  request.getArray();
			var requestPromise;

			try{
				options = angular.extend( options || {}, {
					responseType     : 'arraybuffer',
					transformRequest : null
				});
				//post the cypher to the nearest DC 
				requestPromise = $http.post(DataCenterChooser.chooseServer(self.dcID, self.upload), requestData, options);
			}catch(e){
				console.log(dt(), 'Cypher post failed:' , e);
				requestPromise = $q.reject(e);
			}
			return requestPromise.then(function(result){
				if(!result.data || !result.data.byteLength){
					return $q.reject({code: 406, type: 'NETWORK_BAD_RESPONSE'});
				}
				return result;
			},function(error){
				if(error.status == 404){
					Storage.remove('dc' + self.dcID + '_server_salt',
						'dc' + self.dcID + '_auth_key').then(function(){
							AppRuntimeManager.reload();
						});
				}
				if(!error.message && !error.type){
					error = {code: 406, type : 'NETWORK_BAD_REQUEST'};
				}
				return $q.reject(error);
			});
		});
	};

	TFNetworker.prototype.applyServerSalt = function(newSalt){
		var serverSalt = longToBytes(newSalt);

		var stoObject = {};
		stoObject['dc' + this.dcID + '_server_salt'] = bytesToHex(serverSalt);
		Storage.set(stoObject);

		this.serverSalt = serverSalt;
		return true;
	};

	TFNetworker.prototype.performSheduledRequest = function(){
		console.log(dt(), 'scheduled request ...', this.dcID, this.increment);
		if(this.offline || akStopped){
			console.log(dt(), 'Cancelled scheduled request....');
			return false;
		}
		delete this.nextRequest; 
		if(this.pendingAcks.length){
			var ackMessageIDs = [];
			for(var i = 0; i < this.pendingAcks.length; i++){
				ackMessageIDs.push(this.pendingAcks[i]);
			}
			console.log('acknowledging messages ...', ackMessageIDs);
			this.wrapTFPMessage({ _ : 'msgs_ack', msg_ids : ackMessageIDs}, {notContentRelated : true , noSchedule : true});
		}

		if(this.pendingResends.length){
			var resendMsgIDs  = [],
				resendOptions = {noSchedule: true, notContentRelated : true};
			for(var i = 0; i < this.pendingResends.length; i++){
				resendMsgIDs.push(this.pendingResends[i]);
			}
			this.wrapTFPMessage({_ : 'msg_resend_req', msg_ids : resendMsgIDs}, resendOptions );
			this.lastResendRequest = {req_msg_id : resendOptions.messageID, resend_msg_ids : resendMsgIDs};
		}

		var messages = [],
			message,
			currentTime = tsNow(),
			hasAPICall  = false,
			hasHttpWait = false,
			lenOverflow = false,
			singlesCount = 0,
			msgByteLen 	= 0,
			self        = this;

		angular.forEach(this.pendingMessages , function(value, messageID) {
			if(!value || value >= currentTime){
				if(message = self.sentMessages[messageID]){
					var msgByteLength = (message.body.byteLength || message.body.length) + 32;
					if(!message.notContentRelated && lenOverflow){
						return;
					}
					if(!message.notContentRelated && 
						msgByteLen &&
						msgByteLen + msgByteLength > 655360) {
						//640 kb 
						lenOverflow = true;
						return;
					}
					if(message.singleInRequest){
						singlesCount ++;
						if(singlesCount > 1){
							return;
						}
					}
					messages.push(message);
					msgByteLen += msgByteLength;
					if(message.isAPI){
						hasAPICall = true;
					}
					else if ( message.longPoll){
						hasHttpWait = true;
					}
					
				}else{
					console.log(message, messageID);
				}
				delete self.pendingMessages[messageID];
			}
		});

		if(hasAPICall && !hasHttpWait){
			var serializer = new TFSerialization({protocol : true});
			serializer.storeMethod('http_wait', {mx_delay: 0, wait_after : 0 , max_wait : 1000});
			messages.push({
				msg_id : TimeManager.generateID(),
				seq_no : this.generateSequenceNo(),
				body   : serializer.getBytes()
			});
		}

		if(!messages.length){
			console.log('no scheduled Messages');
			return;
		}

		var noResponseMessages = [];

		if(messages.length > 1 ){
			var container = new TFSerialization({protocol : true , startMaxLength : messageBytesLen + 64});
			container.storeInt(0x73f1f8dc, 'CONTAINER[id]');
			container.storeInt(messages.length, 'CONTAINER[count]');
			var onloads = [];
			var innerMessages = [];
			for (var i = 0; i < messages.length; i++) {
				container.storeLong(messages[i].msg_id, 'CONTAINER[' + i + '][msg_id]');
				innerMessages.push(messages[i].msg_id);
				container.storeInt(messages[i].seq_no, 'CONTAINER[' + i + '][seq_no]');
				container.storeInt(messages[i].body.length, 'CONTAINER[' + i + '][bytes]');
				container.storeInt(messages[i].body, 'CONTAINER[' + i + '][body]');

				if(messages[i].noResponse){
					noResponseMessages.push(messages[i].msg_id);
				}
			}

			var containerSentMessage = {
				msg_id    : TimeManager.generateId(),
				seq_no    : this.generateSequenceNo(true),
				container : true,
				inner 	  : innerMessages
			}

			message = angular.extend({body : container.getBytes(true)}, containerSentMessage);
			this.sentMessages[message.msg_id] = containerSentMessage;

			console.log(dt(), 'Container : ', innerMessages , message.msg_id, message.seq_no);
		
		} else{
			if(message.noResponse){
				noResponseMessages.push(message.msg_id);
			}
			this.sentMessages[message.msg_id] = message;
		}	
		this.pendingAcks = [];

		var self = this;
		this.sendEncryptedRequest(message).then(function(result){
			self.toggleOffline(false);
			self.parseResponse(result.data).then(function(response){
				console.log(dt(), 'Server response : ', self.dcID, response);
				
				self.processMessage(response.response, response.messageID, response.sessionID);

				angular.forEach(noResponseMessages, function(msgID) {
					if(self.sentMessages[msgID]){
						var deferred = self.sentMessages[msgID].deferred;
						delete self.sentMessages[msgID];
						deferred.resolve();
					}
				});

				self.checkLongPoll();
				this.checkConnectionPeriod = Math.max(1.1, Math.sqrt(this.checkConnectionPeriod));

			});
		}, function(error){
			console.log('Encrypted request failed ... ', error);
			if(message.container){
				angular.forEach(message.inner, function(msgID){
					self.pendingMessages[msgID] = 0;
				});
				delete self.sentMessages[message.msg_id];
			}else{
				self.pendingMessages[message.msg_id] = 0;
			}

			angular.forEach( noResponseMessages , function(msgID){
				if(self.sentMessages[msgI]){
					var deferred = self.sentMessages[msgID].deferred;
					delete self.sentMessages[msgID];
					delete self.pendingMessages[msgID];
					deferred.reject();
				}
			});

			self.toggleOffline(true);
		});
		
		if(lenOverflow || singlesCount > 1 ){
			this.scheduleRequest();
		}
	};

	TFNetworker.prototype.scheduleRequest = function(delay){
		if(this.offline){
			this.checkConnection('forced schedule');
		}
		var nextRequest  = tsNow() + delay;
		if(delay && this.nextRequest && this.nextRequest <= nextRequest){
			return false;
		}
		$timeout.cancel(this.nextReqPromise);
		if(delay > 0){
			this.nextReqPromise = $timeout(this.performScheduledRequest.bind(this), delay || 0);
		}else {
			setZeroTimeout(this.performScheduledRequest.bind(this));
		}
		this.nextRequest = nextRequest;
	};

	TFNetworker.prototype.requestResendMessage = function(msgID){
		console.log(dt(), "Requesting a resend of message: ", msgID);
		this.pendingResends.push(msgID);
		this.scheduleRequest(77);
	};

	TFNetworker.prototype.ackMessage = function(msgID){
		this.pendingAcks.push(msgID);
		this.scheduleRequest(30000);
	};

	TFNetworker.prototype.processMessageAck = function(messageID){
		var sentMessage = this.sentMessages[messageID];
		if(sentMessage && !sentMessage.acked){
			delete sentMessage.body;
			sentMessage.acked = true;

			return true;
		}
		return false;
	};

	TFNetworker.prototype.processMessage = function( message, messageID, sessionID){
		console.log('Processing message :', message, messageID, sessionID);
		switch (message._){

			case 'msg_container':
				var len = message.messages.length;
				for (var i = 0; i < len; i++) {
					this.processMessage(message.messages[i], messageID, sessionID);
				}
				break;

			case 'bad_server_salt' : 
				console.log(dt(), 'Bad server salt: ', message);
				var sentMessage = this.sentMessages[message.bad_msg_id];
				if( !sentMessage || sentMessage.seq_no != message.bad_msg_seqno){
					console.log(message.bad_msg_id , message.bad_msg_seqno);
					throw new Error("Bad server salt for invalid message");
				}

				this.applyServerSalt(message.new_server_salt);
				this.pushResend(message.bad_msg_id);
				this.ackMessage(messageID);
				break;

			case 'bad_msg_notification' : 
				console.log(dt(), 'Bad message notification', message);
				var sentMessage = this.sentMessages[message.bad_msg_id];
				if(!sentMessage || sentMessage.seq_no != message.bad_msg_seqno){
					console.log(message.bad_msg_id, message.bad_msg_seqno);
					throw new Error('Bad message notification for invalid msg');
				}
				if(message.error_code == 16 || message.error_code == 17){
					if(TimeManager.applyServerTime(
						bigStringInt(messageID).shiftRight(32).toString(10))) {
						console.log(dt() , 'Update session');
						this.updateSession();
					}
					var badMessage = this.updateSentMessage(message.bad_msg_id);
					this.pushResend(badMessage.msg_id);
					this.ackMessage(messageID);
				}
				break;

			case 'message' : 
				this.serverMessages.push(message.msg_id);
				this.processMessage(message.body, message.msg_id, sessionID);
				break;

			case 'new_session_created' : 
				this.ackMessage(messageID);
				this.processMessageAck(message.first_msg_id);
				this.applyServerSalt(message.server_salt);

				var  self = this;
				Storage.get('dc').then(function(baseDcID){
					if(baseDcID == self.dcID && !self.upload && updatesProcessor){
						updatesProcessor(message);
					}
				});
				break;

			case 'msgs_ack' : 
				for(var i = 0; i < message.msg_ids.length; i++){
					this.processMessageAck(message.msg_ids[i]);
				}
				break;

			case 'msg_detailed_info' : 
				if( !this.sentMessages[message.msg_id]){
					this.ackMessage(message.answer_msg_id);
				}
				break;

			case 'msg_new_detailed_info' : 
				this.reqResendMessage(message.answer_msg_id);
				break;

			case 'msgs_state_info' : 
				this.ackMessage(message.answer_msg_id);
				if(this.lastResendRequest && 
				   this.lastResendRequest.req_msg_id == message.req_msg_id && 
				   this.pendingResends.length){
					var i , badMessageID, pos;
					for(i = 0; i < this.lastResendRequest.resend_msg_ids.length; i++){
						badMessageID = this.lastResendRequest.resend_msg_ids[i];
						pos = this.pendingResends.indexOf(badMessageID);
						if(pos != -1){
							this.pendingResends.splice(pos, 1);
						}
					}
				}
				break;

			case 'rpc_result' : 
				this.ackMessage(messageID);

				var sentMessageID = message.req_msg_id,
					sentMessage   = this.sentMessages[sentMessageID];
				this.processMessageAck(sentMessageID);
				if(sentMessage){
					var deferred = sentMessage.deferred;
					if(message.result._ == 'rpc_error'){
						var error = this.processError(message.result);
						console.log(dt(), 'RPC Error: ', error);
						if(deferred){
							deferred.reject(error);
						}
					}else{
						if(deferred){
							console.log(dt(),'RPC response : ', message.result);
							var dRes = message.result._;
							if(!dRes){
								if(message.result.length  >  5){
									dRes = '[..' + message.result.length + '..]';
								}else {
									dRes = message.result;
								}
							}
							console.log(dt(), 'RPC response: ' ,dRes);
						}
						sentMessage.deferred.resolve(message.result);
					}
					if(sentMessage.isAPI){
						this.connectionInit = true;
					}
					
					delete this.sentMessages[sentMessageID];
				}
				break;

			default : 
				this.ackMessage(messageID);
				console.log('Update:', message);
				if(updatesProcessor){
					updatesProcessor(message);
				}
				break;

		}
	};

	function startAll(){
		if(akStopped){
			akStopped = false;
			updatesProcessor( { _ : 'new_session_created' } );
		}
	}

	function stopAll(){
		akStopped = true;
	}

	return {
		getNetworker : function(dcID, authKey, serverSalt, options ){
			return new TFNetworker(dcID, authKey, serverSalt, options);
		},
		setUpdatesProcessor : function(callback){
			updatesProcessor = callback;
		},
		stopAll : stopAll,
		startAll: startAll
	};
});



























