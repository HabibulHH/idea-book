import { supabase } from './supabase'
import { uploadImage, deleteImage } from './storageService'
import type { Book } from '@/types'

// Helper function to get current user ID
const getCurrentUserId = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id || 'anonymous'
  } catch (error) {
    console.warn('Auth error, using anonymous user:', error)
    return 'anonymous'
  }
}

// Convert database row to Book type
const convertDbToBook = (dbBook: any): Book => ({
  id: dbBook.id,
  title: dbBook.title,
  author: dbBook.author,
  description: dbBook.description,
  coverImageUrl: dbBook.cover_image_url,
  status: dbBook.status,
  rating: dbBook.rating,
  notes: dbBook.notes,
  addedAt: dbBook.added_at,
  startedAt: dbBook.started_at,
  completedAt: dbBook.completed_at,
  tags: dbBook.tags || []
})

// Convert Book type to database row
const convertBookToDb = (book: Book, userId: string) => ({
  id: book.id,
  user_id: userId,
  title: book.title,
  author: book.author,
  description: book.description,
  cover_image_url: book.coverImageUrl,
  status: book.status,
  rating: book.rating,
  notes: book.notes,
  added_at: book.addedAt,
  started_at: book.startedAt,
  completed_at: book.completedAt,
  tags: book.tags
})

// Load all books from Supabase
export const loadBooksFromSupabase = async (): Promise<Book[]> => {
  try {
    const userId = await getCurrentUserId()
    
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', userId)
      .order('added_at', { ascending: false })

    if (error) {
      throw error
    }

    return data.map(convertDbToBook)
  } catch (error) {
    console.error('Error loading books from Supabase:', error)
    return []
  }
}

// Save a book to Supabase
export const saveBook = async (book: Book): Promise<Book> => {
  try {
    const userId = await getCurrentUserId()
    const dbBook = convertBookToDb(book, userId)

    const { error } = await supabase
      .from('books')
      .upsert(dbBook)
      .select()
      .single()

    if (error) {
      throw error
    }

    return book
  } catch (error) {
    console.error('Error saving book to Supabase:', error)
    throw error
  }
}

// Save a book with image upload
export const saveBookWithImage = async (
  book: Book, 
  imageFile?: File
): Promise<Book> => {
  try {
    let updatedBook = { ...book }

    // Upload image if provided
    if (imageFile) {
      const uploadResult = await uploadImage(imageFile, 'book-covers', 'covers')
      updatedBook.coverImageUrl = uploadResult.publicUrl
    }

    // Save book to database
    return await saveBook(updatedBook)
  } catch (error) {
    console.error('Error saving book with image:', error)
    throw error
  }
}

// Update book status
export const updateBookStatus = async (bookId: string, status: Book['status']): Promise<void> => {
  try {
    const userId = await getCurrentUserId()
    const updateData: any = { status }

    if (status === 'reading' && !updateData.started_at) {
      updateData.started_at = new Date().toISOString()
    } else if (status === 'completed') {
      updateData.completed_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('books')
      .update(updateData)
      .eq('id', bookId)
      .eq('user_id', userId)

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Error updating book status:', error)
    throw error
  }
}

// Update book rating
export const updateBookRating = async (bookId: string, rating: number): Promise<void> => {
  try {
    const userId = await getCurrentUserId()

    const { error } = await supabase
      .from('books')
      .update({ rating })
      .eq('id', bookId)
      .eq('user_id', userId)

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Error updating book rating:', error)
    throw error
  }
}

// Delete a book from Supabase
export const deleteBookFromSupabase = async (bookId: string): Promise<void> => {
  try {
    // First get the book to check if it has a cover image
    const userId = await getCurrentUserId()
    const { data: bookData } = await supabase
      .from('books')
      .select('cover_image_url')
      .eq('id', bookId)
      .eq('user_id', userId)
      .single()

    // Delete the book from database
    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', bookId)

    if (error) {
      throw error
    }

    // Delete the cover image if it exists
    if (bookData?.cover_image_url) {
      try {
        // Extract the file path from the URL
        const url = new URL(bookData.cover_image_url)
        const pathParts = url.pathname.split('/')
        const bucketIndex = pathParts.findIndex(part => part === 'book-covers')
        if (bucketIndex !== -1 && bucketIndex + 1 < pathParts.length) {
          const filePath = pathParts.slice(bucketIndex + 1).join('/')
          await deleteImage(filePath, 'book-covers')
        }
      } catch (imageError) {
        console.warn('Error deleting cover image:', imageError)
        // Don't throw here, as the book was already deleted
      }
    }
  } catch (error) {
    console.error('Error deleting book from Supabase:', error)
    throw error
  }
}