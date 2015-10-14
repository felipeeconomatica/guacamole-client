/**
 * sendFileToUser.js
 *
 * Factory para um objeto que se encarrega de salvar um arquivo recebido do
 * servidor remoto.
 */

function buildSendFileToUser(spec) {

	"use strict";

	// private //

	var fileFromEco = function() {

		// private //

		var filename = '';
		var buffers = [];

		var init = function(name) {
			filename = name;
			buffers = [];
		};

		var mimetypes = [	// usado por getMimeTypeFromFile()
			{ext: 'bmp',	mimetype : 'image/bmp'},
			{ext: 'gif',	mimetype : 'image/gif'},
			{ext: 'jpeg',	mimetype : 'image/jpeg'},
			{ext: 'jpg',	mimetype : 'image/jpg'},
			{ext: 'png',	mimetype : 'image/png'},
			{ext: 'tif',	mimetype : 'image/tiff'},
			{ext: 'tiff',	mimetype : 'image/tiff'},
			{ext: 'pdf',	mimetype : 'application/pdf'},
			{ext: 'doc',	mimetype : 'application/msword'},
			{ext: 'docx',	mimetype : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'},
			{ext: 'xls',	mimetype : 'application/vnd.ms-excel'},
			{ext: 'xlsx',	mimetype : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'},
			{ext: 'zip',	mimetype : 'application/zip'},
			{ext: 'txt',	mimetype : 'text/plain'}
		];

		var getMimeTypeFromFile = function() {

			var mt = 'application/octet-stream';
			/*
			 * 2015.08.10 16:49:28 marcelo: isSafari()?
			 * Mantive esse tratamento especial pro Safari que existe no código original pro SparkView.
			 */
			try {
				if (spec.browser.isSafari()) {

					var parts = filename.split('.');
					var ext = (((parts.length > 1) ? parts.pop() : '') || '').toLowerCase();

					mimetypes.forEach(function (element/*, index, array*/) {
						if (element.ext === ext) {
							mt = element.mimetype;
						}
					});
				}
			} catch (e) {
				// ignora exceção
			}
			return mt;
		};

		var that = {};

		// public //

		that.init = init;

		that.addBuffer = function(buffer) {
			buffers.push(new Blob([ buffer ], {
				type : 'application/octet-stream'
			}));
		};

		that.getFilename = function() {
			return filename;
		};

		that.getMimeTypeFromFile = getMimeTypeFromFile;

		that.getBlob = function() {
			return (new Blob(buffers, {
				type : getMimeTypeFromFile()
			}));
		};

		that.done = function() {
			init('');
		};

		return that;
	}();

	var actions = {
		NONE : 0,
		OPEN_FILE : 1,
		SAVE_FILE : 2,
		CANCEL_FILE : 3
	};

	var parseValue = function(value) {

		// private //

		var filename = '';
		var action = 0;
		var payloadSize = 0;
		var payload = '';

		var init = function(value) {

			var parts = value.split(';');

			filename = (parts.length <= 1) ? parts[0] : parts[1];
			action = (parts.length <= 1) ? actions.NONE : parseInt(parts[0]);

			var s = value.substr(0, 8) || '';
			payloadSize = parseInt(s, 16);
			payload = value.substr(8, payloadSize);
		};

		init(value);

		var that = {};

		// public //

		that.getFilename = function() {
			return filename;
		};

		that.getAction = function() {
			return action;
		};

		that.getPayloadSize = function() {
			return payloadSize;
		};

		that.getPayload = function() {
			return payload;
		};

		return that;
	};

	var that = {};

	// public //

	that.init = function(value) {

		var tokens = parseValue(value);
		fileFromEco.init(tokens.getFilename());
	};

	that.add = function(value) {

		var tokens = parseValue(value);
		if (tokens.getPayloadSize() > 0) {

			var base64 = strToUTF8Arr(tokens.getPayload());
			var binary = base64DecToArr(String.fromCharCode.apply(null, base64));

			fileFromEco.addBuffer(binary.buffer);
		}
	};

	that.done = function(value) {

		var tokens = parseValue(value);
		if (tokens.getAction() !== actions.CANCEL_FILE) {

			spec.onSaveAs(fileFromEco.getBlob(), fileFromEco.getFilename());
		}
		fileFromEco.done();
	};

	return that;
}
