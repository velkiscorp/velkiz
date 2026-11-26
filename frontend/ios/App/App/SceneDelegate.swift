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
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
