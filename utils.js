
/*
 * SEARCH INDEX MANAGER.
 */

(function (global) {

  var badCharsRe = /[`~!@#$%^&*()\-_=+\[\]\\|{}'";:\/?.>,<\s]+/g,
        trimRe = /^\s+|\s$/g;

  function createIndex () {
    return {
      shortIndexes: {},
      fullTexts: {}
    }
  }

  function cleanSearchText (text) {
    text = text.replace(badCharsRe, ' ').replace(trimRe, '');
    text = text.replace(/[^A-Za-z0-9]/g, function (ch) {
      return Config.LatinizeMap[ch] || ch;
    });
    text = text.toLowerCase();

    return text;
  }

  function indexObject (id, searchText, searchIndex) {
    if (searchIndex.fullTexts[id] !== undefined) {
      return false;
    }

    searchText = cleanSearchText(searchText);

    if (!searchText.length) {
      return false;
    }

    var shortIndexes = searchIndex.shortIndexes;

    searchIndex.fullTexts[id] = searchText;

    angular.forEach(searchText.split(' '), function(searchWord) {
      var len = Math.min(searchWord.length, 3),
          wordPart, i;
      for (i = 1; i <= len; i++) {
        wordPart = searchWord.substr(0, i);
        if (shortIndexes[wordPart] === undefined) {
          shortIndexes[wordPart] = [id];
        } else {
          shortIndexes[wordPart].push(id);
        }
      }
    });
  }

  function search (query, searchIndex) {
    var shortIndexes = searchIndex.shortIndexes,
        fullTexts = searchIndex.fullTexts;

    query = cleanSearchText(query);

    var queryWords = query.split(' '),
        foundObjs = false,
        newFoundObjs, i, j, searchText, found;

    for (i = 0; i < queryWords.length; i++) {
      newFoundObjs = shortIndexes[queryWords[i].substr(0, 3)];
      if (!newFoundObjs) {
        foundObjs = [];
        break;
      }
      if (foundObjs === false || foundObjs.length > newFoundObjs.length) {
        foundObjs = newFoundObjs;
      }
    }

    newFoundObjs = {};

    for (j = 0; j < foundObjs.length; j++) {
      found = true;
      searchText = fullTexts[foundObjs[j]];
      for (i = 0; i < queryWords.length; i++) {
        if (searchText.indexOf(queryWords[i]) == -1) {
          found = false;
          break;
        }
      }
      if (found) {
        newFoundObjs[foundObjs[j]] = true;
      }
    }

    return newFoundObjs;
  }

  global.SearchIndexManager = {
    createIndex: createIndex,
    indexObject: indexObject,
    cleanSearchText: cleanSearchText,
    search: search
  };

})(window);


(function (global) {
  var nativeWebpSupport = false;

  var image = new Image();
  image.onload = function () {
    nativeWebpSupport = this.width === 2 && this.height === 1;
  };
  image.onerror = function () {
    nativeWebpSupport = false;
  };
  image.src = 'data:image/webp;base64,UklGRjIAAABXRUJQVlA4ICYAAACyAgCdASoCAAEALmk0mk0iIiIiIgBoSygABc6zbAAA/v56QAAAAA==';

  var canvas, context;


  function getPngUrlFromData(data) {
    var start = tsNow();

    var decoder = new WebPDecoder();

    var config = decoder.WebPDecoderConfig;
    var buffer = config.j;
    var bitstream = config.input;

    if (!decoder.WebPInitDecoderConfig(config)) {
      console.error('[webpjs] Library version mismatch!');
      return false;
    }

    // console.log('[webpjs] status code', decoder.VP8StatusCode);

    status = decoder.WebPGetFeatures(data, data.length, bitstream);
    if (status != 0) {
      console.error('[webpjs] status error', status);
    }

    var mode = decoder.WEBP_CSP_MODE;
    buffer.J = 4;

    status = decoder.WebPDecode(data, data.length, config);

    ok = (status == 0);
    if (!ok) {
      console.error('[webpjs] decoding failed', status);
      return false;
    }

    // console.log('[webpjs] decoded: ', buffer.width, buffer.height, bitstream.has_alpha, 'Now saving...');
    var bitmap = buffer.c.RGBA.ma;

    // console.log('[webpjs] done in ', tsNow() - start);

    if (!bitmap) {
      return false;
    }
    var biHeight = buffer.height;
    var biWidth = buffer.width;

    if (!canvas || !context) {
      canvas = document.createElement('canvas');
      context = canvas.getContext('2d');
    } else {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
    canvas.height = biHeight;
    canvas.width = biWidth;

    var output = context.createImageData(canvas.width, canvas.height);
    var outputData = output.data;

    for (var h = 0; h < biHeight; h++) {
      for (var w = 0; w < biWidth; w++) {
        outputData[0+w*4+(biWidth*4)*h] = bitmap[1+w*4+(biWidth*4)*h];
        outputData[1+w*4+(biWidth*4)*h] = bitmap[2+w*4+(biWidth*4)*h];
        outputData[2+w*4+(biWidth*4)*h] = bitmap[3+w*4+(biWidth*4)*h];
        outputData[3+w*4+(biWidth*4)*h] = bitmap[0+w*4+(biWidth*4)*h];

      };
    }

    context.putImageData(output, 0, 0);

    return canvas.toDataURL('image/png');
  }


  global.WebpManager = {
    isWebpSupported: function () {
      return nativeWebpSupport;
    },
    getPngUrlFromData: getPngUrlFromData
  }
})(window);



/********************************************************************
###########################################################
                UTILITY FUNCTIONS
###########################################################
 ********************************************************************/

var getLogTimer = (new Date()).getTime();

function dt(){
	return '[' + (((new Date()).getTime() - getLogTimer)/1000).toFixed(3) + ']';
}

function tsecondsNow(sec){
	var t = +new Date() + (window.tsOffset || 0 );
	return sec ? Math.floor( t/1000) : t;
}


function bigint (num) {
  return new BigInteger(num.toString(16), 16);
}

function bigStringInt (strNum) {
  return new BigInteger(strNum, 10);
}

function dHexDump (bytes) {
  var arr = [];
  for (var i = 0; i < bytes.length; i++) {
    if (i && !(i % 2)) {
      if (!(i % 16)) {
        arr.push("\n");
      } else if (!(i % 4)) {
        arr.push('  ');
      } else {
        arr.push(' ');
      }
    }
    arr.push((bytes[i] < 16 ? '0' : '') + bytes[i].toString(16));
  }

  console.log(arr.join(''));
}

function bytesToHex (bytes) {
  bytes = bytes || [];
  var arr = [];
  for (var i = 0; i < bytes.length; i++) {
    arr.push((bytes[i] < 16 ? '0' : '') + (bytes[i] || 0).toString(16));
  }
  return arr.join('');
}

function bytesFromHex (hexString) {
  var len = hexString.length,
      i,
      start = 0,
      bytes = [];

  if (hexString.length % 2) {
    bytes.push(parseInt(hexString.charAt(0), 16));
    start++;
  }

  for (i = start; i < len; i += 2) {
    bytes.push(parseInt(hexString.substr(i, 2), 16));
  }

  return bytes;
} 

function bytesToBase64(bytes){
  var mod, result = '';

  for(var nlength = bytes.length, uint24 = 0, idx = 0; idx < nlength; idx++){
    mod = idx % 3;
    uint24 |= bytes[idx] << (16 >>> mod & 24);

    if(mod === 3 || length - idx === 1){
      result += String.fromCharCode(  uint6ToBase64(uint24 >>> 18 & 63),
                                      uint6ToBase64(uint24 >>> 12 & 63),
                                      uint6ToBase64(uint24 >>> 6 & 63),
                                      uint6ToBase64(uint24 & 63)
                                    );
      uint24 = 0;

    }
  }
  return result.replace(/A(?=A$|$)/g, '=');
}
function uint6ToBase64 (nUint6) {
  return nUint6 < 26 ? nUint6 + 65 : nUint6 < 52 ? nUint6 + 71
      : nUint6 < 62 ? nUint6 - 4
        : nUint6 === 62 ? 43 : nUint6 === 63 ? 47 : 65;
}

function base64ToBlob(base64String, mimeType) {
  var sliceSize = 1024;
  var byteCharacters = atob(base64String);
  var bytesLength = byteCharacters.length;
  var slicesCount = Math.ceil(bytesLength / sliceSize);
  var byteArrays = new Array(slicesCount);

  for (var sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
    var begin = sliceIndex * sliceSize;
    var end = Math.min(begin + sliceSize, bytesLength);

    var bytes = new Array(end - begin);
    for (var offset = begin, i = 0 ; offset < end; ++i, ++offset) {
      bytes[i] = byteCharacters[offset].charCodeAt(0);
    }
    byteArrays[sliceIndex] = new Uint8Array(bytes);
  }

  return blobConstruct(byteArrays, mimeType);
}

function blobConstruct (blobParts, mimeType) {
  var blob;
  try {
    blob = new Blob(blobParts, {type: mimeType});
  } catch (e) {
    var bb = new BlobBuilder;
    angular.forEach(blobParts, function(blobPart) {
      bb.append(blobPart);
    });
    blob = bb.getBlob(mimeType);
  }
  return blob;
}

function dataUrlToBlob(url) {
  // var name = 'b64blob ' + url.length;
  // console.time(name);
  var urlParts = url.split(',');
  var base64str = urlParts[1];
  var mimeType = urlParts[0].split(':')[1].split(';')[0];
  var blob = base64ToBlob(base64str, mimeType);
  // console.timeEnd(name);
  return blob;
}

function bytesCmp (bytes1, bytes2) {
  var len = bytes1.length;
  if (len != bytes2.length) {
    return false;
  }

  for (var i = 0; i < len; i++) {
    if (bytes1[i] != bytes2[i]) {
      return false;
    }
  }
  return true;
}

function bytesXor (bytes1, bytes2) {
  var len = bytes1.length,
      bytes = [];

  for (var i = 0; i < len; ++i) {
      bytes[i] = bytes1[i] ^ bytes2[i];
  }

  return bytes;
}

function bytesToWords (bytes) {
  if (bytes instanceof ArrayBuffer) {
    bytes = new Uint8Array(bytes);
  }
  var len = bytes.length,
      words = [], i;
  for (i = 0; i < len; i++) {
    words[i >>> 2] |= bytes[i] << (24 - (i % 4) * 8);
  }

  return new CryptoJS.lib.WordArray.init(words, len);
}

function bytesFromWords (wordArray) {
  var words = wordArray.words,
      sigBytes = wordArray.sigBytes,
      bytes = [];

  for (var i = 0; i < sigBytes; i++) {
    bytes.push((words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff);
  }

  return bytes;
}

function bytesFromBigInt (bigInt, len) {
  var bytes = bigInt.toByteArray();

  if (len && bytes.length < len) {
    var padding = [];
    for (var i = 0, needPadding = len - bytes.length; i < needPadding; i++) {
      padding[i] = 0;
    }
    if (bytes instanceof ArrayBuffer) {
      bytes = bufferConcat(padding, bytes);
    } else {
      bytes = padding.concat(bytes);
    }
  }
  else {
    while (!bytes[0] && (!len || bytes.length > len)) {
      bytes = bytes.slice(1);
    }
  }

  return bytes;
}

function bytesFromLeemonBigInt (bigInt, len) {
  var str = bigInt2str(bigInt, 16);
  return bytesFromHex(str);
}

function bytesToArrayBuffer (b) {
  return (new Uint8Array(b)).buffer;
}

function convertToArrayBuffer(bytes) {
  // Be careful with converting subarrays!!
  if (bytes instanceof ArrayBuffer) {
    return bytes;
  }
  if (bytes.buffer !== undefined &&
      bytes.buffer.byteLength == bytes.length * bytes.BYTES_PER_ELEMENT) {
    return bytes.buffer;
  }
  return bytesToArrayBuffer(bytes);
}

function convertToUint8Array(bytes) {
  if (bytes.buffer !== undefined) {
    return bytes;
  }
  return new Uint8Array(bytes);
}

function convertToByteArray(bytes) {
  if (Array.isArray(bytes)) {
    return bytes;
  }
  bytes = convertToUint8Array(bytes);
  var newBytes = [];
  for (var i = 0, len = bytes.length; i < len; i++) {
    newBytes.push(bytes[i]);
  }
  return newBytes;
}

function bytesFromArrayBuffer (buffer) {
  var len = buffer.byteLength,
      byteView = new Uint8Array(buffer),
      bytes = [];

  for (var i = 0; i < len; ++i) {
    bytes[i] = byteView[i];
  }

  return bytes;
}

function bufferConcat(buffer1, buffer2) {
  var l1 = buffer1.byteLength || buffer1.length,
      l2 = buffer2.byteLength || buffer2.length;
  var tmp = new Uint8Array(l1 + l2);
  tmp.set(buffer1 instanceof ArrayBuffer ? new Uint8Array(buffer1) : buffer1, 0);
  tmp.set(buffer2 instanceof ArrayBuffer ? new Uint8Array(buffer2) : buffer2, l1);

  return tmp.buffer;
}
/*
function bufferToBlob(buffer, opt_contentType){
  var blob = new Uint8Array(buffer);
  return new Blob([blob], (opt_contentType ? {type: opt_contentType}:{}));
}
*/

function bufferToBlob(base64Data, contentType){
        contentType = contentType || '';
        var sliceSize = 1024;
        var byteCharacters = atob(base64Data);
        var bytesLength = byteCharacters.length;
        var slicesCount = Math.ceil(bytesLength / sliceSize);
        var byteArrays = new Array(slicesCount);

        for (var sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
            var begin = sliceIndex * sliceSize;
            var end = Math.min(begin + sliceSize, bytesLength);

            var bytes = new Array(end - begin);
            for (var offset = begin, i = 0 ; offset < end; ++i, ++offset) {
                bytes[i] = byteCharacters[offset].charCodeAt(0);
            }
            byteArrays[sliceIndex] = new Uint8Array(bytes);
        }
        return new Blob(byteArrays,{type: contentType});
}

function longToInts (sLong) {
  var divRem = bigStringInt(sLong).divideAndRemainder(bigint(0x100000000));

  return [divRem[0].intValue(), divRem[1].intValue()];
}

function longToBytes (sLong) {
  return bytesFromWords({words: longToInts(sLong), sigBytes: 8}).reverse();
}

function longFromInts (high, low) {
  return bigint(high).shiftLeft(32).add(bigint(low)).toString(10);
}

function intToUint (val) {
  val = parseInt(val);
  if (val < 0) {
    val = val + 4294967296;
  }
  return val;
}

function uintToInt (val) {
  if (val > 2147483647) {
    val = val - 4294967296;
  }
  return val;
}

function sha1HashSync (bytes) {
  this.rushaInstance = this.rushaInstance || new Rusha(1024 * 1024);

  // console.log(dT(), 'SHA-1 hash start', bytes.byteLength || bytes.length);
  var hashBytes = rushaInstance.rawDigest(bytes).buffer;
  // console.log(dT(), 'SHA-1 hash finish');

  return hashBytes;
}

function sha1BytesSync (bytes) {
  return bytesFromArrayBuffer(sha1HashSync(bytes));
}



function rsaEncrypt (publicKey, bytes) {
  bytes = addPadding(bytes, 255);

  // console.log('RSA encrypt start');
  var N = new BigInteger(publicKey.modulus, 16),
      E = new BigInteger(publicKey.exponent, 16),
      X = new BigInteger(bytes),
      encryptedBigInt = X.modPowInt(E, N),
      encryptedBytes  = bytesFromBigInt(encryptedBigInt, 256);
  // console.log('RSA encrypt finish');

  return encryptedBytes;
}

function addPadding(bytes, blockSize, zeroes) {
  blockSize = blockSize || 16;
  var len = bytes.byteLength || bytes.length;
  var needPadding = blockSize - (len % blockSize);
  if (needPadding > 0 && needPadding < blockSize) {
    var padding = new Array(needPadding);
    if (zeroes) {
      for (var i = 0; i < needPadding; i++) {
        padding[i] = 0
      }
    } else {
      (new SecureRandom()).nextBytes(padding);
    }

    if (bytes instanceof ArrayBuffer) {
      bytes = bufferConcat(bytes, padding);
    } else {
      bytes = bytes.concat(padding);
    }
  }

  return bytes; 
}

function aesEncryptSync (bytes, keyBytes, ivBytes) {
  var len = bytes.byteLength || bytes.length;

  // console.log(dT(), 'AES encrypt start', len/*, bytesToHex(keyBytes), bytesToHex(ivBytes)*/);
  bytes = addPadding(bytes);

  var encryptedWords = CryptoJS.AES.encrypt(bytesToWords(bytes), bytesToWords(keyBytes), {
    iv: bytesToWords(ivBytes),
    padding: CryptoJS.pad.NoPadding,
    mode: CryptoJS.mode.IGE
  }).ciphertext;

  var encryptedBytes = bytesFromWords(encryptedWords);
  // console.log(dT(), 'AES encrypt finish');

  return encryptedBytes;
}

function aesDecryptSync (encryptedBytes, keyBytes, ivBytes) {

  // console.log(dT(), 'AES decrypt start', encryptedBytes.length);
  var decryptedWords = CryptoJS.AES.decrypt({ciphertext: bytesToWords(encryptedBytes)}, bytesToWords(keyBytes), {
    iv: bytesToWords(ivBytes),
    padding: CryptoJS.pad.NoPadding,
    mode: CryptoJS.mode.IGE
  });

  var bytes = bytesFromWords(decryptedWords);
  // console.log(dT(), 'AES decrypt finish');

  return bytes;
}

function gzipUncompress (bytes) {
  // console.log('Gzip uncompress start');
  var result = (new Zlib.Gunzip(bytes)).decompress();
  // console.log('Gzip uncompress finish');
  return result;
}

function nextRandomInt (maxValue) {
  return Math.floor(Math.random() * maxValue);
};

function pqPrimeFactorization (pqBytes) {
  var what = new BigInteger(pqBytes),
      result = false;

  // console.log(dT(), 'PQ start', pqBytes, what.toString(16), what.bitLength());

  try {
    result = pqPrimeLeemon(str2bigInt(what.toString(16), 16, Math.ceil(64 / bpe) + 1))
  } catch (e) {
    console.error('Pq leemon Exception', e);
  }

  if (result === false && what.bitLength() <= 64) {
    // console.time('PQ long');
    try {
      result = pqPrimeLong(goog.math.Long.fromString(what.toString(16), 16));
    } catch (e) {
      console.error('Pq long Exception', e);
    };
    // console.timeEnd('PQ long');
  }
  // console.log(result);

  if (result === false) {
    // console.time('pq BigInt');
    result = pqPrimeBigInteger(what);
    // console.timeEnd('pq BigInt');
  }

  // console.log(dT(), 'PQ finish');

  return result;
}

function pqPrimeBigInteger (what) {
  var it = 0,
      g;
  for (var i = 0; i < 3; i++) {
    var q = (nextRandomInt(128) & 15) + 17,
        x = bigint(nextRandomInt(1000000000) + 1),
        y = x.clone(),
        lim = 1 << (i + 18);

    for (var j = 1; j < lim; j++) {
      ++it;
      var a = x.clone(),
          b = x.clone(),
          c = bigint(q);

      while (!b.equals(BigInteger.ZERO)) {
        if (!b.and(BigInteger.ONE).equals(BigInteger.ZERO)) {
          c = c.add(a);
          if (c.compareTo(what) > 0) {
            c = c.subtract(what);
          }
        }
        a = a.add(a);
        if (a.compareTo(what) > 0) {
          a = a.subtract(what);
        }
        b = b.shiftRight(1);
      }

      x = c.clone();
      var z = x.compareTo(y) < 0 ? y.subtract(x) : x.subtract(y);
      g = z.gcd(what);
      if (!g.equals(BigInteger.ONE)) {
        break;
      }
      if ((j & (j - 1)) == 0) {
        y = x.clone();
      }
    }
    if (g.compareTo(BigInteger.ONE) > 0) {
      break;
    }
  }

  var f = what.divide(g), P, Q;

  if (g.compareTo(f) > 0) {
    P = f;
    Q = g;
  } else {
    P = g;
    Q = f;
  }

  return [bytesFromBigInt(P), bytesFromBigInt(Q), it];
}

function gcdLong(a, b) {
  while (a.notEquals(goog.math.Long.ZERO) && b.notEquals(goog.math.Long.ZERO)) {
    while (b.and(goog.math.Long.ONE).equals(goog.math.Long.ZERO)) {
      b = b.shiftRight(1);
    }
    while (a.and(goog.math.Long.ONE).equals(goog.math.Long.ZERO)) {
      a = a.shiftRight(1);
    }
    if (a.compare(b) > 0) {
      a = a.subtract(b);
    } else {
      b = b.subtract(a);
    }
  }
  return b.equals(goog.math.Long.ZERO) ? a : b;
}

function pqPrimeLong(what) {
  var it = 0,
      g;
  for (var i = 0; i < 3; i++) {
    var q = goog.math.Long.fromInt((nextRandomInt(128) & 15) + 17),
        x = goog.math.Long.fromInt(nextRandomInt(1000000000) + 1),
        y = x,
        lim = 1 << (i + 18);

    for (var j = 1; j < lim; j++) {
      ++it;
      var a = x,
          b = x,
          c = q;

      while (b.notEquals(goog.math.Long.ZERO)) {
        if (b.and(goog.math.Long.ONE).notEquals(goog.math.Long.ZERO)) {
          c = c.add(a);
          if (c.compare(what) > 0) {
            c = c.subtract(what);
          }
        }
        a = a.add(a);
        if (a.compare(what) > 0) {
          a = a.subtract(what);
        }
        b = b.shiftRight(1);
      }

      x = c;
      var z = x.compare(y) < 0 ? y.subtract(x) : x.subtract(y);
      g = gcdLong(z, what);
      if (g.notEquals(goog.math.Long.ONE)) {
        break;
      }
      if ((j & (j - 1)) == 0) {
        y = x;
      }
    }
    if (g.compare(goog.math.Long.ONE) > 0) {
      break;
    }
  }

  var f = what.div(g), P, Q;

  if (g.compare(f) > 0) {
    P = f;
    Q = g;
  } else {
    P = g;
    Q = f;
  }

  return [bytesFromHex(P.toString(16)), bytesFromHex(Q.toString(16)), it];
}


function pqPrimeLeemon (what) {
  var minBits = 64,
      minLen = Math.ceil(minBits / bpe) + 1,
      it = 0, i, q, j, lim, g, P, Q,
      a = new Array(minLen),
      b = new Array(minLen),
      c = new Array(minLen),
      g = new Array(minLen),
      z = new Array(minLen),
      x = new Array(minLen),
      y = new Array(minLen);

  for (i = 0; i < 3; i++) {
    q = (nextRandomInt(128) & 15) + 17;
    copyInt_(x, nextRandomInt(1000000000) + 1);
    copy_(y, x);
    lim = 1 << (i + 18);

    for (j = 1; j < lim; j++) {
      ++it;
      copy_(a, x);
      copy_(b, x);
      copyInt_(c, q);

      while (!isZero(b)) {
        if (b[0] & 1) {
          add_(c, a);
          if (greater(c, what)) {
            sub_(c, what);
          }
        }
        add_(a, a);
        if (greater(a, what)) {
          sub_(a, what);
        }
        rightShift_(b, 1);
      }

      copy_(x, c);
      if (greater(x,y)) {
        copy_(z, x);
        sub_(z, y);
      } else {
        copy_(z, y);
        sub_(z, x);
      }
      eGCD_(z, what, g, a, b);
      if (!equalsInt(g, 1)) {
        break;
      }
      if ((j & (j - 1)) == 0) {
        copy_(y, x);
      }
    }
    if (greater(g, one)) {
      break;
    }
  }

  divide_(what, g, x, y);

  if (greater(g, x)) {
    P = x;
    Q = g;
  } else {
    P = g;
    Q = x;
  }

  // console.log(dT(), 'done', bigInt2str(what, 10), bigInt2str(P, 10), bigInt2str(Q, 10));

  return [bytesFromLeemonBigInt(P), bytesFromLeemonBigInt(Q), it];
}


function bytesModPow (x, y, m) {
  try {
    var xBigInt = str2bigInt(bytesToHex(x), 16),
        yBigInt = str2bigInt(bytesToHex(y), 16),
        mBigInt = str2bigInt(bytesToHex(m), 16),
        resBigInt = powMod(xBigInt, yBigInt, mBigInt);

    return bytesFromHex(bigInt2str(resBigInt, 16));
  } catch (e) {
    console.error('mod pow error', e);
  }

  return bytesFromBigInt(new BigInteger(x).modPow(new BigInteger(y), new BigInteger(m)), 256);
}



/*
OTHER UTILS
 */

function checkClick (e, noprevent) {
  if (e.which == 1 && (e.ctrlKey || e.metaKey) || e.which == 2) {
    return true;
  }

  if (!noprevent) {
    e.preventDefault();
  }

  return false;
}

function checkDragEvent(e) {
  if (!e || e.target && (e.target.tagName == 'IMG' || e.target.tagName == 'A')) return false;
  if (e.dataTransfer && e.dataTransfer.types) {
    for (var i = 0; i < e.dataTransfer.types.length; i++) {
      if (e.dataTransfer.types[i] == 'Files') {
        return true;
      }
    }
  } else {
    return true;
  }

  return false;
}

function cancelEvent (event) {
  event = event || window.event;
  if (event) {
    event = event.originalEvent || event;

    if (event.stopPropagation) event.stopPropagation();
    if (event.preventDefault) event.preventDefault();
  }

  return false;
}

function onCtrlEnter (textarea, cb) {
  $(textarea).on('keydown', function (e) {
    if (e.keyCode == 13 && (e.ctrlKey || e.metaKey)) {
      cb();
      return cancelEvent(e);
    }
  });
}

function setFieldSelection(field, from, to) {
  field = $(field)[0];
  try {
    field.focus();
    if (from === undefined || from === false) {
      from = field.value.length;
    }
    if (to === undefined || to === false) {
      to = from;
    }
    if (field.createTextRange) {
      var range = field.createTextRange();
      range.collapse(true);
      range.moveEnd('character', to);
      range.moveStart('character', from);
      range.select();
    }
    else if (field.setSelectionRange) {
      field.setSelectionRange(from, to);
    }
  } catch(e) {}
}

function getFieldSelection (field) {
  if (field.selectionStart) {
    return field.selectionStart;
  }
  else if (!document.selection) {
    return 0;
  }

  var c = "\001",
      sel = document.selection.createRange(),
      txt = sel.text,
      dup = sel.duplicate(),
      len = 0;

  try {
    dup.moveToElementText(field);
  } catch(e) {
    return 0;
  }

  sel.text = txt + c;
  len = dup.text.indexOf(c);
  sel.moveStart('character', -1);
  sel.text  = '';

  // if (browser.msie && len == -1) {
  //   return field.value.length;
  // }
  return len;
}

function getRichValue(field) {
  if (!field) {
    return '';
  }
  var lines = [];
  var line = [];

  getRichElementValue(field, lines, line);
  if (line.length) {
    lines.push(line.join(''));
  }

  return lines.join('\n');
}

function getRichValueWithCaret(field) {
  if (!field) {
    return [];
  }
  var lines = [];
  var line = [];

  var sel = window.getSelection ? window.getSelection() : false;
  var selNode, selOffset;
  if (sel && sel.rangeCount) {
    var range = sel.getRangeAt(0);
    if (range.startContainer &&
        range.startContainer == range.endContainer &&
        range.startOffset == range.endOffset) {
      selNode = range.startContainer;
      selOffset = range.startOffset;
    }
  }

  getRichElementValue(field, lines, line, selNode, selOffset);

  if (line.length) {
    lines.push(line.join(''));
  }

  var value = lines.join('\n');
  var caretPos = value.indexOf('\001');
  if (caretPos != -1) {
    value = value.substr(0, caretPos) + value.substr(caretPos + 1);
  }

  return [value, caretPos];
}

function getRichElementValue(node, lines, line, selNode, selOffset) {
  if (node.nodeType == 3) { // TEXT
    if (selNode === node) {
      var value = node.nodeValue;
      line.push(value.substr(0, selOffset) + '\001' + value.substr(selOffset));
    } else {
      line.push(node.nodeValue);
    }
    return;
  }
  if (node.nodeType != 1) { // NON-ELEMENT
    return;
  }
  var isBlock = node.tagName == 'DIV' || node.tagName == 'P';
  var curChild;
  if (isBlock && line.length || node.tagName == 'BR') {
    lines.push(line.join(''));
    line.splice(0, line.length);
  }
  else if (node.tagName == 'IMG') {
    if (node.alt) {
      line.push(node.alt);
    }
  }
  if (selNode === node) {
    line.push('\001');
  }
  var curChild = node.firstChild;
  while (curChild) {
    getRichElementValue(curChild, lines, line, selNode, selOffset);
    curChild = curChild.nextSibling;
  }
  if (isBlock && line.length) {
    lines.push(line.join(''));
    line.splice(0, line.length);
  }
}

function setRichFocus(field, selectNode) {
  field.focus();
  if (window.getSelection && document.createRange) {
    var range = document.createRange();
    if (selectNode) {
      range.selectNode(selectNode);
    } else {
      range.selectNodeContents(field);
    }
    range.collapse(false);

    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
  else if (document.body.createTextRange !== undefined) {
    var textRange = document.body.createTextRange();
    textRange.moveToElementText(selectNode || field);
    textRange.collapse(false);
    textRange.select();
  }
}

function onContentLoaded (cb) {
  setZeroTimeout(cb);
}

function tsNow (seconds) {
  var t = +new Date() + (window.tsOffset || 0);
  return seconds ? Math.floor(t / 1000) : t;
}

function safeReplaceObject (wasObject, newObject) {
  for (var key in wasObject) {
    if (!newObject.hasOwnProperty(key) && key.charAt(0) != '$') {
      delete wasObject[key];
    }
  }
  for (var key in newObject) {
    if (newObject.hasOwnProperty(key)) {
      wasObject[key] = newObject[key];
    }
  }
}

function listMergeSorted (list1, list2) {
  list1 = list1 || [];
  list2 = list2 || [];

  var result = angular.copy(list1);

  var minID = list1.length ? list1[list1.length - 1] : 0xFFFFFFFF;
  for (var i = 0; i < list2.length; i++) {
    if (list2[i] < minID) {
      result.push(list2[i]);
    }
  }

  return result;
}

function listUniqSorted (list) {
  list = list || [];
  var resultList = [],
      prev = false;
  for (var i = 0; i < list.length; i++) {
    if (list[i] !== prev) {
      resultList.push(list[i])
    }
    prev = list[i];
  }

  return resultList;
}

function templateUrl (tplName) {
  var forceLayout = {
    confirm_modal: 'desktop',
    error_modal: 'desktop',
    media_modal_layout: 'desktop',
    slider: 'desktop',
    reply_message: 'desktop'
  };
  var layout = forceLayout[tplName] || (Config.Mobile ? 'mobile' : 'desktop');
  return 'partials/' + layout + '/' + tplName + '.html';
}

function encodeEntities(value) {
  return value.
    replace(/&/g, '&amp;').
    replace(/([^\#-~| |!])/g, function (value) { // non-alphanumeric
      return '&#' + value.charCodeAt(0) + ';';
    }).
    replace(/</g, '&lt;').
    replace(/>/g, '&gt;');
}

function calcImageInBox(imageW, imageH, boxW, boxH, noZooom) {
  var boxedImageW = boxW;
  var boxedImageH = boxH;

  if ((imageW / imageH) > (boxW / boxH)) {
    boxedImageH = parseInt(imageH * boxW / imageW);
  }
  else {
    boxedImageW = parseInt(imageW * boxH / imageH);
    if (boxedImageW > boxW) {
      boxedImageH = parseInt(boxedImageH * boxW / boxedImageW);
      boxedImageW = boxW;
    }
  }

  // if (Config.Navigator.retina) {
  //   imageW = Math.floor(imageW / 2);
  //   imageH = Math.floor(imageH / 2);
  // }

  if (noZooom && boxedImageW >= imageW && boxedImageH >= imageH) {
    boxedImageW = imageW;
    boxedImageH = imageH;
  }

  return {w: boxedImageW, h: boxedImageH};
}

function versionCompare (ver1, ver2) {
  if (typeof ver1 !== 'string') {
    ver1 = '';
  }
  if (typeof ver2 !== 'string') {
    ver2 = '';
  }
  ver1 = ver1.replace(/^\s+|\s+$/g, '').split('.');
  ver2 = ver2.replace(/^\s+|\s+$/g, '').split('.');

  var a = Math.max(ver1.length, ver2.length), i;

  for (i = 0; i < a; i++) {
    if (ver1[i] == ver2[i]) {
      continue;
    }
    if (ver1[i] > ver2[i]) {
      return 1;
    } else {
      return -1;
    }
  }

  return 0;
}
