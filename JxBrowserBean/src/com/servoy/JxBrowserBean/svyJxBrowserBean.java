package com.servoy.JxBrowserBean;
import java.awt.BorderLayout;

import javax.swing.JPanel;

import com.servoy.j2db.dataprocessing.IRecord;
import com.servoy.j2db.dataui.IServoyAwareBean;
import com.servoy.j2db.plugins.IClientPluginAccess;
import com.teamdev.jxbrowser.chromium.Browser;
import com.teamdev.jxbrowser.chromium.swing.BrowserView;


public class svyJxBrowserBean extends JPanel implements IServoyAwareBean {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	public svyJxBrowserBean() {
		super();
		Browser browser = new Browser();
		BrowserView browserView = new BrowserView(browser);
 
		setLayout(new BorderLayout());
		add(browserView, BorderLayout.CENTER);
		browser.loadURL("http://www.google.com");
	}
	public boolean isReadOnly() {
		// TODO Auto-generated method stub
		return false;
	}

	public void setValidationEnabled(boolean arg0) {
		// TODO Auto-generated method stub

	}

	public boolean stopUIEditing(boolean arg0) {
		// TODO Auto-generated method stub
		return false;
	}

	public void initialize(IClientPluginAccess arg0) {
		// TODO Auto-generated method stub

	}

	public void setSelectedRecord(IRecord arg0) {
		// TODO Auto-generated method stub

	}

}
