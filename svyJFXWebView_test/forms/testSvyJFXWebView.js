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
	var content = <html>
		<body>
			<a id="localLinkCallback" href="callback://testCallback">Invoke local method urlCallback</a><br/>
			<a id="formLinkCallback" href="callback://forms.testSvyJFXWebView.testCallback">formMethod urlCallback</a><br/>
			<a id="formLinkCallbackWithArgs" href="callback://forms.testSvyJFXWebView.testCallback?fruit=banana&amp;brand=Chiquita">formMethod urlCallback with arguments</a><br/>
			<a id="executeMethod" href="#" onclick="servoy.executeMethod('forms.testSvyJFXWebView.testCallback')">executeMethod</a><br/>
			<button id="executeMethodWithArgs" onclick="servoy.executeMethod('forms.testSvyJFXWebView.testCallback', ['banana', window])">executeMethod with params</button>
		</body>
	</html>
	webPanel.loadContent(content.toXMLString())
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
var callbackReceived = false

/**
 * @type {Object}
 *
 * @properties={typeid:35,uuid:"D34CE311-6F27-435D-A59F-36A5A8DB9769",variableType:-4}
 */
var callbackArgs

/**
 * @properties={typeid:24,uuid:"2984ECAC-6BEC-4CF7-84A6-FF1291A85A4A"}
 */
function setUp() {
	loadTestHTML()
}

/**
 * @properties={typeid:24,uuid:"F43C6B16-AD03-45DD-B8A4-911279EB0B7E"}
 */
function testLocalLinkCallback() {
	callbackReceived = false
	webPanel.executeScriptLater('var evt = document.createEvent("MouseEvents"); evt.initEvent("click",true,true); document.getElementById("localLinkCallback").dispatchEvent(evt)')
	var it = 0
	while (!callbackReceived && it < TIME_OUT / UPDATE_WAIT) {
		application.updateUI(UPDATE_WAIT);
		it++
	}
	if (!callbackReceived) {
		jsunit.fail('callback not invoked within TIME_OUT period')
	}
}

/**
 * @properties={typeid:24,uuid:"A37787B4-FE44-4D18-B2BF-9501818C880D"}
 */
function testFormLinkCallback() {
	callbackReceived = false
	webPanel.executeScriptLater('var evt = document.createEvent("MouseEvents"); evt.initEvent("click",true,true); document.getElementById("formLinkCallback").dispatchEvent(evt)')
	var it = 0
	while (!callbackReceived && it < TIME_OUT / UPDATE_WAIT) {
		application.updateUI(UPDATE_WAIT);
		it++
	}
	if (!callbackReceived) {
		jsunit.fail('callback not invoked within TIME_OUT period')
	}
}

/**
 * @properties={typeid:24,uuid:"3FEC9BC4-0108-48FD-B828-6E50A68BDC5C"}
 */
function testFormLinkCallbackWithArgs() {
	callbackReceived = false
	webPanel.executeScriptLater('var evt = document.createEvent("MouseEvents"); evt.initEvent("click",true,true); document.getElementById("formLinkCallbackWithArgs").dispatchEvent(evt)')
	var it = 0
	while (!callbackReceived && it < TIME_OUT / UPDATE_WAIT) {
		application.updateUI(UPDATE_WAIT);
		it++
	}
	if (!callbackReceived) {
		jsunit.fail('callback not invoked within TIME_OUT period')
	} else {
		jsunit.assertEquals('banana', callbackArgs[0]['fruit'][0])
		jsunit.assertEquals('Chiquita', callbackArgs[0]['brand'][0])
	}
}



/**
 * @properties={typeid:24,uuid:"1A53D93A-A0CE-464C-BD67-5D50903771FD"}
 */
function testCallback() {
	callbackReceived = true
	callbackArgs = arguments
}

/**
 * @properties={typeid:24,uuid:"0F15ACFE-DBD3-4E18-B0F6-A96EC3A41FFF"}
 */
function testExecuteMethod() {
	callbackReceived = false
	webPanel.executeScriptLater('var evt = document.createEvent("MouseEvents"); evt.initEvent("click",true,true); document.getElementById("executeMethod").dispatchEvent(evt)')
	var it = 0
	while (!callbackReceived && it < TIME_OUT / UPDATE_WAIT) {
		application.updateUI(UPDATE_WAIT);
		it++
	}
	if (!callbackReceived) {
		jsunit.fail('callback not invoked within TIME_OUT period')
	}
}

/**
 * @properties={typeid:24,uuid:"6126C37D-25A2-4602-8133-DEEB7D319DD0"}
 */
function testExecuteMethodWithArgs() {
	callbackReceived = false
	webPanel.executeScriptLater('document.getElementById("executeMethodWithArgs").click()')
	var it = 0
	while (!callbackReceived && it < TIME_OUT / UPDATE_WAIT) {
		application.updateUI(UPDATE_WAIT);
		it++
	}
	if (!callbackReceived) {
		jsunit.fail('callback not invoked within TIME_OUT period')
	} else {
		jsunit.assertEquals(2, callbackArgs.length)
		jsunit.assertEquals('banana', callbackArgs[0])
		//TODO: check second argumnet
		//jsunit.assertEquals('brand', callbackArgs['Chiquita'])
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
