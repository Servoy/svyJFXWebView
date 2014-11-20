svyJFXWebView
=============

A HTML5 WebView component for the Servoy Smart Client. 'svyJFXWebView' is a module of the Servoy Business Application Platform.


Getting started
-------------
To use the svyJFXWebView module download the [svyJFXWebView.zip](https://github.com/Servoy/svyJFXWebView/releases) file extract the .servoy files and import them into your workspace. 
To use the WebView component add the svyJFXWebView module to the active solution;
load the HTML5 content into a tabless panel using the svyJFXWebView scope methods:


```javascript
var webPanel = new scopes.svyJFXWebView.WebViewPanel(elements.tabless);
// load custom HTML5 into the WebView
webPanel.loadContent('<html>Hello WebView !</html>');
// or load url into the WebView
webPanel.load('http://www.servoy.com/');
```

To use the latest source code clone the git repository and checkout the develop branch. Install the [egit](http://www.eclipse.org/egit/download/) plugin for Eclipse to clone the repository and import the projects into the workspace.


Requirements
-------------
The WebView component requires the JFXPanel Bean which is available since Servoy 7.2 or higher.
For more details about the JFXPanel look at the [Servoy docs](https://wiki.servoy.com/display/Serv7/JFXPanel+Bean)


Documentation
-------------
See the [Wiki](https://github.com/Servoy/svyJFXWebView/wiki) for the available documentation


Feature Requests & Bugs
-----------------------
Found a bug or would like to see a new feature implemented? Raise an issue in the [Issue Tracker](https://github.com/Servoy/svyJFXWebView/issues)


Contributing
-------------
Eager to fix a bug or introduce a new feature? Clone the repository and issue a pull request


License
-------
svyJFXWebView is licensed under LGPL
