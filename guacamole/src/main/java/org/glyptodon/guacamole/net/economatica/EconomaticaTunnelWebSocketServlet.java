package org.glyptodon.guacamole.net.economatica;

import javax.servlet.http.HttpServletRequest;

import org.glyptodon.guacamole.GuacamoleException;
import org.glyptodon.guacamole.net.GuacamoleTunnel;
import org.glyptodon.guacamole.net.basic.websocket.tomcat.GuacamoleWebSocketTunnelServlet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.inject.Inject;
import com.google.inject.Singleton;


/**
 * Extensão da classe de conexão do Guacamole no ambiente Cloud da Economatica, para conexão websocket
 *
 * @see			http://guac-dev.org/
 *
 * @copyright	(2014) Economatica Software de Apoio a Investidores Ltda.
 * @author		Felipe Francesco P. L. da Costa <felipe@economatica.com.br>
 * @since		2014-05-02
 */
@SuppressWarnings("serial")
@Singleton
public class EconomaticaTunnelWebSocketServlet extends GuacamoleWebSocketTunnelServlet {

	private final Logger logger = LoggerFactory.getLogger(EconomaticaTunnelWebSocketServlet.class);

	@Inject
	private EconomaticaGuacamoleUtils economaticaGuacamoleUtils;

	/**
	 * Override para o método de conexão com o servidor Guacamole utilizando WebSockets.
	 *
	 * Neste método implementamos os procedimentos específicos para a conexão direta com
	 * o EcoCloud. Os parâmetros de conexão com o ambiente EcoCloud são recebidos no
	 * argumento "request", preparados pelo "ecostarter.js".
	 *
	 * @{inheritDoc}
	 *
	 * @see 	http://guac-dev.org/doc/gug/guacamole-architecture.html
	 *
	 * @todo	Implementar/confirmar o tratamento de erro. No caso de ocorrer uma exceção
	 *		 	neste método, a mensagem precisa ser repassada para a página de login e
	 *			consequentemente ser exibida para o usuário.
	 */
	@Override
	protected GuacamoleTunnel doConnect(HttpServletRequest request) throws GuacamoleException {

		logger.info("[ETWSS.dC] connecting..");
		GuacamoleTunnel tunnel = economaticaGuacamoleUtils.criaTunnelGuacamole(request);
		logger.info("[ETWSS.dC] ...connected");
		return tunnel;
	}
}
