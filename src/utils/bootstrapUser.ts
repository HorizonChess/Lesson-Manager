import { supabase } from '../lib/supabase'

export async function manualBootstrap() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.log('No authenticated user found')
      return false
    }

    console.log('Current user:', user.id, user.email)

    // Check if user exists in our users table
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single()

    console.log('Existing user check:', { existingUser, selectError })

    if (!existingUser && selectError?.code === 'PGRST116') {
      // User doesn't exist, create them
      console.log('Creating user record...')
      
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email!,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating user:', error)
        return false
      }

      console.log('User created successfully:', data)
      return true
    } else if (existingUser) {
      console.log('User already exists in users table')
      return true
    } else {
      console.error('Unexpected error:', selectError)
      return false
    }
  } catch (error) {
    console.error('Bootstrap failed:', error)
    return false
  }
}