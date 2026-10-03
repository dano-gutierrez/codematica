import ExpoModulesCore
import PencilKit
import UIKit

public class CodematicaHandwritingModule: Module {
  public func definition() -> ModuleDefinition {
    Name("CodematicaHandwriting")
    View(NotebookInkView.self) {
      Events("onBegin", "onEnd", "onPan")
      Prop("disabled") { (view: NotebookInkView, disabled: Bool) in
        view.disabled = disabled
        view.canvas.drawingGestureRecognizer.isEnabled = !disabled && !view.panning
      }
      Prop("resetKey") { (view: NotebookInkView, key: Int) in
        if view.resetKey != key {
          view.gestureGeneration += 1
          view.resetKey = key
          view.canvas.drawing = PKDrawing()
          view.beforeStroke = PKDrawing()
        }
      }
      Prop("strokeCount") { (view: NotebookInkView, count: Int) in
        let strokes = view.canvas.drawing.strokes
        if count < strokes.count {
          view.canvas.drawing = PKDrawing(strokes: Array(strokes.prefix(max(0, count))))
          view.beforeStroke = view.canvas.drawing
        }
      }
    }
  }
}

// Input policy follows actual Pencil contacts, with a brief palm-rejection grace.
// It returns to finger drawing when the Pencil leaves, without a mode toggle.
class NotebookCanvas: PKCanvasView {
  var onPencil: (() -> Void)?
  var pencilContact = false
  var penUntil: TimeInterval = 0
  private var restoreFingerInput: DispatchWorkItem?

  override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
    if touches.contains(where: { $0.type == .pencil }) {
      restoreFingerInput?.cancel()
      pencilContact = true
      drawingPolicy = .pencilOnly
      onPencil?()
    }
    super.touchesBegan(touches, with: event)
  }
  override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
    super.touchesEnded(touches, with: event)
    releasePencil(touches)
  }
  override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
    super.touchesCancelled(touches, with: event)
    releasePencil(touches)
  }
  private func releasePencil(_ touches: Set<UITouch>) {
    guard touches.contains(where: { $0.type == .pencil }) else { return }
    pencilContact = false
    penUntil = Date.timeIntervalSinceReferenceDate + 0.8
    let restore = DispatchWorkItem { [weak self] in
      guard let self, !self.pencilContact else { return }
      self.drawingPolicy = .anyInput
    }
    restoreFingerInput = restore
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.8, execute: restore)
  }
}

// Track physical contacts on the pan recognizer itself: PencilKit may cancel
// touches delivered to its view when its drawing recognizer takes ownership.
class NotebookPan: UIPanGestureRecognizer {
  private(set) var contacts = Set<UITouch>()
  var onRelease: (() -> Void)?
  override func reset() {
    super.reset()
    contacts.removeAll()
    onRelease?()
  }
  override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent) {
    contacts.formUnion(touches)
    super.touchesBegan(touches, with: event)
  }
  override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent) {
    contacts.subtract(touches)
    super.touchesEnded(touches, with: event)
    onRelease?()
  }
  override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent) {
    contacts.subtract(touches)
    super.touchesCancelled(touches, with: event)
    onRelease?()
  }
}

