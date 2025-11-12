import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, debounceTime } from 'rxjs';
import { BoardElement, ElementType, CreateElementRequest, UpdateElementRequest } from '../../../core/models/board.model';
import { ElementService } from '../../../core/services/element.service';
import { WhiteboardRealtimeService } from '../../../core/services/whiteboard-realtime.service';
import { BoardService } from '../../../core/services/board.service';

interface Point {
  x: number;
  y: number;
}

interface HistoryState {
  elements: BoardElement[];
  timestamp: number;
}

@Component({
  selector: 'app-whiteboard-canvas',
  templateUrl: './whiteboard-canvas.component.html',
  styleUrls: ['./whiteboard-canvas.component.css']
})
export class WhiteboardCanvasComponent implements OnInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private destroy$ = new Subject<void>();
  private ctx!: CanvasRenderingContext2D;
  private autoSave$ = new Subject<void>();

  boardId: string = '';
  elements: BoardElement[] = [];
  selectedElements: BoardElement[] = [];
  currentTool: 'select' | 'rectangle' | 'circle' | 'triangle' | 'text' | 'sticky' | 'pen' | 'line' | 'connector' | 'frame' = 'select';

  // Canvas state
  zoom: number = 1;
  panX: number = 0;
  panY: number = 0;
  private isDragging: boolean = false;
  private isDrawing: boolean = false;
  private isPanning: boolean = false;
  private startPoint: Point = { x: 0, y: 0 };
  private currentElement?: BoardElement;
  private drawingPath: Point[] = [];

  // Undo/Redo
  history: HistoryState[] = [];
  historyIndex: number = -1;
  private maxHistorySize: number = 50;

  // Clipboard
  clipboard: BoardElement[] = [];

  // Text editing
  private editingTextElement?: BoardElement;
  private textInput?: HTMLInputElement;

  // Connector state
  connectorStartElement?: BoardElement;

  // Connection handles
  private hoveredElement?: BoardElement;
  private isDraggingFromHandle: boolean = false;
  private dragFromHandle?: { element: BoardElement; position: Point };

  // Snapping and alignment
  snapEnabled: boolean = true;
  private snapThreshold: number = 10;
  private alignmentGuides: Array<{ type: 'vertical' | 'horizontal'; position: number }> = [];

  // Mini-map
  private minimapSize: number = 150;
  private minimapPadding: number = 20;
  showMinimap: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private elementService: ElementService,
    private boardService: BoardService,
    private realtimeService: WhiteboardRealtimeService
  ) {}

  ngOnInit(): void {
    this.boardId = this.route.snapshot.params['id'];
    this.initializeCanvas();
    this.loadBoard();
    this.setupRealtimeConnection();
    this.setupAutoSave();
    this.setupKeyboardShortcuts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.realtimeService.disconnect(this.boardId);
  }

  private initializeCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.resizeCanvas();
  }

  @HostListener('window:resize')
  private resizeCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    this.render();
  }

  private loadBoard(): void {
    this.boardService.getBoardById(this.boardId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(board => {
        this.elements = board.elements;
        this.saveHistoryState();
        this.render();
      });
  }

  private setupRealtimeConnection(): void {
    this.realtimeService.connect(this.boardId);

    this.realtimeService.elementCreated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(element => {
        if (element) {
          this.elements.push(element);
          this.render();
        }
      });

    this.realtimeService.elementUpdated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(element => {
        if (element) {
          const index = this.elements.findIndex(e => e.id === element.id);
          if (index !== -1) {
            this.elements[index] = element;
            this.render();
          }
        }
      });

    this.realtimeService.elementDeleted$
      .pipe(takeUntil(this.destroy$))
      .subscribe(elementId => {
        if (elementId) {
          this.elements = this.elements.filter(e => e.id !== elementId);
          this.render();
        }
      });
  }

  private setupAutoSave(): void {
    this.autoSave$
      .pipe(
        debounceTime(2000),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        // Auto-save is handled by real-time updates
        console.log('Auto-save triggered');
      });
  }

  private setupKeyboardShortcuts(): void {
    // Keyboard shortcuts will be handled in the host listener
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key.toLowerCase()) {
        case 'z':
          event.preventDefault();
          if (event.shiftKey) {
            this.redo();
          } else {
            this.undo();
          }
          break;
        case 'c':
          event.preventDefault();
          this.copy();
          break;
        case 'v':
          event.preventDefault();
          this.paste();
          break;
        case 'a':
          event.preventDefault();
          this.selectAll();
          break;
        case '+':
        case '=':
          event.preventDefault();
          this.zoomIn();
          break;
        case '-':
          event.preventDefault();
          this.zoomOut();
          break;
      }
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      this.deleteSelected();
    }
  }

  // Mouse event handlers
  onMouseDown(event: MouseEvent): void {
    const point = this.getCanvasPoint(event);

    if (event.button === 1 || (event.button === 0 && event.shiftKey)) {
      // Middle mouse or Shift+Left mouse for panning
      this.isPanning = true;
      this.startPoint = point;
      return;
    }

    if (this.currentTool === 'select') {
      // Check if clicking on a connection handle
      const handleInfo = this.getHandleAtPoint(point);
      if (handleInfo) {
        this.isDraggingFromHandle = true;
        this.dragFromHandle = handleInfo;
        this.startPoint = handleInfo.position;
        this.render();
        return;
      }

      const clickedElement = this.getElementAtPoint(point);
      if (clickedElement) {
        // Check for double-click on text elements and connectors
        if (event.detail === 2 && (clickedElement.type === 'Text' || clickedElement.type === 'Connector' || clickedElement.type === 'Line')) {
          this.editText(clickedElement);
          return;
        }

        if (!event.ctrlKey) {
          this.selectedElements = [clickedElement];
        } else {
          this.toggleSelection(clickedElement);
        }
        this.isDragging = true;
        this.startPoint = point;
      } else {
        this.selectedElements = [];
      }
    } else {
      this.isDrawing = true;
      this.startPoint = point;

      if (this.currentTool === 'pen') {
        this.drawingPath = [point];
      }
    }

    this.render();
  }

  onMouseMove(event: MouseEvent): void {
    const point = this.getCanvasPoint(event);

    if (this.isPanning) {
      const dx = point.x - this.startPoint.x;
      const dy = point.y - this.startPoint.y;
      this.panX += dx;
      this.panY += dy;
      this.startPoint = point;
      this.render();
      return;
    }

    // Handle dragging from connection handle
    if (this.isDraggingFromHandle) {
      this.render();
      // Draw preview line from handle to cursor
      this.ctx.save();
      this.ctx.translate(this.panX, this.panY);
      this.ctx.scale(this.zoom, this.zoom);

      this.ctx.strokeStyle = '#2196F3';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([5, 5]);
      this.ctx.beginPath();
      this.ctx.moveTo(this.startPoint.x, this.startPoint.y);
      this.ctx.lineTo(point.x, point.y);
      this.ctx.stroke();

      this.ctx.restore();
      return;
    }

    if (this.isDragging && this.selectedElements.length > 0) {
      let dx = point.x - this.startPoint.x;
      let dy = point.y - this.startPoint.y;

      // Apply snapping if enabled
      if (this.snapEnabled) {
        const snapResult = this.calculateSnapping(this.selectedElements[0], dx, dy);
        dx = snapResult.dx;
        dy = snapResult.dy;
        this.alignmentGuides = snapResult.guides;
      }

      this.selectedElements.forEach(element => {
        element.x += dx;
        element.y += dy;
      });

      this.startPoint.x += dx;
      this.startPoint.y += dy;
      this.render();
      this.autoSave$.next();
      return;
    }

    if (this.isDrawing) {
      if (this.currentTool === 'pen') {
        this.drawingPath.push(point);
        this.render();
      } else {
        this.renderPreview(point);
      }
    }

    // Update hovered element for showing connection handles
    if (this.currentTool === 'select' && !this.isDragging && !this.isDrawing) {
      const elementAtPoint = this.getElementAtPoint(point);
      if (elementAtPoint !== this.hoveredElement) {
        this.hoveredElement = elementAtPoint;
        this.render();
      }
    }

    // Send cursor position for real-time collaboration
    this.realtimeService.sendCursorPosition(this.boardId, point.x, point.y);
  }

  async onMouseUp(event: MouseEvent): Promise<void> {
    const point = this.getCanvasPoint(event);

    if (this.isPanning) {
      this.isPanning = false;
      return;
    }

    // Handle connection from handle drag
    if (this.isDraggingFromHandle && this.dragFromHandle) {
      this.isDraggingFromHandle = false;
      const targetElement = this.getElementAtPoint(point);

      if (targetElement && targetElement.id !== this.dragFromHandle.element.id) {
        // Create connector between elements
        await this.createConnectorFromHandles(this.dragFromHandle.element, targetElement);
      }

      this.dragFromHandle = undefined;
      this.render();
      return;
    }

    if (this.isDragging) {
      this.isDragging = false;
      this.alignmentGuides = []; // Clear alignment guides
      // Update elements on server
      await this.updateSelectedElements();
      this.saveHistoryState();
      this.render();
      return;
    }

    if (this.isDrawing) {
      this.isDrawing = false;

      // Special handling for text tool
      if (this.currentTool === 'text') {
        await this.createTextElement(point);
      }
      // Special handling for sticky note tool
      else if (this.currentTool === 'sticky') {
        await this.createStickyNote(point);
      }
      // Special handling for frame tool
      else if (this.currentTool === 'frame') {
        await this.createFrame(point);
      }
      // Special handling for connector tool
      else if (this.currentTool === 'connector') {
        await this.handleConnectorClick(point);
      }
      // All other tools
      else {
        await this.createNewElement(point);
        this.drawingPath = [];
      }

      this.saveHistoryState();
    }
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    const oldZoom = this.zoom;
    this.zoom *= delta;
    this.zoom = Math.max(0.05, Math.min(10, this.zoom)); // Increased zoom range for infinite canvas

    // Zoom towards mouse position
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Adjust pan to zoom towards cursor
    this.panX = mouseX - (mouseX - this.panX) * (this.zoom / oldZoom);
    this.panY = mouseY - (mouseY - this.panY) * (this.zoom / oldZoom);

    this.render();
  }

  // Tool selection
  selectTool(tool: typeof this.currentTool): void {
    this.currentTool = tool;
    this.selectedElements = [];
    this.render();
  }

  // Zoom controls
  zoomIn(): void {
    this.zoom *= 1.2;
    this.zoom = Math.min(10, this.zoom);
    this.render();
  }

  zoomOut(): void {
    this.zoom *= 0.8;
    this.zoom = Math.max(0.05, this.zoom);
    this.render();
  }

  resetZoom(): void {
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
    this.render();
  }

  // Undo/Redo
  undo(): void {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.restoreHistoryState(this.history[this.historyIndex]);
    }
  }

  redo(): void {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.restoreHistoryState(this.history[this.historyIndex]);
    }
  }

  // Copy/Paste
  copy(): void {
    this.clipboard = [...this.selectedElements];
  }

  async paste(): Promise<void> {
    if (this.clipboard.length === 0) return;

    const newElements: BoardElement[] = [];
    for (const element of this.clipboard) {
      const request: CreateElementRequest = {
        type: element.type,
        x: element.x + 20,
        y: element.y + 20,
        width: element.width,
        height: element.height,
        rotation: element.rotation || 0,
        backgroundColor: element.backgroundColor || '#FFFFFF',
        borderColor: element.borderColor || '#000000',
        borderWidth: element.borderWidth || 2,
        textColor: element.textColor || '#000000',
        fontFamily: element.fontFamily || 'Arial',
        fontSize: element.fontSize || 14,
        fontWeight: element.fontWeight || 'normal',
        fontStyle: element.fontStyle || 'normal',
        textContent: element.textContent || '',
        imageUrl: element.imageUrl || '',
        connectedFromElementId: element.connectedFromElementId,
        connectedToElementId: element.connectedToElementId,
        connectorStyle: element.connectorStyle || 'solid',
        pathData: element.pathData || ''
      };

      try {
        const newElement = await this.elementService.createElement(this.boardId, request).toPromise();
        if (newElement) {
          newElements.push(newElement);
          await this.realtimeService.notifyElementCreated(this.boardId, newElement);
        }
      } catch (error) {
        console.error('Error pasting element:', error);
      }
    }

    this.elements.push(...newElements);
    this.selectedElements = newElements;
    this.saveHistoryState();
    this.render();
  }

  // Delete
  async deleteSelected(): Promise<void> {
    for (const element of this.selectedElements) {
      await this.elementService.deleteElement(this.boardId, element.id).toPromise();
      await this.realtimeService.notifyElementDeleted(this.boardId, element.id);
    }

    this.elements = this.elements.filter(e => !this.selectedElements.includes(e));
    this.selectedElements = [];
    this.saveHistoryState();
    this.render();
  }

  selectAll(): void {
    this.selectedElements = [...this.elements];
    this.render();
  }

  // Text creation and editing
  private async createTextElement(point: Point): Promise<void> {
    const text = prompt('Enter text:');
    if (!text) return;

    const request: CreateElementRequest = {
      type: 'Text',
      x: this.startPoint.x,
      y: this.startPoint.y,
      width: 200,
      height: 30,
      textContent: text,
      textColor: '#000000',
      fontSize: 16,
      fontFamily: 'Arial',
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderWidth: 0
    };

    const element = await this.elementService.createElement(this.boardId, request).toPromise();
    if (element) {
      this.elements.push(element);
      await this.realtimeService.notifyElementCreated(this.boardId, element);
      this.render();
    }
  }

  async editText(element: BoardElement): Promise<void> {
    const newText = prompt('Edit text:', element.textContent);
    if (newText === null) return;

    const request: UpdateElementRequest = {
      textContent: newText
    };

    const updated = await this.elementService.updateElement(this.boardId, element.id, request).toPromise();
    if (updated) {
      const index = this.elements.findIndex(e => e.id === element.id);
      if (index !== -1) {
        this.elements[index] = updated;
      }
      await this.realtimeService.notifyElementUpdated(this.boardId, updated);
      this.render();
    }
  }

  // Sticky note creation
  private async createStickyNote(point: Point): Promise<void> {
    const text = prompt('Enter sticky note text:');
    if (text === null) return;

    const color = prompt('Enter color (yellow, pink, blue, green, orange) or hex code:', 'yellow');
    let backgroundColor = '#FFEB3B'; // Default yellow

    // Map color names to hex codes
    const colorMap: { [key: string]: string } = {
      'yellow': '#FFEB3B',
      'pink': '#FF4081',
      'blue': '#2196F3',
      'green': '#4CAF50',
      'orange': '#FF9800'
    };

    if (color) {
      backgroundColor = colorMap[color.toLowerCase()] || (color.startsWith('#') ? color : '#FFEB3B');
    }

    const width = Math.abs(point.x - this.startPoint.x);
    const height = Math.abs(point.y - this.startPoint.y);
    const x = Math.min(this.startPoint.x, point.x);
    const y = Math.min(this.startPoint.y, point.y);

    const request: CreateElementRequest = {
      type: 'StickyNote',
      x,
      y,
      width: Math.max(width, 150),
      height: Math.max(height, 150),
      textContent: text,
      textColor: '#000000',
      fontSize: 14,
      fontFamily: 'Arial',
      backgroundColor,
      borderColor: backgroundColor,
      borderWidth: 2
    };

    const element = await this.elementService.createElement(this.boardId, request).toPromise();
    if (element) {
      this.elements.push(element);
      await this.realtimeService.notifyElementCreated(this.boardId, element);
      this.render();
    }
  }

  // Frame creation
  private async createFrame(point: Point): Promise<void> {
    const name = prompt('Enter frame name:', 'Frame');
    if (name === null) return;

    const width = Math.abs(point.x - this.startPoint.x);
    const height = Math.abs(point.y - this.startPoint.y);
    const x = Math.min(this.startPoint.x, point.x);
    const y = Math.min(this.startPoint.y, point.y);

    const request: CreateElementRequest = {
      type: 'Rectangle',
      x,
      y,
      width: Math.max(width, 200),
      height: Math.max(height, 150),
      rotation: 0,
      backgroundColor: 'rgba(33, 150, 243, 0.05)',
      borderColor: '#2196F3',
      borderWidth: 3,
      textColor: '#2196F3',
      fontFamily: 'Arial',
      fontSize: 18,
      fontWeight: 'bold',
      fontStyle: 'normal',
      textContent: name,
      connectorStyle: 'solid'
    };

    const element = await this.elementService.createElement(this.boardId, request).toPromise();
    if (element) {
      this.elements.push(element);
      await this.realtimeService.notifyElementCreated(this.boardId, element);
      this.render();
    }
  }

  // Connector handling
  private async handleConnectorClick(point: Point): Promise<void> {
    const clickedElement = this.getElementAtPoint(point);

    if (!this.connectorStartElement) {
      // First click - select start element
      if (clickedElement) {
        this.connectorStartElement = clickedElement;
        this.selectedElements = [clickedElement];
        this.render();
      }
    } else {
      // Second click - create connector
      if (clickedElement && clickedElement.id !== this.connectorStartElement.id) {
        await this.createConnector(this.connectorStartElement, clickedElement);
      }
      this.connectorStartElement = undefined;
      this.selectedElements = [];
      this.render();
    }
  }

  private async createConnector(fromElement: BoardElement, toElement: BoardElement): Promise<void> {
    const request: CreateElementRequest = {
      type: 'Connector',
      x: fromElement.x + fromElement.width / 2,
      y: fromElement.y + fromElement.height / 2,
      width: (toElement.x + toElement.width / 2) - (fromElement.x + fromElement.width / 2),
      height: (toElement.y + toElement.height / 2) - (fromElement.y + fromElement.height / 2),
      connectedFromElementId: fromElement.id,
      connectedToElementId: toElement.id,
      connectorStyle: 'straight',
      borderColor: '#000000',
      borderWidth: 2,
      backgroundColor: 'transparent'
    };

    const element = await this.elementService.createElement(this.boardId, request).toPromise();
    if (element) {
      this.elements.push(element);
      await this.realtimeService.notifyElementCreated(this.boardId, element);
      this.render();
    }
  }

  // Helper methods
  private getCanvasPoint(event: MouseEvent): Point {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left - this.panX) / this.zoom,
      y: (event.clientY - rect.top - this.panY) / this.zoom
    };
  }

  private getElementAtPoint(point: Point): BoardElement | undefined {
    // Find elements in reverse order (top to bottom)
    for (let i = this.elements.length - 1; i >= 0; i--) {
      const element = this.elements[i];
      if (this.isPointInElement(point, element)) {
        return element;
      }
    }
    return undefined;
  }

  private isPointInElement(point: Point, element: BoardElement): boolean {
    // Special handling for circles - check distance from center
    if (element.type === 'Circle') {
      const centerX = element.x + element.width / 2;
      const centerY = element.y + element.height / 2;
      const radius = Math.min(Math.abs(element.width), Math.abs(element.height)) / 2;
      const distance = Math.sqrt(
        Math.pow(point.x - centerX, 2) + Math.pow(point.y - centerY, 2)
      );
      return distance <= radius;
    }

    // Special handling for lines - check distance to line segment
    if (element.type === 'Line' || element.type === 'Connector') {
      const x1 = element.x;
      const y1 = element.y;
      const x2 = element.x + element.width;
      const y2 = element.y + element.height;

      // Calculate distance from point to line segment
      const lineLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      if (lineLength === 0) return false;

      const distance = Math.abs((y2 - y1) * point.x - (x2 - x1) * point.y + x2 * y1 - y2 * x1) / lineLength;

      // Check if point is within line segment bounds (with tolerance)
      const minX = Math.min(x1, x2) - 5;
      const maxX = Math.max(x1, x2) + 5;
      const minY = Math.min(y1, y2) - 5;
      const maxY = Math.max(y1, y2) + 5;

      return distance <= 5 &&
             point.x >= minX && point.x <= maxX &&
             point.y >= minY && point.y <= maxY;
    }

    // For all other elements, use rectangular bounds (handle negative dimensions)
    const minX = Math.min(element.x, element.x + element.width);
    const maxX = Math.max(element.x, element.x + element.width);
    const minY = Math.min(element.y, element.y + element.height);
    const maxY = Math.max(element.y, element.y + element.height);

    return point.x >= minX && point.x <= maxX &&
           point.y >= minY && point.y <= maxY;
  }

  private toggleSelection(element: BoardElement): void {
    const index = this.selectedElements.indexOf(element);
    if (index > -1) {
      this.selectedElements.splice(index, 1);
    } else {
      this.selectedElements.push(element);
    }
  }

  // Snapping and alignment methods
  private calculateSnapping(element: BoardElement, dx: number, dy: number): { dx: number; dy: number; guides: Array<{ type: 'vertical' | 'horizontal'; position: number }> } {
    const guides: Array<{ type: 'vertical' | 'horizontal'; position: number }> = [];

    // Calculate new position
    const newX = element.x + dx;
    const newY = element.y + dy;
    const newCenterX = newX + element.width / 2;
    const newCenterY = newY + element.height / 2;
    const newRight = newX + element.width;
    const newBottom = newY + element.height;

    let snappedDx = dx;
    let snappedDy = dy;
    let minXDist = Infinity;
    let minYDist = Infinity;

    // Check alignment with other elements
    for (const other of this.elements) {
      if (this.selectedElements.includes(other)) continue;

      const otherCenterX = other.x + other.width / 2;
      const otherCenterY = other.y + other.height / 2;
      const otherRight = other.x + other.width;
      const otherBottom = other.y + other.height;

      // Vertical alignment checks
      // Left edges
      const leftDist = Math.abs(newX - other.x);
      if (leftDist < this.snapThreshold && leftDist < minXDist) {
        snappedDx = other.x - element.x;
        minXDist = leftDist;
        guides.push({ type: 'vertical', position: other.x });
      }

      // Right edges
      const rightDist = Math.abs(newRight - otherRight);
      if (rightDist < this.snapThreshold && rightDist < minXDist) {
        snappedDx = otherRight - element.width - element.x;
        minXDist = rightDist;
        guides.push({ type: 'vertical', position: otherRight });
      }

      // Center vertical alignment
      const centerXDist = Math.abs(newCenterX - otherCenterX);
      if (centerXDist < this.snapThreshold && centerXDist < minXDist) {
        snappedDx = otherCenterX - element.width / 2 - element.x;
        minXDist = centerXDist;
        guides.push({ type: 'vertical', position: otherCenterX });
      }

      // Horizontal alignment checks
      // Top edges
      const topDist = Math.abs(newY - other.y);
      if (topDist < this.snapThreshold && topDist < minYDist) {
        snappedDy = other.y - element.y;
        minYDist = topDist;
        guides.push({ type: 'horizontal', position: other.y });
      }

      // Bottom edges
      const bottomDist = Math.abs(newBottom - otherBottom);
      if (bottomDist < this.snapThreshold && bottomDist < minYDist) {
        snappedDy = otherBottom - element.height - element.y;
        minYDist = bottomDist;
        guides.push({ type: 'horizontal', position: otherBottom });
      }

      // Center horizontal alignment
      const centerYDist = Math.abs(newCenterY - otherCenterY);
      if (centerYDist < this.snapThreshold && centerYDist < minYDist) {
        snappedDy = otherCenterY - element.height / 2 - element.y;
        minYDist = centerYDist;
        guides.push({ type: 'horizontal', position: otherCenterY });
      }
    }

    return { dx: snappedDx, dy: snappedDy, guides };
  }

  toggleSnapping(): void {
    this.snapEnabled = !this.snapEnabled;
  }

  toggleMinimap(): void {
    this.showMinimap = !this.showMinimap;
    this.render();
  }

  // Connection handle methods
  private getConnectionHandles(element: BoardElement): Point[] {
    // Don't show handles for lines, connectors, or drawings
    if (element.type === 'Line' || element.type === 'Connector' || element.type === 'Drawing') {
      return [];
    }

    const handles: Point[] = [];

    if (element.type === 'Circle') {
      const centerX = element.x + element.width / 2;
      const centerY = element.y + element.height / 2;
      const radius = Math.min(Math.abs(element.width), Math.abs(element.height)) / 2;

      // Top, right, bottom, left
      handles.push({ x: centerX, y: centerY - radius }); // Top
      handles.push({ x: centerX + radius, y: centerY }); // Right
      handles.push({ x: centerX, y: centerY + radius }); // Bottom
      handles.push({ x: centerX - radius, y: centerY }); // Left
    } else {
      // For rectangles, sticky notes, text
      const minX = Math.min(element.x, element.x + element.width);
      const maxX = Math.max(element.x, element.x + element.width);
      const minY = Math.min(element.y, element.y + element.height);
      const maxY = Math.max(element.y, element.y + element.height);
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      // Top, right, bottom, left
      handles.push({ x: centerX, y: minY }); // Top
      handles.push({ x: maxX, y: centerY }); // Right
      handles.push({ x: centerX, y: maxY }); // Bottom
      handles.push({ x: minX, y: centerY }); // Left
    }

    return handles;
  }

  private getHandleAtPoint(point: Point): { element: BoardElement; position: Point } | undefined {
    const handleRadius = 6; // Clickable radius

    // Check all selected and hovered elements for handle clicks
    const elementsToCheck = [...this.selectedElements];
    if (this.hoveredElement && !elementsToCheck.includes(this.hoveredElement)) {
      elementsToCheck.push(this.hoveredElement);
    }

    for (const element of elementsToCheck) {
      const handles = this.getConnectionHandles(element);
      for (const handle of handles) {
        const distance = Math.sqrt(
          Math.pow(point.x - handle.x, 2) + Math.pow(point.y - handle.y, 2)
        );
        if (distance <= handleRadius) {
          return { element, position: handle };
        }
      }
    }

    return undefined;
  }

  private async createConnectorFromHandles(fromElement: BoardElement, toElement: BoardElement): Promise<void> {
    // Find the closest handles between the two elements
    const fromHandles = this.getConnectionHandles(fromElement);
    const toHandles = this.getConnectionHandles(toElement);

    if (fromHandles.length === 0 || toHandles.length === 0) return;

    // Find the pair of handles that are closest to each other
    let minDistance = Infinity;
    let bestFromHandle = fromHandles[0];
    let bestToHandle = toHandles[0];

    for (const fromHandle of fromHandles) {
      for (const toHandle of toHandles) {
        const distance = Math.sqrt(
          Math.pow(toHandle.x - fromHandle.x, 2) + Math.pow(toHandle.y - fromHandle.y, 2)
        );
        if (distance < minDistance) {
          minDistance = distance;
          bestFromHandle = fromHandle;
          bestToHandle = toHandle;
        }
      }
    }

    const request: CreateElementRequest = {
      type: 'Connector',
      x: bestFromHandle.x,
      y: bestFromHandle.y,
      width: bestToHandle.x - bestFromHandle.x,
      height: bestToHandle.y - bestFromHandle.y,
      connectedFromElementId: fromElement.id,
      connectedToElementId: toElement.id,
      connectorStyle: 'straight',
      borderColor: '#2196F3',
      borderWidth: 3,
      backgroundColor: 'transparent'
    };

    const element = await this.elementService.createElement(this.boardId, request).toPromise();
    if (element) {
      this.elements.push(element);
      await this.realtimeService.notifyElementCreated(this.boardId, element);
      this.saveHistoryState();
      this.render();
    }
  }

  private async createNewElement(endPoint: Point): Promise<void> {
    // For lines, preserve direction by using signed width/height
    let width = endPoint.x - this.startPoint.x;
    let height = endPoint.y - this.startPoint.y;
    let x = this.startPoint.x;
    let y = this.startPoint.y;

    // For non-line shapes, normalize to top-left corner with positive dimensions
    if (this.currentTool !== 'line' && this.currentTool !== 'connector') {
      width = Math.abs(width);
      height = Math.abs(height);
      x = Math.min(this.startPoint.x, endPoint.x);
      y = Math.min(this.startPoint.y, endPoint.y);
    }

    let request: CreateElementRequest = {
      type: this.getElementType(),
      x,
      y,
      width: this.currentTool === 'line' ? width : Math.max(width, 10),
      height: this.currentTool === 'line' ? height : Math.max(height, 10),
      rotation: 0,
      backgroundColor: '#FFFFFF',
      borderColor: '#000000',
      borderWidth: 2,
      textColor: '#000000',
      fontFamily: 'Arial',
      fontSize: 14,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textContent: '',
      connectorStyle: 'solid'
    };

    if (this.currentTool === 'pen' && this.drawingPath.length > 0) {
      request.pathData = this.pathToSVG(this.drawingPath);
    }

    try {
      const element = await this.elementService.createElement(this.boardId, request).toPromise();
      if (element) {
        this.elements.push(element);
        await this.realtimeService.notifyElementCreated(this.boardId, element);
        this.render();
      }
    } catch (error) {
      console.error('Error creating element:', error);
      // Show error to user if needed
    }
  }

  private async updateSelectedElements(): Promise<void> {
    for (const element of this.selectedElements) {
      const request: UpdateElementRequest = {
        x: element.x,
        y: element.y
      };

      const updated = await this.elementService.updateElement(this.boardId, element.id, request).toPromise();
      if (updated) {
        await this.realtimeService.notifyElementUpdated(this.boardId, updated);
      }
    }
  }

  private getElementType(): string {
    switch (this.currentTool) {
      case 'rectangle': return 'Rectangle';
      case 'circle': return 'Circle';
      case 'triangle': return 'Triangle';
      case 'text': return 'Text';
      case 'sticky': return 'StickyNote';
      case 'pen': return 'Drawing';
      case 'line': return 'Line';
      case 'connector': return 'Connector';
      case 'frame': return 'Rectangle'; // Frames are stored as rectangles with special styling
      default: return 'Rectangle';
    }
  }

  private pathToSVG(points: Point[]): string {
    if (points.length === 0) return '';
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    return path;
  }

  // Rendering
  private render(): void {
    this.ctx.clearRect(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
    this.ctx.save();

    // Apply zoom and pan
    this.ctx.translate(this.panX, this.panY);
    this.ctx.scale(this.zoom, this.zoom);

    // Draw grid
    this.drawGrid();

    // Draw elements
    this.elements.forEach(element => {
      const isSelected = this.selectedElements.includes(element);
      const isHovered = this.hoveredElement === element;
      this.drawElement(element, isSelected);

      // Draw connection handles for selected or hovered elements
      if ((isSelected || isHovered) && this.currentTool === 'select') {
        this.drawConnectionHandles(element);
      }
    });

    // Draw in-progress drawing path (real-time feedback)
    if (this.isDrawing && this.currentTool === 'pen' && this.drawingPath.length > 1) {
      this.ctx.beginPath();
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 2;
      this.ctx.moveTo(this.drawingPath[0].x, this.drawingPath[0].y);
      for (let i = 1; i < this.drawingPath.length; i++) {
        this.ctx.lineTo(this.drawingPath[i].x, this.drawingPath[i].y);
      }
      this.ctx.stroke();
    }

    // Draw alignment guides
    if (this.alignmentGuides.length > 0) {
      this.drawAlignmentGuides();
    }

    this.ctx.restore();

    // Draw mini-map (in screen coordinates, not world coordinates)
    if (this.showMinimap) {
      this.drawMinimap();
    }
  }

  private drawGrid(): void {
    const gridSize = 20;
    const canvas = this.canvasRef.nativeElement;

    // Calculate visible area in world coordinates
    const startX = -this.panX / this.zoom;
    const startY = -this.panY / this.zoom;
    const width = canvas.width / this.zoom;
    const height = canvas.height / this.zoom;

    // Calculate grid start positions (snap to grid)
    const gridStartX = Math.floor(startX / gridSize) * gridSize;
    const gridStartY = Math.floor(startY / gridSize) * gridSize;

    this.ctx.strokeStyle = '#E0E0E0';
    this.ctx.lineWidth = 0.5;

    // Draw vertical lines
    for (let x = gridStartX; x < startX + width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, startY);
      this.ctx.lineTo(x, startY + height);
      this.ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = gridStartY; y < startY + height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(startX, y);
      this.ctx.lineTo(startX + width, y);
      this.ctx.stroke();
    }
  }

  private drawElement(element: BoardElement, isSelected: boolean): void {
    this.ctx.save();

    switch (element.type) {
      case 'Rectangle':
      case 'StickyNote':
        this.drawRectangle(element);
        break;
      case 'Circle':
        this.drawCircle(element);
        break;
      case 'Triangle':
        this.drawTriangle(element);
        break;
      case 'Text':
        this.drawText(element);
        break;
      case 'Drawing':
        this.drawPath(element);
        break;
      case 'Line':
        this.drawLine(element);
        break;
      case 'Connector':
        this.drawConnector(element);
        break;
    }

    if (isSelected) {
      this.drawSelectionBox(element);
    }

    this.ctx.restore();
  }

  private drawRectangle(element: BoardElement): void {
    const isFrame = element.textContent === 'Frame' && element.fontSize === 18 && element.fontWeight === 'bold';

    this.ctx.fillStyle = element.backgroundColor;
    this.ctx.strokeStyle = element.borderColor;
    this.ctx.lineWidth = element.borderWidth;
    this.ctx.fillRect(element.x, element.y, element.width, element.height);
    this.ctx.strokeRect(element.x, element.y, element.width, element.height);

    if (element.textContent) {
      if (isFrame) {
        // Draw frame title bar
        const titleBarHeight = 30;
        this.ctx.fillStyle = 'rgba(33, 150, 243, 0.1)';
        this.ctx.fillRect(element.x, element.y, element.width, titleBarHeight);

        // Draw title text
        this.ctx.fillStyle = element.textColor;
        this.ctx.font = `${element.fontWeight} ${element.fontSize}px ${element.fontFamily}`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(
          element.textContent,
          element.x + 10,
          element.y + titleBarHeight / 2
        );
      } else {
        // Regular rectangle/sticky note text (centered)
        this.ctx.fillStyle = element.textColor;
        this.ctx.font = `${element.fontSize}px ${element.fontFamily}`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(
          element.textContent,
          element.x + element.width / 2,
          element.y + element.height / 2
        );
      }
    }
  }

  private drawCircle(element: BoardElement): void {
    const centerX = element.x + element.width / 2;
    const centerY = element.y + element.height / 2;
    const radius = Math.min(element.width, element.height) / 2;

    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    this.ctx.fillStyle = element.backgroundColor;
    this.ctx.fill();
    this.ctx.strokeStyle = element.borderColor;
    this.ctx.lineWidth = element.borderWidth;
    this.ctx.stroke();
  }

  private drawTriangle(element: BoardElement): void {
    const centerX = element.x + element.width / 2;

    this.ctx.beginPath();
    this.ctx.moveTo(centerX, element.y);
    this.ctx.lineTo(element.x, element.y + element.height);
    this.ctx.lineTo(element.x + element.width, element.y + element.height);
    this.ctx.closePath();

    this.ctx.fillStyle = element.backgroundColor;
    this.ctx.fill();
    this.ctx.strokeStyle = element.borderColor;
    this.ctx.lineWidth = element.borderWidth;
    this.ctx.stroke();

    // Draw text if present
    if (element.textContent) {
      this.ctx.fillStyle = element.textColor;
      this.ctx.font = `${element.fontSize}px ${element.fontFamily}`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(
        element.textContent,
        centerX,
        element.y + (2 * element.height) / 3
      );
    }
  }

  private drawText(element: BoardElement): void {
    this.ctx.fillStyle = element.textColor;
    this.ctx.font = `${element.fontSize}px ${element.fontFamily}`;
    this.ctx.fillText(element.textContent, element.x, element.y);
  }

  private drawPath(element: BoardElement): void {
    if (!element.pathData) return;

    const path = new Path2D(element.pathData);
    this.ctx.strokeStyle = element.borderColor;
    this.ctx.lineWidth = element.borderWidth;
    this.ctx.stroke(path);
  }

  private drawLine(element: BoardElement): void {
    const startX = element.x;
    const startY = element.y;
    const endX = element.x + element.width;
    const endY = element.y + element.height;

    this.ctx.save();
    const lineColor = element.borderColor || '#000000';
    const lineWidth = element.borderWidth || 2;

    // Draw the line
    this.ctx.strokeStyle = lineColor;
    this.ctx.lineWidth = lineWidth;
    this.ctx.lineCap = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();

    // Draw arrow head at the end
    const arrowSize = 10;
    const angle = Math.atan2(endY - startY, endX - startX);

    this.ctx.fillStyle = lineColor;
    this.ctx.beginPath();
    this.ctx.moveTo(endX, endY);
    this.ctx.lineTo(
      endX - arrowSize * Math.cos(angle - Math.PI / 6),
      endY - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    this.ctx.lineTo(
      endX - arrowSize * Math.cos(angle + Math.PI / 6),
      endY - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.restore();
  }

  private drawConnector(element: BoardElement): void {
    // Get connected elements to calculate dynamic positions
    let startX = element.x;
    let startY = element.y;
    let endX = element.x + element.width;
    let endY = element.y + element.height;

    // If connected to specific elements, update positions
    if (element.connectedFromElementId && element.connectedToElementId) {
      const fromElement = this.elements.find(e => e.id === element.connectedFromElementId);
      const toElement = this.elements.find(e => e.id === element.connectedToElementId);

      if (fromElement && toElement) {
        startX = fromElement.x + fromElement.width / 2;
        startY = fromElement.y + fromElement.height / 2;
        endX = toElement.x + toElement.width / 2;
        endY = toElement.y + toElement.height / 2;
      }
    }

    // Draw the connector line with more visible styling
    this.ctx.save();
    const lineColor = element.borderColor || '#2196F3';
    const lineWidth = element.borderWidth || 3;

    this.ctx.strokeStyle = lineColor;
    this.ctx.lineWidth = lineWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.ctx.beginPath();

    if (element.connectorStyle === 'curved') {
      // Bezier curve
      const controlX1 = startX + (endX - startX) / 3;
      const controlY1 = startY;
      const controlX2 = startX + (2 * (endX - startX)) / 3;
      const controlY2 = endY;
      this.ctx.moveTo(startX, startY);
      this.ctx.bezierCurveTo(controlX1, controlY1, controlX2, controlY2, endX, endY);
    } else if (element.connectorStyle === 'elbow') {
      // Right-angle connector
      const midX = (startX + endX) / 2;
      this.ctx.moveTo(startX, startY);
      this.ctx.lineTo(midX, startY);
      this.ctx.lineTo(midX, endY);
      this.ctx.lineTo(endX, endY);
    } else {
      // Straight line (default)
      this.ctx.moveTo(startX, startY);
      this.ctx.lineTo(endX, endY);
    }

    this.ctx.stroke();

    // Draw filled arrow head at the end
    const arrowSize = 12;
    const angle = Math.atan2(endY - startY, endX - startX);

    this.ctx.fillStyle = lineColor;
    this.ctx.beginPath();
    this.ctx.moveTo(endX, endY);
    this.ctx.lineTo(
      endX - arrowSize * Math.cos(angle - Math.PI / 6),
      endY - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    this.ctx.lineTo(
      endX - arrowSize * Math.cos(angle + Math.PI / 6),
      endY - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    this.ctx.closePath();
    this.ctx.fill();

    // Draw text label if present
    if (element.textContent) {
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;

      // Draw background for text
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      this.ctx.font = `${element.fontSize || 12}px ${element.fontFamily || 'Arial'}`;
      const textMetrics = this.ctx.measureText(element.textContent);
      const textWidth = textMetrics.width;
      const textHeight = element.fontSize || 12;
      const padding = 4;

      this.ctx.fillRect(
        midX - textWidth / 2 - padding,
        midY - textHeight / 2 - padding,
        textWidth + padding * 2,
        textHeight + padding * 2
      );

      // Draw text
      this.ctx.fillStyle = element.textColor || '#000000';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(element.textContent, midX, midY);
    }

    this.ctx.restore();
  }

  private drawSelectionBox(element: BoardElement): void {
    this.ctx.strokeStyle = '#2196F3';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);

    // Handle negative dimensions for proper selection box
    const minX = Math.min(element.x, element.x + element.width);
    const minY = Math.min(element.y, element.y + element.height);
    const width = Math.abs(element.width);
    const height = Math.abs(element.height);

    this.ctx.strokeRect(minX - 2, minY - 2, width + 4, height + 4);
    this.ctx.setLineDash([]);
  }

  private drawConnectionHandles(element: BoardElement): void {
    const handles = this.getConnectionHandles(element);
    if (handles.length === 0) return;

    const handleSize = 8; // Visual size of handle
    const isSelected = this.selectedElements.includes(element);

    this.ctx.save();

    handles.forEach(handle => {
      // Draw handle background (white circle)
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.beginPath();
      this.ctx.arc(handle.x, handle.y, handleSize / 2, 0, 2 * Math.PI);
      this.ctx.fill();

      // Draw handle border
      this.ctx.strokeStyle = isSelected ? '#2196F3' : '#757575';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(handle.x, handle.y, handleSize / 2, 0, 2 * Math.PI);
      this.ctx.stroke();
    });

    this.ctx.restore();
  }

  private drawAlignmentGuides(): void {
    this.ctx.save();

    this.ctx.strokeStyle = '#FF4081';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([5, 5]);

    const canvas = this.canvasRef.nativeElement;
    const startX = -this.panX / this.zoom;
    const startY = -this.panY / this.zoom;
    const width = canvas.width / this.zoom;
    const height = canvas.height / this.zoom;

    for (const guide of this.alignmentGuides) {
      this.ctx.beginPath();
      if (guide.type === 'vertical') {
        this.ctx.moveTo(guide.position, startY);
        this.ctx.lineTo(guide.position, startY + height);
      } else {
        this.ctx.moveTo(startX, guide.position);
        this.ctx.lineTo(startX + width, guide.position);
      }
      this.ctx.stroke();
    }

    this.ctx.setLineDash([]);
    this.ctx.restore();
  }

  private drawMinimap(): void {
    if (this.elements.length === 0) return;

    const canvas = this.canvasRef.nativeElement;
    this.ctx.save();

    // Calculate bounds of all elements
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const element of this.elements) {
      const elMinX = Math.min(element.x, element.x + element.width);
      const elMaxX = Math.max(element.x, element.x + element.width);
      const elMinY = Math.min(element.y, element.y + element.height);
      const elMaxY = Math.max(element.y, element.y + element.height);

      minX = Math.min(minX, elMinX);
      minY = Math.min(minY, elMinY);
      maxX = Math.max(maxX, elMaxX);
      maxY = Math.max(maxY, elMaxY);
    }

    // Add padding
    const padding = 50;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    // Calculate minimap scale
    const minimapScale = Math.min(
      this.minimapSize / contentWidth,
      this.minimapSize / contentHeight
    );

    const minimapWidth = contentWidth * minimapScale;
    const minimapHeight = contentHeight * minimapScale;

    // Position minimap in bottom-right corner
    const minimapX = canvas.width - minimapWidth - this.minimapPadding;
    const minimapY = canvas.height - minimapHeight - this.minimapPadding;

    // Draw minimap background
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.strokeStyle = '#CCCCCC';
    this.ctx.lineWidth = 2;
    this.ctx.fillRect(minimapX, minimapY, minimapWidth, minimapHeight);
    this.ctx.strokeRect(minimapX, minimapY, minimapWidth, minimapHeight);

    // Draw elements in minimap
    for (const element of this.elements) {
      const x = minimapX + (element.x - minX) * minimapScale;
      const y = minimapY + (element.y - minY) * minimapScale;
      const w = element.width * minimapScale;
      const h = element.height * minimapScale;

      this.ctx.fillStyle = element.backgroundColor || '#CCCCCC';
      this.ctx.fillRect(x, y, w, h);
    }

    // Draw viewport rectangle
    const viewportX = minimapX + (-this.panX / this.zoom - minX) * minimapScale;
    const viewportY = minimapY + (-this.panY / this.zoom - minY) * minimapScale;
    const viewportW = (canvas.width / this.zoom) * minimapScale;
    const viewportH = (canvas.height / this.zoom) * minimapScale;

    this.ctx.strokeStyle = '#2196F3';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(viewportX, viewportY, viewportW, viewportH);

    this.ctx.restore();
  }

  private renderPreview(endPoint: Point): void {
    this.render();
    this.ctx.save();
    this.ctx.translate(this.panX, this.panY);
    this.ctx.scale(this.zoom, this.zoom);

    const width = endPoint.x - this.startPoint.x;
    const height = endPoint.y - this.startPoint.y;

    this.ctx.strokeStyle = '#2196F3';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);

    if (this.currentTool === 'circle') {
      const radius = Math.sqrt(width * width + height * height);
      this.ctx.beginPath();
      this.ctx.arc(this.startPoint.x, this.startPoint.y, radius, 0, 2 * Math.PI);
      this.ctx.stroke();
    } else if (this.currentTool === 'line' || this.currentTool === 'connector') {
      // Draw line preview
      this.ctx.beginPath();
      this.ctx.moveTo(this.startPoint.x, this.startPoint.y);
      this.ctx.lineTo(endPoint.x, endPoint.y);
      this.ctx.stroke();
    } else if (this.currentTool === 'triangle') {
      // Draw triangle preview
      const centerX = this.startPoint.x + width / 2;
      this.ctx.beginPath();
      this.ctx.moveTo(centerX, this.startPoint.y);
      this.ctx.lineTo(this.startPoint.x, this.startPoint.y + height);
      this.ctx.lineTo(this.startPoint.x + width, this.startPoint.y + height);
      this.ctx.closePath();
      this.ctx.stroke();
    } else {
      this.ctx.strokeRect(this.startPoint.x, this.startPoint.y, width, height);
    }

    this.ctx.restore();
  }

  // History management
  private saveHistoryState(): void {
    const state: HistoryState = {
      elements: JSON.parse(JSON.stringify(this.elements)),
      timestamp: Date.now()
    };

    // Remove future history if we're not at the end
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    this.history.push(state);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
  }

  private restoreHistoryState(state: HistoryState): void {
    this.elements = JSON.parse(JSON.stringify(state.elements));
    this.render();
  }
}
