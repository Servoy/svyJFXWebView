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

/*
 * See: http://docs.oracle.com/javafx/2/api/javafx/scene/web/WebEngine.html
 * 
 * CHECKME: see if the cache of JS/CSS resources can somehow be controlled. Currently seems that you need to restart Servoy Developer to realy clear the cache (https://forums.oracle.com/message/11040487#11040487)
 * TODO: add relevant Listeners
 * TODO: expose more relevant properties
 */

/**
 * @private
 * @type {scopes.modUtils$log.Logger}
 * @properties={typeid:35,uuid:"5DBA7CA5-3CD8-4D42-91B1-3834E7CBCFC1",variableType:-4}
 */
var log = scopes.modJFXWebView['log']

/**
 * @private
 * @type {Packages.javafx.scene.web.WebEngine}
 *
 * @properties={typeid:35,uuid:"E65C723F-846B-4872-BF7A-87B8C10C5B09",variableType:-4}
 */
var webEngine

/**
 * Only stored for resize issue debugging purposes
 * @private
 * @type {Packages.javafx.scene.web.WebView}
 *
 * @properties={typeid:35,uuid:"589473B9-4FF3-4A2A-9CA3-1A1D3DFDF2AC",variableType:-4}
 */
var browser

/**
 * Only stored for resize issue debugging purposes
 * @private
 * @type {Packages.javafx.scene.Scene}
 *
 * @properties={typeid:35,uuid:"9CF83AE3-779B-4BE5-A830-EAA44312F55F",variableType:-4}
 */
var scene

/**
 * @private
 * @properties={typeid:35,uuid:"2F57D9F9-3417-47E8-B706-40DC67DAB7B8",variableType:-4}
 */
var webEngineReady = false

/**
 * @private
 * @type {java.util.concurrent.CountDownLatch}
 *
 * @properties={typeid:35,uuid:"23C9C713-F2EE-4E90-A72D-B2D2C838DFD7",variableType:-4}
 */
var webEngineNotReadyCountdownLatch

/**
 * @private
 * @type {java.util.concurrent.CountDownLatch}
 *
 * @properties={typeid:35,uuid:"D88D3A02-6EAF-4E9C-A720-64CC9A4F38B7",variableType:-4}
 */
var executeScriptCountdownLatch

/**
 * @private
 * @properties={typeid:24,uuid:"B4DC94FB-14B9-440C-B4C4-2EFE28DA2DC2"}
 */
