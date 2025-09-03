export interface Tab {
  id: string
  url: string
  title: string
  active: boolean
  favicon?: string
}

export interface TabConfig {
  id: string
  name: string
  url: string
  icon?: string
}

export interface TabManagerState {
  tabs: Tab[]
  activeTabId: string | null
}
