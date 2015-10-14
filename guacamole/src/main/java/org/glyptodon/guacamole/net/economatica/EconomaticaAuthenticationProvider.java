package org.glyptodon.guacamole.net.economatica;

import java.util.HashMap;
import java.util.Map;

import org.glyptodon.guacamole.GuacamoleException;
import org.glyptodon.guacamole.net.auth.Credentials;
import org.glyptodon.guacamole.net.auth.simple.SimpleAuthenticationProvider;
import org.glyptodon.guacamole.protocol.GuacamoleConfiguration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


/**
 * Extensão da classe de autenticação do Guacamole para login no ambiente Cloud
 * da Economatica.
 *
 * @see			http://guac-dev.org/
 *
 *----------------------------------------------------------------------------------------
 *
 * O Guacamole utiliza o Maven para a compilação desta classe. Isto significa que basta
 * ter instalado um JDK para que todas as dependências sejam baixadas e instaladas
 * automaticamente antes da compilação.
 *
 * @see 		http://maven.apache.org/
 *
 * O arquivo "pom.xml" é utilizado para a definição dos parâmetros de compilação, bem como
 * as dependências para tal. Para compilar, basta executar o comando "mvn package" no
 * mesmo diretório em que está localizado o arquivo "pom.xml". Consulte o link abaixo
 * caso precise de referências sobre a compilação.
 *
 * @see			http://guac-dev.org/doc/gug/custom-authentication.html#user-auth-example
 *
 * Para compilação, utilizei o "OpenJDK 1.7" no "Ubuntu x64". Esse compilador funcionou bem
 * para a construção do "guacamole-client 0.9.0". Para a instalação do OpenJDK utilize o
 * comando "apt-get install default-jdk".
 *
 * @see 		https://help.ubuntu.com/community/Java
 *
 * Após compilado, o arquivo "guacamole-auth-economatica-0.9.0.jar" deve ser copiado do
 * diretório "target/" para a pasta de deployment do Guacamole com o nome
 * "guacamole-auth-economatica.jar". Se você utilizou o tutorial oficial para instalar o
 * Guacamole, provavelmente o destino será o diretório "/var/lib/guacamole/classpath/".
 *
 * @see			http://guac-dev.org/doc/gug/installing-guacamole.html
 *
 *----------------------------------------------------------------------------------------
 *
 * @copyright	(2014) Economatica Software de Apoio a Investidores Ltda.
 * @author		Rodrigo Salvador <rodrigo@economatica.com.br>
 * @since		2014-04-02
 */
public class EconomaticaAuthenticationProvider extends SimpleAuthenticationProvider {

	private final Logger logger = LoggerFactory.getLogger(EconomaticaAuthenticationProvider.class);

	/**
	 * Override para o método de autenticação de usuários do Guacamole.
	 *
	 * Neste método implementamos os procedimentos específicos de autenticação de
	 * usuários para a plataforma Eco-Cloud.
	 *
	 * @{inheritDoc}
	 *
	 * @see http://guac-dev.org/doc/gug/custom-authentication.html#user-auth-example
	 */
	@Override
	public Map<String, GuacamoleConfiguration> getAuthorizedConfigurations(Credentials credentials) throws GuacamoleException {

		Map<String, GuacamoleConfiguration> result = new HashMap<String, GuacamoleConfiguration>();
		result.put("DEFAULT", EconomaticaGuacamoleUtils.configureConnection(credentials.getRequest()));

		logger.info("[EAP.gac] configuration mapped");

		return result;
	}
}
