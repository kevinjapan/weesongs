
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useAppStore } from './appStore'
import reqInit from "../utilities/requestInit/RequestInit"
import { get_new_album_template } from '../utilities/newAlbumTemplate/newAlbumTemplate'
import { get_db_ready_datetime } from '../utilities/dates/dates'



// AlbumStore


export const useAlbumStore = defineStore('album_store', () => {


   // The current album
   const album = ref(null)


   // Albums List page
   const curr_albums_page = ref(1)
   const curr_albums_order_by = ref('made')
   const curr_albums_asc = ref(false)


   // We follow state of local copy to server copy
   // Components can enable their 'apply' ctrls on this flag
   const synched = ref(true)

   
   async function create_album(title) {

      const app_store = useAppStore()

      const new_album = get_new_album_template()
      const datetime = get_db_ready_datetime()
      new_album.title = title
      new_album.slug = title.replace(/ /g, '-')

      try {
         await fetch(`${app_store.app_api}/albums`,reqInit("POST",app_store.bearer_token,JSON.stringify(new_album)))
            .then(response => response.json())
            .then(data => {
               if(data.outcome === 'success') {
                  album.value = data.album
               }
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
         message: ''   // we don't need notification, the album will appear
      }
   }

   async function load_album(slug) {
   
      const app_store = useAppStore()
      try {
         await fetch(`${app_store.app_api}/albums/${slug}`,reqInit())
            .then(response => response.json())
            .then(data => {
               if(data.outcome === 'success') {
                  album.value = data.album
               }
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
         message: ''   // we don't need notification, the album will appear
      }
   }

     // save a modified copy of the song to the server (and replace copy in this store)
     async function save_album(modified_album) {

      const app_store = useAppStore()
      try {
         await fetch(`${app_store.app_api}/albums/${modified_album.id}`,reqInit('PUT',app_store.bearer_token,JSON.stringify(modified_album)))
            .then(response => response.json())
            .then(data => {           
               // handle response : 401
               // PUT http://songs-api-laravel/api/albums/431 401 (Unauthorized)
               if(data.message) {
                  if(data.message === 'Unauthenticated.') throw 'You need to login to perform this action'
               }
               // refresh the local copy of song ('updated_at' will have changed)
               album.value = data
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
         message: 'The album was updated successfully'
      }
   }

   
   // save this store local copy to server (after we have updated_sections etc)
   async function save() {

      const app_store = useAppStore()
      try {
         await fetch(`${app_store.app_api}/albums/${song.value.id}`,reqInit('PUT',app_store.bearer_token,JSON.stringify(album.value)))
            .then(response => response.json())
            .then(data => {           
               // handle response : 401
               // PUT http://songs-api-laravel/api/albums/431 401 (Unauthorized)
               if(data.message) {
                  if(data.message === 'Unauthenticated.') throw 'You need to login to perform this action'
               }
               // note, there is inconsistency in packaging from server - cf w/ load_song api response
               album.value = data
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
         message: 'The album was updated successfully'
      }
   }

   async function update_album(modified_album) {

      const app_store = useAppStore()
      try {
         await fetch(`${app_store.app_api}/albums/${modified_song.id}`,reqInit('PUT',app_store.bearer_token,JSON.stringify(modified_album)))
            .then(response => response.json())
            .then(data => {               
               // handle response : 401
               // PUT http://songs-api-laravel/api/albums/431 401 (Unauthorized)
               if(data.message) {
                  if(data.message === 'Unauthenticated.') throw 'You need to login to perform this action'
               }
               album.value = data.album
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
         message: 'The album was updated successfully'
      }
   }

   
   async function delete_album(album_id) {

      const app_store = useAppStore()
   
      try {
         await fetch(`${app_store.app_api}/albums/${song_id}`,reqInit("DELETE",app_store.bearer_token,{}))
            .then(response => response.json())
            .then(data => {       
               // handle response : 401
               // PUT http://songs-api-laravel/api/albums/431 401 (Unauthorized)
               if(data.message) {
                  if(data.message === 'Unauthenticated.') throw 'You need to login to perform this action'
               }
               if(data.outcome === 'success') {
                  album.value = null
                  // any redirection is carried out by client component (some eg lists may not want to)
               }
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
         message: 'The album was successfully deleted'
      }
   }



   // User has left page w/out applying changes - we revert to last saved
   function discard_changes() {
      load_album(album.value.slug)
   }

   return {
      album,
      create_album,
      load_album,
      save_album,
      save,
      update_album,
      delete_album,
      discard_changes,
      curr_albums_page,
      curr_albums_order_by,
      curr_albums_asc
   }

})