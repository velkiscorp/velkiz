import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        let window = UIWindow(windowScene: windowScene)
        window.rootViewController = CAPBridgeViewController()
        window.makeKeyAndVisible()
        self.window = window
        hideFromScreenCapture(window)

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    // Screenshots and screen recordings of Velkiz come out blank.
    // iOS leaves the inside of a password field out of every capture, so the
    // whole window is drawn inside one (an empty, invisible password field).
    // Taps and layout are unaffected: only where the window is drawn changes.
    private let captureShield = UITextField()

    private func hideFromScreenCapture(_ window: UIWindow, attempt: Int = 0) {
        captureShield.isSecureTextEntry = true
        captureShield.isUserInteractionEnabled = false
        if captureShield.superview == nil {
            window.addSubview(captureShield)
        }
        // The window's layer gets a parent once it is on screen; wait for that
        guard let parent = window.layer.superlayer,
              let secureLayer = captureShield.layer.sublayers?.last else {
            if attempt < 20 {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) { [weak self] in
                    self?.hideFromScreenCapture(window, attempt: attempt + 1)
                }
            }
            return
        }
        parent.addSublayer(captureShield.layer)
        secureLayer.addSublayer(window.layer)
        addCaptureCover(to: parent, below: captureShield.layer, size: window.bounds.size)
    }

    // What a screenshot or screen recording shows instead: the Velkiz logo on
    // black. It sits behind the window, so people never see it in the app;
    // captures leave the window out and show only this.
    private func addCaptureCover(to parent: CALayer, below shield: CALayer, size: CGSize) {
        let scale = UIScreen.main.scale
        let gold = UIColor(red: 214 / 255, green: 186 / 255, blue: 140 / 255, alpha: 1).cgColor

        let cover = CALayer()
        cover.frame = CGRect(origin: .zero, size: size)
        cover.backgroundColor = UIColor(red: 8 / 255, green: 6 / 255, blue: 10 / 255, alpha: 1).cgColor

        let side: CGFloat = 88
        if let logo = UIImage(named: "CaptureLogo")?.cgImage {
            let logoLayer = CALayer()
            logoLayer.frame = CGRect(x: (size.width - side) / 2, y: size.height / 2 - side - 8, width: side, height: side)
            logoLayer.contents = logo
            logoLayer.contentsGravity = .resizeAspect
            logoLayer.contentsScale = scale
            cover.addSublayer(logoLayer)
        }

        let title = CATextLayer()
        title.string = "Velkiz"
        title.font = "Georgia-Italic" as CFTypeRef
        title.fontSize = 36
        title.foregroundColor = gold
        title.alignmentMode = .center
        title.contentsScale = scale
        title.frame = CGRect(x: 0, y: size.height / 2 + 6, width: size.width, height: 46)
        cover.addSublayer(title)

        let note = CATextLayer()
        note.string = "Screenshots are private"
        note.fontSize = 14
        note.foregroundColor = UIColor(white: 1, alpha: 0.5).cgColor
        note.alignmentMode = .center
        note.contentsScale = scale
        note.frame = CGRect(x: 0, y: size.height / 2 + 58, width: size.width, height: 20)
        cover.addSublayer(note)

        parent.insertSublayer(cover, below: shield)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
