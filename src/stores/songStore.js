
import { ref,computed,watch } from 'vue'
import { defineStore } from 'pinia'
import { useAppStore } from './appStore'
import reqInit from "../utilities/requestInit/RequestInit"


// SongStore

// Separate views will modify the store 'song' during user inputs, and these are 
// only commited on songStore.save() being called. Synch issues are negated by views 
// always fetching from db on startup. Any differences caused by interruption 
// (cancel,refresh etc) will be discarded on view opening.

export const useSongStore = defineStore('song_store', () => {

   //
   // state props
   //

   // The current song
   const song = ref(null)

   // We follow state of local copy to server copy
   // Components can enable their 'apply' ctrls on this flag
   const synched = ref(true)

   // getters
   // const load_song = computed(() => app_api) - only for getting stuff!

   // actions
   // change and rely on reactivity to update components
   function change_my_object() {
      // store.$patch({
      //    count: store.count + 1,
      //    age: 120,
      //    name: 'DIO',
      //  })
       
   }

   async function load_song(slug) {

      console.log('load_song',slug)
   
      // to use another store, we 'use' it inside an action
      const app_store = useAppStore()

      try {
         await fetch(`${app_store.app_api}/songs/${slug}`,reqInit())
            .then(response => response.json())
            .then(data => {
               if(data.outcome === 'success') {
                  song.value = data.song
               }
            })
            .catch((error) => {
               console.log('ERR',error)
            })
      }
      catch(error) {
         return {
            outcome: 'fail',
            message: error
         }
      }
      synched.value = true
      return {
         outcome: 'success',
         message: ''   // we don't need notification, the song will appear!
      }
   }

   async function save() {

      const app_store = useAppStore()
      try {
         await fetch(`${app_store.app_api}/songs/${song.value.id}`,reqInit('PUT',app_store.bearer_token,JSON.stringify(song.value)))
            .then(response => response.json())
            .then(data => {           
               // handle response : 401
               // PUT http://songs-api-laravel/api/songs/431 401 (Unauthorized)
               if(data.message) {
                  if(data.message === 'Unauthenticated.') throw 'You need to login to perform this action'
               }
               // note, there is inconsistency in packaging from server - cf w/ load_song api response
               song.value = data
            })
            .catch((error) => {
               throw error
            })
      }
      catch(error) {
         return {
            outcome: 'fail',
            message: error
         }
      }
      synched.value = true
      return {
         outcome: 'success',
         message: 'The song was updated successfully'
      }
   }

   async function update_song(modified_song) {

      const app_store = useAppStore()
      try {
         await fetch(`${app_store.app_api}/songs/${modified_song.id}`,reqInit('PUT',app_store.bearer_token,JSON.stringify(modified_song)))
            .then(response => response.json())
            .then(data => {               
               // handle response : 401
               // PUT http://songs-api-laravel/api/songs/431 401 (Unauthorized)
               if(data.message) {
                  if(data.message === 'Unauthenticated.') throw 'You need to login to perform this action'
               }
               song.value = data.song
            })
            .catch((error) => {
               throw error
            })
      }
      catch(error) {
         return {
            outcome: 'fail',
            message: error
         }
      }
      synched.value = true
      return {
         outcome: 'success',
         message: 'The song was updated successfully'
      }
   }

   function del_section(section_id) {
      
      // note using spread will only clone first level, all nested are still refs
      // for deeper unwrapping, use JSON.parse(JSON.stringify(song.value.songsheet))
      try {
         let modified = {...song.value.songsheet}
      
         const modified_sections = modified.aSections.filter(section => {
            return section.id !== section_id
         })
         modified.aSections = modified_sections

         song.value.songsheet = modified
         synched.value = false
      }
      catch(error) {
         return {
            outcome: 'fail',
            message: error
         }
      }
      return {
         outcome: 'success',
         message: 'The section was deleted successfully'
      }
   }

   function clone_section(section_id) {

      try {
         let modified = {...song.value.songsheet}
         const target_section = modified.aSections.find(section => {
            return section.id === section_id
         })
         let copy_section = {...target_section}

         // calc id by incrementing current highest
         const ids = modified.aSections.map(section => section.id)
         ids.sort()
         copy_section.id = ids[ids.length - 1] + 1

         // calc next DAW char
         const daws = modified.aSections.map(section => section.daw)
         daws.sort()
         const next_daw = String.fromCharCode(daws[daws.length -1].charCodeAt(0) + 1)
         if(next_daw > 'Z'.charCodeAt(0)) next_daw = 'Z'.charCodeAt(0)
         copy_section.daw = next_daw

         // we retain title since section type most likely remains the same

         modified.aSections.push(copy_section)

         song.value.songsheet = modified
         synched.value = false
      }
      catch(error){
         return {
            outcome: 'fail',
            message: error
         }
      }
      return {
         outcome: 'success',
         message: 'The section was cloned successfully'
      }
   }

   function move_section(section_id,direction) {
         
      try {
         let modified = {...song.value.songsheet}
         const target_index = modified.aSections.findIndex(section => {
            return section.id === section_id
         })
         const swap_to_index = direction === "down" ? target_index + 1 :  target_index - 1
         if(swap_to_index > -1 && swap_to_index < modified.aSections.length) {
            const target_section = modified.aSections[target_index]
            const swap_section = modified.aSections[swap_to_index]
            if(swap_section) {
                  modified.aSections[swap_to_index] = target_section
                  modified.aSections[target_index] = swap_section
            }
         }
         song.value.songsheet = modified
      }
      catch(error) {
         return {
            outcome: 'fail',
            message: error
         }
      }
      synched.value = false
      return {
         outcome: 'success',
         message: 'The section was moved successfully'
      }
   }

   function update_section(section_id,modified_section) {

      try {
         let modified = {...song.value.songsheet}
         const target_index = modified.aSections.findIndex(section => {
            return section.id === section_id
         })
         modified.aSections[target_index] = modified_section
         song.value.songsheet = modified
         synched.value = false
      }
      catch(error) {
         return {
            outcome: 'fail',
            message: error
         }
      }
      return {
         outcome: 'success',
         message: 'The section was updated successfully'
      }
   }

   // User has left page w/out applyig changes - we revert to last saved
   function discard_changes() {

      console.log('about to load_song in discard_changes',song)
      load_song(song.value.slug)

   }


   return {
      song, synched, load_song, 
      update_song, save, 
      del_section, clone_section, move_section, update_section,
      discard_changes
   }

})