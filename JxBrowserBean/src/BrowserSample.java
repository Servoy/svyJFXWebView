import com.teamdev.jxbrowser.chromium.Browser;
import com.teamdev.jxbrowser.chromium.swing.BrowserView;
 
import javax.swing.*;
import java.awt.*;
 
public class BrowserSample {
   public static void main(String[] args) {
       Browser browser = new Browser();
       BrowserView browserView = new BrowserView(browser);
 
       JPanel pane = new JPanel();
       pane.setLayout(new BorderLayout());
       pane.add(browserView, BorderLayout.CENTER);

       JFrame frame = new JFrame();
       frame.setDefaultCloseOperation(WindowConstants.EXIT_ON_CLOSE);
       frame.setContentPane(pane);
       frame.setSize(700, 500);
       frame.setLocationRelativeTo(null);
       frame.setVisible(true);

       browser.loadURL("http://www.google.com");
   }
}
