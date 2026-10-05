import SafariServices
import UIKit
import WebKit

final class AnimeLogViewController: UIViewController, WKNavigationDelegate, WKUIDelegate {
    private var webView: WKWebView!
    private let toolbar = UIToolbar()
    private let errorPanel = UIStackView()
    private let spinner = UIActivityIndicatorView(style: .medium)
    private var backButton: UIBarButtonItem!
    private var forwardButton: UIBarButtonItem!
    private var pendingURL = NavigationPolicy.home
    private var historyObservations: [NSKeyValueObservation] = []
    private var downloadCoordinator: DownloadCoordinator!

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground
        // A fresh configuration is essential: no Capacitor message handlers or bridge.
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.allowsBackForwardNavigationGestures = true
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.customUserAgent = nil
        downloadCoordinator = DownloadCoordinator(presenter: self) { [weak self] in
            self?.showDownloadFailure()
        }
        configureToolbar()
        configureErrorPanel()
        for child in [webView!, toolbar, errorPanel, spinner] {
            child.translatesAutoresizingMaskIntoConstraints = false
            view.addSubview(child)
        }
        let safe = view.safeAreaLayoutGuide
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: safe.topAnchor),
            webView.leadingAnchor.constraint(equalTo: safe.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: safe.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: toolbar.topAnchor),
            toolbar.leadingAnchor.constraint(equalTo: safe.leadingAnchor),
            toolbar.trailingAnchor.constraint(equalTo: safe.trailingAnchor),
            toolbar.bottomAnchor.constraint(equalTo: view.keyboardLayoutGuide.topAnchor),
            toolbar.heightAnchor.constraint(equalToConstant: 44),
            errorPanel.centerXAnchor.constraint(equalTo: webView.centerXAnchor),
            errorPanel.centerYAnchor.constraint(equalTo: webView.centerYAnchor),
            errorPanel.widthAnchor.constraint(lessThanOrEqualTo: safe.widthAnchor, constant: -48),
            spinner.centerXAnchor.constraint(equalTo: webView.centerXAnchor),
            spinner.topAnchor.constraint(equalTo: safe.topAnchor, constant: 8)
        ])
        historyObservations = [
            webView.observe(\.canGoBack, options: [.initial, .new]) { [weak self] _, _ in
                self?.backButton.isEnabled = self?.webView.canGoBack ?? false
            },
            webView.observe(\.canGoForward, options: [.initial, .new]) { [weak self] _, _ in
                self?.forwardButton.isEnabled = self?.webView.canGoForward ?? false
            }
        ]
        retry()
    }

    private func configureToolbar() {
        backButton = UIBarButtonItem(image: UIImage(systemName: "chevron.backward"),
                                    style: .plain, target: self, action: #selector(goBack))
        forwardButton = UIBarButtonItem(image: UIImage(systemName: "chevron.forward"),
                                       style: .plain, target: self, action: #selector(goForward))
        backButton.accessibilityLabel = "戻る"
        forwardButton.accessibilityLabel = "進む"
        let reload = UIBarButtonItem(barButtonSystemItem: .refresh, target: self, action: #selector(retry))
        reload.accessibilityLabel = "再読み込み"
        let share = UIBarButtonItem(barButtonSystemItem: .action, target: self, action: #selector(shareLink))
        share.accessibilityLabel = "リンクを共有"
        let space = { UIBarButtonItem(barButtonSystemItem: .flexibleSpace, target: nil, action: nil) }
        toolbar.items = [backButton, space(), forwardButton, space(), reload, space(), share]
    }

    private func configureErrorPanel() {
        errorPanel.axis = .vertical
        errorPanel.alignment = .center
        errorPanel.spacing = 16
        let label = UILabel()
        label.text = "接続できませんでした。通信状態を確認して、もう一度お試しください。"
        label.numberOfLines = 0
        label.textAlignment = .center
        label.font = .preferredFont(forTextStyle: .body)
        label.adjustsFontForContentSizeCategory = true
        let button = UIButton(type: .system)
        button.setTitle("再試行", for: .normal)
        button.addTarget(self, action: #selector(retry), for: .touchUpInside)
        errorPanel.addArrangedSubview(label)
        errorPanel.addArrangedSubview(button)
        errorPanel.isHidden = true
    }

    @objc private func goBack() { webView.goBack() }
    @objc private func goForward() { webView.goForward() }

    @objc private func retry() {
        errorPanel.isHidden = true
        webView.isHidden = false
        spinner.startAnimating()
        webView.load(URLRequest(url: pendingURL))
    }

    @objc private func shareLink() {
        let share = UIActivityViewController(activityItems: [NavigationPolicy.shareURL(for: webView.url)],
                                             applicationActivities: nil)
        share.popoverPresentationController?.barButtonItem = toolbar.items?.last
        present(share, animated: true)
    }

    private func showFailure(message: String = "接続できませんでした。通信状態を確認して、もう一度お試しください。") {
        spinner.stopAnimating()
        (errorPanel.arrangedSubviews.first as? UILabel)?.text = message
        webView.isHidden = true
        errorPanel.isHidden = false
    }

    private func showDownloadFailure() {
        // Keep drafts and the current page intact when only a file download fails.
        let message = UILabel()
        message.text = "ファイルを保存できませんでした。もう一度お試しください。"
        message.font = .preferredFont(forTextStyle: .body)
        message.numberOfLines = 0
        message.textAlignment = .center
        message.backgroundColor = .secondarySystemBackground
        message.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(message)
        NSLayoutConstraint.activate([
            message.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 16),
            message.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -16),
            message.bottomAnchor.constraint(equalTo: toolbar.topAnchor, constant: -8)
        ])
        UIAccessibility.post(notification: .announcement, argument: message.text)
        DispatchQueue.main.asyncAfter(deadline: .now() + 5) { message.removeFromSuperview() }
    }

    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = action.request.url else { decisionHandler(.cancel); return }
        let internalURL = NavigationPolicy.isInternal(url)
        if action.shouldPerformDownload && (internalURL || NavigationPolicy.isDownloadBlob(url)) {
            decisionHandler(.download)
            return
        }
        if internalURL {
            if action.targetFrame == nil {
                decisionHandler(.cancel)
                webView.load(action.request)
            } else {
                decisionHandler(.allow)
            }
            return
        }
        decisionHandler(.cancel)
        // Only explicit user navigation opens an external browser, never server redirects.
        if action.navigationType == .linkActivated, action.sourceFrame.isMainFrame,
           NavigationPolicy.canOpenExternally(url), presentedViewController == nil {
            present(SFSafariViewController(url: url), animated: true)
        }
    }

    func webView(_ webView: WKWebView, decidePolicyFor response: WKNavigationResponse,
                 decisionHandler: @escaping (WKNavigationResponsePolicy) -> Void) {
        if !response.isForMainFrame { decisionHandler(.allow); return }
        guard let url = response.response.url,
              NavigationPolicy.isInternal(url) || NavigationPolicy.isDownloadBlob(url) else {
            decisionHandler(.cancel)
            showFailure()
            return
        }
        let attachment = (response.response as? HTTPURLResponse)?
            .value(forHTTPHeaderField: "Content-Disposition")?.lowercased().hasPrefix("attachment") ?? false
        decisionHandler(response.canShowMIMEType && !attachment ? .allow : .download)
    }

    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        errorPanel.isHidden = true
        webView.isHidden = false
        spinner.startAnimating()
    }

    func webView(_ webView: WKWebView, didCommit navigation: WKNavigation!) {
        if let url = webView.url, NavigationPolicy.isInternal(url) { pendingURL = url }
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) { spinner.stopAnimating() }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        handleFailure(error)
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        handleFailure(error)
    }

    private func handleFailure(_ error: Error) {
        spinner.stopAnimating()
        let failure = error as NSError
        guard !(failure.domain == NSURLErrorDomain && failure.code == NSURLErrorCancelled) else { return }
        // Keep the intended destination so retry does not silently return to the home page.
        if let url = failure.userInfo[NSURLErrorFailingURLErrorKey] as? URL,
           NavigationPolicy.isInternal(url) { pendingURL = url }
        showFailure()
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        // A manual retry avoids an endless reload loop on an unstable device.
        showFailure(message: "画面の表示が中断されました。再試行すると開き直せます。")
    }

    func webView(_ webView: WKWebView, navigationAction: WKNavigationAction, didBecome download: WKDownload) {
        spinner.stopAnimating()
        download.delegate = downloadCoordinator
    }

    func webView(_ webView: WKWebView, navigationResponse: WKNavigationResponse, didBecome download: WKDownload) {
        spinner.stopAnimating()
        download.delegate = downloadCoordinator
    }
}
