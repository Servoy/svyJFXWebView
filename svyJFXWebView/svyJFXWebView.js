/*
 * This file is part of the Servoy Business Application Platform, Copyright (C) 2012-2013 Servoy BV
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * @private
 * @properties={typeid:35,uuid:"D01B2F1E-047D-4A93-BB4C-00DED8AEAD6A",variableType:-4}
 */
var log = scopes.svyLogManager.getLogger('com.servoy.bap.components.webview')

/**
 * Creates and displays a JavaFX WebView component in the supplied container<br>
 * <br>
 * This component depends on the availability of JavaFX, which must be made available in Smart Clients by setting the property <i>servoy.client.javafx</i> to true through the Admin pages<br>
 * <br>
 * JavaFX comes pre-installed with Java 7 update 6 or higher.
 * On Java 7 < update 6 the user gets prompted when starting the Smart Client to install JavaFX if JavaFX is not yet installed
 * On Java 6 JavaFX must be manually installed and is only available on Windows<br>
 * <br>
 * The content in the JavaFX WebView can make use of media:/// urls to access resources stored in the Servoy Media library<br>
 * <br>
 * From within the content of the JavaFX WebView upcalls can be made to the Servoy scripting layer in two ways:<br>
 * 1. From JavaScript using <i>servoy.executeMethod(methodName:String, arguments:Array<*>)</i><br>
 * 2. Through callback url's, for example: <i>callback://{methodName}?key1=value1&key2=value2</i>. Note that XHTTPRequests using url's using the callback:// protocol are not supported due to CORS restrictions<br>
 * <br>
 * The methodName used in the upcalls can be either the name of a method on the form on which the JFXWebView is displayed or a fully qualified path to a method on a form or in a scope<br>
 * The call to the method specified when doing <i>servoy.executeMethod</i> is asynchronous, so <i>servoy.executeMethod</i> always returns void.<br>
 * It is possible to send a function as argument into <i>servoy.executeMethod</i> to be executed inside the Servoy scripting layer as callback
 * <br>
 * Known issues:<br>
 * <ul>
 * <li>Loading websites that require (basic http) authentication will result in a login dialog popup, regardless if the username/password are passed in through the URL</li>
 * <li>=< Servoy 7.3: After being loaded a first time, JS & CSS are cached for the duration of JVM session. Especially in Servoy Developer this is cumbersome, as it requires restarting Servoy Developer to test changes</li>
 * </ul>
 *
 * @constructor
 * @param {RuntimeTabPanel} container
 *
 * @example <pre>
 * var panel = new scopes.modJFXWebView.WebViewPanel(elements.myTablessTabPanel)
 * panel.load('http://servoy.com')
 * </pre>
 *
 * @example <pre>
 * var panel = new scopes.modJFXWebView.WebViewPanel(elements.myTablessTabPanel)
 * var content = {@code<html
 * 	<body>
 * 		<a href="callback://testCallbackUrl">callback://testCallbackUrl</a><br/>
 * 		<a href="callback://forms.test.testCallbackUrl">callback://forms.test.testCallbackUrl</a><br/>
 * 		<a href="callback://forms.test.testCallbackUrl?fruit=banana&amp;brand=Chiquita">callback://forms.test.testCallbackUrl?fruit=banana&brand=Chiquita</a><br/>
 * 		<a href="#" onclick="servoy.executeMethod('forms.test.testServoyExecuteMethod')">servoy.executeMethod('forms.test.testServoyExecuteMethod')</a><br/>
 * 		<button id="myButton" onclick="servoy.executeMethod('forms.test.testServoyExecuteMethod', ['banaan', window])">servoy.executeMethod('forms.test.testServoyExecuteMethod', ['banana', window])</button>
 * 	</body>
 * </html>}
 * panel.loadContent(content.toXMLString())
 * panel.executeScriptLater('document.getElementById('myButton').click()')
 * </pre>
 *
 * @properties={typeid:24,uuid:"9C95D0A8-7A31-4AF6-8011-771DE24E863A"}
 */
function WebViewPanel(container) {
	if (!jfxAvailable) {
		log.warn('Attempting to use svyJFXWebView when JavaFX is not available (Java version: ' + Packages.java.lang.System.getProperty("java.version") + ')')
		var dummy = function() {
			log.warn('Attempting to use svyJFXWebView when JavaFX is not available (Java version: ' + Packages.java.lang.System.getProperty("java.version") + ')')
		}
		return {
			load: dummy,
			loadContent: dummy,
			executeScriptAndWait: dummy,
			executeScriptLater: dummy,
			enableFirebug: dummy
		}
	}

	var formName = application.getUUID().toString()
	application.createNewFormInstance("JFXWebViewPanel", formName)

	container.removeAllTabs()
	container.addTab(forms[formName])

	/**
	 * @param {String} url
	 */
	this.load = function(url) {
		forms[formName].load(url)
	}

	/**
	 * @param {String} content
	 * @param {String} [contentType]
	 */
	this.loadContent = function(content, contentType) {
		forms[formName].loadContent(content, contentType)
	}

	/**
	 * Executes the supplied script in the JavaFX WebView and waits for the script to be executed and then returns the return value of the executed script<br>
	 * <br>
	 * If the executed script does not return anything or the returned value is not used, use {@link #executeScriptLater} instead<br>
	 * <br>
	 * Use with care: using this method can cause deadlocks if the script that is executed performs callbacks back to the Servoy scripting layer again using <i>servoy.executeMethod(...)</i><br>
	 * <br>
	 * @param {String} script
	 * @return {*}
	 */
	this.executeScriptAndWait = function(script) {
		return forms[formName].executeScriptAndWait(script)
	}

	/**
	 * Executes the supplied script in the JavaFX WebView and returns immediately. This means that this method never returns a value<br>
	 * <br>
	 * If the return value of the executed script is required, use {@link #executeScriptAndWait} instead
	 * @param {String} script
	 * TODO: add optional callback parameter
	 */
	this.executeScriptLater = function(script) {
		forms[formName].executeScriptLater(script)
	}

	this.enableFirebug = function() {
		forms[formName].enableFirebug()
	}
}

