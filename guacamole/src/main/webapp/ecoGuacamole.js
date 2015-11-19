var EcoGuacamole = function(ecoClipboard, ecoLog, ecoDisplay, ecoBrowser) {

    // Virtual Channel RDP
    var _sendPool = [];
    var _inFileUpload = false;
    var _tentativasDeReconexao = 0;

    var screenSize = {
        pixel_density : 0,
        optimal_width : 0,
        optimal_height : 0,
        last_scroll_left : 0,
        last_scroll_top : 0,
        last_scroll_width : 0,
        last_scroll_height : 0,
        last_window_width : 0,
        last_window_height : 0
    };

    this.conexao = null;
    this._vc = null;
    this.screenSize = screenSize;
    var _ecoStatus = EcoGuacamole.ECO_BEFORE_STARTING;
    var _guacKeyboard = null;
    var _guacMouse = null;
    var _guacTouch = null;
    var _reconectando = false;
    var _token = null;

    this.msg = ecoLog;
    this.clip = ecoClipboard;
    this.display = ecoDisplay;
    this.browser = ecoBrowser;
    this.terminated = false;
    this._sendPool = _sendPool;
    this._inFileUpload = _inFileUpload;
    this.status = _ecoStatus;
    this.dump = false;
    this.tentativasDeReconexao = _tentativasDeReconexao;
    this.onDepoisDeConectar = null;
    this.guacKeyboard = _guacKeyboard;
    this.guacMouse = _guacMouse;
    this.guacTouch = _guacTouch;
    this.reconectando = _reconectando;
    this.onRedimensionarTela = null;
    this.token = _token;
    this.disconnectReason = EcoGuacamole.DISCONNECT_REASON_UNKNOWN;

    this.sendFileToUser = buildSendFileToUser({
        browser : this.browser,
        onSaveAs : saveAs
    });

    var _keyDown = [];
    this.keyDown = _keyDown;
};

// Tipos de ações (TBrowserAction)
EcoGuacamole.VC_AC_APP_STARTED = 0;                             // tbaAppStarted
EcoGuacamole.VC_AC_APP_CLOSED = 1;                              // tbaAppClosed
EcoGuacamole.VC_AC_APP_HALTED = 2;                              // tbaAppHalted
EcoGuacamole.VC_AC_TERMINATE = 3;                               // tbaTerminate
EcoGuacamole.VC_AC_BIND_ELEMENT = 4;                            // tbaBindElement
EcoGuacamole.VC_AC_UNBIND_ELEMENT = 5;                          // tbaUnbindElement
EcoGuacamole.VC_AC_HELLO = 6;                                   // tbaHello
EcoGuacamole.VC_AC_OPEN_LINK = 7;                               // tbaOpenLink
EcoGuacamole.VC_AC_SEND_FILE_TO_ECO = 8;                        // tbaSendFileToEco
EcoGuacamole.VC_AC_FILE_TRANSFER_COMPLETE = 9;                  // tbaFileTransferComplete
EcoGuacamole.VC_AC_FILE_PROCESS_COMPLETE = 10;                  // tbaFileProcessComplete
EcoGuacamole.VC_AC_RAW_DATA = 11;                               // tbaRawData
EcoGuacamole.VC_AC_PREPARE_COPY = 12;                           // tbaPrepareToCopy
EcoGuacamole.VC_AC_CONFIRM_COPY = 13;                           // tbaConfirmCopy
EcoGuacamole.VC_AC_HIDE_COPY_MSG = 14;                          // tbaHideCopyMsg
EcoGuacamole.VC_AC_SHUTDOWN = 15;                               // tbaShutDown -- NÃO UTILIZADO NO GUACAMOLE
EcoGuacamole.VC_AC_REQUEST_ID_AMBIENTE = 16;                    // tbaRequestIdAmbiente
EcoGuacamole.VC_AC_INIT_SINGLE_FILE_TRANSFER = 17;              // tbaInitSingleFileTransfer - 17~19: guacamole
EcoGuacamole.VC_AC_END_SINGLE_FILE_TRANSFER = 18;               // tbaEndSingleFileTransfer
EcoGuacamole.VC_AC_PART_FILE_TRANSFER = 19;                     // tbaPartFileTransfer
EcoGuacamole.VC_AC_SEND_FILE_TO_USER_BEGIN = 20;                // tbaSendFileToUserBegin - 20~22: exporta dados
EcoGuacamole.VC_AC_SEND_FILE_TO_USER_DATA = 21;                 // tbaSendFileToUserData
EcoGuacamole.VC_AC_SEND_FILE_TO_USER_END = 22;                  // tbaSendFileToUserEnd
EcoGuacamole.VC_AC_SEND_JANELA_MENOR_QUE_TAM_MAINFORM = 23;     // tbaSendJanelaMenorQueTamMainForm

EcoGuacamole.RECONNECT_RETRIES = 10;
EcoGuacamole.RECONNECT_RETRIES_RESTART_TIME = 150;

