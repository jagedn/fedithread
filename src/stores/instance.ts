
import { defineStore } from 'pinia'
import {ref} from 'vue';

const SETTINGS_LOCAL_STORAGE_FEDITHREAD_INSTANCE = 'FEDITHREAD_INSTANCE'

export const instanceStore = defineStore('instance', () => {

  const currentUser = ref(null)

  const getUser = ()=>{
    const settings = localStorage.getItem(SETTINGS_LOCAL_STORAGE_FEDITHREAD_INSTANCE)

    currentUser.value = settings ? JSON.parse(settings) : null
    return currentUser.value
  }

  const updateUser = (settings : any)=>{
    localStorage.setItem(SETTINGS_LOCAL_STORAGE_FEDITHREAD_INSTANCE, JSON.stringify(settings))
    return getUser();
  }

  const removeUser = ()=>{
    localStorage.removeItem(SETTINGS_LOCAL_STORAGE_FEDITHREAD_INSTANCE);
    currentUser.value = null;
  }

  return { currentUser, getUser, updateUser, removeUser }
})
