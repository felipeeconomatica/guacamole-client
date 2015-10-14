function EcoBrowser(msg, version) {

	this.msg = msg;
	this.msg.setLang(this.getCookie("lang"));
	this.VERSION = version;
}

EcoBrowser.ECO_SITE_URL = 'http://www.economatica.com';

EcoBrowser.prototype = {

	addStageElement : function(id, action, clickCallback, width, height, top, left) {
		var newElement = document.getElementById(id);
		if (!newElement) {
			newElement = document.createElement('div');
			newElement.id = id;
			newElement.style.position = 'absolute';
			newElement.style.backgroundColor = '#FFFFFF';
			newElement.style.zIndex = '9995';
			newElement.style.opacity = 0.1;
			newElement.action = action;
			newElement.onclick = clickCallback;

			var stage = document.getElementById('stage');
			stage.appendChild(newElement);
		}
		newElement.style.width = width + 'px';
		newElement.style.height = height + 'px';
		newElement.style.top = top + 'px';
		newElement.style.left = left + 'px';
	},

	removeStageElement : function(id) {
		var element = document.getElementById(id);
		if (element) {
			var stage = document.getElementById('stage');
			stage.removeChild(element);
		}
	},

	verificaUserAgent : function(testaUserAgent) {
		var myNav = navigator.userAgent.toLowerCase();
		return myNav.indexOf(testaUserAgent) > -1;
	},

	isIPAD: function() {
		return this.verificaUserAgent('ipad');
	},

	isMAC: function() {
		return this.verificaUserAgent('macintosh');
	},

	isChrome: function() {
		return /chrome/.test(navigator.userAgent.toLowerCase());
	},

	isFirefox: function() {
		return this.verificaUserAgent('firefox');
	},

	isIE: function() {
		return this.getBrowser() == 'msie' ? parseInt(this.getBrowser(true)[0]) : false;
	},

	isSafari: function() {
		return (this.getBrowser() == 'safari');
	},

	isOpera : function() {
		return this.getBrowser() == 'opera';
	},

	getCookie: function(name) {
		name = name + "=";

		var cookies = document.cookie.split(';');

		var i, value;
		for (i = 0; i < cookies.length; i++) {

			value = cookies[i];
			while (value.charAt(0) == ' ') {
				value = value.substring(1, value.length);
			}

			if (value.indexOf(name) == 0) {
				return value.substring(name.length, value.length);
			}
		}
		return null;
	},

	cleanCookies: function (cleanAll) {

		var EXP = '0; path=/' + this.VERSION + '; domain=economatica.com; secure=yes; expires=Thu, 01-Jan-1970 00:00:01 GMT';

		if (cleanAll) {
			document.cookie = 'gateway=' + EXP;
			document.cookie = 'server=' + EXP;
			document.cookie = 'port=' + EXP;
			document.cookie = 'server_bpp=' + EXP;
			document.cookie = 'playSound=' + EXP;
			document.cookie = 'mapClipboard=' + EXP;
			document.cookie = 'smoothfont=' + EXP;
			document.cookie = 'startProgram=' + EXP;
			document.cookie = 'exe=' + EXP;
			document.cookie = 'mapPrinter=' + EXP;
		}

		document.cookie = 'user=' + EXP;
		document.cookie = 'pwd=' + EXP;
	},

	getBrowser: function(version) {
		var N = navigator.appName, ua = navigator.userAgent, tem;
		var M = ua.match(/(opera|chrome|safari|firefox|msie|trident)\/?\s*(\.?\d+(\.\d+)*)/i);
		if (M && (tem = ua.match(/version\/([\.\d]+)/i)) != null)  {
			M[2] = tem[1];
		}
		M = M ? [M[1], M[2]] : [N, navigator.appVersion, '-?'];

		return !version ? M[0].toLowerCase().replace('trident', 'msie') : M[1].split('.') ;
	},

	checkBrowserSuportaHTML5: function() {
		this.msg.registraLog('Checking browser compatibility...');

		var hasCanvas = false;
		try {
			this.msg.registraLog('Checking HTML5 canvas...');

			document.createElement("canvas").getContext("2d");

			hasCanvas = true;
		} catch (e) {
			hasCanvas = false;
		}

		if (!hasCanvas) {
			this.msg.registraLog('Without support to HTML5 canvas!');
		}
		return hasCanvas;
	},

	avisaUsuarioSobreNavegadorAntigo: function() {
		var s = this.msg.textLang(
			// pt
			'<p><strong>Esta versão do seu navegador é antiga e não suporta HTML5.</strong></p>' +
			'<p>Para acessar o sistema Economatica é necessário que você atualize a versão do seu navegador.</p>',
			// en
			'<p><strong>Your browser is out of date and does not support HTML5.</strong></p>' +
			'<p>To access Economatica please upgrade your browser.</p>',
			// es
			'<p><strong>Esta versión de su navegador es antigua y no soporta HTML5.</strong></p>' +
			'<p>Para acceder al sistema Economatica es necesario que usted actualice la versión de su navegador.</p>'
		);
		var text = '<tr><td id="msgLabel">' + s + '</td></tr>';
		this.msg.setaObjetoMensagem('style="padding-left:10px;"', text);
		this.msg.mostraBlockMensagem();
	},

	alertPopup: function(url) {
		this.msg.registraLog('Popup blocked!');

		switch(this.getCookie('lang')) {
			case 'pt':
				this.msg.showMessage(
					'', '<b>Clique no link</b>',
					'<br><a href="' + url + '" onclick="msg.hideMessage();" target="_blank">' + (url.length > 50 ? (url.substr(0, 50) + '...') : url) + '</a>',
					false, 0.1, true, 'Cancelar');
				break;
			case 'es':
				this.msg.showMessage(
					'', '<b>Oprima o link</b>',
					'<br><a href="' + url + '" onclick="msg.hideMessage();" target="_blank">' + (url.length > 50 ? (url.substr(0, 50) + '...') : url) + '</a>',
					false, 0.1, true, 'Cancelar');
				break;
			default:
				this.msg.showMessage(
					'', '<b>Click in the link</b>',
					'<br><a href="' + url + '" onclick="msg.hideMessage();" target="_blank">' + (url.length > 50 ? (url.substr(0, 50) + '...') : url) + '</a>',
					false, 0.1, true, 'Cancel');
				break;
		}
	},

	openUrl: function(url) {
		var pattern = new RegExp(/^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i);
		var popup = null;

		var isMailTo = pattern.test(url) || url.indexOf('mailto:') != -1;
		var isChrome = this.isChrome();
		if (!isMailTo && !isChrome) {
			popup = window.open(url, '_blank');
			if (!popup) {
				this.alertPopup(url);
			}
		} else {
			if (this.isIPAD()) {
				// Para ipad com Safari ou Chrome
				window.location.href = (url.indexOf('mailto:') == -1) ? 'mailto://' + url : url.replace('mailto:', 'mailto://');
			} else if (this.isIE() || this.isOpera()) {
				// Para IE (nativo sem o ChromeFrame) e Opera
				window.open(url, '_blank');
			} else {
				popup = window.open('', '_blank', 'width=5,height=5');
				if (popup) {
					if (isChrome) {
						// Somente para o Chrome no PC (url ou mail)
						setTimeout(function() {
							if (popup.innerHeight === undefined || (popup.innerHeight > 0) === false || (popup.screenX > 0) === false) {
								this.alertPopup(url);
							} else {
								if (isMailTo) {
									popup.window.open(url, '_blank', 'width=5,height=5').close();
								} else {
									popup.window.open(url, '_blank');
								}
								popup.close();
							}
						}, 250);
					} else {
						// Para qquer outro browser
						popup.window.open(url, '_blank', 'width=5,height=5').close();
						popup.close();
					}
				} else {
					this.alertPopup(url);
				}
			}
		}
	},

	redirecionaParaURL : function(url) {
		this.msg.showMessage(
			this.msg.textLang(
				"ATENÇÃO!!!",
				"WARNING!!!",
				"ATENCIÓN!!!"
			),
			this.msg.textLang(
				"A sua sessão foi encerrada.",
				"Your session has ended.",
				"Su sesión ha terminado."
			), '', true);
		window.onbeforeunload = null;
		window.setTimeout(function() {
			window.location.href = url;
		}, 100);
	}
};
