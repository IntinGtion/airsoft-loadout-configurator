export interface AttachmentTypeResponse {
  id: number
  name: string
}

export interface CategoryResponse {
  id: number
  name: string
  icon: string
}

export interface SlotResponse {
  id: number
  attachmentTypeId: number
  attachmentTypeName: string
  label: string
  positionXPercent: number
  positionYPercent: number
  gridColumn: number | null
  gridRow: number | null
}

export interface MountPointResponse {
  id: number
  attachmentTypeId: number
  attachmentTypeName: string
  label: string
  positionXPercent: number
  positionYPercent: number
  gridColumn: number | null
  gridRow: number | null
}

export interface ComponentResponse {
  id: number
  categoryId: number
  categoryName: string
  name: string
  manufacturer: string | null
  weightGrams: number | null
  priceEur: number | null
  svgAssetPath: string | null
  realWidthMm: number | null
  slots: SlotResponse[]
  acceptedAttachmentTypes: AttachmentTypeResponse[]
  mountPoints: MountPointResponse[]
}

export interface LoadoutSummary {
  id: number
  name: string
  shareToken: string
  createdAt: string
  itemCount: number
}

export interface LoadoutItemResponse {
  id: number
  componentId: number
  componentName: string
  categoryName: string
  weightGrams: number | null
  priceEur: number | null
  svgAssetPath: string | null
  acceptedAttachmentTypes: AttachmentTypeResponse[]
  parentSlotId: number | null
}

export interface LoadoutResponse {
  id: number
  name: string
  shareToken: string
  createdAt: string
  items: LoadoutItemResponse[]
}