// TODO:  Idealmente estas constantes não deveriam estar aqui. Mas por questão
//        de simplicidade, estou mantendo-as nesta classe.
EcoGuacamole.ECO_BEFORE_STARTING = 0;
EcoGuacamole.ECO_WAITING_APP = 1;
EcoGuacamole.ECO_RUNNING = 2;
EcoGuacamole.ECO_CLOSED = 3;

EcoGuacamole.DISCONNECT_REASON_UNKNOWN                           = 0x00000000;
EcoGuacamole.DISCONNECT_REASON_RPC_INITIATED_DISCONNECT          = 0x00000001; // FREERDP error.h: ERRINFO_RPC_INITIATED_DISCONNECT
EcoGuacamole.DISCONNECT_REASON_RPC_INITIATED_LOGOFF              = 0x00000002; // FREERDP error.h: ERRINFO_RPC_INITIATED_LOGOFF
EcoGuacamole.DISCONNECT_REASON_IDLE_TIMEOUT                      = 0x00000003; // FREERDP error.h: ERRINFO_IDLE_TIMEOUT
EcoGuacamole.DISCONNECT_REASON_LOGON_TIMEOUT                     = 0x00000004; // FREERDP error.h: ERRINFO_LOGON_TIMEOUT
EcoGuacamole.DISCONNECT_REASON_DISCONNECTED_BY_OTHER_CONNECTION  = 0x00000005; // FREERDP error.h: ERRINFO_DISCONNECTED_BY_OTHER_CONNECTION
EcoGuacamole.DISCONNECT_REASON_OUT_OF_MEMORY                     = 0x00000006; // FREERDP error.h: ERRINFO_OUT_OF_MEMORY
EcoGuacamole.DISCONNECT_REASON_SERVER_DENIED_CONNECTION          = 0x00000007; // FREERDP error.h: ERRINFO_SERVER_DENIED_CONNECTION
EcoGuacamole.DISCONNECT_REASON_SERVER_INSUFFICIENT_PRIVILEGES    = 0x00000009; // FREERDP error.h: ERRINFO_SERVER_INSUFFICIENT_PRIVILEGES
EcoGuacamole.DISCONNECT_REASON_SERVER_FRESH_CREDENTIALS_REQUIRED = 0x0000000A; // FREERDP error.h: ERRINFO_SERVER_FRESH_CREDENTIALS_REQUIRED
EcoGuacamole.DISCONNECT_REASON_RPC_INITIATED_DISCONNECT_BY_USER  = 0x0000000B; // FREERDP error.h: ERRINFO_RPC_INITIATED_DISCONNECT_BY_USER
EcoGuacamole.DISCONNECT_REASON_LOGOFF_BY_USER                    = 0x0000000C; // FREERDP error.h: ERRINFO_LOGOFF_BY_USER


EcoGuacamole.loopTeclaF1NoInternetExplorer = 0;
EcoGuacamole.timeoutKeyUpLoop = null;

EcoGuacamole.ConexaoGuac = null;

