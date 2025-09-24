import { supabase } from './supabase'

export interface UploadResult {
  path: string;
  publicUrl: string;
}

// Upload an image file to Supabase Storage
export const uploadImage = async (
  file: File, 
  bucketName: string = 'book-covers',
  folder: string = 'covers'
): Promise<UploadResult> => {
  try {
    // Generate a unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    // Upload the file with public access
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      })

    if (error) {
      console.error('Storage upload error:', error)
      throw error
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath)

    return {
      path: data.path,
      publicUrl
    }
  } catch (error) {
    console.error('Error uploading image:', error)
    throw error
  }
}

// Delete an image from Supabase Storage
export const deleteImage = async (
  filePath: string,
  bucketName: string = 'book-covers'
): Promise<void> => {
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath])

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Error deleting image:', error)
    throw error
  }
}

// Get a signed URL for private images (if needed)
export const getSignedUrl = async (
  filePath: string,
  bucketName: string = 'book-covers',
  expiresIn: number = 3600
): Promise<string> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, expiresIn)

    if (error) {
      throw error
    }

    return data.signedUrl
  } catch (error) {
    console.error('Error getting signed URL:', error)
    throw error
  }
}