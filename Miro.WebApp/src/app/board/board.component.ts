import { Component, OnDestroy, OnInit } from '@angular/core';
import { fabric } from 'fabric';
import { Subscription, timer } from 'rxjs';
import { SignalrService } from '../shared/services/signalr.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss']
})
export class BoardComponent implements OnInit, OnDestroy {
  private canvas: fabric.Canvas;
  private isPanning: boolean = false;
  private lastPosX: number = 0;
  private lastPosY: number = 0;
  private boardId = 'test-board'; // Replace with actual board ID
  private history: any[] = [];
  private historyIndex = -1;
  private autosaveSubscription!: Subscription;

  constructor(private signalrService: SignalrService) { }

  ngOnInit(): void {
    this.signalrService.startConnection();
    this.signalrService.joinBoard(this.boardId);

    this.canvas = new fabric.Canvas('canvas', {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: '#f0f0f0'
    });

    this.canvas.on('mouse:wheel', this.onMouseWheel.bind(this));
    this.canvas.on('mouse:down', this.onMouseDown.bind(this));
    this.canvas.on('mouse:move', this.onMouseMove.bind(this));
    this.canvas.on('mouse:up', this.onMouseUp.bind(this));
    this.canvas.on('object:added', this.onObjectAdded.bind(this));
    this.canvas.on('object:modified', this.onObjectModified.bind(this));
    this.canvas.on('object:removed', this.onObjectRemoved.bind(this));
    this.canvas.on('drop', this.onDrop.bind(this));

    this.signalrService.addElementListener((element: any) => {
      fabric.util.enlivenObjects([element], (objects: any) => {
        objects.forEach((obj: any) => {
          this.canvas.add(obj);
        });
      });
    });

    this.saveState();
    this.autosaveSubscription = timer(30000, 30000).subscribe(() => this.saveBoard());
  }

  ngOnDestroy(): void {
    if (this.autosaveSubscription) {
      this.autosaveSubscription.unsubscribe();
    }
  }

  public addStickyNote(): void {
    const stickyNote = new fabric.IText('New Sticky Note', {
      left: 100,
      top: 100,
      backgroundColor: '#ffffa8',
      padding: 10
    });
    this.canvas.add(stickyNote);
    this.saveState();
  }

  public addRectangle(): void {
    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      fill: 'red',
      width: 200,
      height: 100
    });
    this.canvas.add(rect);
    this.saveState();
  }

  public addCircle(): void {
    const circle = new fabric.Circle({
      left: 100,
      top: 100,
      fill: 'blue',
      radius: 50
    });
    this.canvas.add(circle);
    this.saveState();
  }

  public addText(): void {
    const text = new fabric.IText('New Text', {
      left: 100,
      top: 100,
      fontSize: 20,
      fill: '#000000'
    });
    this.canvas.add(text);
    this.saveState();
  }

  public toggleDrawingMode(): void {
    this.canvas.isDrawingMode = !this.canvas.isDrawingMode;
  }

  public undo(): void {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.canvas.loadFromJSON(this.history[this.historyIndex], this.canvas.renderAll.bind(this.canvas));
    }
  }

  public redo(): void {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.canvas.loadFromJSON(this.history[this.historyIndex], this.canvas.renderAll.bind(this.canvas));
    }
  }

  public exportAsJPG(): void {
    const dataURL = this.canvas.toDataURL({
      format: 'jpeg',
      quality: 0.8
    });
    const link = document.createElement('a');
    link.download = 'board.jpg';
    link.href = dataURL;
    link.click();
  }

  public exportAsPDF(): void {
    const canvasElement = document.querySelector("#canvas") as HTMLElement;
    if (canvasElement) {
      html2canvas(canvasElement).then((canvas: any) => {
        const contentDataURL = canvas.toDataURL('image/png')
        let pdf = new jsPDF('l', 'cm', 'a4'); // A4 size page of PDF
        pdf.addImage(contentDataURL, 'PNG', 0, 0, 29.7, 21.0);
        pdf.save('board.pdf');
      });
    }
  }

  private saveState(): void {
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(this.canvas.toObject());
    this.historyIndex++;
  }

  private saveBoard(): void {
    // Save board state to database
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
      vpt[4] += e.clientX - this.lastPosX;
      vpt[5] += e.clientY - this.lastPosY;
      this.canvas.requestRenderAll();
      this.lastPosX = e.clientX;
      this.lastPosY = e.clientY;
    }
  }

  private onMouseUp(opt: fabric.IEvent<MouseEvent>): void {
    this.isPanning = false;
    this.saveState();
  }

  private onObjectAdded(opt: fabric.IEvent): void {
    this.signalrService.sendElement(opt.target.toObject(), this.boardId);
  }

  private onObjectModified(opt: fabric.IEvent): void {
    this.signalrService.sendElement(opt.target.toObject(), this.boardId);
  }

  private onObjectRemoved(opt: fabric.IEvent): void {
    // Send remove event to server
  }

  private onDrop(opt: fabric.IEvent<DragEvent>): void {
    opt.e.preventDefault();
    const files = opt.e.dataTransfer.files;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.match('image.*')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageUrl = (e.target as any).result;
          fabric.Image.fromURL(imageUrl, (img: any) => {
            img.set({
              left: opt.e.offsetX,
              top: opt.e.offsetY
            });
            this.canvas.add(img);
            this.saveState();
          });
        };
        reader.readAsDataURL(file);
      }
    }
  }
}