EcoGuacamole.prototype = {

    getTentativasDeReconexao : function() {
        return this.tentativasDeReconexao;
    },

    limpaTentativasDeReconexao : function() {
        this.tentativasDeReconexao = 0;
    },

    addNovaTentativaDeReconexao : function() {
        this.tentativasDeReconexao++;
        return(this.tentativasDeReconexao <= EcoGuacamole.RECONNECT_RETRIES);
    },

    getStatus : function() {
        return this.status;
    },

    getDisconnectReason : function () {
        return this.disconnectReason;
    },

    setStatusWaitingApp : function () {
        this.status = EcoGuacamole.ECO_WAITING_APP;
    },

    limpaArquivosParaTransmissao : function() {
        this._sendPool = [];
    },

    addArquivoParaTransmissao : function(file) {
        this._sendPool.push(file);
    },

    quantidadeDeArquivosNaFilaDeTransmissao : function() {
        return this._sendPool.length;
    },

    estaConectado : function() {
        return this.getStatus() == EcoGuacamole.ECO_RUNNING;
    },

    removeArquivoDaListaDeTransmissao : function(nomeArquivo) {
        for(var i = 0; i < this._sendPool.length; i++)
            if (nomeArquivo.indexOf(this._sendPool[i].name > -1)) {
                this._sendPool.splice(i, 1);
                break;
            }
    },

    obtemArquivoDaFilaDeTransmissao : function(posicao) {
        return this._sendPool[posicao];
    },

    registraHandlers: function() {

        this.conexao.onerror = function(error) {
            EcoGuacamole.ConexaoGuac.msg.registraLog("Erro Guacamole. Codigo: " + error.code + ". Reason: " + error.reason);
        };

        this.conexao.ondisconnected = function(reason) {
            EcoGuacamole.ConexaoGuac.disconnectReason = reason;
            EcoGuacamole.ConexaoGuac.msg.registraLog("Disconneted. Reason:{0}".format(reason));
        }

        // Tratamento do Virtual Channel
        this.conexao.onpipe = function(stream, mimetype, name) {

            EcoGuacamole.ConexaoGuac.msg.registraLog("Pipe \"{0}\" open. Mimetype is {1}".format(name, mimetype));

            var reader = new Guacamole.ArrayBufferReader(stream);

            reader.ondata = function(data) {
                EcoGuacamole.ConexaoGuac.recvFromEco(data);
            };

            EcoGuacamole.ConexaoGuac._vc = new Guacamole.ArrayBufferWriter(EcoGuacamole.ConexaoGuac.conexao.createPipeStream(mimetype, name));
        };

        this.conexao.onclipboard = function(stream, mimetype) {

            var data = ""; // buffer para os dados recebidos
            GuacamoleSessionStorage.setItem("clipboard", data);

            var reader = new Guacamole.StringReader(stream);
            reader.ontext = function clipboard_text_received(text) {
                data += text;
                stream.sendAck("Received", Guacamole.Status.Code.SUCCESS);
            };
            reader.onend = function clipboard_text_end() {
                GuacamoleSessionStorage.setItem("clipboard", data);
                data = "";
            };
        };
    },

    connectGuac: function(conn) {

        this.conexao = conn;

        this.disconnectReason = EcoGuacamole.DISCONNECT_REASON_UNKNOWN;

        this.display.attach(this.conexao);

        this.registraHandlers();

        // Calcula a largura/altura otimizada
        this.calculaAlturaELarguraOtimizadas();

        // Define a string com os parâmetros da sessão RDP e conecta
        this.conexao.connect(this.parametrosDaSessaoRDP());

        if (this.onDepoisDeConectar !== null) {
            this.onDepoisDeConectar();
        }

        var trataMouseState = function(mouseState) {
            EcoGuacamole.ConexaoGuac.conexao.getDisplay().showCursor(!EcoDisplayUI.local_cursor);

            // Scale event by current scale
            var scaledState = new Guacamole.Mouse.State(
                mouseState.x / EcoGuacamole.ConexaoGuac.conexao.getDisplay().getScale(),
                mouseState.y / EcoGuacamole.ConexaoGuac.conexao.getDisplay().getScale(),
                mouseState.left,
                mouseState.middle,
                mouseState.right,
                mouseState.up,
                mouseState.down);

            EcoGuacamole.ConexaoGuac.conexao.sendMouseState(scaledState);

            //Faz animação do botao do teclado no IPAD
            EcoGuacamole.ConexaoGuac.display.startAnimationTouchTextInput();
        };

        // Associa o controle do mouse
        if (this.guacMouse !== null) {
            this.guacMouse = null;
        }

        this.guacMouse = new Guacamole.Mouse(this.conexao.getDisplay().getElement());

        if (this.guacTouch !== null) {
            this.guacTouch = null;
        }

        this.guacTouch = new Guacamole.Mouse.Touchscreen(this.conexao.getDisplay().getElement());

        this.guacMouse.onmousedown =
            this.guacMouse.onmouseup =
            this.guacMouse.onmousemove =
            this.guacTouch.onmousedown =
            this.guacTouch.onmouseup =
            this.guacTouch.onmousemove = trataMouseState;

        this.guacMouse.onmouseout = function() {
            EcoGuacamole.ConexaoGuac.conexao.getDisplay().showCursor(false);
        };

        this.conexao.getDisplay().oncursor = function (display, displayUI, mouse) {
            return function (canvas, x, y) {

                // ECO-1955 - Tratamento de aparente bug no Google Chrome.
                // O bug tornou-se perceptível na versão 44.0.
                // É bem provável que versões futuras não apresentem o problema.
                //
                // 2015.08.18 10:54:34 marcelo: extra closure?
                // A correção original quebrou no IE10, alterei para não ter referências a this.

                display.getElement().style.cursor = "none";

                displayUI.local_cursor = mouse.setCursor(canvas, x, y);
            };
        }(this.conexao.getDisplay(), EcoDisplayUI, this.guacMouse);

        // Associa o controle do teclado
        if (!this.guacKeyboard) {

            this.guacKeyboard = new Guacamole.Keyboard(document);

            var teclaControlAcionada = function() {
                return (
                        (
                                EcoGuacamole.ConexaoGuac.guacKeyboard.modifiers.ctrl // Win
                                ||
                                EcoGuacamole.ConexaoGuac.guacKeyboard.modifiers.meta // Mac
                        )
                        &&
                        (!EcoGuacamole.ConexaoGuac.guacKeyboard.modifiers.alt)
                        &&
                        (!EcoGuacamole.ConexaoGuac.guacKeyboard.modifiers.shift)
                    );
            };
            
            this.guacKeyboard.onkeydown = function (keysym) {

                if (!isKeyEventsEnabled()) {
                    return false;
                }

                var isCtrlC = ( (keysym === /*CTRL+C*/99) && teclaControlAcionada() );
                var isCtrlV = ( (keysym === /*CTRL+V*/118) && teclaControlAcionada() );

                var esperandoCtrlCdoCopyGrande = (
                    EcoGuacamole.ConexaoGuac.clip.isCopyGrande
                    &&
                    !EcoGuacamole.ConexaoGuac.clip.completou
                );

                // no caso do Ctrl-V, o tratamento de paste vai enviar o Ctrl-V
                
                if ( !(esperandoCtrlCdoCopyGrande || isCtrlV) ) {

                    try {
                        EcoGuacamole.ConexaoGuac.conexao.sendKeyEvent(1, keysym);

                        // lembra que mandou a tecla pro eco - ver onkeyup()
                        EcoGuacamole.ConexaoGuac.keyDown.push(keysym);
                    } catch(error) {
                        /* ignora */
                    }
                }
                

                // Se for Ctrl-C ou Ctrl-V o navegador também vai tratar as teclas senão fica só por conta do eco.
                return ( isCtrlC || (isCtrlV && (!esperandoCtrlCdoCopyGrande)) );
            };

            this.guacKeyboard.onkeyup = function (keysym) {
                /**
                * Este IF será para verificar se houve loop com a tecla F1
                * quando é utilizado o Internet Explorer, pois, neste navegador
                * a tecla F1 não pode ser bloqueada, o navegador, sempre executa
                * uma janela de ajuda, o que faz o Guacamole perder o foco e
                * gerar um loop infinito nesta função. Loop que ocorre por causa
                * do setInterval da função this.press que fica no Keyboard.js
                *
                * keysym = 65470 corresponde a tecla F1 do teclado
                */
                if (keysym === 65470) {
                    if (EcoGuacamole.loopTeclaF1NoInternetExplorer++ > 10) {
                        EcoGuacamole.loopTeclaF1NoInternetExplorer = 0;
                        EcoGuacamole.ConexaoGuac.guacKeyboard.release(keysym);
                    }
                    else {
                        // setTimeout utilizado para limpar o contador se o loop na função for interrompido
                        window.clearTimeout(EcoGuacamole.timeoutKeyUpLoop);
                        EcoGuacamole.timeoutKeyUpLoop = window.setTimeout(function() {
                            EcoGuacamole.loopTeclaF1NoInternetExplorer = 0;
                        }, 3000);
                    }
                }
                else {
                    EcoGuacamole.loopTeclaF1NoInternetExplorer = 0;
                }

                var i = EcoGuacamole.ConexaoGuac.keyDown.indexOf(keysym);
                if (i >= 0) {

                    EcoGuacamole.ConexaoGuac.conexao.sendKeyEvent(0, keysym);

                    // esquece da tecla
                    EcoGuacamole.ConexaoGuac.keyDown.splice(i, /*howmany*/1);
                }

                return false;
            };

            this.ultimoFoiCtrlC = function() {
                var idxKeyCtrl = EcoGuacamole.ConexaoGuac.keyDown.indexOf(EcoClipboard.HEX_CONTROL);
                var idxKeyC = EcoGuacamole.ConexaoGuac.keyDown.indexOf(EcoClipboard.HEX_C);
                return (
                    (idxKeyCtrl >= 0)
                    &&
                    (idxKeyC >= 0)
                    &&
                    (idxKeyCtrl < idxKeyC)
                );
            }
        }
    },

    criaTunnel: function() {

        var that = this;

        if (!window.WebSocket && window.MozWebSocket) {
            window.WebSocket = window.MozWebSocket;
        }

        var tunnel;
        var naoTemWebSocket = !(window.WebSocket || this.browser.isChrome());

        if (naoTemWebSocket) {
            tunnel = new Guacamole.HTTPTunnel("ecoLogin");
        } else {
            tunnel = new Guacamole.ChainedTunnel(
                new Guacamole.WebSocketTunnel("websocket-tunnel"),
                new Guacamole.HTTPTunnel("ecoLogin"));
        }

        tunnel.onstatechange = function (state) {
            var timeout = 10000;

            if (!EcoGuacamole.ConexaoGuac) {
                return;
            }

            if (EcoGuacamole.ConexaoGuac.getStatus() == EcoGuacamole.ECO_CLOSED) {
                EcoGuacamole.ConexaoGuac.encerrarSessao(true, 1000, false);
                return;
            }

            if (state === Guacamole.Tunnel.State.CLOSED) {
                var disconnectReason = EcoGuacamole.ConexaoGuac.getDisconnectReason();
                if (
                    (disconnectReason == EcoGuacamole.DISCONNECT_REASON_RPC_INITIATED_DISCONNECT)
                    ||
                    (disconnectReason == EcoGuacamole.DISCONNECT_REASON_RPC_INITIATED_LOGOFF)
                    ||
                    (disconnectReason == EcoGuacamole.DISCONNECT_REASON_DISCONNECTED_BY_OTHER_CONNECTION)
                    ||
                    (disconnectReason == EcoGuacamole.DISCONNECT_REASON_RPC_INITIATED_DISCONNECT_BY_USER)
                    ||
                    (disconnectReason == EcoGuacamole.DISCONNECT_REASON_LOGOFF_BY_USER)
                ) {
                    EcoGuacamole.ConexaoGuac.encerrarSessao(true, 5000, false);
                    return;
                } else {
                    that.status = EcoGuacamole.ECO_CLOSED;

                    if (EcoGuacamole.ConexaoGuac.getTentativasDeReconexao() === 0) {
                        EcoGuacamole.ConexaoGuac.reconectar();
                    } else {
                        window.setTimeout(function() {
                            EcoGuacamole.ConexaoGuac.reconectar();
                        }, timeout);
                    }
                }
            }
        };

        return tunnel;
    },

    reconectar : function() {
        if (this.reconectando) {
            return;
        }
        if (this.addNovaTentativaDeReconexao()) {
            this.msg.showMessage(
                this.msg.textLang(
                    "ATENÇÃO!!!",
                    "WARNING!!!",
                    "ATENCIÓN!!!"
                ),
                this.msg.textLang(
                    "A conexão com o sistema ECONOMATICA foi interrompida.<br>Tentando reestabelecer a conexão. Tentativa {0} de {1}."
                    .format(this.getTentativasDeReconexao(), EcoGuacamole.RECONNECT_RETRIES),

                    "The connection to the Economatica system was interrupted.<br>Trying to reconnect. Attempt {0} out of {1}."
                    .format(this.getTentativasDeReconexao(), EcoGuacamole.RECONNECT_RETRIES),

                    "La conexión con el sistema ECONOMATICA fue interrumpida.<br>Intentando restaurar la conexión. Tentativa {0} de {1}."
                    .format(this.getTentativasDeReconexao(), EcoGuacamole.RECONNECT_RETRIES)
                ), '', true);

            this.status = EcoGuacamole.ECO_WAITING_APP;

            if (this.display.attachedClient !== null) {
                this.display.attachedClient = null;
            }

            this.connectGuac(
                new Guacamole.Client(EcoGuacamole.ConexaoGuac.criaTunnel())
            );

            //Aguarda alguns instantes para tentar novamente se não foi reconectado
            //A rotina tunnel.onstatechange chama este método quando tenta reconectar
            sleepFor(200);
        }
        else {
            EcoGuacamole.ConexaoGuac.encerrarSessao(true, 1000, false);
        }
    },

    parametrosDaSessaoRDP: function() {
        return "username="        + Base64.decode(this.browser.getCookie('user')) + "&" +
            "password="        + Base64.decode(this.browser.getCookie('pwd')) + "&" +
            "hostname="        + this.browser.getCookie('server') + "&" +
            "port="            + this.browser.getCookie('port') + "&" +
            "remote-app="      + this.browser.getCookie('exe') + "&" +
            "remote-app-args=" + this.browser.getCookie('args') + "&" +
            "width="              + Math.floor(this.screenSize.optimal_width) + "&" +
            "height="         + Math.floor(this.screenSize.optimal_height) + "&" +
            "authToken="          + this.token.authToken;
    },

    calculaAlturaELarguraOtimizadas : function() {
        this.screenSize.pixel_density = window.devicePixelRatio || 1;
        this.screenSize.optimal_width = (window.innerWidth - 4) * this.screenSize.pixel_density;
        this.screenSize.optimal_height = (window.innerHeight - 4) * this.screenSize.pixel_density;
    },

    defineAlturaLarguraMinima : function(largura, altura) {
        if (this.screenSize.optimal_width < largura || this.screenSize.optimal_height < altura) {
            var scale = Math.max(largura / this.screenSize.optimal_width, altura / this.screenSize.optimal_height);

            this.screenSize.optimal_width = this.screenSize.optimal_width * scale;
            this.screenSize.optimal_height = this.screenSize.optimal_height * scale;
        }
    },

    encerrarSessao : function (gotoSiteEco, timeout, terminate) {
        this.msg.showMessage(
            this.msg.textLang(
                'Aguarde...',
                'Please wait...',
                'Aguarde...'
            ),
            this.msg.textLang(
                'Encerrando a sessão do sistema ECONOMATICA.',
                'Exiting access to ECONOMATICA.',
                'Finalizando el acceso al sistema Economatica'
            ),
            '', true
        );

        if (terminate) {
            this.sendToEco(EcoGuacamole.VC_AC_TERMINATE);
            this.msg.registraLog('Terminate signal on unload was sent.');
            sleepFor(2000);
        }

        if (this.status != EcoGuacamole.ECO_CLOSED) {
            this.status = EcoGuacamole.ECO_CLOSED;
            if (this.conexao !== null) {
                this.conexao.disconnect();
            }
        }

        window.onbeforeunload = null;

        if (gotoSiteEco) {
            window.setTimeout(
                function finalizaSessao (gotoSiteEco) {
                    window.location = EcoBrowser.ECO_SITE_URL;
                },
                timeout
            );
        }
    },

    sendToEco : function(action, value) {
        /*
        // Se não for especificado um dados além da ação, o SV irá enviar somente
        // 2 bytes para o servidor. Um pacote pequeno assim causa uma exceção
        // 'ERangeCheck' no servidor. Para evitar esse tipo de problema,
        // acrescentamos um conteúdo 'dummy' para totalizar um pacote de 16 bytes.
        */
        if (!value) {
            value = '00000000000000';
        }
        var vetAction = new Uint8Array([action]);
        var dataarr;

        if (action == EcoGuacamole.VC_AC_PART_FILE_TRANSFER) {
            dataarr = appendBuffer(vetAction, value);
        } else {
            dataarr = appendBuffer(vetAction, str2ArrayBuffer(value));
        }
        if (this.dump) {
            this.msg.registraLog('(VC) sendData ' + dataarr.byteLength + ' bytes');
        }

        if (this._vc !== null)  {
            this._vc.sendData(dataarr);
        }

        return 0;
    },

    /**
    * Manipulador para o click de elementos 'bindable'.
    */
    onBindableClick: function(event) {
        EcoGuacamole.ConexaoGuac.msg.registraLog('(VC) bindableClick event');

        if (event.currentTarget) {
            switch(event.currentTarget.action) {
                case EcoGuacamole.VC_AC_SEND_FILE_TO_ECO:
                    EcoGuacamole.ConexaoGuac.msg.registraLog('(VC) Send file to eco');
                    EcoGuacamole.ConexaoGuac.insereArquivoNaFilaDeTransmissao();
                    break;

                default:
                    EcoGuacamole.ConexaoGuac.msg.registraLog('Invalid bindable action!');
            }
        } else {
            EcoGuacamole.ConexaoGuac.msg.registraLog('Undefined action to bindable object.');
        }
    },


    /**
    * Efetua a seleção e a transferência de um arquivo do computador do cliente
    * para o servidor.
    */

    insereArquivoNaFilaDeTransmissao : function() {
        this.limpaArquivosParaTransmissao();

        var inputFile = document.createElement('input');
        inputFile.type = 'file';
        inputFile.value = '';
        inputFile.accept = '.glw,.ptf,.col,.gdd,.gdp,.bmp,.jpg,.jpeg,.gif';
        inputFile.style.position = 'absolute';
        inputFile.style.top = '-99999px';
        inputFile.style.left = '-99999px';
        inputFile.multiple = true;

        document.body.appendChild(inputFile);

        inputFile.onchange = function() {

            var i;
            for(i = 0; i < inputFile.files.length; i++) {
                EcoGuacamole.ConexaoGuac.addArquivoParaTransmissao(inputFile.files[i]);
            }
            EcoGuacamole.ConexaoGuac.transfereArquivosNaFila();

            document.body.removeChild(inputFile);
        };

        inputFile.click();
    },

    /**
    * Funcao complementar para o envio sequencial de arquivos.
    */
    transfereArquivosNaFila : function() {

        if (this.quantidadeDeArquivosNaFilaDeTransmissao() > 0) {

            this._inFileUpload = true;

            var file = this.obtemArquivoDaFilaDeTransmissao(0);
            var isEcoFile = /^.*\.(glw|ptf|col|gdd|gdp|bmp|jpg|jpeg|gif)$/i.test(file.name);

            if (isEcoFile) {
                this.msg.registraLog('Transmitindo arquivo: {0}'.format(file.name));

                this.msg.showMessage(
                    this.msg.textLang(
                        'Transferindo...',
                        'Transferring...',
                        'Transferindo...'
                    ),
                    this.msg.textLang(
                        'Aguarde, enviando arquivo para o EcoCloud',
                        'Please wait, sending file to EcoCloud',
                        'Aguarde, enviando archivo para el EcoCloud'
                    ),
                    file.name, true, 0.5
                );


                var reader = new FileReader();

                reader.onload = (function(fileName) {
                    return function (e) {
                        var MAX_BYTE_SIZE = 5376;
                        EcoGuacamole.ConexaoGuac.transmiteArquivoQuebrandoPeloTamanho(fileName, MAX_BYTE_SIZE, e.target.result);
                    };
                })(file.name);

                reader.readAsArrayBuffer(file);

            } else {
                this.msg.registraLog('Invalid file type "' + file.name + '"');

                this.msg.alertLang(
                    'O sistema ECONOMATICA não reconhece esse tipo de arquivo: "' + file.name + '"',
                    'The ECONOMATICA system don\'t accept this file type: "' + file.name + '"',
                    'El sistema ECONOMATICA no reconoce este tipo de archivo: "' + file.name + '"'
                );
            }
        } else {
            this.msg.registraLog('Upload pool is empty!');
            this._inFileUpload = false;
        }
    },

    transmiteArquivoQuebrandoPeloTamanho : function(fileName, tamanhoMaximo, rawData) {
        var dadosEnvia;
        var headerEnvia = 'filename:' + fileName + ';';
        var offset = 0;

        this.msg.registraLog(
            "(VC) Envia VC_AC_INIT_SINGLE_FILE_TRANSFER. Header: {0}".format(headerEnvia)
        );

        this.sendToEco(
            EcoGuacamole.VC_AC_INIT_SINGLE_FILE_TRANSFER , headerEnvia
        );

        while(offset < rawData.byteLength) {
            dadosEnvia = rawData.slice(offset, offset + tamanhoMaximo);

            this.msg.registraLog(
                "(VC) Envia Dados VC_AC_PART_FILE_TRANSFER. Size: {0}".format(dadosEnvia.byteLength)
            );

            this.sendToEco(
                EcoGuacamole.VC_AC_PART_FILE_TRANSFER , dadosEnvia
            );

            offset += tamanhoMaximo;
        }


        this.msg.registraLog(
            "(VC) Envia Dados VC_AC_END_SINGLE_FILE_TRANSFER."
        );

        this.sendToEco(
            EcoGuacamole.VC_AC_END_SINGLE_FILE_TRANSFER
        );
    },

    recvFromEco : function(data) {

        var that = this;

        var buffer = new Uint8Array(data); // 'data' como um array de bytes

        var action = buffer[0];
        var value = ""; // 'data' como string, exclui o 'action'
        var i;

        if (buffer.length > 1) {
            for(i = 1; i < buffer.length; i++) {
                value += String.fromCharCode(buffer[i]);
            }
        }

        if (this.dump) {
            this.msg.registraLog("receive({0}) Action: {1}, Dados: {2}".format(buffer.length, action, value));
        }
        switch(action){
            case EcoGuacamole.VC_AC_OPEN_LINK:
                if (value !== '') {
                    this.msg.registraLog('(VC) Opening link: ' + value);
                    setTimeout("this.browser.openUrl('" + value + "');", 500);
                } else {
                    this.msg.registraLog('(VC) Invalid link address');
                }
                break;

            case EcoGuacamole.VC_AC_APP_STARTED:
                this.status = EcoGuacamole.ECO_RUNNING;
                this.limpaTentativasDeReconexao();
                this.msg.registraLog('(VC) Remote application started');

                setTimeout(function() {
                    that.msg.hideMessage();
                }, 15000 /*15 segundos*/);

                /*
                 * Este tratamento é necessário, pois, no IPAD os navegadores não chamam o evento window.onresize
                 * quando está abrindo a página, diferentemente dos navegadores desktop que sempre chamam o onresize
                 * no início
                 */
                if (this.browser.isIPAD()) {
                    this.atualizaTela(
                        document.body.scrollLeft,
                        document.body.scrollTop,
                        document.body.scrollWidth,
                        document.body.scrollHeight,
                        window.innerWidth,
                        window.innerHeight,
                        window.devicePixelRatio
                    );
                }
                break;

            case EcoGuacamole.VC_AC_APP_CLOSED:
                this.msg.registraLog('(VC) Remote application closed');
                this.encerrarSessao(false, 0, false);
                break;

            case EcoGuacamole.VC_AC_HELLO:
                if (this.status == EcoGuacamole.ECO_WAITING_APP) {
                    this.status = EcoGuacamole.ECO_RUNNING;
                    this.msg.hideMessage();
                    this.msg.registraLog("(VC) Hello");
                    this.limpaTentativasDeReconexao();
                    this.clip.resetStates();
                }
                break;

            case EcoGuacamole.VC_AC_PREPARE_COPY:
                this.clip.preparaCopyGrande();
                break;

            case EcoGuacamole.VC_AC_CONFIRM_COPY:
                this.clip.finalizaCopyGrande();
                break;

            case EcoGuacamole.VC_AC_HIDE_COPY_MSG:
                this.msg.registraLog('(VC) hide copy message');
                this.msg.hideMessage();
                break;

            case EcoGuacamole.VC_AC_RAW_DATA:
                this.clip.recebeDadosDoCopyGrande(value);
                break;

            case EcoGuacamole.VC_AC_BIND_ELEMENT:
                this.msg.registraLog('(VC) Binding element: ' + value);
                var bindData = JSON.parse(value);
                this.browser.addStageElement(
                    bindData.id, bindData.ac, this.onBindableClick,
                    bindData.w, bindData.h, bindData.y, bindData.x);
                break;

            case EcoGuacamole.VC_AC_UNBIND_ELEMENT:
                var unbindData = JSON.parse(value);
                this.browser.removeStageElement(unbindData.id);
                break;

            case EcoGuacamole.VC_AC_FILE_TRANSFER_COMPLETE:
                this.msg.registraLog('(VC) Eco confirms file "{0}" was received. - {1}'.format(value, this._sendPool.length));
                break;

            case EcoGuacamole.VC_AC_FILE_PROCESS_COMPLETE:
                this.msg.registraLog('(VC) Eco confirms file "' + value + '" was processed.');
                this.removeArquivoDaListaDeTransmissao(value);
                this.msg.hideMessage();
                setTimeout(function() {
                    EcoGuacamole.ConexaoGuac.transfereArquivosNaFila();
                }, 1500);
                break;

            case EcoGuacamole.VC_AC_REQUEST_ID_AMBIENTE:
                var strIdAmbiente = this.browser.getCookie('idambiente');
                this.msg.registraLog('(VC) request IdAmbiente [' + strIdAmbiente + '] was processed.');

                this.sendToEco(EcoGuacamole.VC_AC_REQUEST_ID_AMBIENTE, strIdAmbiente);
                break;

            case EcoGuacamole.VC_AC_SEND_FILE_TO_USER_BEGIN:
                try {
                    this.sendFileToUser.init(value);
                }
                catch(err) {
                    this.msg.registraLog('(VC) SFtU #' + action + ' [' + err + '] value:"' + value + '"');
                }
                break;

            case EcoGuacamole.VC_AC_SEND_FILE_TO_USER_DATA:

                try {
                    this.sendFileToUser.add(value);
                }
                catch(err) {
                    this.msg.registraLog('(VC) SFtU #' + action + ' [' + err + '] value:"' + value + '"');
                }
                break;

            case EcoGuacamole.VC_AC_SEND_FILE_TO_USER_END:

                try {
                    this.sendFileToUser.done(value);
                }
                catch(err) {
                    this.msg.registraLog('(VC) SFtU #' + action + ' [' + err + '] value:"' + value + '"');
                }
                break;

            case EcoGuacamole.VC_AC_SEND_JANELA_MENOR_QUE_TAM_MAINFORM:
                var strMsgEco = value;
                this.msg.registraLog('(VC) Eco SendJanelaMenorQueTamMainForm - value: ' + strMsgEco + '.');

                if (strMsgEco === "1") {
                    this.msg.showMessage(
                    this.msg.textLang(
                        "ATENÇÃO!!!",
                        "WARNING!!!",
                        "ATENCIÓN!!!"
                    ),
                    this.msg.textLang(
                        "Aumente o tamanho da janela do seu browser para poder ver todo o conteúdo.",
                        "Increase the size of your browser window to view all content.",
                        "Aumentar el tamaño de la ventana de su navegador para ver todo el contenido."
                    ), '', false, 0.5);
                } else {
                    this.msg.hideMessage();
                }
                break;

            default:
                this.msg.registraLog("(VC) Unrecognized action message. Action: " + action);
        }
    },

    atualizaTela : function(scrollLeft, scrollTop, scrollWidth, scrollHeight, innerWidth, innerHeight, pixelRatio) {
        // Only reflow if size or scroll have changed
        if (
            (scrollLeft   !== this.screenSize.last_scroll_left) ||
            (scrollTop    !== this.screenSize.last_scroll_top) ||
            (scrollWidth  !== this.screenSize.last_scroll_width) ||
            (scrollHeight !== this.screenSize.last_scroll_height) ||
            (innerWidth   !== this.screenSize.last_window_width) ||
            (innerHeight  !== this.screenSize.last_window_height)
        ) {

            this.screenSize.last_scroll_top    = scrollTop;
            this.screenSize.last_scroll_left   = scrollLeft;
            this.screenSize.last_scroll_width  = scrollWidth;
            this.screenSize.last_scroll_height = scrollHeight;
            this.screenSize.last_window_width  = innerWidth;
            this.screenSize.last_window_height = innerHeight;

            // Anchor main to top-left of viewport, sized to fit above bottom
            var main = this.display.main;
            main.style.top = scrollTop + "px";
            main.style.left = scrollLeft + "px";
            main.style.width = innerWidth + "px";
            main.style.height = innerHeight + "px";

            if (this.display.attachedClient) {
                /*
                * 2015.07.23 11:41:22 marcelo: pixelRatio?
                * Estava passando pro cliente o tamanho da janela corrigido pelo pixelRatio.
                * mas isso tem efeitos indesejáveis:
                *
                *      (1) gera um efeito (inesperado) de zoom durante o resize da janela o que faz
                *          o usuário ver uma imagem ampliada/reduzida da aplicação que retorna ao
                *          tamanho normal ao terminar o resize da janela.
                *      (2) por causa do efeito de zoom, o guacamole descarta com frequencia toda
                *          a imagem exibida, resultando num flickering durante o resize.
                *      (3) o control de zoom do navegador não funciona.
                *
                * Desconsiderar pixelRatio minimiza o problema (1) e elimina os problemas (2) e (3).
                */
                this.display.attachedClient.sendSize(main.offsetWidth, main.offsetHeight);
            }
        }
    }
};
