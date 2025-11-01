import { create } from "zustand"

interface Account {
  id: string
  platform: "facebook" | "instagram"
  name: string
  connected: boolean
}

interface AccountsState {
  accounts: Account[]
  addAccount: (account: Account) => void
  removeAccount: (id: string) => void
}

export const useAccountsStore = create<AccountsState>((set) => ({
  accounts: [],
  addAccount: (account) => set((state) => ({ accounts: [...state.accounts, account] })),
  removeAccount: (id) => set((state) => ({ accounts: state.accounts.filter((a) => a.id !== id) })),
}))