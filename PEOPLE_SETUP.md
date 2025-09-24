# People Directory Setup Guide

This guide will help you set up the People Directory feature in your Self-Management app. The People Directory allows you to manage your business contacts, track their helpfulness/usefulness, and organize their skills and connections.

## Features

### Core Functionality
- **Contact Management**: Store names, mobile numbers, emails, and social media links
- **Helpfulness Rating**: Rate people from 1-5 stars based on their usefulness to your business
- **Advanced Skills Tracking**: Multi-select interface for easy skill management
- **Connection Mapping**: Track relationships between people in your network
- **Search & Filter**: Find people by name, skills, or notes
- **Tags System**: Add custom tags for better organization

### Enhanced Skills Management
- **Multi-Select Dropdown**: Choose multiple skills simultaneously
- **Individual Skill Levels**: Set different expertise levels for each skill
- **Visual Skill Tags**: See selected skills as colored badges
- **Quick Selection**: Search and filter skills in the dropdown
- **Easy Removal**: Remove skills with a single click

### Predefined Skill Categories
The system comes with predefined skill categories that match your business needs:
- debt / lending
- ui ux
- coding
- seo
- thumbnail
- marketing
- video editing
- project management
- startup funding
- design
- content creation
- sales
- business development
- legal
- accounting
- networking
- mentoring
- consulting

## Database Setup

### 1. Run the Database Schema
Execute the updated `supabase_schema.sql` file in your Supabase SQL editor to create the required tables:

```sql
-- The schema includes:
-- - people table (main contact information)
-- - people_skills table (skills and expertise levels)
-- - people_connections table (relationships between people)
-- - Row Level Security (RLS) policies
-- - Proper indexes for performance
```

### 2. Verify Tables Created
After running the schema, verify these tables exist in your Supabase dashboard:
- `public.people`
- `public.people_skills`
- `public.people_connections`

## Usage Guide

### Adding People
1. Navigate to the "People" section in your app
2. Click "Add Person" button
3. Fill in the contact information:
   - **Name** (required)
   - **Mobile** number
   - **Email** address
   - **Social Media Links** (LinkedIn, Facebook, WhatsApp)
   - **Helpfulness Rating** (1-5 stars)
   - **Notes** about the person
4. Add skills by selecting from predefined categories
5. Add custom tags for better organization
6. Save the person

### Managing Skills
- **Multi-Select Interface**: Choose multiple skills at once using the modern dropdown
- **Predefined Categories**: Select from 18 predefined skill categories
- **Skill Levels**: Set individual levels (Beginner, Intermediate, Advanced, Expert) for each skill
- **Easy Management**: Add/remove skills with a single click
- **Visual Feedback**: See selected skills as colored tags
- Skills help you find the right people for specific tasks

### Creating Connections
1. Click "Add Connection" button
2. Select two people from your directory
3. Choose relationship type:
   - Colleague
   - Friend
   - Family
   - Business Partner
   - Mentor/Mentee
   - Client/Vendor
   - Other
4. Add notes about the relationship
5. Save the connection

### Searching and Filtering
- **Search**: Use the search bar to find people by name, notes, or skills
- **Filter by Skill**: Use the skill dropdown to filter people by specific expertise
- **Clear Filters**: Click the X button to clear all filters

### Rating System
Rate people based on their helpfulness to your business:
- **5 Stars**: Extremely helpful, go-to person
- **4 Stars**: Very helpful, reliable
- **3 Stars**: Moderately helpful
- **2 Stars**: Somewhat helpful
- **1 Star**: Minimal help
- **No Rating**: Haven't worked with them yet

## Data Structure

### Person Object
```typescript
interface Person {
  id: string;
  name: string;
  mobile?: string;
  email?: string;
  linkedinUrl?: string;
  facebookUrl?: string;
  whatsappUrl?: string;
  notes?: string;
  helpfulnessRating?: number; // 1-5 stars
  createdAt: string;
  updatedAt: string;
  tags: string[];
  skills?: PersonSkill[];
  connections?: PersonConnection[];
}
```

### Skills
```typescript
interface PersonSkill {
  id: string;
  personId: string;
  skillName: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  createdAt: string;
}
```

### Connections
```typescript
interface PersonConnection {
  id: string;
  personAId: string;
  personBId: string;
  relationshipType: 'colleague' | 'friend' | 'family' | 'business_partner' | 'mentor' | 'mentee' | 'client' | 'vendor' | 'other';
  relationshipNotes?: string;
  createdAt: string;
}
```

## API Endpoints

The PeopleService provides these methods:

### Person Management
- `getPeople()` - Get all people
- `getPerson(id)` - Get specific person
- `createPerson(data)` - Add new person
- `updatePerson(id, data)` - Update person
- `deletePerson(id)` - Remove person

### Skills Management
- `addSkillsToPerson(personId, skills)` - Add skills to person
- `updatePersonSkills(personId, skills)` - Replace all skills

### Connections Management
- `createConnection(data)` - Create relationship
- `deleteConnection(id)` - Remove relationship

### Search & Filter
- `searchPeople(query)` - Search by name/notes/skills
- `getPeopleBySkill(skillName)` - Filter by specific skill

## Best Practices

### 1. Consistent Naming
- Use full names for better searchability
- Include nicknames in notes if needed

### 2. Skill Organization
- Use predefined categories when possible
- Be specific about skill levels
- Add multiple relevant skills per person

### 3. Rating Guidelines
- Rate based on actual business value
- Update ratings as relationships evolve
- Consider both quality and reliability

### 4. Connection Mapping
- Map key business relationships
- Include context in relationship notes
- Track both professional and personal connections

### 5. Tag Usage
- Use tags for project-specific groupings
- Create tags for industries or specializations
- Keep tag names consistent

## Troubleshooting

### Common Issues

1. **People not loading**
   - Check Supabase connection
   - Verify RLS policies are enabled
   - Ensure user is authenticated

2. **Skills not saving**
   - Verify skill name is not empty
   - Check that skill level is selected
   - Ensure person exists before adding skills

3. **Connections not working**
   - Verify both people exist in the system
   - Check that person A and person B are different
   - Ensure relationship type is selected

### Database Issues
- Check Supabase logs for error messages
- Verify table permissions
- Ensure RLS policies are correctly configured

## Future Enhancements

The People Directory is designed to be extensible. Potential future features:
- Import/Export contacts
- Bulk operations
- Advanced filtering options
- Contact history tracking
- Integration with external contact systems
- Automated skill suggestions
- Relationship strength indicators

## Support

If you encounter any issues:
1. Check the browser console for error messages
2. Verify your Supabase configuration
3. Ensure all database tables are created
4. Check that RLS policies are properly set up

The People Directory is now fully integrated into your Self-Management app and ready to help you organize your business network!
