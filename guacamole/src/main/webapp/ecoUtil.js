// Formatação de string
if (!String.prototype.format) {
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/\{(\d+)\}/g, function(match, number) {
            return (typeof args[number] != 'undefined') ? args[number] : match;
        });
    };
}

if (!String.prototype.padLeft) {
    String.prototype.padLeft = function(chr, size) {
        if (size >= this.length) {
            return Array(size - this.length + 1).join(chr) + this.toString();
        } else {
            return this;
        }
    };
}

// TODO: tentar aposentar esta função
function sleepFor(sleepDuration)
{
    var now = new Date().getTime();
    while (new Date().getTime() < now + sleepDuration) {/* Espera... */}
}

//********************************************************
// Vide issue #529
//********************************************************
function trataBase64ParaEco(data) {
    var i = 1;
    while (data.substr(-1) == '=' && i++ <= 2) {
        data = data.substring(0, data.length - 1);
    }

    return data;
}

function str2ArrayBuffer(value) {
    var dataraw = new ArrayBuffer(value.length);
    var dataarr = new Uint8Array(dataraw);

    if (value && value.length > 0) {
        for (var i = 0; i < value.length; i++) {
            dataarr[i] = value.charCodeAt(i);
        }
    }

    return dataarr;
}

function appendBuffer( buffer1, buffer2 ) {
    var tmp = new Uint8Array( buffer1.byteLength + buffer2.byteLength );
    tmp.set( new Uint8Array( buffer1 ), 0 );
    tmp.set( new Uint8Array( buffer2 ), buffer1.byteLength );

    return tmp.buffer;
}

function StringBuffer() {
    this.buffer = '';
}

StringBuffer.prototype.append = function append(string) {
    this.buffer += string;
    return this;
};

StringBuffer.prototype.clear = function clear() {
    this.buffer = '';
    return this;
};

StringBuffer.prototype.toString = function toString() {
    return this.buffer;
};

function _arrayBufferToBase64( buffer ) {
    var binary = '';
    var bytes = new Uint8Array( buffer );
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
    }
    return window.btoa( binary );
}



