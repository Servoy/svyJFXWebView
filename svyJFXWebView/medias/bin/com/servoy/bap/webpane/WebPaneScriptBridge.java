package com.servoy.bap.webpane;

public abstract class WebPaneScriptBridge {
	
	public abstract Object executeMethod(String upcallMethod);

	public abstract Object executeMethod(String upcallMethod, Object args);
}