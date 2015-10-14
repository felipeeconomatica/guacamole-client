/*
 * Copyright (C) 2013 Glyptodon LLC
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

var Guacamole = Guacamole || {};

/**
 * A writer which automatically writes to the given output stream with arbitrary
 * binary data, supplied as ArrayBuffers.
 *
 * @constructor
 * @param {Guacamole.OutputStream} stream The stream that data will be written
 *										  to.
 */
Guacamole.ArrayBufferWriter = function(stream) {

	/**
	 * Reference to this Guacamole.StringWriter.
	 * @private
	 */
	var guac_writer = this;

	// Simply call onack for acknowledgements
	stream.onack = function(status) {
		if (guac_writer.onack)
			guac_writer.onack(status);
	};

	/**
	 * Encodes the given data as base64.
	 * be small enough to fit into a single blob instruction.
	 *
	 * @private
	 * @param {Uint8Array} bytes The data to encode.
	 */
	function __encode_to_base64(bytes) {

		var binary = "";

		// Produce binary string from bytes in buffer
		for (var i=0; i<bytes.byteLength; i++)
			binary += String.fromCharCode(bytes[i]);

		// return as base64
		return window.btoa(binary);
	}

	/**
	 * Sends the given data.
	 *
	 * @param {ArrayBuffer|TypedArray} data The data to send.
	 */
	this.sendData = function(data) {

		var bytes = new Uint8Array(data);
		var binaryEncoded = __encode_to_base64(bytes);

		// If small enough to fit into single instruction, send as-is
		if (binaryEncoded.length <= 8064)
			stream.sendBlob(binaryEncoded);

		// Otherwise, send as multiple instructions
		else {
			for (var offset=0; offset<binaryEncoded.length; offset += 8064)
				 stream.sendBlob(binaryEncoded.substring(offset, offset + 8064));
		}

	};

	/**
	 * Signals that no further text will be sent, effectively closing the
	 * stream.
	 */
	this.sendEnd = function() {
		stream.sendEnd();
	};

	/**
	 * Fired for received data, if acknowledged by the server.
	 * @event
	 * @param {Guacamole.Status} status The status of the operation.
	 */
	this.onack = null;

};
