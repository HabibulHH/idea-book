import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import type { Book } from '@/types'
import { 
  loadBooksFromSupabase, 
  saveBookWithImage, 
  deleteBookFromSupabase,
  updateBookStatus,
  updateBookRating 
} from '@/lib/booksService'

export const Books: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [newBook, setNewBook] = useState<Partial<Book>>({
    title: '',
    author: '',
    description: '',
    status: 'to-read',
    tags: []
  })
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showMobileModal, setShowMobileModal] = useState(false)

  useEffect(() => {
    loadBooks()
  }, [])

  const loadBooks = async () => {
    try {
      setLoading(true)
      const booksData = await loadBooksFromSupabase()
      setBooks(booksData)
    } catch (error) {
      console.error('Error loading books:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedImage(file)
    }
  }

  const handleAddBook = async () => {
    try {
      if (!newBook.title || !newBook.author) {
        alert('Please fill in title and author')
        return
      }

      const book: Book = {
        id: crypto.randomUUID(),
        title: newBook.title!,
        author: newBook.author!,
        description: newBook.description || '',
        status: newBook.status || 'to-read',
        rating: newBook.rating,
        notes: newBook.notes || '',
        addedAt: new Date().toISOString(),
        tags: newBook.tags || []
      }

      await saveBookWithImage(book, selectedImage || undefined)
      
      setBooks([book, ...books])
      setNewBook({ title: '', author: '', description: '', status: 'to-read', tags: [] })
      setSelectedImage(null)
      setShowAddModal(false)
    } catch (error) {
      console.error('Error adding book:', error)
      alert('Error adding book')
    }
  }

  const handleDeleteBook = async (bookId: string) => {
    try {
      await deleteBookFromSupabase(bookId)
      setBooks(books.filter(book => book.id !== bookId))
      if (selectedBook?.id === bookId) {
        setSelectedBook(null)
      }
    } catch (error) {
      console.error('Error deleting book:', error)
      alert('Error deleting book')
    }
  }

  const handleStatusChange = async (bookId: string, status: Book['status']) => {
    try {
      await updateBookStatus(bookId, status)
      setBooks(books.map(book => 
        book.id === bookId 
          ? { 
              ...book, 
              status,
              startedAt: status === 'reading' && !book.startedAt ? new Date().toISOString() : book.startedAt,
              completedAt: status === 'completed' ? new Date().toISOString() : book.completedAt
            }
          : book
      ))
      if (selectedBook?.id === bookId) {
        setSelectedBook({ ...selectedBook, status })
      }
    } catch (error) {
      console.error('Error updating book status:', error)
    }
  }

  const handleRatingChange = async (bookId: string, rating: number) => {
    try {
      await updateBookRating(bookId, rating)
      setBooks(books.map(book => 
        book.id === bookId ? { ...book, rating } : book
      ))
      if (selectedBook?.id === bookId) {
        setSelectedBook({ ...selectedBook, rating })
      }
    } catch (error) {
      console.error('Error updating book rating:', error)
    }
  }

  // Filter books based on search and status
  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || book.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: Book['status']) => {
    switch (status) {
      case 'to-read': return 'bg-gray-100 text-gray-800'
      case 'reading': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'abandoned': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading books...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full max-h-full">
      {/* Sticky Header */}
      <div className="flex-shrink-0 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Books</h1>
            <p className="text-gray-600 mt-1">{books.length} books in your collection</p>
          </div>
          <Button 
            onClick={() => setShowAddModal(true)} 
            className="bg-blue-600 hover:bg-blue-700"
          >
            Add Book
          </Button>
        </div>
        
        {/* Search and Filter */}
        <div className="flex gap-4 mt-4">
          <Input
            placeholder="Search books..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="to-read">To Read</SelectItem>
              <SelectItem value="reading">Reading</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="abandoned">Abandoned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto scrollbar-hide min-h-0">
          {/* Books List - Goodreads Style */}
          <div className="p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
          {filteredBooks.map((book) => (
            <div 
              key={book.id} 
              className="cursor-pointer group"
              onClick={() => {
                setSelectedBook(book)
                setShowMobileModal(true)
              }}
            >
              {/* Book Cover - Proper Aspect Ratio */}
              <div className="mb-3 flex justify-center">
                {book.coverImageUrl ? (
                  <img
                    src={book.coverImageUrl}
                    alt={book.title}
                    className="max-w-full h-48 object-contain rounded shadow-md group-hover:shadow-lg transition-shadow"
                  />
                ) : (
                  <div 
                    className="w-32 h-48 bg-gray-200 rounded shadow-md flex items-center justify-center"
                  >
                    <span className="text-gray-500 text-xs text-center px-2">No Cover</span>
                  </div>
                )}
              </div>
              
              {/* Book Details - Below Cover */}
              <div className="space-y-1 text-center">
                <h3 className="font-semibold text-sm text-gray-900 leading-tight overflow-hidden" style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {book.title}
                </h3>
                
                <p className="text-gray-600 text-xs">by {book.author}</p>
                
                {/* Rating */}
                {book.rating && (
                  <div className="flex items-center justify-center gap-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-xs ${
                            i < book.rating! ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">{book.rating}.0</span>
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="pt-1 flex justify-center">
                  <Badge className={`${getStatusColor(book.status)} text-xs px-2 py-1`}>
                    {book.status.replace('-', ' ')}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredBooks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No books found</div>
            <p className="text-gray-400 mt-2">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Add your first book to get started'
              }
            </p>
          </div>
        )}
      </div>

      {/* Add Book Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Add New Book</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAddModal(false)
                    setNewBook({ title: '', author: '', description: '', status: 'to-read', tags: [] })
                    setSelectedImage(null)
                  }}
                >
                  ✕
                </Button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Book Title *</label>
                  <Input
                    placeholder="Enter book title"
                    value={newBook.title || ''}
                    onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Author *</label>
                  <Input
                    placeholder="Enter author name"
                    value={newBook.author || ''}
                    onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <Textarea
                    placeholder="Enter book description"
                    value={newBook.description || ''}
                    onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <Select 
                    value={newBook.status || 'to-read'} 
                    onValueChange={(value: Book['status']) => setNewBook({ ...newBook, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="to-read">To Read</SelectItem>
                      <SelectItem value="reading">Reading</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="abandoned">Abandoned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setNewBook({ ...newBook, rating: star })}
                        className={`text-2xl ${
                          star <= (newBook.rating || 0) 
                            ? 'text-yellow-400' 
                            : 'text-gray-300'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Cover Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {selectedImage && (
                    <p className="text-sm text-gray-600 mt-1">Selected: {selectedImage.name}</p>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Notes</label>
                  <Textarea
                    placeholder="Add any notes about this book"
                    value={newBook.notes || ''}
                    onChange={(e) => setNewBook({ ...newBook, notes: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                <Button 
                  onClick={handleAddBook}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={!newBook.title || !newBook.author}
                >
                  Add Book
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAddModal(false)
                    setNewBook({ title: '', author: '', description: '', status: 'to-read', tags: [] })
                    setSelectedImage(null)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Book Details Modal */}
      {showMobileModal && selectedBook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end lg:items-center lg:justify-center">
          <div className="bg-white w-full lg:w-auto lg:max-w-2xl max-h-[90vh] rounded-t-lg lg:rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Book Details</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowMobileModal(false)
                  setSelectedBook(null)
                }}
              >
                ✕
              </Button>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-4">
              {/* Book Header - Goodreads Style */}
              <div className="flex gap-4 mb-6">
                {selectedBook.coverImageUrl && (
                  <img
                    src={selectedBook.coverImageUrl}
                    alt={selectedBook.title}
                    className="w-20 h-28 object-cover rounded flex-shrink-0"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1">{selectedBook.title}</h3>
                  <p className="text-gray-600 mb-2">by {selectedBook.author}</p>
                  
                  {/* Rating Display */}
                  {selectedBook.rating && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-sm ${
                              i < selectedBook.rating! ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">{selectedBook.rating}.0</span>
                    </div>
                  )}
                </div>
              </div>
              
              {selectedBook.description && (
                <p className="text-gray-700 mb-4">{selectedBook.description}</p>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <Select 
                    value={selectedBook.status} 
                    onValueChange={(value: Book['status']) => handleStatusChange(selectedBook.id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="to-read">To Read</SelectItem>
                      <SelectItem value="reading">Reading</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="abandoned">Abandoned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRatingChange(selectedBook.id, star)}
                        className={`text-2xl ${
                          star <= (selectedBook.rating || 0) 
                            ? 'text-yellow-400' 
                            : 'text-gray-300'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                {selectedBook.tags && selectedBook.tags.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedBook.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedBook.notes && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Notes</label>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded">{selectedBook.notes}</p>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleDeleteBook(selectedBook.id)
                      setShowMobileModal(false)
                      setSelectedBook(null)
                    }}
                    className="w-full"
                  >
                    Delete Book
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  )
}