/**
 * @private
 * @properties={typeid:35,uuid:"D06CE19A-0AD5-4365-9437-34006E1F152A",variableType:-4}
 */
var jfxAvailable = false

/**
 * Returns <code>true</code> if JavaFX is available for use in the smart client<br>
 * 
 * In the web client, this always returns <code>true</code>.
 *
 * @properties={typeid:24,uuid:"D2D3C152-29B7-4845-82B2-CF783C78ABC2"}
 */
function isJavaFxAvailable() {
	if (scopes.svySystem.isSwingClient()) {
		return jfxAvailable;
	} else {
		return true;
	}
}

/**
 * @private
 * @SuppressWarnings(unused)
 * @properties={typeid:35,uuid:"2C1A4FD1-06D8-40CD-BC62-7FFE638FE97E",variableType:-4}
 */
var init = (function() {
	if (scopes.svySystem.isSwingClient()) {
		/* Getting ClientPluginAccess needed for at least registerURLStreamHandler
		 * Using inlined code from scopes.svySmartClientUtils.getSmartClientPluginAccess as to not have to make registerURLStreamHandler a public method, since too dangerous:
		 * using registerURLStreamHandler with a Java Class that has a (partial) JavaScript implementation causes mem-leaks and errors after switching solution
		 * */
		var x = new Packages.org.mozilla.javascript.NativeJavaObject(globals, plugins.window, new Packages.org.mozilla.javascript.JavaMembers(globals, Packages.com.servoy.extensions.plugins.window.WindowProvider));
		/** @type {Packages.com.servoy.j2db.plugins.IClientPluginAccess} */
		var clientPluginAccess = x['getClientPluginAccess']()

		jfxAvailable = typeof Packages.scene.Node === 'function'

		if (!jfxAvailable) {
			/* In developer or the testrunner client JavaFX is loaded only when a instance of the JFXPanel bean is instantiated
			 * It can happen that this code is executed before a JFXPanel instance is created
			 * Therefore this code forces such instance creation, so JavaFX gets loaded if available
			 */
			log.trace('Trying forced JavaFX load')
			var jfxPanel = new Packages.com.servoy.extensions.beans.jfxpanel.JFXPanel();
			/** @type {Packages.com.servoy.extensions.beans.jfxpanel.ServoyJFXPanel} */
			var svyJFXPanel = jfxPanel.getBeanInstance(2, clientPluginAccess, null)
			jfxAvailable = svyJFXPanel.isJavaFXAvailable()
		}

		if (jfxAvailable) {
			/*
			 * Registering a URLStreamHandler for the 'callback://' protocol, to be used from within HTML inside JFXWebView to do callbacks to Servoy's JavaScript layer based on URL's
			 *
			 * The URLStreamHandler for the 'callback://' protocol is needed to be able to intercept requests to such URL's.
			 *
			 * The webengine's LoadWorker State change Listener cancels loading of urls with the callback protocol before the Java layer actually tries to resolve the url and fires a Servoy method instead
			 *
			 * As a URLStreamHandler that is registered remains registered when switching solutions in the Smart Client or when restarting Debug Smart Clients in Developer,
			 * a real compiled Java Class is used, as extending URLStreamHandler and implementing IDeveloperURLStreamHandler using Rhino's Java/JavaScript interaction capabilities
			 * would create a Java Class that holds onto the JavaScript scope in which it is created, which in turn would cause errors and memory leaks when switching solutions in the SC/restarting DSC's
			 *
			 * In order to not have external dependencies on beans/plugins, the required Java class is stored in the media library, which in turn requires a custom URLCLassLoader to retrieve it
			 */
			var cx = Packages.org.mozilla.javascript.Context.getCurrentContext()
			var customCL = java.net.URLClassLoader([new java.net.URL("media:///bin/")], cx.getApplicationClassLoader())

			var dummyURLStreamHandlerClass = java.lang.Class.forName("com.servoy.bap.webpane.DummyURLStreamHandler", false, customCL)
			/** @type {java.net.URLStreamHandler} */
			var dummyURLStreamHandlerInstance = dummyURLStreamHandlerClass.newInstance();
			
			clientPluginAccess.registerURLStreamHandler('callback', dummyURLStreamHandlerInstance);
		}
	}
}())