function EcoMensagem(blocoMensagem, objetoMensagem) {
	this.bloco = blocoMensagem;
	this.areaMensagem = objetoMensagem;

	this.onEventoForcaFoco = null;
	this._lang = 'pt';
}

EcoMensagem.prototype = {

	setLang : function(l) {
		this._lang = l;
	},

	registraLog : function(s) {
		if (window.console) {
			console.log('Economatica: ' + s);
		}
	},

	textLang : function(pt, en, es) {
		switch (this._lang) {
			case 'pt':
				return pt;
			case 'es':
				return es;
			default:
				return en;
		}
	},

	alertLang : function(pt, en, es) {
		var s = this.textLang(pt, en, es);
		this.registraLog(s);
		alert(s);
	},

	obtemObjetoBlocoMensagem : function() {
		return this.bloco;
	},

	mostraBlockMensagem : function() {
		var msgBlock = this.obtemObjetoBlocoMensagem();
		msgBlock.style.display = '';
		return msgBlock;
	},

	escondeObjetoBlocoMensagem : function() {
		this.obtemObjetoBlocoMensagem().style.display = 'none';
	},

	obtemObjetoMensagem : function() {
		return this.areaMensagem;
	},

	setaObjetoMensagem : function(atributosAdicionais, texto) {
		this.obtemObjetoMensagem().innerHTML = '<table id="msgTable" {0} border="0">{1}</table>'.format(atributosAdicionais, texto);
		this.obtemObjetoMensagem().style.display = '';
	},

	escondeObjetoMensagem : function() {
		this.obtemObjetoMensagem().style.display = 'none';
		this.obtemObjetoMensagem().innerHTML = '';
	},

	showMessage : function(title, label, text, showLoader, alpha, showClose, buttonLabel) {

		var that = this;

		this.obtemObjetoMensagem().addEventListener("click", function(e) {
			if (that.onEventoForcaFoco) {
				that.onEventoForcaFoco();
			}
		});

		this.obtemObjetoBlocoMensagem().addEventListener("click", function(e) {
			if (that.onEventoForcaFoco) {
				that.onEventoForcaFoco();
			}
		});

		this.mostraBlockMensagem().style.opacity = (alpha ? alpha : 1);

		var trTop = this.montaTopMensagem(showLoader, showClose, title, text);
		var tdLabel = this.montaLabelMensagem(label);
		var trBottom = this.montaBottomMensagem(text, buttonLabel, showClose);

		var loaderAjust = (!showLoader ? 'style="padding-left:10px;"' : '');
		this.setaObjetoMensagem(loaderAjust, trTop + tdLabel + trBottom);

		if (this.onEventoForcaFoco) {
			this.onEventoForcaFoco();
		}
	},

	montaTopMensagem : function(showLoader, showClose, title, text) {
		var trTop = '';

		if (showLoader) {
			trTop += '<td rowspan="{0}" id="msgLoader"></td>'.format(((text === null || text === '') && !showClose ? 2 : 3));
		}

		if (title && title !== '') {
			trTop += '<td id="msgTitle">{0}</td>'.format(title);
		}
		if (trTop !== '') {
			trTop = '<tr>{0}</tr>'.format(trTop);
		}

		return trTop;
	},

	montaLabelMensagem : function(label) {

		var tdLabel = '';
		if (label && label !== '') {
			tdLabel = '<tr><td id="msgLabel">{0}</td></tr>'.format(label);
		}

		return tdLabel;
	},

	montaBottomMensagem : function(text, buttonLabel, showClose) {
		var trBottom = '';
		if (text && text !== '') {
			trBottom += '<span>{0}</span>'.format(text);
		}
		if (showClose) {
			if (!buttonLabel) {
				buttonLabel = 'OK';
			}
			trBottom += '<br/><br/><button onclick="msg.hideMessage();" style="width:80px;">{0}</button>'.format(buttonLabel);
		}
		if (trBottom !== '') {
			trBottom = '<tr><td id="msgText" ' + (showClose ? 'align="center"' : '') + '>{0}</td></tr>'.format(trBottom);
		}

		return trBottom;
	},

	hideMessage : function() {
		this.escondeObjetoMensagem();
		this.escondeObjetoBlocoMensagem();
	}
};