/**
 * @type {Object}
 *
 * @properties={typeid:35,uuid:"AF6C4E66-911A-4FE7-B21C-7496AEE5C126",variableType:-4}
 */
var webPanel


/**
 * @type {String}
 *
 * @properties={typeid:35,uuid:"D4D48585-66AE-4268-A145-ADF7BAFBE1D7"}
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
	webPanel = new scopes.modWebView.JFXWebViewWebPanel(elements.tabless)
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
	var parsedUrl = scopes.modUtils$net.parseUrl(urlToLoad)
	
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
 * @properties={typeid:24,uuid:"F5CBD179-0582-466A-8B97-C6063BD813A4"}
 */
function testJFXWebViewWebPanel() {
	var content = <html>
		<body style="background-color: transparent">
			<a id="lnk_old" href="callback://testCallbackUrl">Invoke local method urlCallback</a><br/>
			<a id="lnk_old" href="callback://forms.testModWebView.testCallbackUrl">formMethod urlCallback</a><br/>
			<a id="lnk_old" href="callback://forms.testModWebView.testCallbackUrl?fruit=banana&amp;brand=Chiquita">formMethod urlCallback with arguments</a><br/>
			<a id="lnk" href="#" onclick="servoy.executeMethod('forms.testModWebView.testServoyExecuteMethod')">executeMethod</a><br/>
			<button id="btn" onclick="servoy.executeMethod('forms.testModWebView.testServoyExecuteMethod', ['banaan', window])">executeMethod with params</button>
		</body>
	</html>
	application.output('Loading Test Content')
	webPanel.loadContent(content.toXMLString())

	application.output('Executing Link click')
	//Test callback:// url handling
	webPanel.executeScript('var evt = document.createEvent("MouseEvents"); evt.initEvent("click",true,true); document.getElementById("lnk").dispatchEvent(evt)')

	application.output('Executing bUTTON click')
	//Test servoy.executeMethod(methodName, args) upcall
	webPanel.executeScript('document.getElementById("btn").click()')
}

/**
 * \@properties={typeid:24,uuid:"1A53D93A-A0CE-464C-BD67-5D50903771FD"}
 */
function testCallbackUrl(isExecuteMethodCall) {
	var logMessage = "testCallbackUrl called with " + arguments.length + " arguments"
	application.setStatusText(new Date() + ": " + logMessage)
	application.output(java.lang.Thread.currentThread().getName() + " " + logMessage)
	for (var i = 0; i < arguments.length; i++) {
		application.output(arguments[i])
	}
}

/**
 * @properties={typeid:24,uuid:"192457EC-4840-4A87-8F13-3E329B4C8AC0"}
 */
function testServoyExecuteMethod() {
	var logMessage = "testServoyExecuteMethod called with " + arguments.length + " arguments"
	application.setStatusText(new Date() + ": " + logMessage)
	application.output(java.lang.Thread.currentThread().getName() + " " + logMessage)
	for (var i = 0; i < arguments.length; i++) {
		application.output(arguments[i])
	}
}

/**
 * @properties={typeid:24,uuid:"873D5A8F-9E53-4E0F-85C1-86E990710469"}
 */
function testGarbageCollection() {
	var ref = new java.lang.ref.WeakReference(webPanel)
	
	java.lang.System.gc()
	if (ref.get()) {
		//Fail: not cleared
	}
}
/**
 * Perform the element default action.
 *
 * @param {JSEvent} event the event that triggered the action
 *
 * @private
 *
 * @properties={typeid:24,uuid:"9B725094-68F3-45E3-B108-8A6350FD7C59"}
 */
function onAction1(event) {
	webPanel.enableFirebug()
}
