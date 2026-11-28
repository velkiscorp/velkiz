import UIKit
import Capacitor
import PhotosUI
import UniformTypeIdentifiers

// The app's own window controller: Capacitor as usual, plus the photo picker below.
class VelkizBridgeViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(MediaPickerPlugin())
    }
}

// Picks one photo or video for a chat with Apple's system picker (PHPicker).
// It needs no access to the photo library (no permission prompt), and with a
// limit of one it closes as soon as something is tapped.
// JS: MediaPicker.pick() -> { webPath, isVideo, ext } or { cancelled: true }
@objc(MediaPickerPlugin)
public class MediaPickerPlugin: CAPPlugin, CAPBridgedPlugin, PHPickerViewControllerDelegate {
    public let identifier = "MediaPickerPlugin"
    public let jsName = "MediaPicker"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "pick", returnType: CAPPluginReturnPromise)
    ]

    private var pending: CAPPluginCall?

    @objc func pick(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            // A picker that never reported back shouldn't block this one
            self.pending?.resolve(["cancelled": true])
            self.pending = call

            var config = PHPickerConfiguration()
            config.selectionLimit = 1
            config.filter = .any(of: [.images, .videos])
            // HEIC photos arrive as JPEG and HEVC videos as H.264, which every phone can show
            config.preferredAssetRepresentationMode = .compatible

            let picker = PHPickerViewController(configuration: config)
            picker.delegate = self
            picker.modalPresentationStyle = .fullScreen
            guard let presenter = self.bridge?.viewController else {
                self.finish(["cancelled": true])
                return
            }
            presenter.present(picker, animated: true)
        }
    }

    public func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
        picker.dismiss(animated: true)
        guard let provider = results.first?.itemProvider else {
            finish(["cancelled": true])
            return
        }
        let isVideo = provider.hasItemConformingToTypeIdentifier(UTType.movie.identifier)
        let type = isVideo ? UTType.movie : UTType.image
        provider.loadFileRepresentation(forTypeIdentifier: type.identifier) { [weak self] url, _ in
            guard let self = self else { return }
            guard let url = url else {
                self.fail("Couldn't open that. Try another one.")
                return
            }
            // The picker's file is deleted when this block returns: keep a copy
            let ext = (url.pathExtension.isEmpty ? (isVideo ? "mov" : "jpg") : url.pathExtension).lowercased()
            let copy = FileManager.default.temporaryDirectory
                .appendingPathComponent("pick-\(UUID().uuidString)")
                .appendingPathExtension(ext)
            do {
                try FileManager.default.copyItem(at: url, to: copy)
            } catch {
                self.fail("Couldn't open that. Try another one.")
                return
            }
            DispatchQueue.main.async {
                let webPath = self.bridge?.portablePath(fromLocalURL: copy)?.absoluteString ?? ""
                self.finish(["webPath": webPath, "isVideo": isVideo, "ext": ext])
            }
        }
    }

    private func finish(_ data: [String: Any]) {
        DispatchQueue.main.async {
            self.pending?.resolve(data)
            self.pending = nil
        }
    }

    private func fail(_ message: String) {
        DispatchQueue.main.async {
            self.pending?.reject(message)
            self.pending = nil
        }
    }
}
