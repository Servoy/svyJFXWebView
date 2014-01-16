package com.servoy.bap.webpane;

public abstract class WebPaneScriptBridge {
	
	public abstract Object executeMethod(String method);

	public abstract Object executeMethod(String method, Object args);
}