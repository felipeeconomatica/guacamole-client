package org.glyptodon.guacamole.net.economatica;

import javax.servlet.http.HttpServletRequest;

import org.glyptodon.guacamole.GuacamoleException;
import org.glyptodon.guacamole.net.GuacamoleTunnel;
import org.glyptodon.guacamole.servlet.GuacamoleHTTPTunnelServlet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.inject.Inject;

/**
 * Extensão da classe de conexão do Guacamole no ambiente Cloud da Economatica.
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
 * @see			http://guac-dev.org/doc/gug/writing-you-own-guacamole-app.html
 *
 * Para compilação, utilizei o "OpenJDK 1.7" no "Ubuntu x64". Esse compilador funcionou bem
 * para a construção do "guacamole-client 0.9.0". Para a instalação do OpenJDK utilize o
 * comando "apt-get install default-jdk".
 *
 * @see 		https://help.ubuntu.com/community/Java
 *
 * Após compilado, o arquivo "guacamole-login-economatica-0.9.0.jar" deve ser copiado do
 * diretório "target/" para a pasta de deployment do Guacamole com o nome da versão web
 * conforme definido no "gotologin.js" e pelo arquivo "web.version".
 * Se você utilizou o tutorial oficial para instalar o Guacamole, provavelmente o destino
 * será o diretório "/var/lib/tomcat7/webapps".
 *
 * @see			http://guac-dev.org/doc/gug/installing-guacamole.html
 *
 * Esta classe é compilada pelos scripts "rc" e "c". O "rc" deve ser utilizado quando
 * a edição dos fontes estiver sendo feita remotamente (no Mac, por exemplo), e o script
 * irá copiar os arquivos para o servidor Guacamole (nos seus devidos diretórios) e então
 * executará a compilação do servlet. O "c" simplesmente compila o servlet e deverá ser
 * utilizado diretamente no servidor Guacamole.
 *
 *----------------------------------------------------------------------------------------
 *
 * @todo		É necessário implementar a versão do conteúdo web (gerado pelo version.cgi)
 *				no script de compilação, para automatizar a instalação/atualização.
 *
 * @todo		É necessário implementar um mecanismo de tratamento de erros, para que no
 *				caso de haver uma exceção nesta classe, a mensagem seja exibida na página
 *				de login no site da Economatica.
 *
 *----------------------------------------------------------------------------------------
 *
 * @copyright	(2014) Economatica Software de Apoio a Investidores Ltda.
 * @author		Rodrigo Salvador <rodrigo@economatica.com.br>
 * @since		2014-04-25
 */
@SuppressWarnings("serial")
public class EconomaticaTunnelServlet extends GuacamoleHTTPTunnelServlet {

	@Inject
	private EconomaticaGuacamoleUtils economaticaGuacamoleUtils;

	private final Logger logger = LoggerFactory.getLogger(EconomaticaTunnelServlet.class);

	/**
	 * Override para o método de conexão com o servidor Guacamole.
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
		logger.debug(">>>>> EconomaticaTunnelServlet - doConnect Instância de Utils:{}", economaticaGuacamoleUtils.toString());

		return economaticaGuacamoleUtils.criaTunnelGuacamole(request);

	}
}
