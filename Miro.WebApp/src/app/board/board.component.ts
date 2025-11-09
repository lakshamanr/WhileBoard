import { Component, OnInit, OnDestroy } from '@angular/core';
import { fabric } from 'fabric';
import { SignalrService } from '../shared/services/signalr.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss']
})
export class BoardComponent implements OnInit, OnDestroy {
  private canvas!: fabric.Canvas;
  private boardId!: string;

  constructor(
    private signalrService: SignalrService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.boardId = params['id'];
      this.signalrService.startConnection(this.boardId);
      this.signalrService.newElementReceived.subscribe(element => {
        const newElement = new fabric.Object(element);
        this.canvas.add(newElement);
      });
      this.signalrService.updatedElementReceived.subscribe(element => {
        // Find and update the element on the canvas
      });
      this.signalrService.deletedElementReceived.subscribe(elementId => {
        // Find and delete the element from the canvas
      });
      this.signalrService.undoReceived.subscribe(() => {
        // Implement undo functionality
      });
      this.signalrService.redoReceived.subscribe(() => {
        // Implement redo functionality
      });
    });

    this.canvas = new fabric.Canvas('canvas', {
      isDrawingMode: false,
      selection: true
    });

    this.canvas.on('object:added', this.onObjectAdded.bind(this));
    this.canvas.on('object:modified', this.onObjectModified.bind(this));
    this.canvas.on('object:removed', this.onObjectRemoved.bind(this));
    this.canvas.on('mouse:wheel', this.onMouseWheel.bind(this));
    this.canvas.on('mouse:down', this.onMouseDown.bind(this));
    this.canvas.on('mouse:move', this.onMouseMove.bind(this));
    this.canvas.on('mouse:up', this.onMouseUp.bind(this));
  }

  ngOnDestroy(): void {
    this.canvas.off('object:added');
    this.canvas.off('mouse:wheel');
    this.canvas.off('mouse:down');
    this.canvas.off('mouse:move');
    this.canvas.off('mouse:up');
  }

  private onObjectAdded(opt: fabric.IEvent): void {
    if (opt.target) {
      this.signalrService.createElement(opt.target.toObject(), this.boardId);
    }
  }

  private onObjectModified(opt: fabric.IEvent): void {
    if (opt.target) {
      this.signalrService.updateElement(opt.target.toObject(), this.boardId);
    }
  }

  private onObjectRemoved(opt: fabric.IEvent): void {
    if (opt.target) {
      this.signalrService.deleteElement((opt.target as any).id, this.boardId);
    }
  }

  private onMouseWheel(opt: fabric.IEvent<WheelEvent>): void {
    const delta = opt.e.deltaY;
    let zoom = this.canvas.getZoom();
    zoom *= 0.999 ** delta;
    if (zoom > 20) zoom = 20;
    if (zoom < 0.01) zoom = 0.01;
    this.canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
    opt.e.preventDefault();
    opt.e.stopPropagation();
  }

  private isPanning = false;
  private lastPosX = 0;
  private lastPosY = 0;

  private onMouseDown(opt: fabric.IEvent<MouseEvent>): void {
    if (opt.e.altKey === true) {
      this.isPanning = true;
      this.lastPosX = opt.e.clientX;
      this.lastPosY = opt.e.clientY;
    }
  }

  private onMouseMove(opt: fabric.IEvent<MouseEvent>): void {
    if (this.isPanning) {
      const e = opt.e;
      const vpt = this.canvas.viewportTransform;
      if (vpt) {
        vpt[4] += e.clientX - this.lastPosX;
        vpt[5] += e.clientY - this.lastPosY;
        this.canvas.requestRenderAll();
        this.lastPosX = e.clientX;
        this.lastPosY = e.clientY;
      }
    }
  }

  private onMouseUp(opt: fabric.IEvent<MouseEvent>): void {
    this.isPanning = false;
  }

  addStickyNote(): void {
    const note = new fabric.Rect({
      left: 100,
      top: 100,
      fill: 'yellow',
      width: 150,
      height: 100,
      stroke: 'black',
      strokeWidth: 1
    });
    this.canvas.add(note);
  }

  addRectangle(): void {
    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      fill: 'transparent',
      width: 150,
      height: 100,
      stroke: 'black',
      strokeWidth: 1
    });
    this.canvas.add(rect);
  }

  addCircle(): void {
    const circle = new fabric.Circle({
      left: 100,
      top: 100,
      fill: 'transparent',
      radius: 50,
      stroke: 'black',
      strokeWidth: 1
    });
    this.canvas.add(circle);
  }

  addText(): void {
    const text = new fabric.Textbox('New Text', {
      left: 100,
      top: 100,
      width: 150,
      fontSize: 20
    });
    this.canvas.add(text);
  }

  toggleDrawingMode(): void {
    this.canvas.isDrawingMode = !this.canvas.isDrawingMode;
  }

  addConnector(): void {
    // Implement connector functionality
  }

  undo(): void {
    this.signalrService.undo(this.boardId);
  }

  redo(): void {
    this.signalrService.redo(this.boardId);
  }

  exportAsJPG(): void {
    const dataURL = this.canvas.toDataURL({
      format: 'jpeg',
      quality: 0.8
    });
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'board.jpg';
    link.click();
  }

  exportAsPDF(): void {
    // Implement PDF export functionality
  }
}