function setUpPanel() {
	/**
	 * @param {String} qualifiedName
	 * @param {*} [args]
	 * @param {Boolean} invokeAndWait
	 * 
	 * @return {*} If not invoked on Swing's EDT, there will not be a return value, because that could cause deadlocks
	 * 
	 * @throws {scopes.modUtils$exceptions.IllegalArgumentException}
	 */
	function callServoyMethod(qualifiedName, args, invokeAndWait) {
		log.debug('callback: ' + qualifiedName + ' (' + JSON.stringify(args) + ' )' )
		
		function callMethod() {
			try {
				var parentFormName = scopes.modUtils$UI.getParentFormName(forms[controller.getName()])
				var context = parentFormName ? forms[parentFormName] : null
				return scopes.modUtils.callServoyMethod.call(context, qualifiedName, args)
			} catch (e) {
				log.error('Error handling callback from JFXWebView back to Servoy scripting layer', e)
			}
			return null
		}
		
		if (Packages.javax.swing.SwingUtilities.isEventDispatchThread()) { //This scenario is not likely to happen
			log.debug('Performing callback directly on Swing\'s EDT')
			return callMethod()
		} else if (!invokeAndWait || (executeScriptCountdownLatch && executeScriptCountdownLatch.getCount())) {
			log.debug('Performing callback through SwingUtilities.invokeLater')
			if (invokeAndWait) {
				log.warn('Prevented deadlock! servoy.executeMethod called from JavaFX WebView in response to a call to WebViewPanel.executeScriptAndWait')
			}
			Packages.javax.swing.SwingUtilities.invokeLater(new Runnable({
				run: callMethod
			}))
		} else {
			log.debug('Performing callback through SwingUtilities.invokeAndWait')
			var tmp
			Packages.javax.swing.SwingUtilities.invokeAndWait(new Runnable({
				run: function() {
					log.debug('Performing callback through SwingUtilities.invokeAndWait: run called')
					tmp = callMethod()
				}
			}))
			return tmp
		} 
		return null;
	}

	//Import some of the required Java classes for easy coding
	var Platform = Packages.javafx.application.Platform,
		WebView = Packages.javafx.scene.web.WebView,
		Scene = Packages.javafx.scene.Scene,
		Runnable = java.lang.Runnable,
		ChangeListener = Packages.javafx.beans.value.ChangeListener,
		State = Packages.javafx.concurrent.Worker.State

	var latch = new java.util.concurrent.CountDownLatch(1)
	//Setup the UI for the JFXWebViewPanel
	Platform.runLater(new Runnable({
		run: function() {
			//TODO: add transparent background support when implemented, see https://javafx-jira.kenai.com/browse/RT-25004
			browser = new WebView();
			webEngine = browser.getEngine();
			
			/*
			 * Proper sizing is tricky:
			 * 	http://java-no-makanaikata.blogspot.nl/2012/10/javafx-webview-size-trick.html
			 * 
			 */
//			browser.prefWidthProperty().bind(scene.widthProperty());
//		    browser.prefHeightProperty().bind(scene.heightProperty());
			scene = new Scene(browser) //, 200, 160
			elements.webPanel.setScene(scene)
			
			if (log.isTraceEnabled()) {
				webEngine.setOnResized(new Packages.javafx.event.EventHandler({
					handle: function(evt){
						log.trace('Webengine resized: ' + evt)
					}
				}))
			}
			
			if (application.isInDeveloper() || log.isDebugEnabled()) {
				//Hook into WebEngine Debugging impl to log exceptions that happen in the page loaded into the WebPane
				//WebPane exposes messageing interface that sends messages back and fort according to the Webkit Remote Debugging Protocol: https://developers.google.com/chrome-developer-tools/docs/protocol/1.0/console
				var debuggerCallback = new Packages.javafx.util.Callback({
					call: function(message) {
						/** @type {{method: String,
						 * 		params: {
						 * 			message: {
						 * 				text: String,
						 * 				level: String,
						 * 				stackTrace: Array<{
						 * 					url: String,
						 * 					lineNumber: Number,
						 * 					functionName: String
						 * 				}>
						 * 			}		
						 * 		}
						 * }}
						 */
						var messageObject = JSON.parse(message)
						switch (messageObject.method) {
							case 'Console.messageAdded':
								var output = 'JFXWebViewPanel console: ' + messageObject.params.message.text
								switch (messageObject.params.message.level) {
									case 'error':
										if (messageObject.params.message.stackTrace) {
											var first = true
											for each (var callFrame in messageObject.params.message.stackTrace) {
												output += first ? ' ' : '\n\tat '
												output += callFrame.url + ':' + callFrame.lineNumber + ' (' + callFrame.functionName + ')'
												first = false
											}
										}
										log.error(output)
										break;
									case 'debug':
										log.debug(output)
										break;
									case 'warning':
										log.warn(output)
										break;
									case 'log': //Intentional fallthrough
									case 'tip': //Intentional fallthrough
									default:
										log.info(output)
										break;
								}
								break;
							
							default:
								break;
						}
						if (log.isTraceEnabled()) {
							log.trace('JFXWebViewPanel form dimensions: x=' + controller.getFormWidth() + ', y=?')
							log.trace('JFXPanel bean dimensions: x=' + elements.webPanel.getWidth() + ', y=' + elements.webPanel.getHeight())
							//TODO: this raises errors in the log that getwidth is know known...................
							log.trace('scene dimensions: x=' + elements.webPanel.scene.getWidth() + ', y=' + elements.webPanel.scene.getHeight())
							log.trace('Webview dimensions: x=' + browser.widthProperty().getValue() + ', y=' + browser.heightProperty().getValue())
						}
					}
				})
				
				//Enable the debugger for the Console part only
				webEngine.impl_getDebugger().setMessageCallback(debuggerCallback)
				webEngine.impl_getDebugger().setEnabled(true)
				webEngine.impl_getDebugger().sendMessage(JSON.stringify({
					"id": 1,
					"method": "Console.enable"
				}))
			}	
				
			//Logging of load exceptions
			webEngine.getLoadWorker().exceptionProperty().addListener(new ChangeListener({
				changed: function(observableValue, oldThrowable, newThrowable) {
					log.error('Exception loading', newThrowable)
				}
			}))
			
			latch.countDown()
		}
	}))
	latch.await()
	
	if (log.isTraceEnabled()) {
		elements.webPanel.addComponentListener(new java.awt.event.ComponentListener({
			componentHidden: function(){},
			componentMoved: function(){},
			/**
			 * @param {java.awt.event.ComponentEvent} evt
			 */
			componentResized: function(evt){
				var size = evt.getComponent().size()
				log.trace('JFXPanel resized to: ' + size)
				Platform.runLater(new Runnable({
					run: function() {
						log.trace('Updating browser dimensions to: ' + size)
						browser.setPrefSize(size.width, size.height)
						browser.setMinSize(size.width, size.height)
						browser.setMaxSize(size.width, size.height)
					}
				}))
				
			},
			componentshown:  function(){}
		}))
	}
	
	try {
		var cx = Packages.org.mozilla.javascript.Context.getCurrentContext()
		var savedCL = cx.getApplicationClassLoader()
		var mediaCL = java.net.URLClassLoader([new java.net.URL("media:///bin/")], savedCL)
		cx.setApplicationClassLoader(mediaCL)	
		/** @type {Packages} */
		var MediaPackages = new Packages(mediaCL); //See http://osdir.com/ml/mozilla.devel.jseng/2002-06/msg00037.html
			
		/**
		 * TODO: might need a recursion depth limit to prevent endless loops when sending in the windows object for example as object
		 * @param {Packages.netscape.javascript.JSObject|*} o
		 */
		function unwrapJSObject(o) {
			if (o instanceof Packages.netscape.javascript.JSObject) {
				var retval
				if (o.getMember('length') instanceof Number) { //Must be an Array
					retval = []
					for (var i = 0, l = o.getMember('length'); i < l; i++) {
						retval.push(unwrapJSObject(o.getSlot(i)))
					}
				} else { //must be an object
					retval = {}
					/** @type {Packages.netscape.javascript.JSObject} */
					var keys = o.eval("Object.keys(this)")
					for (i = 0, l = keys.getMember('length'); i < l; i++) {
						/** @type {String} */
						var key = keys.getSlot(i)
						retval[key] = unwrapJSObject(o.getMember(key))
					}
				}
				return retval
			}
			return o
		}
		
		//Setup the bridge to allow upcalls from the JavaScript inside the WebEngine and Servoy
		//Using custom Java class here for the bridge between the WebEngine and Servoy's scripting layer, in order to have control over the argument types of the Java Methods
		var callBackClass = new MediaPackages.com.servoy.bap.webpane.WebPaneScriptBridge({ //Packages.com.servoy.bap.webpane.WebPaneScriptBridge is custom Java class stored in the media://bin/ dir
				/**
				 * @param {String} methodName
				 * @param {Packages.netscape.javascript.JSObject} args
				 */
				executeMethod: function(methodName, args) {
					var tmp = callServoyMethod(methodName, unwrapJSObject(args), true)
					log.debug('executeMethod returning: ' + JSON.stringify(tmp))
					return JSON.stringify(tmp); //CHECKME: Should we stringify here or is that up to the called method?
				}
			})
	} catch (e) {
		log.error(e)
	} finally {
		cx.setApplicationClassLoader(savedCL);	
	}
	
	/*
	 * Manage state when (re)loading content
	 * - Cancel load if a callback:// url and execute the callback method
	 * - When HTMLDocument changes, register the callbackClass again for callbacks through JavaScript using servoy.executeMethod 
	 * - Set the webEngineReady flag accordingly
	 * - Manage the webEngineNotReadyCountdownLatch accordingly
	 */
	Platform.runLater(new Runnable({
		run: function() {
			webEngine.documentProperty().addListener(new ChangeListener({
				changed: function(ov, oldState, newState) {
					log.debug('DocumentProperty Changed: ' + oldState + ' > ' + newState)
					//Re-adding the window.servoy property with the callBackClass. Needs to be everytime after the state has changed 
					/** @type {Packages.netscape.javascript.JSObject} */
					var window = webEngine.executeScript("window")
					window.setMember('servoy', callBackClass)
				}
			}))
			
			webEngine.getLoadWorker().stateProperty().addListener(new ChangeListener({
				changed: function(ov, oldState, newState) {
					if (log.isDebugEnabled()) {
						log.debug('State Changed: ' + oldState + ' > ' + newState + " (location: " + webEngine.getLocation() + ")")
					}
					if (log.isTraceEnabled()) {
						log.trace('State Changed scene dimensions: x=' + scene.getWidth() + ', y=' + scene.getHeight())
						log.trace('State Changed Webview dimensions: x=' + browser.widthProperty().getValue() + ', y=' + browser.heightProperty().getValue())
					}
					
					switch (newState) {
						case State.SCHEDULED:
							if (webEngine.getLocation().indexOf('callback://') == 0) {
								var parsedUrl = scopes.modUtils$net.parseUrl(webEngine.getLocation())
								callServoyMethod(parsedUrl.host, Object.getOwnPropertyNames(parsedUrl.queryKey).length != 0 ? parsedUrl.queryKey : null, false)
								
								//Canceling the loading of the url if it's a callback url. Needs to be done through Platform.runLater or else it'll crash the JVM
								Platform.runLater(new Runnable({
									run: function() {
										webEngine.getLoadWorker().cancel();
									}
								}));
							}
							break;
						case State.SUCCEEDED:
//							//Re-adding the window.servoy property with the callBackClass. Needs to be everytime after the state has changed 
//							/** @type {Packages.netscape.javascript.JSObject} */
//							var window = webEngine.executeScript("window")
//							window.setMember('servoy', callBackClass)
							//Intentional fall through
						case State.FAILED: //Intentional fall through
						case State.CANCELLED:
							webEngineReady = true;
							if (webEngineNotReadyCountdownLatch) {
								webEngineNotReadyCountdownLatch.countDown();
							}
							break
						default:
							webEngineReady = false;
							break;
					}
					log.debug('webEngineReady: ' + webEngineReady)
				}
			})
			)
		}
	}))
	
	webEngineReady = true
}

