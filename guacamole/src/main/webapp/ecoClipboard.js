/*
===============================================================================
== CLIPBOARD
===============================================================================
*/
function EcoClipboard(msg, ecoDisplay, ecoBrowser) {

    this._clipData = new StringBuffer();
    this._clipDataVC = new StringBuffer(); // recepção do virtual channel
    this.msg = msg;
    this.ecoDisplay = ecoDisplay;
    this.ecoBrowser = ecoBrowser;

    this.handlerClipboardData = null;
    this.isCopyGrande = false;
    this.completou = true;
    this.recebendoDadosVC = false;
}

EcoClipboard.COMANDO_COPIA_NENHUM = 0;
EcoClipboard.COMANDO_COPIA_AGUARDA_VC = 1;
EcoClipboard.COMANDO_COPIA_TRANSFERE_CLIPBOARD = 2;

EcoClipboard.HEX_CONTROL = 0xFFE3;
EcoClipboard.HEX_META = 0xFFEB;
EcoClipboard.HEX_C = 0x63;
EcoClipboard.HEX_V = 0x76;

EcoClipboard.prototype = {

    preparaClipboard: function () {
        this._clipDataVC.clear();
    },

    recebeDadosVC: function (dados) {
        try {
            this._clipDataVC.append(dados);
        } catch (err) {
            this.msg.registraLog('[ECO] ec.rdvc: ' + err.message);
        }
    },

    finalizaCopia: function () {

        if (EcoGuacamole.ConexaoGuac.clip.isCopyGrande && !EcoGuacamole.ConexaoGuac.clip.completou) {
            var keyName = EcoGuacamole.ConexaoGuac.clip.ecoBrowser.isMAC() ? 'COMMAND+C' : 'CTRL+C';

            EcoGuacamole.ConexaoGuac.clip.msg.showMessage('',
                EcoGuacamole.ConexaoGuac.clip.msg.textLang(
                    'Tecle ' + keyName + ' novamente para concluir a cópia e espere até esta mensagem desaparecer (pode demorar alguns segundos).',
                    'Press ' + keyName + ' again to complete the copy and wait until this message be closed (it may take a few seconds). ',
                    'Oprima ' + keyName + ' de nuevo para completar la copia y espere hasta que se cierre este mensaje (puede tartar unos segundos).'
                ), '', false, 0.5);
        }
        else {
            if (!EcoGuacamole.ConexaoGuac.clip.isCopyGrande && !EcoGuacamole.ConexaoGuac.clip.completou) {
                setTimeout(EcoGuacamole.ConexaoGuac.clip.finalizaCopia, 0);
            }
            else {
                this.msg.registraLog(
                    "[ECO] ec.finalizaCopia: EcoGuacamole.ConexaoGuac.clip.isCopyGrande"
                    + EcoGuacamole.ConexaoGuac.clip.isCopyGrande
                    + " this.completou="
                    + EcoGuacamole.ConexaoGuac.clip.completou
                );
            }
        }
    },

    extraiDados: function () {

        var retorno = ""
        if (!this.ehValorVazio()) {
            retorno = this._clipData.toString();
            this._clipData.clear();
        }

        return retorno;
    },

    enviaComandoDeCopiaParaServidor: function () {

        if (this.ecoDisplay.attachedClient) {
            // -- Segura
            this.ecoDisplay.attachedClient.sendKeyEvent(1, EcoClipboard.HEX_CONTROL);
            this.ecoDisplay.attachedClient.sendKeyEvent(1, EcoClipboard.HEX_C);

            sleepFor(100);

            // -- Libera
            this.ecoDisplay.attachedClient.sendKeyEvent(0, EcoClipboard.HEX_C);
            this.ecoDisplay.attachedClient.sendKeyEvent(0, EcoClipboard.HEX_CONTROL);

            sleepFor(100);
        }
        else {
            this.msg.registraLog('[ECO] ec.ecdcps1: unable to send copy command to server, no attached client');
        }
    },

    enviaComandoDeColarParaServidor: function () {

        if (this.ecoDisplay.attachedClient) {
            // -- Segura
            this.ecoDisplay.attachedClient.sendKeyEvent(1, EcoClipboard.HEX_CONTROL);
            this.ecoDisplay.attachedClient.sendKeyEvent(1, EcoClipboard.HEX_V);

            sleepFor(100);

            // -- Libera
            this.ecoDisplay.attachedClient.sendKeyEvent(0, EcoClipboard.HEX_V);
            this.ecoDisplay.attachedClient.sendKeyEvent(0, EcoClipboard.HEX_CONTROL);

            sleepFor(100);
        }
        else {
            this.msg.registraLog('[ECO] ec.ecdcps2: unable to send copy command to server, no attached client');
        }
    },

    ehValorVazio: function () {
        return (
            (this._clipData == null) ||
            (this._clipData.toString() === "")
        );
    },

    recuperaDadosDoCopyGrande: function () {

        this._clipData.clear();
        this._clipData.append(this._clipDataVC.toString());
        this._clipDataVC.clear();
    },

    recuperaDadosDoCopy: function () {
        this._clipDataVC.clear();
    },

    obtemDadosCopiaDaSessao: function () {

        if (this.handlerClipboardData) {
            var data = this.handlerClipboardData() || "";
            this._clipData.append(data);
        }
    },

    executaComandoCopia: function () {

        var status = EcoClipboard.COMANDO_COPIA_NENHUM;

        if (!this.completou) {

            if (!(this.isCopyGrande || EcoGuacamole.ConexaoGuac.ultimoFoiCtrlC())) {

                // não teve Ctrl-C antes, manda as teclas para o eco

                this.msg.registraLog("Manda comando para o servidor");
                this.enviaComandoDeCopiaParaServidor();
            }

            if (this.isCopyGrande && !this.recebendoDadosVC) {

                this.msg.registraLog("Obtendo dados copy grande");

                this.recuperaDadosDoCopyGrande();
                status = EcoClipboard.COMANDO_COPIA_TRANSFERE_CLIPBOARD;
            }
            else {
                if (!this.isCopyGrande) {
                    this.obtemDadosCopiaDaSessao();

                    this.isCopyGrande = this.ehValorVazio();
                    if (this.isCopyGrande) {
                        this.msg.registraLog("Copy pequeno falhou!");
                        status = EcoClipboard.COMANDO_COPIA_AGUARDA_VC;
                    }
                    else {
                        this.isCopyGrande = false;
                        this.recuperaDadosDoCopy();

                        this.msg.registraLog("Finalizando copy");
                        this.msg.hideMessage();

                        status = EcoClipboard.COMANDO_COPIA_TRANSFERE_CLIPBOARD;
                    }
                }
                else {
                    this.msg.registraLog(
                        "this.completou=" + this.completou
                        + " this.isCopyGrande=" + this.isCopyGrande
                        + " this.recebendoDadosVC=" + this.recebendoDadosVC
                    );
                }
            }
        }
        else {
            this.msg.registraLog("Alguma coisa aconteceu de errado!");
        }

        return status;
    },

    executaComandoColar: function (dados) {

        /**
         * Por algum motivo que eu não descobri qual é, ao copiar um texto
         * com quebra de página no Firefox ele traz somente o caracter de
         * Line Feed (LF) sem estar precedido do Carriage Return (CR). Isto faz com que,
         * por exemplo, copiar dados no screening não funcione.
         *
         * 2015.08.19 15:27:01 marcelo:
         * É um bug antigo do mozilla que foi corrigido recentemente
         * ver https://bugzilla.mozilla.org/show_bug.cgi?id=116083
         */
        var insereCarriageReturnParaQuebraDeLinha = function(texto) {
            var dados = '';
            var prevByteChar = 0;

            var byteChar;
            var i;
            for (i = 0; i < texto.length; i++) {
                byteChar = texto.charCodeAt(i);

                // -- Para funcionar a quebra de linha, um caracter de Line Feed (LF = 0xA)
                // -- deve ser precedido de um Carriage Return (CR = 0xD)
                if (byteChar === 0xA && prevByteChar !== 0xD) {
                    dados += String.fromCharCode(0xD);
                }

                dados += String.fromCharCode(byteChar);

                prevByteChar = byteChar;
            }
            return dados;
        };

        if (this.ecoBrowser.isFirefox()) {
            dados = insereCarriageReturnParaQuebraDeLinha(dados);
        }

        // manda os dados para o servidor remoto
        window.setTimeout(function(that, dados) {
            return function() {
                that.ecoDisplay.setRemoteClipboard(dados);
                that.enviaComandoDeColarParaServidor();
                /*
                 * 2015.10.27 16:03:15 marcelo: focusHiddenTextArea()?
                 * O IE perde o foco após o paste.
                 */
                focusHiddenTextArea();
            };
        }(this, dados), 0);
    },

    preparaCopyGrande: function() {

        this.msg.registraLog("(VC) Prepare copy");
        this.recebendoDadosVC = true;
        this.preparaClipboard();
    },

    finalizaCopyGrande: function() {

        this.msg.registraLog("(VC) Confirmation of copy is finished!!");
        this.msg.hideMessage();
        this.recebendoDadosVC = false;
        this.finalizaCopia();
    },

    recebeDadosDoCopyGrande: function(value) {

        this.recebeDadosVC(value);
    },

    resetStates: function () {
        this.completou = true;
        this.isCopyGrande = false;
    }
};
