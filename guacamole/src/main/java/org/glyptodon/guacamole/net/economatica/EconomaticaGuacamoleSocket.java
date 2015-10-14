package org.glyptodon.guacamole.net.economatica;


import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.SocketAddress;
import java.net.SocketException;
import java.net.SocketTimeoutException;

import org.glyptodon.guacamole.GuacamoleConnectionClosedException;
import org.glyptodon.guacamole.GuacamoleException;
import org.glyptodon.guacamole.GuacamoleServerException;
import org.glyptodon.guacamole.GuacamoleUpstreamTimeoutException;
import org.glyptodon.guacamole.io.GuacamoleReader;
import org.glyptodon.guacamole.io.GuacamoleWriter;
import org.glyptodon.guacamole.io.ReaderGuacamoleReader;
import org.glyptodon.guacamole.net.GuacamoleSocket;
import org.glyptodon.guacamole.protocol.GuacamoleInstruction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Cópia de InetGuacamoleSocket.java, re-implementando WriterGuacamoleWriter para
 * inserir log.
 *
 * @author Felipe Francesco
 */
public class EconomaticaGuacamoleSocket implements GuacamoleSocket {

    private Logger logger = LoggerFactory.getLogger(EconomaticaGuacamoleSocket.class);

    private GuacamoleReader reader;

    private GuacamoleWriter writer;

    private static final int SOCKET_TIMEOUT = 90000; //  The default value is 15000.

    private Socket sock;

    public EconomaticaGuacamoleSocket(String hostname, int port) throws GuacamoleException {

        try {

            logger.info("Connecting to guacd at {}:{}.", hostname, port);

            // Get address
            SocketAddress address = new InetSocketAddress(
                    InetAddress.getByName(hostname),
                    port
            );

            // Connect with timeout
            sock = new Socket();
            sock.connect(address, SOCKET_TIMEOUT);

            // Set read timeout
            sock.setSoTimeout(SOCKET_TIMEOUT);

            // On successful connect, retrieve I/O streams
            reader = new ReaderGuacamoleReader(new InputStreamReader(sock.getInputStream(), "UTF-8"));
            writer = new EconomaticaGuacamoleWriter(new OutputStreamWriter(sock.getOutputStream(), "UTF-8"));

        }
        catch (SocketTimeoutException e) {
            throw new GuacamoleUpstreamTimeoutException("Connection timed out.", e);
        }
        catch (IOException e) {
            throw new GuacamoleServerException(e);
        }

    }

    @Override
    public void close() throws GuacamoleException {
        try {
            logger.debug("Closing socket to guacd.");
            sock.close();
        }
        catch (IOException e) {
            throw new GuacamoleServerException(e);
        }
    }

    @Override
    public GuacamoleReader getReader() {
        return reader;
    }

    @Override
    public GuacamoleWriter getWriter() {
        return writer;
    }

    @Override
    public boolean isOpen() {
        return !sock.isClosed();
    }

	private class EconomaticaGuacamoleWriter implements GuacamoleWriter {

		private Writer output;

		private Logger logger = LoggerFactory.getLogger(EconomaticaGuacamoleWriter.class);


		public EconomaticaGuacamoleWriter(Writer output) {
			this.output = output;
		}

		@Override
		public void write(char[] chunk, int off, int len) throws GuacamoleException {
			try {
				output.write(chunk, off, len);
				output.flush();
			}
            catch (SocketTimeoutException e) {
                throw new GuacamoleUpstreamTimeoutException("Connection to guacd timed out.", e);
            }
            catch (SocketException e) {
                throw new GuacamoleConnectionClosedException("Connection to guacd is closed.", e);
            }
			catch (IOException e) {
				throw new GuacamoleServerException(e);
			}
		}

		@Override
		public void write(char[] chunk) throws GuacamoleException {
			write(chunk, 0, chunk.length);
		}

		@Override
		public void writeInstruction(GuacamoleInstruction instruction) throws GuacamoleException {
            logger.info(">> Eco: Write " + instruction.getOpcode());

			write(instruction.toString().toCharArray());
		}

	}

}

