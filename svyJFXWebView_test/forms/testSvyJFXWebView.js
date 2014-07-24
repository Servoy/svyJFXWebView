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
 * @properties={typeid:35,uuid:"29F09D57-7146-4F9C-92D8-C68C912BDC72",variableType:-4}
 */
var log = scopes.svyLogManager.getLogger('com.servoy.bap.component.webview.test')

/**
 * @type {Object}
 *
 * @properties={typeid:35,uuid:"AF6C4E66-911A-4FE7-B21C-7496AEE5C126",variableType:-4}
 */
var webPanel

/**
 * @type {String}
 *
 * @properties={typeid:35,uuid:"1042F2C9-6E29-455E-B118-19423223C64D"}
 */
var url

/**
 * Callback method when form is (re)loaded.
 *
 * @param {JSEvent} event the event that triggered the action
 *
 * @private
 *
 * @properties={typeid:24,uuid:"2335A750-E4EC-4050-92D8-4FA60759D279"}
 */
function onLoad(event) {
	webPanel = new scopes.svyJFXWebView.WebViewPanel(elements.tabless)
}

/**
 * Perform the element default action.
 *
 * @param {JSEvent} event the event that triggered the action
 *
 * @private
 *
 * @properties={typeid:24,uuid:"9AFDD3A5-7E22-4811-8573-94654C013E56"}
 */
function onAction(event) {
	/** @type {RuntimeTextField} */
	var el = event.getSource()
	var urlToLoad = controller.getDataProviderValue(el.getDataProviderID())
	var parsedUrl = scopes.svyNet.parseUrl(urlToLoad)
	
	//Tried to make the location bar Google search bar as well, but not yet working
	application.output('URL to load: ' + parsedUrl.authority)
	if (!parsedUrl.authority) {
		urlToLoad = 'https://www.google.com/search?q=' + urlToLoad.split(' ').join('+')
	}
	if (!parsedUrl.protocol) {
		parsedUrl.protocol = 'http'
		urlToLoad = parsedUrl.toString()
	}
	controller.setDataProviderValue(el.getDataProviderID(), urlToLoad)
	webPanel.load(parsedUrl.toString())
}

/**
 * @properties={typeid:24,uuid:"A165781C-1DC1-44E0-942C-FFA18B8EC22D"}
 */
function loadTestHTML() {
	var content = '<html style="background-color: rgba(0,0,0,0)">\
		<head>\
			<script>\
			function callback() {\
				/* Strings (probably other types as well) are not passed into the WebView scripting engine as strings, but as JavaRuntimeObject\
				 * This is most likely due to the fact that JavaScript strings passed from the Servoy scripting layer to the Java layer in Rhino \
				 * are wrapped in some internal classes of Rhino and since the API of the WebView used to do the callback takes an Array of Objects\
				 * the Rhino engine doesn\'t knwo how to properly unwrap stuff.\
				 * \
				 * Most of the time this isn\'t an issue, but it becomes an issue when doing typechecking or stringifcation, like:\
				 * console.log(arguments[0])\
				 * console.log(typeof arguments[0])\
				 * console.log(arguments[0] instanceof String)\
				 * console.log(Object.prototype.toString.call(arguments[0]))\
				 * console.log(arguments)\
				 * console.log(Array.prototype.slice.call(arguments))\
				 * console.log(JSON.stringify(Array.prototype.slice.call(arguments)))\
				 * console.log(JSON.stringify(arguments))\
				 */\
				\
				console.log("callMe!!!! called with arguments: " + arguments[0])\
			}\
			</script>\
		</head>\
		<body style="background-color: transparent">\
			<a id="localLinkUpcall" href="callback://upcallRecorder">Invoke local method urlCallback</a><br/>\
			<a id="formLinkUpcall" href="callback://forms.testSvyJFXWebView.upcallRecorder">formMethod urlCallback</a><br/>\
			<a id="formLinkUpcallWithArgs" href="callback://forms.testSvyJFXWebView.upcallRecorder?fruit=banana&amp;brand=Chiquita">formMethod urlCallback with arguments</a><br/>\
			<a id="executeMethodUpcall" href="#" onclick="servoy.executeMethod(\'forms.testSvyJFXWebView.upcallRecorder\')">executeMethod</a><br/>\
			<button id="executeMethodUpcallWithArgs" onclick="servoy.executeMethod(\'forms.testSvyJFXWebView.upcallRecorder\', [\'banana\', window])">executeMethod with params</button>\
			<button id="executeMethodUpcallWithArgsAndCallback" onclick="servoy.executeMethod(\'forms.testSvyJFXWebView.upcallRecorder\', [\'banana\', callback])">executeMethod with params and callback</button>\
		</body>\
	</html>'
	webPanel.loadContent(content)
}