class NotebookInkView: ExpoView, PKCanvasViewDelegate, UIGestureRecognizerDelegate {
  let canvas = NotebookCanvas()
  let onBegin = EventDispatcher()
  let onEnd = EventDispatcher()
  let onPan = EventDispatcher()
  var disabled = false
  var resetKey = 0
  var usingTool = false
  var panning = false
  var paperPan: NotebookPan?
  var gestureGeneration = 0
  var beforeStroke = PKDrawing()

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
    canvas.backgroundColor = .clear
    canvas.isOpaque = false
    // The RN viewport scrolls both the ruled paper and the native ink together.
    canvas.isScrollEnabled = false
    canvas.drawingPolicy = .anyInput
    canvas.delegate = self
    canvas.tool = PKInkingTool(.pen, color: UIColor(red: 0.15, green: 0.20, blue: 0.22, alpha: 1), width: 3)
    canvas.onPencil = { [weak self] in
      guard let self, self.usingTool else { return }
      self.cancelLiveStroke()
      self.canvas.drawingGestureRecognizer.isEnabled = !self.disabled
    }
    let pan = NotebookPan(target: self, action: #selector(panPaper(_:)))
    paperPan = pan
    pan.onRelease = { [weak self] in self?.finishPanIfReleased() }
    pan.minimumNumberOfTouches = 2
    pan.maximumNumberOfTouches = 2
    pan.allowedTouchTypes = [NSNumber(value: UITouch.TouchType.direct.rawValue)]
    pan.cancelsTouchesInView = false
    pan.delegate = self
    canvas.addGestureRecognizer(pan)
    addSubview(canvas)
  }
  override func layoutSubviews() {
    super.layoutSubviews()
    canvas.frame = bounds
    canvas.contentSize = bounds.size
  }
  private func cancelLiveStroke() {
    gestureGeneration += 1
    usingTool = false
    canvas.drawingGestureRecognizer.isEnabled = false
    canvas.drawing = beforeStroke
  }
  override func gestureRecognizerShouldBegin(_ gestureRecognizer: UIGestureRecognizer) -> Bool {
    !canvas.pencilContact && Date.timeIntervalSinceReferenceDate >= canvas.penUntil
  }
  func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer,
    shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer) -> Bool { true }

  private func finishPanIfReleased() {
    guard panning, paperPan?.contacts.isEmpty == true else { return }
    panning = false
    canvas.drawingGestureRecognizer.isEnabled = !disabled
    onPan(["phase": "ended", "deltaY": 0])
  }
  @objc private func panPaper(_ gesture: UIPanGestureRecognizer) {
    switch gesture.state {
    case .began:
      panning = true
      if usingTool { cancelLiveStroke() } else { gestureGeneration += 1 }
      canvas.drawingGestureRecognizer.isEnabled = false
      onPan(["phase": "began", "deltaY": 0])
    case .changed:
      guard gesture.numberOfTouches >= 2 else {
        gesture.setTranslation(.zero, in: window)
        return
      }
      // Measure in the stationary window, since the canvas moves with the paper.
      let delta = gesture.translation(in: window).y
      gesture.setTranslation(.zero, in: window)
      onPan(["phase": "changed", "deltaY": -Double(delta)])
    case .ended, .cancelled, .failed:
      // Do not turn a remaining finger into ink before every contact lifts.
      finishPanIfReleased()
    default: break
    }
    if gesture.state == .began { gesture.setTranslation(.zero, in: window) }
  }
  func canvasViewDidBeginUsingTool(_ canvasView: PKCanvasView) {
    guard !panning else { return }
    gestureGeneration += 1
    beforeStroke = canvas.drawing
    usingTool = true
    onBegin(["pen": canvas.pencilContact])
  }
  func canvasViewDidEndUsingTool(_ canvasView: PKCanvasView) {
    guard usingTool else { return }
    usingTool = false
    // PencilKit publishes the final sample after its tool delegate callback.
    let generation = resetKey
    let gesture = gestureGeneration
    DispatchQueue.main.async { [weak self] in
      guard let self, !self.usingTool, !self.panning,
        self.resetKey == generation, self.gestureGeneration == gesture else { return }
      let strokes: [[String: Any]] = self.canvas.drawing.strokes.map { stroke in
        let samples = Array(stroke.path.interpolatedPoints(by: .distance(1.5)))
        return [
          "points": samples.map { sample -> [Double] in
            let location = sample.location.applying(stroke.transform)
            return [Double(location.x), Double(location.y)]
          },
          "pressures": samples.map { min(1.0, max(0.0, Double($0.force))) }
        ]
      }
      self.beforeStroke = self.canvas.drawing
      self.onEnd(["strokes": strokes, "generation": generation])
    }
  }
}
