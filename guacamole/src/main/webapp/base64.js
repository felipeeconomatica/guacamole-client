/**
 *
 *	Base64 encode / decode
 *	http://www.webtoolkit.info/
 *
 **/

var Base64 = {

	// private property
	_keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

	// public method for encoding
	encode : function (input) {

		var chr1, chr2, chr3, enc1, enc2, enc3, enc4;

		input = this._utf8_encode(input);

		var output = "", i = 0;
		while (i < input.length) {

			chr1 = input.charCodeAt(i++);
			chr2 = input.charCodeAt(i++);
			chr3 = input.charCodeAt(i++);

			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc4 = chr3 & 63;

			if (isNaN(chr2)) {
				enc3 = enc4 = 64;
			} else if (isNaN(chr3)) {
				enc4 = 64;
			}

			output = output +
			this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
			this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
		}

		return output;
	},

	// public method for decoding
	decode : function (input) {

		var output = "";
		var chr1, chr2, chr3;
		var enc1, enc2, enc3, enc4;
		var i = 0;

		input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

		while (i < input.length) {

			enc1 = this._keyStr.indexOf(input.charAt(i++));
			enc2 = this._keyStr.indexOf(input.charAt(i++));
			enc3 = this._keyStr.indexOf(input.charAt(i++));
			enc4 = this._keyStr.indexOf(input.charAt(i++));

			chr1 = (enc1 << 2) | (enc2 >> 4);
			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			chr3 = ((enc3 & 3) << 6) | enc4;

			output = output + String.fromCharCode(chr1);

			if (enc3 != 64) {
				output = output + String.fromCharCode(chr2);
			}
			if (enc4 != 64) {
				output = output + String.fromCharCode(chr3);
			}
		}
		output = this._utf8_decode(output);

		return output;
	},

	// private method for UTF-8 encoding
	_utf8_encode : function (string) {

		string = string.replace(/\r\n/g,"\n");

		var utftext = "", c;
		for (var n = 0; n < string.length; n++) {

			c = string.charCodeAt(n);

			if (c < 128) {
				utftext += String.fromCharCode(c);
			}
			else if((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			}
			else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}
		}
		return utftext;
	},

	// private method for UTF-8 decoding
	_utf8_decode : function (utftext) {

		var c, c2, c3;

		var string = "", i = 0;
		while ( i < utftext.length ) {

			c = utftext.charCodeAt(i);

			if (c < 128) {
				string += String.fromCharCode(c);
				i++;
			}
			else if((c > 191) && (c < 224)) {
				c2 = utftext.charCodeAt(i+1);
				string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
				i += 2;
			}
			else {
				c2 = utftext.charCodeAt(i+1);
				c3 = utftext.charCodeAt(i+2);
				string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
				i += 3;
			}
		}
		return string;
	}

};

/**
 * b64ToUint6(), base64DecToArr(), uint6ToB64(), base64EncArr() e strToUTF8Arr() vieram do artigo
 * "Base64 codificando y decodificando" do Mozilla Developer Network em https://goo.gl/M5oBG0.
 * A versão em inglês do mesmo artigo não tem esse código atualmente. No github tem essas funções
 * no repositório https://github.com/jo/couch64.
 *
 * A implementação do webtoolkit.info usa strings, esta implementação usa arrays.
 */

function b64ToUint6 (nChr) {

  return nChr > 64 && nChr < 91 ?
	  nChr - 65
	: nChr > 96 && nChr < 123 ?
	  nChr - 71
	: nChr > 47 && nChr < 58 ?
	  nChr + 4
	: nChr === 43 ?
	  62
	: nChr === 47 ?
	  63
	:
	  0;

}

function base64DecToArr (sBase64, nBlocksSize) {

  var
	sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, ""), nInLen = sB64Enc.length,
	nOutLen = nBlocksSize ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize : nInLen * 3 + 1 >> 2, taBytes = new Uint8Array(nOutLen);

  for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
	nMod4 = nInIdx & 3;
	nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4;
	if (nMod4 === 3 || nInLen - nInIdx === 1) {
	  for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
		taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
	  }
	  nUint24 = 0;

	}
  }

  return taBytes;
}

