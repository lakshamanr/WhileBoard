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
  currentTool: 'select' | 'rectangle' | 'circle' | 'text' | 'sticky' | 'pen' | 'line' | 'connector' = 'select';

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
  private connectorStartElement?: BoardElement;

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
      const clickedElement = this.getElementAtPoint(point);
      if (clickedElement) {
        // Check for double-click on text elements
        if (event.detail === 2 && clickedElement.type === 'Text') {
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

    if (this.isDragging && this.selectedElements.length > 0) {
      const dx = point.x - this.startPoint.x;
      const dy = point.y - this.startPoint.y;

      this.selectedElements.forEach(element => {
        element.x += dx;
        element.y += dy;
      });

      this.startPoint = point;
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

    // Send cursor position for real-time collaboration
    this.realtimeService.sendCursorPosition(this.boardId, point.x, point.y);
  }

  async onMouseUp(event: MouseEvent): Promise<void> {
    const point = this.getCanvasPoint(event);

    if (this.isPanning) {
      this.isPanning = false;
      return;
    }

    if (this.isDragging) {
      this.isDragging = false;
      // Update elements on server
      await this.updateSelectedElements();
      this.saveHistoryState();
      return;
    }

    if (this.isDrawing) {
      this.isDrawing = false;

      // Special handling for text tool
      if (this.currentTool === 'text') {
        await this.createTextElement(point);
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
    this.zoom *= delta;
    this.zoom = Math.max(0.1, Math.min(5, this.zoom));
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
    this.zoom = Math.min(5, this.zoom);
    this.render();
  }

  zoomOut(): void {
    this.zoom *= 0.8;
    this.zoom = Math.max(0.1, this.zoom);
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
    return point.x >= element.x &&
           point.x <= element.x + element.width &&
           point.y >= element.y &&
           point.y <= element.y + element.height;
  }

  private toggleSelection(element: BoardElement): void {
    const index = this.selectedElements.indexOf(element);
    if (index > -1) {
      this.selectedElements.splice(index, 1);
    } else {
      this.selectedElements.push(element);
    }
  }

  private async createNewElement(endPoint: Point): Promise<void> {
    const width = Math.abs(endPoint.x - this.startPoint.x);
    const height = Math.abs(endPoint.y - this.startPoint.y);
    const x = Math.min(this.startPoint.x, endPoint.x);
    const y = Math.min(this.startPoint.y, endPoint.y);

    let request: CreateElementRequest = {
      type: this.getElementType(),
      x,
      y,
      width: Math.max(width, 10),
      height: Math.max(height, 10),
      rotation: 0,
      backgroundColor: this.currentTool === 'sticky' ? '#FFEB3B' : '#FFFFFF',
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
      case 'text': return 'Text';
      case 'sticky': return 'StickyNote';
      case 'pen': return 'Drawing';
      case 'line': return 'Line';
      case 'connector': return 'Connector';
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
      this.drawElement(element, this.selectedElements.includes(element));
    });

    this.ctx.restore();
  }

  private drawGrid(): void {
    const gridSize = 20;
    const canvas = this.canvasRef.nativeElement;
    const width = canvas.width / this.zoom;
    const height = canvas.height / this.zoom;

    this.ctx.strokeStyle = '#E0E0E0';
    this.ctx.lineWidth = 0.5;

    for (let x = 0; x < width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
      this.ctx.stroke();
    }

    for (let y = 0; y < height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
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
    this.ctx.fillStyle = element.backgroundColor;
    this.ctx.strokeStyle = element.borderColor;
    this.ctx.lineWidth = element.borderWidth;
    this.ctx.fillRect(element.x, element.y, element.width, element.height);
    this.ctx.strokeRect(element.x, element.y, element.width, element.height);

    if (element.textContent) {
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
    this.ctx.beginPath();
    this.ctx.moveTo(element.x, element.y);
    this.ctx.lineTo(element.x + element.width, element.y + element.height);
    this.ctx.strokeStyle = element.borderColor;
    this.ctx.lineWidth = element.borderWidth;
    this.ctx.stroke();
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

    // Draw the connector line
    this.ctx.beginPath();
    this.ctx.strokeStyle = element.borderColor;
    this.ctx.lineWidth = element.borderWidth;

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

    // Draw arrow head at the end
    const arrowSize = 10;
    const angle = Math.atan2(endY - startY, endX - startX);

    this.ctx.beginPath();
    this.ctx.moveTo(endX, endY);
    this.ctx.lineTo(
      endX - arrowSize * Math.cos(angle - Math.PI / 6),
      endY - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    this.ctx.moveTo(endX, endY);
    this.ctx.lineTo(
      endX - arrowSize * Math.cos(angle + Math.PI / 6),
      endY - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    this.ctx.stroke();
  }

  private drawSelectionBox(element: BoardElement): void {
    this.ctx.strokeStyle = '#2196F3';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.strokeRect(element.x - 2, element.y - 2, element.width + 4, element.height + 4);
    this.ctx.setLineDash([]);
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