/**
 * @type {Number}
 *
 * @properties={typeid:35,uuid:"0B1FE1B9-D52E-490C-8D04-622601093B10",variableType:4}
 */
var TIME_OUT = 1000

/**
 * @type {Number}
 *
 * @properties={typeid:35,uuid:"431AFA03-2D6D-475D-8842-22444B89E955",variableType:4}
 */
var UPDATE_WAIT = 100

/**
 * @properties={typeid:35,uuid:"D0C22038-4F6D-4B86-B915-CB7BAC3EE61F",variableType:-4}
 */
var upcallReceived = false

/**
 * @type {Object}
 *
 * @properties={typeid:35,uuid:"D34CE311-6F27-435D-A59F-36A5A8DB9769",variableType:-4}
 */
var upcallArgs

/**
 * @properties={typeid:24,uuid:"2984ECAC-6BEC-4CF7-84A6-FF1291A85A4A"}
 */
function setUp() {
	var config = {
		status: "error",
		plugins: 'scopes.svyUnitTestUtils.TestAppender',
		appenders: [{
			type: "scopes.svyUnitTestUtils.TestAppender",
			name: "ApplicationOutputAppender",
			PatternLayout: {
				pattern: "%5level %logger{1.} - %msg"
			}
		}],
		loggers: {
			logger: [{
				name: "com.servoy.bap.components.webview.console",
				level: "debug",
				additivity: false,
				AppenderRef: {
					ref: "ApplicationOutputAppender"
				}
			}, {
				name: "com.servoy.bap.components.webview",
				level: "warn",
				additivity: false,
				AppenderRef: {
					ref: "ApplicationOutputAppender"
				}
			}],
			root: {
				level: "error",
				AppenderRef: {
					ref: "ApplicationOutputAppender"
				}
			}
		}
	}
	scopes.svyLogManager.loadConfig(config)
	loadTestHTML()
}

/**
 * @properties={typeid:24,uuid:"F43C6B16-AD03-45DD-B8A4-911279EB0B7E"}
 */
function testLocalLinkUpcall() {
	upcallReceived = false
	webPanel.executeScriptLater('var evt = document.createEvent("MouseEvents"); evt.initEvent("click",true,true); document.getElementById("localLinkUpcall").dispatchEvent(evt)')
	var it = 0
	while (!upcallReceived && it < TIME_OUT / UPDATE_WAIT) {
		application.updateUI(UPDATE_WAIT);
		it++
	}
	if (!upcallReceived) {
		jsunit.fail('upcall not invoked within TIME_OUT period')
	}
}

/**
 * @properties={typeid:24,uuid:"A37787B4-FE44-4D18-B2BF-9501818C880D"}
 */
function testFormLinkUpcall() {
	upcallReceived = false
	webPanel.executeScriptLater('var evt = document.createEvent("MouseEvents"); evt.initEvent("click",true,true); document.getElementById("formLinkUpcall").dispatchEvent(evt)')
	var it = 0
	while (!upcallReceived && it < TIME_OUT / UPDATE_WAIT) {
		application.updateUI(UPDATE_WAIT);
		it++
	}
	if (!upcallReceived) {
		jsunit.fail('upcall not invoked within TIME_OUT period')
	}
}

/**
 * @properties={typeid:24,uuid:"3FEC9BC4-0108-48FD-B828-6E50A68BDC5C"}
 */
function testFormLinkUpcallWithArgs() {
	upcallReceived = false
	webPanel.executeScriptLater('var evt = document.createEvent("MouseEvents"); evt.initEvent("click",true,true); document.getElementById("formLinkUpcallWithArgs").dispatchEvent(evt)')
	var it = 0
	while (!upcallReceived && it < TIME_OUT / UPDATE_WAIT) {
		application.updateUI(UPDATE_WAIT);
		it++
	}
	if (!upcallReceived) {
		jsunit.fail('upcallnot invoked within TIME_OUT period')
	} else {
		jsunit.assertEquals('banana', upcallArgs[0]['fruit'][0])
		jsunit.assertEquals('Chiquita', upcallArgs[0]['brand'][0])
	}
}

/**
 * @properties={typeid:24,uuid:"1A53D93A-A0CE-464C-BD67-5D50903771FD"}
 */