/**
 * Callback method when form is (re)loaded.
 *
 * @private
 * @param {JSEvent} event the event that triggered the action
 *
 * @properties={typeid:24,uuid:"21AC843D-1481-4CBC-9D6E-6E67803E0052"}
 */
function onLoad(event) {
	setUpPanel()
}

/**
 * @param {String} url
 *
 * @properties={typeid:24,uuid:"0AAB0119-9467-4064-9026-A6044191E8AB"}
 */
function load(url) {
	if (!webEngine) {
		return;
	}
	webEngineReady = false //prevent {@link executeScript} execution
	Packages.javafx.application.Platform.runLater(new java.lang.Runnable({
		run: function() {
			log.debug('load executed')
			try {
				webEngine.load(url);
			} catch (e) {
				log.error('Loading URL content failed', e)
			}
		}
	}))
}

/**
 * @param {String} content
 * @param {String} [contentType]
 *
 * @properties={typeid:24,uuid:"7D6CED64-C44B-4E64-BDFC-CBBDDD5D0887"}
 */
function loadContent(content, contentType) {
	if (!webEngine) {
		log.warn('Failed to load content, as webengine == null')
		return;
	}
	webEngineReady = false //prevent {@link executeScript} execution
	Packages.javafx.application.Platform.runLater(new java.lang.Runnable({
		run: function() {
			log.debug('loadContent executed')
			try {
				if (!contentType) {
					webEngine.loadContent(content)
				} else {
					webEngine.loadContent(content, contentType)					
				}
			} catch (e) {
				log.error('Loading content failed', e)
			}
		}
	}))
}

