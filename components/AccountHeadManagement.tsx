'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { toast } from 'react-hot-toast'

interface AccountHead {
  id: string
  name: string
  description: string
  created_at: string
}

export default function AccountHeadManagement() {
  const [accountHeads, setAccountHeads] = useState<AccountHead[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  useEffect(() => {
    fetchAccountHeads()
  }, [])

  const fetchAccountHeads = async () => {
    try {
      const { data, error } = await supabase
        .from('account_heads')
        .select('*')
        .order('name')

      if (error) throw error
      setAccountHeads(data || [])
    } catch (error) {
      console.error('Error fetching account heads:', error)
      toast.error('Failed to load account heads')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data, error } = await supabase
        .from('account_heads')
        .insert([formData])
        .select()

      if (error) throw error
      setAccountHeads([...(data || []), ...accountHeads])
      setFormData({ name: '', description: '' })
      toast.success('Account head added successfully')
    } catch (error) {
      console.error('Error adding account head:', error)
      toast.error('Failed to add account head')
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return

    try {
      const { error } = await supabase
        .from('account_heads')
        .update(formData)
        .eq('id', editingId)

      if (error) throw error
      
      setAccountHeads(accountHeads.map(head => 
        head.id === editingId ? { ...head, ...formData } : head
      ))
      setEditingId(null)
      setFormData({ name: '', description: '' })
      toast.success('Account head updated successfully')
    } catch (error) {
      console.error('Error updating account head:', error)
      toast.error('Failed to update account head')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this account head?')) return

    try {
      const { error } = await supabase
        .from('account_heads')
        .delete()
        .eq('id', id)

      if (error) throw error
      setAccountHeads(accountHeads.filter(head => head.id !== id))
      toast.success('Account head deleted successfully')
    } catch (error) {
      console.error('Error deleting account head:', error)
      toast.error('Failed to delete account head')
    }
  }

  const startEdit = (head: AccountHead) => {
    setEditingId(head.id)
    setFormData({
      name: head.name,
      description: head.description
    })
  }

  if (loading) {
    return <div className="text-center">Loading account heads...</div>
  }

  return (
    <div className="space-y-6">
      <form onSubmit={editingId ? handleEdit : handleAdd} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <input
            type="text"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {editingId ? 'Update' : 'Add'} Account Head
        </button>
        {editingId && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null)
              setFormData({ name: '', description: '' })
            }}
            className="ml-2 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
        )}
      </form>

      <div className="mt-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {accountHeads.map(head => (
              <tr key={head.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{head.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{head.description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => startEdit(head)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(head.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
