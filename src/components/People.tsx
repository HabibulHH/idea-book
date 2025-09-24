import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import ReactSelect from 'react-select'
import { PeopleService, SKILL_CATEGORIES, RELATIONSHIP_TYPES } from '@/lib/peopleService'
import type { Person, PersonSkill, PersonConnection } from '@/types'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Star, 
  Phone, 
  Mail, 
  Linkedin, 
  Facebook, 
  MessageCircle,
  Users,
  Filter,
  X,
  Save,
  UserPlus
} from 'lucide-react'

export default function People() {
  const [people, setPeople] = useState<Person[]>([])
  const [filteredPeople, setFilteredPeople] = useState<Person[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSkill, setSelectedSkill] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showConnectionModal, setShowConnectionModal] = useState(false)
  const [editingPerson, setEditingPerson] = useState<Person | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    linkedinUrl: '',
    facebookUrl: '',
    whatsappUrl: '',
    notes: '',
    helpfulnessRating: 0,
    tags: [] as string[],
    skills: [] as { skillName: string; skillLevel: string }[]
  })

  const [connectionData, setConnectionData] = useState({
    personAId: '',
    personBId: '',
    relationshipType: 'other' as const,
    relationshipNotes: ''
  })

  // Skill options for react-select
  const skillOptions = SKILL_CATEGORIES.map(skill => ({
    value: skill,
    label: skill.charAt(0).toUpperCase() + skill.slice(1)
  }))

  const skillLevelOptions = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'expert', label: 'Expert' }
  ]

  // Load people on component mount
  useEffect(() => {
    loadPeople()
  }, [])

  // Filter people based on search and skill filter
  useEffect(() => {
    let filtered = people

    if (searchQuery) {
      filtered = filtered.filter(person =>
        person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.skills?.some(skill => 
          skill.skillName.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    }

    if (selectedSkill) {
      filtered = filtered.filter(person =>
        person.skills?.some(skill => skill.skillName === selectedSkill)
      )
    }

    setFilteredPeople(filtered)
  }, [people, searchQuery, selectedSkill])

  const loadPeople = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await PeopleService.getPeople()
      setPeople(data)
    } catch (err) {
      setError('Failed to load people')
      console.error('Error loading people:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddPerson = async () => {
    try {
      setError(null)
      const personData = {
        ...formData,
        skills: formData.skills.map(skill => ({
          skillName: skill.skillName,
          skillLevel: skill.skillLevel as 'beginner' | 'intermediate' | 'advanced' | 'expert'
        }))
      }
      await PeopleService.createPerson(personData)
      await loadPeople()
      setShowAddModal(false)
      resetForm()
    } catch (err) {
      setError('Failed to add person')
      console.error('Error adding person:', err)
    }
  }

  const handleUpdatePerson = async () => {
    if (!editingPerson) return

    try {
      setError(null)
      const personData = {
        ...formData,
        skills: formData.skills.map(skill => ({
          skillName: skill.skillName,
          skillLevel: skill.skillLevel as 'beginner' | 'intermediate' | 'advanced' | 'expert'
        }))
      }
      await PeopleService.updatePerson(editingPerson.id, personData)
      await loadPeople()
      setShowEditModal(false)
      setEditingPerson(null)
      resetForm()
    } catch (err) {
      setError('Failed to update person')
      console.error('Error updating person:', err)
    }
  }

  const handleDeletePerson = async (id: string) => {
    if (!confirm('Are you sure you want to delete this person?')) return

    try {
      setError(null)
      await PeopleService.deletePerson(id)
      await loadPeople()
    } catch (err) {
      setError('Failed to delete person')
      console.error('Error deleting person:', err)
    }
  }

  const handleCreateConnection = async () => {
    try {
      setError(null)
      await PeopleService.createConnection(connectionData)
      await loadPeople()
      setShowConnectionModal(false)
      setConnectionData({
        personAId: '',
        personBId: '',
        relationshipType: 'other',
        relationshipNotes: ''
      })
    } catch (err) {
      setError('Failed to create connection')
      console.error('Error creating connection:', err)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      mobile: '',
      email: '',
      linkedinUrl: '',
      facebookUrl: '',
      whatsappUrl: '',
      notes: '',
      helpfulnessRating: 0,
      tags: [],
      skills: []
    })
  }

  const openEditModal = (person: Person) => {
    setEditingPerson(person)
    setFormData({
      name: person.name,
      mobile: person.mobile || '',
      email: person.email || '',
      linkedinUrl: person.linkedinUrl || '',
      facebookUrl: person.facebookUrl || '',
      whatsappUrl: person.whatsappUrl || '',
      notes: person.notes || '',
      helpfulnessRating: person.helpfulnessRating || 0,
      tags: person.tags || [],
      skills: person.skills?.map(skill => ({
        skillName: skill.skillName,
        skillLevel: skill.skillLevel
      })) || []
    })
    setShowEditModal(true)
  }

  const handleSkillsChange = (selectedOptions: any) => {
    const skills = selectedOptions.map((option: any) => ({
      skillName: option.value,
      skillLevel: 'intermediate' // Default level
    }))
    setFormData(prev => ({
      ...prev,
      skills
    }))
  }

  const updateSkillLevel = (skillName: string, skillLevel: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.map(skill => 
        skill.skillName === skillName ? { ...skill, skillLevel } : skill
      )
    }))
  }

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }))
    }
  }

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ))
  }

  const renderPersonCard = (person: Person) => (
    <Card key={person.id} className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {person.name}
          </h3>
          {person.helpfulnessRating && (
            <div className="flex items-center gap-1 mt-1">
              {renderStars(person.helpfulnessRating)}
              <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                ({person.helpfulnessRating}/5)
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => openEditModal(person)}
            variant="outline"
            size="sm"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => handleDeletePerson(person.id)}
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-2 mb-4">
        {person.mobile && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Phone className="h-4 w-4" />
            <a href={`tel:${person.mobile}`} className="hover:text-blue-600">
              {person.mobile}
            </a>
          </div>
        )}
        {person.email && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Mail className="h-4 w-4" />
            <a href={`mailto:${person.email}`} className="hover:text-blue-600">
              {person.email}
            </a>
          </div>
        )}
        {person.linkedinUrl && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Linkedin className="h-4 w-4" />
            <a href={person.linkedinUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
              LinkedIn Profile
            </a>
          </div>
        )}
        {person.facebookUrl && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Facebook className="h-4 w-4" />
            <a href={person.facebookUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
              Facebook Profile
            </a>
          </div>
        )}
        {person.whatsappUrl && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <MessageCircle className="h-4 w-4" />
            <a href={person.whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
              WhatsApp
            </a>
          </div>
        )}
      </div>

      {/* Skills */}
      {person.skills && person.skills.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Skills</h4>
          <div className="flex flex-wrap gap-2">
            {person.skills.map((skill, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {skill.skillName} ({skill.skillLevel})
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {person.tags && person.tags.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {person.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {person.notes && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p className="line-clamp-3">{person.notes}</p>
        </div>
      )}

      {/* Connections */}
      {person.connections && person.connections.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Users className="h-4 w-4" />
            <span>{person.connections.length} connection(s)</span>
          </div>
        </div>
      )}
    </Card>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">People Directory</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your business contacts and their helpfulness
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowConnectionModal(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Add Connection
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Person
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search people by name, notes, or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Select
            value={selectedSkill}
            onValueChange={setSelectedSkill}
          >
            <option value="">All Skills</option>
            {SKILL_CATEGORIES.map(skill => (
              <option key={skill} value={skill}>{skill}</option>
            ))}
          </Select>
          {(searchQuery || selectedSkill) && (
            <Button
              onClick={() => {
                setSearchQuery('')
                setSelectedSkill('')
              }}
              variant="outline"
              size="sm"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* People Grid */}
      {filteredPeople.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No people found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchQuery || selectedSkill 
              ? 'Try adjusting your search criteria'
              : 'Start by adding your first contact'
            }
          </p>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Person
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPeople.map(renderPersonCard)}
        </div>
      )}

      {/* Add Person Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Add New Person
                </h2>
                <Button
                  onClick={() => setShowAddModal(false)}
                  variant="ghost"
                  size="sm"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mobile">Mobile</Label>
                    <Input
                      id="mobile"
                      value={formData.mobile}
                      onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                      placeholder="Phone number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Email address"
                    />
                  </div>
                  <div>
                    <Label>Helpfulness Rating</Label>
                    <div className="flex items-center gap-2 mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, helpfulnessRating: star }))}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`h-6 w-6 ${
                              star <= (formData.helpfulnessRating || 0)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300 hover:text-yellow-300'
                            } transition-colors`}
                          />
                        </button>
                      ))}
                      {formData.helpfulnessRating > 0 && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, helpfulnessRating: 0 }))}
                          className="ml-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.helpfulnessRating === 0 
                        ? 'Not rated' 
                        : `${formData.helpfulnessRating} star${formData.helpfulnessRating > 1 ? 's' : ''}`
                      }
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="linkedin">LinkedIn URL</Label>
                    <Input
                      id="linkedin"
                      value={formData.linkedinUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                      placeholder="LinkedIn profile"
                    />
                  </div>
                  <div>
                    <Label htmlFor="facebook">Facebook URL</Label>
                    <Input
                      id="facebook"
                      value={formData.facebookUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, facebookUrl: e.target.value }))}
                      placeholder="Facebook profile"
                    />
                  </div>
                  <div>
                    <Label htmlFor="whatsapp">WhatsApp URL</Label>
                    <Input
                      id="whatsapp"
                      value={formData.whatsappUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, whatsappUrl: e.target.value }))}
                      placeholder="WhatsApp link"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes about this person..."
                    rows={3}
                  />
                </div>

                {/* Skills Section */}
                <div>
                  <Label>Skills</Label>
                  <div className="mt-2">
                    <ReactSelect
                      isMulti
                      options={skillOptions}
                      value={formData.skills.map(skill => ({
                        value: skill.skillName,
                        label: skill.skillName.charAt(0).toUpperCase() + skill.skillName.slice(1)
                      }))}
                      onChange={handleSkillsChange}
                      placeholder="Select skills..."
                      className="react-select-container"
                      classNamePrefix="react-select"
                      styles={{
                        control: (base) => ({
                          ...base,
                          minHeight: '40px',
                          borderColor: '#d1d5db',
                          '&:hover': {
                            borderColor: '#9ca3af'
                          }
                        }),
                        multiValue: (base) => ({
                          ...base,
                          backgroundColor: '#f3f4f6'
                        }),
                        multiValueLabel: (base) => ({
                          ...base,
                          color: '#374151'
                        })
                      }}
                    />
                  </div>
                  
                  {/* Skill Level Selectors */}
                  {formData.skills.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <Label className="text-sm font-medium">Set Skill Levels</Label>
                      {formData.skills.map((skill, index) => (
                        <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {skill.skillName.charAt(0).toUpperCase() + skill.skillName.slice(1)}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            {skillLevelOptions.map((option) => (
                              <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`skill-level-${skill.skillName}`}
                                  value={option.value}
                                  checked={skill.skillLevel === option.value}
                                  onChange={(e) => updateSkillLevel(skill.skillName, e.target.value)}
                                  className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  {option.label}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tags Section */}
                <div>
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-2 mb-2">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder="Type a tag and press Enter"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const input = e.target as HTMLInputElement
                        addTag(input.value.trim())
                        input.value = ''
                      }
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  onClick={() => setShowAddModal(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddPerson}
                  disabled={!formData.name.trim()}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Add Person
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Person Modal */}
      {showEditModal && editingPerson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Edit Person
                </h2>
                <Button
                  onClick={() => setShowEditModal(false)}
                  variant="ghost"
                  size="sm"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Same form as add modal but with update handler */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-name">Name *</Label>
                    <Input
                      id="edit-name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-mobile">Mobile</Label>
                    <Input
                      id="edit-mobile"
                      value={formData.mobile}
                      onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                      placeholder="Phone number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-email">Email</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Email address"
                    />
                  </div>
                  <div>
                    <Label>Helpfulness Rating</Label>
                    <div className="flex items-center gap-2 mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, helpfulnessRating: star }))}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`h-6 w-6 ${
                              star <= (formData.helpfulnessRating || 0)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300 hover:text-yellow-300'
                            } transition-colors`}
                          />
                        </button>
                      ))}
                      {formData.helpfulnessRating > 0 && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, helpfulnessRating: 0 }))}
                          className="ml-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.helpfulnessRating === 0 
                        ? 'Not rated' 
                        : `${formData.helpfulnessRating} star${formData.helpfulnessRating > 1 ? 's' : ''}`
                      }
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="edit-linkedin">LinkedIn URL</Label>
                    <Input
                      id="edit-linkedin"
                      value={formData.linkedinUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                      placeholder="LinkedIn profile"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-facebook">Facebook URL</Label>
                    <Input
                      id="edit-facebook"
                      value={formData.facebookUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, facebookUrl: e.target.value }))}
                      placeholder="Facebook profile"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-whatsapp">WhatsApp URL</Label>
                    <Input
                      id="edit-whatsapp"
                      value={formData.whatsappUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, whatsappUrl: e.target.value }))}
                      placeholder="WhatsApp link"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea
                    id="edit-notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes about this person..."
                    rows={3}
                  />
                </div>

                {/* Skills Section */}
                <div>
                  <Label>Skills</Label>
                  <div className="mt-2">
                    <ReactSelect
                      isMulti
                      options={skillOptions}
                      value={formData.skills.map(skill => ({
                        value: skill.skillName,
                        label: skill.skillName.charAt(0).toUpperCase() + skill.skillName.slice(1)
                      }))}
                      onChange={handleSkillsChange}
                      placeholder="Select skills..."
                      className="react-select-container"
                      classNamePrefix="react-select"
                      styles={{
                        control: (base) => ({
                          ...base,
                          minHeight: '40px',
                          borderColor: '#d1d5db',
                          '&:hover': {
                            borderColor: '#9ca3af'
                          }
                        }),
                        multiValue: (base) => ({
                          ...base,
                          backgroundColor: '#f3f4f6'
                        }),
                        multiValueLabel: (base) => ({
                          ...base,
                          color: '#374151'
                        })
                      }}
                    />
                  </div>
                  
                  {/* Skill Level Selectors */}
                  {formData.skills.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <Label className="text-sm font-medium">Set Skill Levels</Label>
                      {formData.skills.map((skill, index) => (
                        <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {skill.skillName.charAt(0).toUpperCase() + skill.skillName.slice(1)}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            {skillLevelOptions.map((option) => (
                              <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`skill-level-${skill.skillName}`}
                                  value={option.value}
                                  checked={skill.skillLevel === option.value}
                                  onChange={(e) => updateSkillLevel(skill.skillName, e.target.value)}
                                  className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  {option.label}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tags Section */}
                <div>
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-2 mb-2">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder="Type a tag and press Enter"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const input = e.target as HTMLInputElement
                        addTag(input.value.trim())
                        input.value = ''
                      }
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  onClick={() => setShowEditModal(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdatePerson}
                  disabled={!formData.name.trim()}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Update Person
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connection Modal */}
      {showConnectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Create Connection
                </h2>
                <Button
                  onClick={() => setShowConnectionModal(false)}
                  variant="ghost"
                  size="sm"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="person-a">Person A</Label>
                  <Select
                    value={connectionData.personAId}
                    onValueChange={(value) => setConnectionData(prev => ({ ...prev, personAId: value }))}
                  >
                    <option value="">Select person</option>
                    {people.map(person => (
                      <option key={person.id} value={person.id}>{person.name}</option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label htmlFor="person-b">Person B</Label>
                  <Select
                    value={connectionData.personBId}
                    onValueChange={(value) => setConnectionData(prev => ({ ...prev, personBId: value }))}
                  >
                    <option value="">Select person</option>
                    {people.map(person => (
                      <option key={person.id} value={person.id}>{person.name}</option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label htmlFor="relationship">Relationship Type</Label>
                  <Select
                    value={connectionData.relationshipType}
                    onValueChange={(value) => setConnectionData(prev => ({ ...prev, relationshipType: value as any }))}
                  >
                    {RELATIONSHIP_TYPES.map(type => (
                      <option key={type} value={type}>
                        {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label htmlFor="relationship-notes">Relationship Notes</Label>
                  <Textarea
                    id="relationship-notes"
                    value={connectionData.relationshipNotes}
                    onChange={(e) => setConnectionData(prev => ({ ...prev, relationshipNotes: e.target.value }))}
                    placeholder="Additional notes about this relationship..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  onClick={() => setShowConnectionModal(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateConnection}
                  disabled={!connectionData.personAId || !connectionData.personBId || connectionData.personAId === connectionData.personBId}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Connection
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