/**
 * @param {String} code
 * @return {*}
 *
 * @properties={typeid:24,uuid:"C15CD03C-0CCE-43B2-88E3-6BCBE0905985"}
 */
function executeScriptAndWait(code) {
	if (!webEngine) {
		return null;
	}

	log.debug('webEngineReady? ' + webEngineReady)
	
	//Prevent calling executeScript while the DOM is not ready
	if (!webEngineReady) {
		log.debug('Going into waiting')
		webEngineNotReadyCountdownLatch = new java.util.concurrent.CountDownLatch(1)
		webEngineNotReadyCountdownLatch.await()
		log.debug('Resuming from wait')
	}
	
	var retval;
	var error = null
	executeScriptCountdownLatch = new java.util.concurrent.CountDownLatch(1)
	Packages.javafx.application.Platform.runLater(new java.lang.Runnable({
		run: function() {
			log.debug('executeScriptAndWait executed: ' + code)
			try {
				retval = webEngine.executeScript(code)
			} catch (e) {
				e['stack'] //Touching the stack property, so it in instantiated. Dunno why this is needed...
				error = e //Saving the error, so it can be rethrown on the Swing thread to get the correct stacktrace
			} finally {
				if (log.isTraceEnabled()) {
					log.trace(getStringFromDocument(webEngine.getDocument())) //CHECKME: using log.log instead of log.info hangs the DSC and error only reported in console in Eclipse when running from source
				}
				executeScriptCountdownLatch.countDown();
			}
		}
	}));
	executeScriptCountdownLatch.await();
	if (error) {
		try {
			throw error
		} catch (e) {
			log.error('Exception while executing script \'' + code + '\'', error)
		}
	}
	return retval;
}

/**
 * @param {String} code
 *
 * @properties={typeid:24,uuid:"67C490FE-6906-412C-B2A9-1B07C4BE631F"}
 */
