// Avatar types
export interface ArtStyle {
  id: string;
  name: string;
  description: string;
  promptModifier: string;
  previewColor: string;
  iconName: string;
}

export interface AvatarForgeRequest {
  id: string;
  userId: string;
  stylePrompt: string;
  inputImageUrl: string;
  outputImageUrl: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Drop types - simplified for instant personal drops
export interface DropListing {
  id: string;
  baseAvatarId: string;
  creatorId: string;
  title: string;
  description: string | null;
  stockLimit: number;
  stockAvailable: number;
  collectionName: string | null;
  traitConfig: any;
  generationStatus: string | null;
  generationProgress: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DropOwnership {
  id: string;
  listingId: string;
  ownerId: string;
  tokenNumber: number;
  acquiredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DropGeneratedAvatar {
  id: string;
  listingId: string;
  tokenNumber: number;
  traits: Array<{ trait_type: string; value: string }>;
  rarity: string;
  rarityScore: number | null;
  avatarImageUrl: string;
  generatedAt: Date;
  assignedToTokenId: string | null;
}

