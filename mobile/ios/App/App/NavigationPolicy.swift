import Foundation

/// Top-level navigation policy only. CDN images and API requests stay in WebKit.
enum NavigationPolicy {
    static let home = URL(string: "https://animelog.jp/")!

    static func isInternal(_ url: URL) -> Bool {
        url.scheme == "https" && url.host == "animelog.jp"
            && (url.port == nil || url.port == 443)
            && url.user == nil && url.password == nil
    }

    static func isDownloadBlob(_ url: URL) -> Bool {
        guard url.scheme == "blob",
              let origin = URL(string: String(url.absoluteString.dropFirst(5))) else { return false }
        return isInternal(origin)
    }

    static func canOpenExternally(_ url: URL) -> Bool {
        url.scheme == "https" && url.host != nil && url.user == nil && url.password == nil
    }

    /// Share public profile/record pages only; never share auth codes or URL queries.
    static func shareURL(for url: URL?) -> URL {
        guard let url, isInternal(url),
              var parts = URLComponents(url: url, resolvingAgainstBaseURL: false) else { return home }
        let path = url.path.split(separator: "/")
        guard path.count == 2, ["profile", "share"].contains(String(path[0])) else { return home }
        parts.query = nil
        parts.fragment = nil
        return parts.url ?? home
    }
}
