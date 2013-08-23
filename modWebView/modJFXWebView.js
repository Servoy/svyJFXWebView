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
 * Creates and displays a JavaFX WebView component in the supplied container
 * @constructor
 * @param {RuntimeTabPanel} container
 *
 * @properties={typeid:24,uuid:"9C95D0A8-7A31-4AF6-8011-771DE24E863A"}
 */
function WebViewPanel(container) {
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
	 * @param {String} script
	 * @return {*}
	 */
	this.executeScript = function(script) {
		return forms[formName].executeScript(script)
	}
	
	this.enableFirebug = function() {
		forms[formName].enableFirebug()
	}
}

/**
 * @protected 
 * @type {scopes.modUtils$log.Logger}
 * @properties={typeid:35,uuid:"D01B2F1E-047D-4A93-BB4C-00DED8AEAD6A",variableType:-4}
 */
var log = (function() {
		var logger = scopes.modUtils$log.getLogger('com.servoy.bap.components.webpanel')
		
		//TODO: in this logger we'd like to also log the Java thread (java.lang.Thread.currentThread().getName())
		
		logger.setLevel(scopes.modUtils$log.Level.DEBUG) //TODO: Level.ALL doesn't work properly
		return logger
	}())

/**
 * @private 
 * @SuppressWarnings(unused)
 * @properties={typeid:35,uuid:"2C1A4FD1-06D8-40CD-BC62-7FFE638FE97E",variableType:-4}
 */
var init = function() { 
	//TODO: add check to test for JavaFX availability
	if (scopes.modUtils$system.isSwingClient()) {
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
		
		//Using inlined code from scopes.modUtils$smartClient.unwrapElement & scopes.modUtils$smartClient.getSmartClientPluginAccess so not having to make registerURLStreamHandler a public method, since too dangerous:
		//using registerURLStreamHandler with a Java Class that has a (partial) JavaScript implementation causes mem-leaks and errors after switching solution
		var list = new Packages.java.util.ArrayList();
		list.add(plugins.window);
		var unwrappedElement = list.get(0);
		unwrappedElement['getClientPluginAccess']().registerURLStreamHandler('callback', dummyURLStreamHandlerClass.newInstance())
	}
}()
