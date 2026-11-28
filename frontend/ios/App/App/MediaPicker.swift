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
//     MediaPicker.capture() -> the same, from the camera (photo or video, up to a minute)
@objc(MediaPickerPlugin)
public class MediaPickerPlugin: CAPPlugin, CAPBridgedPlugin, PHPickerViewControllerDelegate,
    UIImagePickerControllerDelegate, UINavigationControllerDelegate {
    public let identifier = "MediaPickerPlugin"
    public let jsName = "MediaPicker"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "pick", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "capture", returnType: CAPPluginReturnPromise)
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

    // Camera: take a photo or record a video, then hand it back like a pick.
    // iOS asks for camera (and, for video, microphone) access the first time.
    @objc func capture(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.pending?.resolve(["cancelled": true])
            self.pending = call
            guard UIImagePickerController.isSourceTypeAvailable(.camera),
                  let presenter = self.bridge?.viewController else {
                self.fail("This phone has no camera available.")
                return
            }
            let camera = UIImagePickerController()
            camera.sourceType = .camera
            camera.mediaTypes = [UTType.image.identifier, UTType.movie.identifier]
            camera.videoMaximumDuration = 60
            camera.videoQuality = .typeHigh
            camera.cameraDevice = .rear
            camera.delegate = self
            camera.modalPresentationStyle = .fullScreen
            presenter.present(camera, animated: true)
        }
    }

    public func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
        picker.dismiss(animated: true)
        finish(["cancelled": true])
    }

    public func imagePickerController(_ picker: UIImagePickerController,
                                      didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
        picker.dismiss(animated: true)
        if let video = info[.mediaURL] as? URL {
            let ext = video.pathExtension.isEmpty ? "mov" : video.pathExtension.lowercased()
            let copy = tempURL(ext)
            do {
                try FileManager.default.copyItem(at: video, to: copy)
                hand(copy, isVideo: true, ext: ext)
            } catch {
                fail("Couldn't save that video. Try again.")
            }
            return
        }
        guard let image = info[.originalImage] as? UIImage,
              let data = image.jpegData(compressionQuality: 0.9) else {
            fail("Couldn't save that photo. Try again.")
            return
        }
        let copy = tempURL("jpg")
        do {
            try data.write(to: copy)
            hand(copy, isVideo: false, ext: "jpg")
        } catch {
            fail("Couldn't save that photo. Try again.")
        }
    }

    private func tempURL(_ ext: String) -> URL {
        FileManager.default.temporaryDirectory
            .appendingPathComponent("pick-\(UUID().uuidString)")
            .appendingPathExtension(ext)
    }

    private func hand(_ file: URL, isVideo: Bool, ext: String) {
        DispatchQueue.main.async {
            let webPath = self.bridge?.portablePath(fromLocalURL: file)?.absoluteString ?? ""
            self.finish(["webPath": webPath, "isVideo": isVideo, "ext": ext])
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
