import { supabase } from './supabase'
import type { Person, PersonSkill, PersonConnection } from '@/types'

export class PeopleService {
  // Get all people for the current user
  static async getPeople(): Promise<Person[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data: people, error } = await supabase
        .from('people')
        .select(`
          *,
          people_skills (*),
          people_connections!people_connections_person_a_id_fkey (
            *,
            person_b:people!people_connections_person_b_id_fkey (*)
          )
        `)
        .eq('user_id', user.id)
        .order('helpfulness_rating', { ascending: false, nullsLast: true })
        .order('created_at', { ascending: false })

      if (error) throw error

      return people?.map(this.transformPerson) || []
    } catch (error) {
      console.error('Error fetching people:', error)
      throw error
    }
  }

  // Get a single person by ID
  static async getPerson(id: string): Promise<Person | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data: person, error } = await supabase
        .from('people')
        .select(`
          *,
          people_skills (*),
          people_connections!people_connections_person_a_id_fkey (
            *,
            person_b:people!people_connections_person_b_id_fkey (*)
          )
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      return person ? this.transformPerson(person) : null
    } catch (error) {
      console.error('Error fetching person:', error)
      throw error
    }
  }

  // Create a new person
  static async createPerson(personData: Omit<Person, 'id' | 'createdAt' | 'updatedAt'>): Promise<Person> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data: person, error } = await supabase
        .from('people')
        .insert({
          user_id: user.id,
          name: personData.name,
          mobile: personData.mobile,
          email: personData.email,
          linkedin_url: personData.linkedinUrl,
          facebook_url: personData.facebookUrl,
          whatsapp_url: personData.whatsappUrl,
          notes: personData.notes,
          helpfulness_rating: personData.helpfulnessRating,
          tags: personData.tags || []
        })
        .select()
        .single()

      if (error) throw error

      // Add skills if provided
      if (personData.skills && personData.skills.length > 0) {
        await this.addSkillsToPerson(person.id, personData.skills)
      }

      return this.transformPerson(person)
    } catch (error) {
      console.error('Error creating person:', error)
      throw error
    }
  }

  // Update a person
  static async updatePerson(id: string, personData: Partial<Omit<Person, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Person> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const updateData: any = {
        updated_at: new Date().toISOString()
      }

      if (personData.name !== undefined) updateData.name = personData.name
      if (personData.mobile !== undefined) updateData.mobile = personData.mobile
      if (personData.email !== undefined) updateData.email = personData.email
      if (personData.linkedinUrl !== undefined) updateData.linkedin_url = personData.linkedinUrl
      if (personData.facebookUrl !== undefined) updateData.facebook_url = personData.facebookUrl
      if (personData.whatsappUrl !== undefined) updateData.whatsapp_url = personData.whatsappUrl
      if (personData.notes !== undefined) updateData.notes = personData.notes
      if (personData.helpfulnessRating !== undefined) updateData.helpfulness_rating = personData.helpfulnessRating
      if (personData.tags !== undefined) updateData.tags = personData.tags

      const { data: person, error } = await supabase
        .from('people')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      // Update skills if provided
      if (personData.skills !== undefined) {
        await this.updatePersonSkills(id, personData.skills)
      }

      return this.transformPerson(person)
    } catch (error) {
      console.error('Error updating person:', error)
      throw error
    }
  }

  // Delete a person
  static async deletePerson(id: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('people')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting person:', error)
      throw error
    }
  }

  // Add skills to a person
  static async addSkillsToPerson(personId: string, skills: Omit<PersonSkill, 'id' | 'personId' | 'createdAt'>[]): Promise<void> {
    try {
      const skillsData = skills.map(skill => ({
        person_id: personId,
        skill_name: skill.skillName,
        skill_level: skill.skillLevel
      }))

      const { error } = await supabase
        .from('people_skills')
        .insert(skillsData)

      if (error) throw error
    } catch (error) {
      console.error('Error adding skills to person:', error)
      throw error
    }
  }

  // Update person skills (replace all skills)
  static async updatePersonSkills(personId: string, skills: Omit<PersonSkill, 'id' | 'personId' | 'createdAt'>[]): Promise<void> {
    try {
      // First delete existing skills
      await supabase
        .from('people_skills')
        .delete()
        .eq('person_id', personId)

      // Then add new skills
      if (skills.length > 0) {
        await this.addSkillsToPerson(personId, skills)
      }
    } catch (error) {
      console.error('Error updating person skills:', error)
      throw error
    }
  }

  // Create a connection between two people
  static async createConnection(connectionData: Omit<PersonConnection, 'id' | 'createdAt'>): Promise<PersonConnection> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data: connection, error } = await supabase
        .from('people_connections')
        .insert({
          user_id: user.id,
          person_a_id: connectionData.personAId,
          person_b_id: connectionData.personBId,
          relationship_type: connectionData.relationshipType,
          relationship_notes: connectionData.relationshipNotes
        })
        .select()
        .single()

      if (error) throw error

      return this.transformConnection(connection)
    } catch (error) {
      console.error('Error creating connection:', error)
      throw error
    }
  }

  // Delete a connection
  static async deleteConnection(connectionId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('people_connections')
        .delete()
        .eq('id', connectionId)
        .eq('user_id', user.id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting connection:', error)
      throw error
    }
  }

  // Search people by name or skills
  static async searchPeople(query: string): Promise<Person[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data: people, error } = await supabase
        .from('people')
        .select(`
          *,
          people_skills (*),
          people_connections!people_connections_person_a_id_fkey (
            *,
            person_b:people!people_connections_person_b_id_fkey (*)
          )
        `)
        .eq('user_id', user.id)
        .or(`name.ilike.%${query}%,notes.ilike.%${query}%`)
        .order('helpfulness_rating', { ascending: false, nullsLast: true })

      if (error) throw error

      return people?.map(this.transformPerson) || []
    } catch (error) {
      console.error('Error searching people:', error)
      throw error
    }
  }

  // Get people by skill
  static async getPeopleBySkill(skillName: string): Promise<Person[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data: people, error } = await supabase
        .from('people')
        .select(`
          *,
          people_skills (*),
          people_connections!people_connections_person_a_id_fkey (
            *,
            person_b:people!people_connections_person_b_id_fkey (*)
          )
        `)
        .eq('user_id', user.id)
        .eq('people_skills.skill_name', skillName)
        .order('helpfulness_rating', { ascending: false, nullsLast: true })

      if (error) throw error

      return people?.map(this.transformPerson) || []
    } catch (error) {
      console.error('Error fetching people by skill:', error)
      throw error
    }
  }

  // Transform database person to our Person interface
  private static transformPerson(dbPerson: any): Person {
    return {
      id: dbPerson.id,
      name: dbPerson.name,
      mobile: dbPerson.mobile,
      email: dbPerson.email,
      linkedinUrl: dbPerson.linkedin_url,
      facebookUrl: dbPerson.facebook_url,
      whatsappUrl: dbPerson.whatsapp_url,
      notes: dbPerson.notes,
      helpfulnessRating: dbPerson.helpfulness_rating,
      createdAt: dbPerson.created_at,
      updatedAt: dbPerson.updated_at,
      tags: dbPerson.tags || [],
      skills: dbPerson.people_skills?.map(this.transformSkill) || [],
      connections: dbPerson.people_connections?.map(this.transformConnection) || []
    }
  }

  // Transform database skill to our PersonSkill interface
  private static transformSkill(dbSkill: any): PersonSkill {
    return {
      id: dbSkill.id,
      personId: dbSkill.person_id,
      skillName: dbSkill.skill_name,
      skillLevel: dbSkill.skill_level,
      createdAt: dbSkill.created_at
    }
  }

  // Transform database connection to our PersonConnection interface
  private static transformConnection(dbConnection: any): PersonConnection {
    return {
      id: dbConnection.id,
      personAId: dbConnection.person_a_id,
      personBId: dbConnection.person_b_id,
      relationshipType: dbConnection.relationship_type,
      relationshipNotes: dbConnection.relationship_notes,
      createdAt: dbConnection.created_at
    }
  }
}

// Predefined skill categories for easy selection
export const SKILL_CATEGORIES = [
  'debt / lending',
  'ui ux',
  'coding',
  'seo',
  'thumbnail',
  'marketing',
  'video editing',
  'project management',
  'startup funding',
  'design',
  'content creation',
  'sales',
  'business development',
  'legal',
  'accounting',
  'networking',
  'mentoring',
  'consulting'
] as const

export const RELATIONSHIP_TYPES = [
  'colleague',
  'friend',
  'family',
  'business_partner',
  'mentor',
  'mentee',
  'client',
  'vendor',
  'other'
] as const
