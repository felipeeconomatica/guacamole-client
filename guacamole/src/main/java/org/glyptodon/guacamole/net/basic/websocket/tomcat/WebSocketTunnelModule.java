/*
 * Copyright (C) 2014 Glyptodon LLC
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

package org.glyptodon.guacamole.net.basic.websocket.tomcat;

import com.google.inject.servlet.ServletModule;

import java.io.File;

import org.glyptodon.guacamole.GuacamoleException;
import org.glyptodon.guacamole.environment.Environment;
import org.glyptodon.guacamole.environment.LocalEnvironment;
import org.glyptodon.guacamole.net.basic.TunnelLoader;
import org.glyptodon.guacamole.net.basic.extension.DirectoryClassLoader;
import org.glyptodon.guacamole.net.economatica.EconomaticaTunnelWebSocketServlet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Loads the Jetty 9 WebSocket tunnel implementation.
 *
 * @author Michael Jumper
 */
public class WebSocketTunnelModule extends ServletModule implements TunnelLoader {

    /**
     * Logger for this class.
     */
    private final Logger logger = LoggerFactory.getLogger(WebSocketTunnelModule.class);

    @Override
    public boolean isSupported() {

        try {

            // Attempt to find WebSocket servlet
        	Class.forName("org.glyptodon.guacamole.net.economatica.EconomaticaTunnelWebSocketServlet");

        	logger.info("[WSTM.is] web socket support ok");

        	// Support found
            return true;

        }

        // If no such servlet class, this particular WebSocket support
        // is not present
        catch (ClassNotFoundException e) {
            logger.warn("[WSTM.is] class not found", e);
        }
        catch (NoClassDefFoundError e) {
            logger.warn("[WSTM.is] no class def", e);
        }

        logger.error("[WSTM.is] web socket support not found!");

        // Support not found
        return false;

    }

    @Override
    public void configureServlets() {

        logger.info("Loading Tomcat 7 WebSocket support...");
        serve("/websocket-tunnel").with(EconomaticaTunnelWebSocketServlet.class);

    }

}
