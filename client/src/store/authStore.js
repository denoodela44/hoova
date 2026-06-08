import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,

      setAuth: (user, token, refreshToken) =>
        set({ user, token, refreshToken }),

      updateUser: (patch) =>
        set((s) => ({ user: { ...s.user, ...patch } })),

      logout: () =>
        set({ user: null, token: null, refreshToken: null }),

      isLoggedIn: () => !!get().token,
    }),
    { name: 'hoova-auth' }
  )
)

export default useAuthStore
