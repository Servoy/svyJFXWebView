package com.servoy.bap.webpane;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLConnection;

public class DummyURLConnection extends URLConnection {

	public DummyURLConnection(URL url) throws MalformedURLException {
		super(url);
	}

	@Override
	public void connect() throws IOException {
	}

	@Override
	public InputStream getInputStream() throws IOException {
		return  new ByteArrayInputStream("".getBytes("UTF-8"));  
	}
}
