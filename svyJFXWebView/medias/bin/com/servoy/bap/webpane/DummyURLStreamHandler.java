package com.servoy.bap.webpane;

import java.io.IOException;
import java.net.URL;
import java.net.URLConnection;
import java.net.URLStreamHandler;

import com.servoy.j2db.util.IDeveloperURLStreamHandler;

public class DummyURLStreamHandler extends URLStreamHandler implements IDeveloperURLStreamHandler {

	public DummyURLStreamHandler() {
		
	}
	
	@Override
	public URLConnection openConnection(URL url) throws IOException {
		return new DummyURLConnection(url);
	}

}
