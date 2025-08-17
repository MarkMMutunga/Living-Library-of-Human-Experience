'use client'

export function CreateFragmentButton() {
  return (
    <button 
      onClick={() => window.location.href = '/create'}
      className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium"
    >
      Create Fragment
    </button>
  )
}