function executeScriptLater(code) {
	if (!webEngine) {
		return;
	}

	log.debug('webEngineReady? ' + webEngineReady)
	
	//Prevent calling executeScript while the DOM is not ready
	if (!webEngineReady) {
		log.debug('Going into waiting')
		webEngineNotReadyCountdownLatch = new java.util.concurrent.CountDownLatch(1)
		webEngineNotReadyCountdownLatch.await()
		log.debug('Resuming from wait')
	}
	
	var error = null
	Packages.javafx.application.Platform.runLater(new java.lang.Runnable({
		run: function() {
			log.debug('executeScriptLater executed: ' + code)
			try {
				webEngine.executeScript(code)
			} catch (e) {
				e['stack'] //Touching the stack property, so it in instantiated. Dunno why this is needed...
				error = e //Saving the error, so it can be rethrown on the Swing thread to get the correct stacktrace
			} finally {
				if (log.isTraceEnabled()) {
					log.trace(getStringFromDocument(webEngine.getDocument())) //CHECKME: using log.log instead of log.info hangs the DSC and error only reported in console in Eclipse when running from source
				}
			}
		}
	}));
	if (error) {
		try {
			throw error
		} catch (e) {
			log.error('Exception while executing script \'' + code + '\'', error)
		}
	}
}

/**
 * Helper method to print the HTML content of the JFXWebView
 * @private 
 * @param doc
 *
 * @properties={typeid:24,uuid:"E80ABEA1-01AE-41A0-84E5-C179F406ED2C"}
 */
function getStringFromDocument(doc)
{
	//CHECKME; maybe better results? http://stackoverflow.com/questions/14273450/get-the-contents-from-the-webview-using-javafx
	try
    {
       var domSource = new Packages.javax.xml.transform.dom.DOMSource(doc);
       var writer = new java.io.StringWriter();
       var result = new Packages.javax.xml.transform.stream.StreamResult(writer);
       var tf = Packages.javax.xml.transform.TransformerFactory.newInstance();
       var transformer = tf.newTransformer();
       transformer.transform(domSource, result);
       return writer.toString();
    }
    catch(/** @type {Packages.org.mozilla.javascript.JavaScriptException} */ex)
    {
       ex.printStackTrace();
       return null;
    }
}

/**
 * @properties={typeid:24,uuid:"DEF1BBFF-C6D0-42D8-88E0-56A907BDF56A"}
 */
function enableFirebug() {
	executeScriptLater("if (!document.getElementById('FirebugLite')){E = document['createElement' + 'NS'] && document.documentElement.namespaceURI;E = E ? document['createElement' + 'NS'](E, 'script') : document['createElement']('script');E['setAttribute']('id', 'FirebugLite');E['setAttribute']('src', 'https://getfirebug.com/' + 'firebug-lite.js' + '#startOpened');E['setAttribute']('FirebugLite', '4');(document['getElementsByTagName']('head')[0] || document['getElementsByTagName']('body')[0]).appendChild(E);E = new Image;E['setAttribute']('src', 'https://getfirebug.com/' + '#startOpened');}"); 
}

/**
 * Callback method when form is resized.
 *
 * @param {JSEvent} event the event that triggered the action
 *
 * @private
 *
 * @properties={typeid:24,uuid:"78F24B70-09E5-4431-B752-71357F17F714"}
 */
function onResize(event) {
	if (log.isTraceEnabled()) {
		log.trace('onResize JFXWebViewPanel form resized: x=' + controller.getFormWidth() + ', y=?')
		log.trace('onResize JFXWebViewPanel preferred sizes: x=' + browser.getPrefWidth() + ', y=' + browser.getPrefHeight())
		log.trace('onResize scene preferred sizes: x=' + scene.widthProperty().getValue() + ', y=' + scene.heightProperty().getValue())
	}
}

/**
 * Callback method for when form is shown.
 *
 * @param {Boolean} firstShow form is shown first time after load
 * @param {JSEvent} event the event that triggered the action
 *
 * @private
 *
 * @properties={typeid:24,uuid:"70B7FC8D-75F6-4400-BD9F-21541C4C30AB"}
 */
function onShow(firstShow, event) {
	if (log.isTraceEnabled()) {
		log.trace('onShow JFXWebViewPanel form dimensions: x=' + elements.webPanel.getWidth() + ', y=' + elements.webPanel.getHeight())
		log.trace('onShow scene dimensions: x=' + elements.webPanel.scene.getWidth() + ', y=' + elements.webPanel.scene.getHeight())
	}
}
