import { create } from 'zustand'
import { timeEntriesApi } from '../api/timeEntries'

export const useTimerStore = create((set, get) => ({
  runningEntry: null,
  elapsedSeconds: 0,
  isRunning: false,
  intervalId: null,

  startTimer: async (projectId, description = '') => {
    try {
      const response = await timeEntriesApi.start(projectId, description)
      const entry = response.data
      set({ 
        runningEntry: entry, 
        isRunning: true,
        elapsedSeconds: 0 
      })
      get().startInterval()
      return { success: true, entry }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Error al iniciar timer' 
      }
    }
  },

  stopTimer: async () => {
    try {
      const { runningEntry } = get()
      const response = await timeEntriesApi.stop(runningEntry?.id)
      get().stopInterval()
      set({ 
        runningEntry: null, 
        isRunning: false,
        elapsedSeconds: 0 
      })
      return { success: true, entry: response.data }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Error al detener timer' 
      }
    }
  },

  fetchRunning: async () => {
    try {
      const response = await timeEntriesApi.getRunning()
      const entry = response.data
      const startTime = new Date(entry.started_at).getTime()
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      
      set({ 
        runningEntry: entry, 
        isRunning: true,
        elapsedSeconds: elapsed 
      })
      get().startInterval()
    } catch (error) {
      set({ 
        runningEntry: null, 
        isRunning: false,
        elapsedSeconds: 0 
      })
    }
  },

  startInterval: () => {
    const { intervalId } = get()
    if (intervalId) clearInterval(intervalId)
    
    const id = setInterval(() => {
      set(state => ({ elapsedSeconds: state.elapsedSeconds + 1 }))
    }, 1000)
    
    set({ intervalId: id })
  },

  stopInterval: () => {
    const { intervalId } = get()
    if (intervalId) {
      clearInterval(intervalId)
      set({ intervalId: null })
    }
  },

  formatTime: (seconds) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  },
}))