import Foundation

func check(_ condition: @autoclosure () -> Bool, _ message: String) {
    if !condition() { fatalError(message) }
}

for value in ["https://animelog.jp/", "https://animelog.jp:443/profile/demo"] {
    check(NavigationPolicy.isInternal(URL(string: value)!), "Expected internal URL: \(value)")
}
for value in ["http://animelog.jp/", "https://animelog.jp.evil.test/", "https://evil.test/animelog.jp",
              "https://animelog.jp:8443/", "https://user@animelog.jp/", "https://www.animelog.jp/",
              "javascript:alert(1)", "file:///tmp/example", "capacitor://localhost/"] {
    check(!NavigationPolicy.isInternal(URL(string: value)!), "Unsafe URL accepted: \(value)")
}
check(NavigationPolicy.isDownloadBlob(URL(string: "blob:https://animelog.jp/123")!), "Internal blob rejected")
check(!NavigationPolicy.isDownloadBlob(URL(string: "blob:https://evil.test/123")!), "External blob accepted")
check(NavigationPolicy.canOpenExternally(URL(string: "https://example.org/")!), "HTTPS link rejected")
check(!NavigationPolicy.canOpenExternally(URL(string: "http://example.org/")!), "HTTP link accepted")
check(!NavigationPolicy.canOpenExternally(URL(string: "https://user@example.org/")!), "Credentials accepted")
for value in ["https://animelog.jp/auth/callback?code=secret", "https://animelog.jp/reset-password#token=secret",
              "https://evil.test/profile/demo", "https://animelog.jp/profile/demo/private"] {
    check(NavigationPolicy.shareURL(for: URL(string: value)) == NavigationPolicy.home, "Sensitive URL shared")
}
check(NavigationPolicy.shareURL(for: URL(string: "https://animelog.jp/profile/demo?code=secret#token"))
      .absoluteString == "https://animelog.jp/profile/demo", "Share URL was not sanitized")
check(NavigationPolicy.shareURL(for: URL(string: "https://animelog.jp/share/demo"))
      .absoluteString == "https://animelog.jp/share/demo", "Public record URL rejected")
check(NavigationPolicy.shareURL(for: nil) == NavigationPolicy.home, "Nil URL was not handled")
print("NavigationPolicy: 23 checks passed")
