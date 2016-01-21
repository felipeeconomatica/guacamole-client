package org.glyptodon.guacamole.net.economatica;

import java.util.UUID;
import java.util.concurrent.locks.ReentrantLock;

import javax.servlet.http.HttpServletRequest;

import org.glyptodon.guacamole.GuacamoleException;
import org.glyptodon.guacamole.io.GuacamoleReader;
import org.glyptodon.guacamole.io.GuacamoleWriter;
import org.glyptodon.guacamole.net.GuacamoleSocket;
import org.glyptodon.guacamole.net.GuacamoleTunnel;
import org.glyptodon.guacamole.net.InetGuacamoleSocket;
import org.glyptodon.guacamole.net.basic.ClipboardState;
import org.glyptodon.guacamole.net.basic.GuacamoleSession;
import org.glyptodon.guacamole.net.basic.MonitoringGuacamoleReader;
import org.glyptodon.guacamole.net.basic.rest.auth.AuthenticationService;
import org.glyptodon.guacamole.protocol.ConfiguredGuacamoleSocket;
import org.glyptodon.guacamole.protocol.GuacamoleConfiguration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.inject.Inject;
import com.google.inject.Singleton;


/**
 * Classe com utilidades comuns na extensão do Guacamole para a Economatica
 *
 * @see         http://guac-dev.org/
 *
 * @copyright   (2014) Economatica Software de Apoio a Investidores Ltda.
 * @author      Felipe Francesco P. L. da Costa <felipe@economatica.com.br>
 * @since       2014-09-19
 */
@Singleton
public class EconomaticaGuacamoleUtils  {

    private final Logger logger = LoggerFactory.getLogger(EconomaticaGuacamoleUtils.class);

    @Inject
    private AuthenticationService authenticationService;

    public static GuacamoleConfiguration configureConnection(HttpServletRequest request) {

        String username = request.getParameter("username");
        String password = request.getParameter("password");
        String hostname = request.getParameter("hostname");
        String port = request.getParameter("port");

        String remoteApp = request.getParameter("remote-app");
        String remoteAppArgs = request.getParameter("remote-app-args");
        String width = request.getParameter("width");
        String height = request.getParameter("height");

        GuacamoleConfiguration config = new GuacamoleConfiguration();

        config.setProtocol("rdp");
        config.setParameter("hostname", hostname);
        config.setParameter("port", port);
        config.setParameter("username", username);
        config.setParameter("password", password);
        config.setParameter("width", width);
        config.setParameter("height", height);
        config.setParameter("disable-audio", "true");
        config.setParameter("enable-printing", "false");
        config.setParameter("color-depth", "32");

        if (remoteApp != "") {
            config.setParameter("static-channels", "SPARK");
        }

        if (remoteAppArgs != "") {
            config.setParameter("remote-app-args", remoteAppArgs);
        }

        config.setParameter("server-layout", "en-us-qwerty");

        return config;
    }

    public GuacamoleTunnel criaTunnelGuacamole(HttpServletRequest request) throws GuacamoleException {

        // Estabelece a conexão com o guacd
        // Observe que esta conexão é feita em localhost, pois o mesmo local em que o
        // servlet está sendo executado, também existe um daemon guacd. }
        GuacamoleSocket socket = null;
        try {
            socket = new ConfiguredGuacamoleSocket(
                    new EconomaticaGuacamoleSocket("localhost", 4822),
                    configureConnection(request)
                );
            logger.info("[EGU.cTG] connected to guacd");
        } catch (GuacamoleException e) {
            logger.error("[EGU.cTG] socket exception, is guacd alive?");
            throw e;
        }

        String authToken = request.getParameter("authToken");
        logger.debug("[EGU.cTG] authToken:" + authToken);

        if (authenticationService != null) {

            logger.debug("[EGU.cTG] authenticationService:" + authenticationService.toString());

            final GuacamoleSession session = authenticationService.getGuacamoleSession(authToken);

            logger.info("[EGU.cTG] creating tunnel...");

            GuacamoleTunnel tunnel = new EconomaticaTunnel(socket) {

                @Override
                public GuacamoleReader acquireReader() {
                    ClipboardState clipboard = session.getClipboardState();
                    return new MonitoringGuacamoleReader(clipboard, super.acquireReader());
                }

                @Override
                public void close() {

                    String uuid = getUUID().toString();

                    logger.info("closing session {}...", uuid);

                    try {
                        session.removeTunnel(uuid);
                        super.close();
                    } catch (GuacamoleException e) {
                        logger.error("failed to close tunnel associated to session " + uuid, e);
                    } catch (Exception e) {
                        logger.error("unexpected error while closing tunnel associated to session " + uuid, e);
                    }

                    logger.info("...session {} closed", uuid);
                }
            };

            logger.info("[EGU.cTG] ...tunnel created");

            session.addTunnel(tunnel);

            logger.info("[EGU.cTG] tunnel associated with session");

            return tunnel;
        }
        else {
            logger.warn("[EGU.cTG] null authenticationService");
        }

        return null;
    }

    private class EconomaticaTunnel implements GuacamoleTunnel {

        /**
         * Logger for this class.
         */
        private Logger logger = LoggerFactory.getLogger(EconomaticaTunnel.class);

        /**
         * The UUID associated with this tunnel. Every tunnel must have a
         * corresponding UUID such that tunnel read/write requests can be
         * directed to the proper tunnel.
         */
        private UUID uuid;

        /**
         * The GuacamoleSocket that tunnel should use for communication on
         * behalf of the connecting user.
         */
        private GuacamoleSocket socket;

        /**
         * Lock acquired when a read operation is in progress.
         */
        private ReentrantLock readerLock;

        /**
         * Lock acquired when a write operation is in progress.
         */
        private ReentrantLock writerLock;

        /**
         * Creates a new GuacamoleTunnel which synchronizes access to the
         * Guacamole instruction stream associated with the given GuacamoleSocket.
         *
         * @param socket The GuacamoleSocket to provide synchronized access for.
         */
        EconomaticaTunnel(GuacamoleSocket socket) {

            this.socket = socket;
            uuid = UUID.randomUUID();

            readerLock = new ReentrantLock();
            writerLock = new ReentrantLock();

            logger.info("[EGU.ET] tunnel created");
        }

        public GuacamoleReader acquireReader() {
            readerLock.lock();
            return socket.getReader();
        }

        public void releaseReader() {
            readerLock.unlock();

        }

        public boolean hasQueuedReaderThreads() {
            return readerLock.hasQueuedThreads();
        }

        public GuacamoleWriter acquireWriter() {
            writerLock.lock();
            return socket.getWriter();
        }

        public void releaseWriter() {
            writerLock.unlock();
        }

        public boolean hasQueuedWriterThreads() {
            return writerLock.hasQueuedThreads();
        }

        public UUID getUUID() {
            return this.uuid;
        }

        public GuacamoleSocket getSocket() {
            return socket;
        }

        public void close() throws GuacamoleException {

            socket.close();

            logger.info("socket closed");
        }

        public boolean isOpen() {
            return socket.isOpen();
        }

    }
}
