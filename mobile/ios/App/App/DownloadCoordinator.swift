import UIKit
import WebKit

/// WebKit performs authenticated downloads; native code only shares completed files.
final class DownloadCoordinator: NSObject, WKDownloadDelegate {
    private weak var presenter: UIViewController?
    private let onFailure: () -> Void
    private var destinations: [ObjectIdentifier: URL] = [:]

    init(presenter: UIViewController, onFailure: @escaping () -> Void) {
        self.presenter = presenter
        self.onFailure = onFailure
    }

    func download(_ download: WKDownload, decideDestinationUsing response: URLResponse,
                  suggestedFilename: String, completionHandler: @escaping (URL?) -> Void) {
        let folder = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        do {
            try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
            let name = (suggestedFilename as NSString).lastPathComponent
            let destination = folder.appendingPathComponent(name.isEmpty || name == "." || name == ".." ? "animelog-export" : name)
            destinations[ObjectIdentifier(download)] = destination
            completionHandler(destination)
        } catch {
            completionHandler(nil)
            onFailure()
        }
    }

    func downloadDidFinish(_ download: WKDownload) {
        guard let file = destinations.removeValue(forKey: ObjectIdentifier(download)) else { return }
        guard let presenter, presenter.presentedViewController == nil else {
            removeTemporaryFile(file)
            onFailure()
            return
        }
        let sheet = UIActivityViewController(activityItems: [file], applicationActivities: nil)
        sheet.completionWithItemsHandler = { [weak self] _, _, _, _ in self?.removeTemporaryFile(file) }
        sheet.popoverPresentationController?.sourceView = presenter.view
        sheet.popoverPresentationController?.sourceRect = CGRect(x: presenter.view.bounds.midX,
                                                                  y: presenter.view.bounds.maxY - 44,
                                                                  width: 1, height: 1)
        presenter.present(sheet, animated: true)
    }

    func download(_ download: WKDownload, didFailWithError error: Error, resumeData: Data?) {
        if let file = destinations.removeValue(forKey: ObjectIdentifier(download)) { removeTemporaryFile(file) }
        onFailure()
    }

    func download(_ download: WKDownload, willPerformHTTPRedirection response: HTTPURLResponse,
                  newRequest request: URLRequest, decisionHandler: @escaping (WKDownload.RedirectPolicy) -> Void) {
        decisionHandler(request.url.map(NavigationPolicy.isInternal) == true ? .allow : .cancel)
    }

    private func removeTemporaryFile(_ file: URL) {
        try? FileManager.default.removeItem(at: file.deletingLastPathComponent())
    }
}
