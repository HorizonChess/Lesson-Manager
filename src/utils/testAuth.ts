import { supabase } from '../lib/supabase'

export async function testDataIsolation() {
  try {
    const currentUser = await getCurrentUser()
    console.log('Current auth user:', currentUser)

    // Test that we can query our own data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
    
    console.log('Users query:', { userData, userError })
    
    if (userError) {
      console.error('Error fetching user data:', userError)
      // If user doesn't exist in our table, try to create them
      if (userError.code === 'PGRST116' && currentUser) {
        console.log('User not found in users table, creating...')
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: currentUser.id,
            email: currentUser.email!,
          })
        
        if (insertError) {
          console.error('Error creating user:', insertError)
          return false
        }
        console.log('User created successfully')
      } else {
        return false
      }
    }

    // Test that we can query schools (should be empty initially)
    const { data: schoolsData, error: schoolsError } = await supabase
      .from('schools')
      .select('*')
    
    console.log('Schools query:', { schoolsData, schoolsError })
    
    if (schoolsError) {
      console.error('Error fetching schools data:', schoolsError)
      return false
    }

    console.log('User data:', userData)
    console.log('Schools data:', schoolsData)
    
    return true
  } catch (error) {
    console.error('Test failed:', error)
    return false
  }
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}