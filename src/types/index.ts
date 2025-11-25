// Collection types
export interface AvatarCollection {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  coverImageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

// Generation job types
export interface GenerationJob {
  id: string;
  jobType: 'avatar_single' | 'avatar_batch' | 'drop_variations' | 'drop_single';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  totalItems: number;
  completedItems: number;
  config: any;
  result?: any;
  errorMessage: string | null;
  priority: number;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Collection statistics types
export interface CollectionStats {
  id: string;
  totalAvatars: number;
  totalDrops: number;
  totalVariations: number;
  totalFavorites: number;
  averageRating: number | null;
  rarityDistribution: Record<string, number>;
  topTags: Array<{ tag: string; count: number }>;
  storageUsed: number;
  lastUpdated: Date;
}

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
  stylePrompt: string;
  inputImageUrl: string;
  outputImageUrl: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage: string | null;
  processingTimeMs: number | null;
  collectionId: string | null;
  tags: string[];
  rating: number | null;
  notes: string | null;
  favorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  collection?: AvatarCollection;
}

// Drop types - enhanced for trait generation
export interface TraitCategory {
  name: string;
  values: TraitValue[];
  rarityWeights: number[];
}

export interface TraitValue {
  value: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  weight: number;
}

export interface TraitConfig {
  categories: TraitCategory[];
  totalVariations: number;
  rarityDistribution: Record<string, number>;
  strategy: 'pre-generate' | 'on-demand' | 'hybrid';
}

export interface DropListing {
  id: string;
  baseAvatarId: string;
  title: string;
  description: string | null;
  stockLimit: number;
  stockAvailable: number;
  collectionName: string | null;
  traitConfig: TraitConfig | null;
  generationStatus: string | null;
  generationProgress: number | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  baseAvatar: {
    id: string;
    outputImageUrl: string | null;
  };
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
