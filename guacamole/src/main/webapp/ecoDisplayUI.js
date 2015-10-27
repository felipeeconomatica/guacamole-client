/**
 * Este objeto foi copiado (e simplificado) em boa parte do código do client do guacamole
 * client-ui.js
*/
var EcoDisplayUI = {
    "clipboard_integration_enabled" : true,
    "local_cursor"                  : false,
    "attachedClient"                : null,
    "main"                          : document.getElementById("main"),
    "display"                       : document.getElementById("display"),
    "touchTextInput"                : document.getElementById("touchTextInput"),
    "auto_fit"                      : true,
    "min_zoom"                      : 1,
    "max_zoom"                      : 3,
    "lastClipboardData"         : ""
};

/**
 * Sets the contents of the remote clipboard, if the contents given are
 * different.
 *
 * @param {String} data The data to assign to the clipboard.
 */
EcoDisplayUI.setRemoteClipboard = function (data) {

    if (this.attachedClient) {

        if (data !== this.lastClipboardData) {
            this.attachedClient.setClipboard(data);
            this.lastClipboardData = data;
        } else {
            // não precisa mandar novamente o valor para o servidor remoto, o valor já está no clipboard do servidor
        }
    } else {
        console.log('[ECO] edui.sc: unable to set clipboard data, no attached client');
    }
};

EcoDisplayUI.showTouchTextInput = function () {
    if (EcoGuacamole.ConexaoGuac.browser.isIPAD()) {
        this.touchTextInput.style.display = "block";
    }
};

EcoDisplayUI.hiddenTouchTextInput = function () {
    this.touchTextInput.style.display = "none";
};

var timeoutAnimation = 0;
EcoDisplayUI.startAnimationTouchTextInput = function () {
    if (EcoGuacamole.ConexaoGuac.browser.isIPAD()){
        this.showTouchTextInput();
        clearTimeout(timeoutAnimation);

        timeoutAnimation = setTimeout(EcoGuacamole.ConexaoGuac.display.hiddenTouchTextInput, 6000);
    }
};

/**
 * Sets the current display scale to the given value, where 1 is 100% (1:1
 * pixel ratio). Out-of-range values will be clamped in-range.
 *
 * @param {Number} new_scale The new scale to apply
 */
EcoDisplayUI.setScale = function(new_scale) {

    new_scale = Math.max(new_scale, this.min_zoom);
    new_scale = Math.min(new_scale, this.max_zoom);

    if (this.attachedClient) {
        this.attachedClient.getDisplay().scale(new_scale);
    }
    // If at minimum zoom level, auto fit is ON
    if (new_scale === EcoDisplayUI.min_zoom) {
        this.main.style.overflow = "hidden";
    } else {
        this.main.style.overflow = "auto";
    }
};


/**
 * Updates the scale of the attached Guacamole.Client based on current window
 * size and "auto-fit" setting.
 */
EcoDisplayUI.updateDisplayScale = function() {

    // Determine whether display is currently fit to the screen
    var guac = this.attachedClient;
    var auto_fit = (guac.getDisplay().getScale() === this.min_zoom);

    // Calculate scale to fit screen
    this.min_zoom = Math.min(
        this.main.offsetWidth  / Math.max(guac.getDisplay().getWidth(), 1),
        this.main.offsetHeight / Math.max(guac.getDisplay().getHeight(), 1)
    );

    // Calculate appropriate maximum zoom level
    this.max_zoom = Math.max(this.min_zoom, 3);

    // Clamp zoom level, maintain auto-fit
    if (guac.getDisplay().getScale() < this.min_zoom || auto_fit) {
        this.setScale(this.min_zoom);

    } else if (guac.getDisplay().getScale() > this.max_zoom) {
        this.setScale(this.max_zoom);
    }
};

/**
 * Attaches a Guacamole.Client to the client UI, such that Guacamole events
 * affect the UI, and local events affect the Guacamole.Client. If a client
 * is already attached, it is replaced.
 *
 * @param {Guacamole.Client} guac The Guacamole.Client to attach to the UI.
 */
EcoDisplayUI.attach = function(guac) {

    var that = this;

    // If a client is already attached, ensure it is disconnected
    if (this.attachedClient) {
        this.attachedClient.disconnect();
    }
    // Store attached client
    this.attachedClient = guac;

    // Get display element
    var guac_display = guac.getDisplay().getElement();

    /*
     * Update the scale of the display when the client display size changes.
     */

    guac_display.onresize =
        guac.getDisplay().onresize = function(width, height) {
            setTimeout(function() {
                that.updateDisplayScale();
            }, 1000);
        };

    /*
     * Update UI when the state of the Guacamole.Client changes.
     */

    guac.onstatechange = function(clientState) {

        switch (clientState) {

            // Connected
            case 3:
                var dados = GuacamoleSessionStorage.getItem("clipboard");
                if (dados) {
                    that.setRemoteClipboard(dados);
                }
                break;

            default:
                // Nada

        }
    };

    // Remove old client from UI, if any
    this.display.innerHTML = "";

    // Add client to UI
    guac_display.className = "software-cursor";
    this.display.appendChild(guac_display);

};