/* Base64 string to array encoding */

function uint6ToB64 (nUint6) {

  return nUint6 < 26 ?
	  nUint6 + 65
	: nUint6 < 52 ?
	  nUint6 + 71
	: nUint6 < 62 ?
	  nUint6 - 4
	: nUint6 === 62 ?
	  43
	: nUint6 === 63 ?
	  47
	:
	  65;

}

function base64EncArr (aBytes) {

  var nMod3 = 2, sB64Enc = "";

  for (var nLen = aBytes.length, nUint24 = 0, nIdx = 0; nIdx < nLen; nIdx++) {
	nMod3 = nIdx % 3;
	if (nIdx > 0 && (nIdx * 4 / 3) % 76 === 0) { sB64Enc += "\r\n"; }
	nUint24 |= aBytes[nIdx] << (16 >>> nMod3 & 24);
	if (nMod3 === 2 || aBytes.length - nIdx === 1) {
	  sB64Enc += String.fromCharCode(uint6ToB64(nUint24 >>> 18 & 63), uint6ToB64(nUint24 >>> 12 & 63), uint6ToB64(nUint24 >>> 6 & 63), uint6ToB64(nUint24 & 63));
	  nUint24 = 0;
	}
  }

  return sB64Enc.substr(0, sB64Enc.length - 2 + nMod3) + (nMod3 === 2 ? '' : nMod3 === 1 ? '=' : '==');

}


function strToUTF8Arr(sDOMStr) {

	var aBytes, nChr, nStrLen = sDOMStr.length, nArrLen = 0;

	/* mapping... */

	for (var nMapIdx = 0; nMapIdx < nStrLen; nMapIdx++) {
		nChr = sDOMStr.charCodeAt(nMapIdx);
		nArrLen += nChr < 0x80 ? 1 : nChr < 0x800 ? 2 : nChr < 0x10000 ? 3 : nChr < 0x200000 ? 4 : nChr < 0x4000000 ? 5 : 6;
	}

	aBytes = new Uint8Array(nArrLen);

	/* transcription... */

	for (var nIdx = 0, nChrIdx = 0; nIdx < nArrLen; nChrIdx++) {
		nChr = sDOMStr.charCodeAt(nChrIdx);
		if (nChr < 128) {
			/* one byte */
			aBytes[nIdx++] = nChr;
		} else if (nChr < 0x800) {
			/* two bytes */
			aBytes[nIdx++] = 192 + (nChr >>> 6);
			aBytes[nIdx++] = 128 + (nChr & 63);
		} else if (nChr < 0x10000) {
			/* three bytes */
			aBytes[nIdx++] = 224 + (nChr >>> 12);
			aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
			aBytes[nIdx++] = 128 + (nChr & 63);
		} else if (nChr < 0x200000) {
			/* four bytes */
			aBytes[nIdx++] = 240 + (nChr >>> 18);
			aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
			aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
			aBytes[nIdx++] = 128 + (nChr & 63);
		} else if (nChr < 0x4000000) {
			/* five bytes */
			aBytes[nIdx++] = 248 + (nChr >>> 24);
			aBytes[nIdx++] = 128 + (nChr >>> 18 & 63);
			aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
			aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
			aBytes[nIdx++] = 128 + (nChr & 63);
		} else /* if (nChr <= 0x7fffffff) */ {
			/* six bytes */
			aBytes[nIdx++] = 252 + (nChr >>> 30);
			aBytes[nIdx++] = 128 + (nChr >>> 24 & 63);
			aBytes[nIdx++] = 128 + (nChr >>> 18 & 63);
			aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
			aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
			aBytes[nIdx++] = 128 + (nChr & 63);
		}
	}

	return aBytes;

}