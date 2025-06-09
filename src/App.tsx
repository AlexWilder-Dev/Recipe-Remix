import { useState, useEffect } from 'react'
import html2pdf from 'html2pdf.js'
import clsx from 'clsx'

export interface Recipe {
  title: string
  description: string
  ingredients: string[]
  steps: string[]
}

const defaultRecipes: Recipe[] = [
  { title: 'Loading...', description: '', ingredients: [], steps: [] },
  { title: 'Loading...', description: '', ingredients: [], steps: [] },
  { title: 'Loading...', description: '', ingredients: [], steps: [] }
]

function App() {
  const [query, setQuery] = useState('')
  const [recipes, setRecipes] = useState<Recipe[]>(defaultRecipes)
  const [loading, setLoading] = useState(false)
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    if (dark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [dark])

  const fetchRecipes = async (prompt: string) => {
    setLoading(true)
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a helpful chef.' },
            { role: 'user', content: `Give me 3 recipes using: ${prompt}` }
          ]
        })
      })
      const data = await response.json()
      const text = data.choices?.[0]?.message?.content || ''
      const parsed: Recipe[] = JSON.parse(text)
      setRecipes(parsed)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    if (!query) return
    fetchRecipes(query)
  }

  const saveRecipe = (recipe: Recipe) => {
    const saved = JSON.parse(localStorage.getItem('cookbook') || '[]')
    localStorage.setItem('cookbook', JSON.stringify([...saved, recipe]))
  }

  const downloadRecipe = (recipe: Recipe) => {
    const element = document.createElement('div')
    element.innerHTML = `
      <h1>${recipe.title}</h1>
      <p>${recipe.description}</p>
      <h2>Ingredients</h2>
      <ul>${recipe.ingredients.map(i => `<li>${i}</li>`).join('')}</ul>
      <h2>Steps</h2>
      <ol>${recipe.steps.map(s => `<li>${s}</li>`).join('')}</ol>
    `
    html2pdf().from(element).save(`${recipe.title}.pdf`)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold text-primary">Recipe Remix</h1>
          <button
            onClick={() => setDark(d => !d)}
            aria-label="Toggle dark mode"
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            {dark ? '🌙' : '☀️'}
          </button>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-8 max-w-4xl mx-auto w-full">
        <div className="relative mb-8 max-w-xl mx-auto">
          <label htmlFor="search" className="sr-only">Search recipes</label>
          <span aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            id="search"
            type="text"
            className="w-full pl-10 pr-28 py-3 rounded-full shadow-inner focus:outline-none focus:ring-2 focus:ring-primary/60 transition"
            placeholder="Type ingredients to inspire recipes..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button
            onClick={handleSearch}
            aria-label="Search recipes"
            disabled={!query || loading}
            className={clsx(
              'absolute right-1 top-1/2 -translate-y-1/2 px-4 py-2 rounded-full text-white bg-gradient-to-r from-primary to-accent shadow hover:shadow-lg transition',
              (!query || loading) && 'opacity-50 cursor-not-allowed'
            )}
          >
            Search
          </button>
        </div>
        {loading && <p role="status" aria-live="polite" className="text-center">Loading...</p>}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
          {recipes.map((r, idx) => (
            <div key={idx} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 flex flex-col animate-fade hover:shadow-2xl transition">
              <h2 className="text-xl font-semibold mb-2 text-primary">{r.title}</h2>
              <p className="mb-2 text-sm">{r.description}</p>
              <h3 className="font-semibold">Ingredients</h3>
              <ul className="mb-2 space-y-1">
                {r.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-start"><span className="mr-2" aria-hidden="true">🥕</span>{ing}</li>
                ))}
              </ul>
              <h3 className="font-semibold">Steps</h3>
              <ol className="list-decimal list-inside mb-4 space-y-1">
                {r.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
              <div className="mt-auto flex space-x-2">
                <button
                  onClick={() => fetchRecipes(`${query} but spicier`)}
                  aria-label="Remix recipe"
                  className="bg-gradient-to-r from-orange-400 to-pink-500 text-white px-3 py-1 rounded-full shadow hover:shadow-md transition-transform hover:-translate-y-0.5"
                >
                  Remix
                </button>
                <button
                  onClick={() => saveRecipe(r)}
                  aria-label="Save recipe"
                  className="bg-green-600 text-white px-3 py-1 rounded-full shadow hover:shadow-md"
                >
                  Save
                </button>
                <button
                  onClick={() => downloadRecipe(r)}
                  aria-label="Download recipe as PDF"
                  className="bg-gray-700 text-white px-3 py-1 rounded-full shadow hover:shadow-md"
                >
                  PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
      {!loading && query && (
        <button
          onClick={() => fetchRecipes(`${query} with a twist`)}
          aria-label="Remix all recipes"
          className="fixed bottom-6 right-6 bg-gradient-to-r from-primary to-accent text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-transform hover:-translate-y-1"
        >
          <span aria-hidden="true">🔀</span>
        </button>
      )}
    </div>
  )
}

export default App
