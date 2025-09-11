import { supabase } from '../lib/supabase'

export async function testDataIsolation() {
  try {
    // Test that we can query our own data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
    
    if (userError) {
      console.error('Error fetching user data:', userError)
      return false
    }

    // Test that we can query schools (should be empty initially)
    const { data: schoolsData, error: schoolsError } = await supabase
      .from('schools')
      .select('*')
    
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