function upcallRecorder() {
	upcallReceived = true
	upcallArgs = arguments
	return 'hello'
}

/**
 * @properties={typeid:24,uuid:"0F15ACFE-DBD3-4E18-B0F6-A96EC3A41FFF"}
 */
function testExecuteMethod() {
	upcallReceived = false
	webPanel.executeScriptLater('var evt = document.createEvent("MouseEvents"); evt.initEvent("click",true,true); document.getElementById("executeMethodUpcall").dispatchEvent(evt)')
	var it = 0
	while (!upcallReceived && it < TIME_OUT / UPDATE_WAIT) {
		application.updateUI(UPDATE_WAIT);
		it++
	}
	if (!upcallReceived) {
		jsunit.fail('upcall not invoked within TIME_OUT period')
	}
}

/**
 * @properties={typeid:24,uuid:"6126C37D-25A2-4602-8133-DEEB7D319DD0"}
 */
function testExecuteMethodWithArgs() {
	upcallReceived = false
	webPanel.executeScriptLater('document.getElementById("executeMethodUpcallWithArgs").click()')
	var it = 0
	while (!upcallReceived && it < TIME_OUT / UPDATE_WAIT) {
		application.updateUI(UPDATE_WAIT);
		it++
	}
	if (!upcallReceived) {
		jsunit.fail('upcall not invoked within TIME_OUT period')
	} else {
		jsunit.assertEquals(2, upcallArgs.length)
		jsunit.assertEquals('banana', upcallArgs[0])
		jsunit.assertEquals(null, upcallArgs[1])
		//Check for log entry about passing Window
		jsunit.assertEquals(1, scopes.svyUnitTestUtils.logMessages.ApplicationOutputAppender.length)
		var expectedLogMessage = ' WARN c.s.b.c.webview - Prevented passing non-JavaScript object to the Servoy scripting layer (value is replaced with null): [object DOMWindow]'
		jsunit.assertEquals(expectedLogMessage, scopes.svyUnitTestUtils.logMessages.ApplicationOutputAppender[0])
	}
}

/**
 * @properties={typeid:24,uuid:"A9AE4F84-3D0C-4A21-B48A-77490C101D4B"}
 */
function testExecuteMethodWithArgsAndCallback() {
	upcallReceived = false
	webPanel.executeScriptLater('document.getElementById("executeMethodUpcallWithArgsAndCallback").click()')
	var it = 0
	while (!upcallReceived && it < TIME_OUT / UPDATE_WAIT) {
		application.updateUI(UPDATE_WAIT);
		it++
	}
	if (!upcallReceived) {
		jsunit.fail('upcall not invoked within TIME_OUT period')
	} else {
		jsunit.assertEquals(2, upcallArgs.length)
		jsunit.assertEquals('banana', upcallArgs[0])
		jsunit.assertEquals('function', typeof upcallArgs[1])
		scopes.svyUnitTestUtils.logMessages.ApplicationOutputAppender.length = 0
		upcallArgs[1]('Hello', 1)
		it = 0
		while (!scopes.svyUnitTestUtils.logMessages.ApplicationOutputAppender.length && it < TIME_OUT / UPDATE_WAIT) {
			application.updateUI(UPDATE_WAIT);
			it++
		}
		if (!scopes.svyUnitTestUtils.logMessages.ApplicationOutputAppender.length) {
			jsunit.fail('callback not invoked within TIME_OUT period')
		}
		jsunit.assertEquals(1, scopes.svyUnitTestUtils.logMessages.ApplicationOutputAppender.length)
		jsunit.assertEquals(' INFO c.s.b.c.w.console - callMe!!!! called with arguments: Hello', scopes.svyUnitTestUtils.logMessages.ApplicationOutputAppender[0])
		
	}
}

///**
// * @properties={typeid:24,uuid:"873D5A8F-9E53-4E0F-85C1-86E990710469"}
// */
//function testGarbageCollection() {
//	var ref = new java.lang.ref.WeakReference(webPanel)
//	
//	java.lang.System.gc()
//	if (ref.get()) {
//		//Fail: not cleared
//	}
//}

/**
 * Perform the element default action.
 *
 * @param {JSEvent} event the event that triggered the action
 *
 * @private
 *
 * @properties={typeid:24,uuid:"9B725094-68F3-45E3-B108-8A6350FD7C59"}
 */
function showFirebug(event) {
	webPanel.enableFirebug()
}
