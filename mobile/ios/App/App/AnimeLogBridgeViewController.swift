import Capacitor
import UIKit

/// Capacitor loads bundled assets. Remote pages never receive its native bridge.
final class AnimeLogBridgeViewController: CAPBridgeViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        webView?.isHidden = true
        // Capacitor makes its WebView the root view. Use a separate visible container
        // so hiding the local bridge does not hide the remote child controller too.
        view = UIView()
        view.backgroundColor = .systemBackground
        let content = AnimeLogViewController()
        addChild(content)
        view.addSubview(content.view)
        content.view.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            content.view.topAnchor.constraint(equalTo: view.topAnchor),
            content.view.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            content.view.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            content.view.trailingAnchor.constraint(equalTo: view.trailingAnchor)
        ])
        content.didMove(toParent: self)
    }
}
