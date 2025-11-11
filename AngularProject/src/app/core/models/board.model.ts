export interface Board {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  ownerName: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  thumbnailUrl: string;
  elementCount: number;
  collaboratorCount: number;
}

export interface BoardDetail extends Board {
  elements: BoardElement[];
  collaborators: Collaborator[];
}

export interface CreateBoardRequest {
  name: string;
  description: string;
  isPublic: boolean;
}

export interface UpdateBoardRequest {
  name?: string;
  description?: string;
  isPublic?: boolean;
  thumbnailUrl?: string;
}

export interface BoardElement {
  id: string;
  boardId: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  textColor: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontStyle: string;
  textContent: string;
  imageUrl: string;
  connectedFromElementId?: string;
  connectedToElementId?: string;
  connectorStyle: string;
  pathData: string;
  createdBy: string;
  creatorName?: string;
  createdAt: Date;
  updatedAt: Date;
  isLocked: boolean;
}

export type ElementType = 'Rectangle' | 'Circle' | 'Triangle' | 'Line' | 'Connector' | 'Text' | 'StickyNote' | 'Drawing' | 'Image';

export interface CreateElementRequest {
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  textColor?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  textContent?: string;
  imageUrl?: string;
  connectedFromElementId?: string;
  connectedToElementId?: string;
  connectorStyle?: string;
  pathData?: string;
}

export interface UpdateElementRequest {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  zIndex?: number;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  textColor?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  textContent?: string;
  imageUrl?: string;
  connectedFromElementId?: string;
  connectedToElementId?: string;
  connectorStyle?: string;
  pathData?: string;
  isLocked?: boolean;
}

export interface Collaborator {
  userId: string;
  username: string;
  email: string;
  permission: 'Viewer' | 'Editor' | 'Admin';
  addedAt: Date;
}

export interface AddCollaboratorRequest {
  email: string;
  permission: 'Viewer' | 'Editor' | 'Admin';
}
