import { useState } from 'react'
import html2pdf from 'html2pdf.js'

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
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-4 text-center">Recipe Remix</h1>
      <div className="flex mb-6 justify-center">
        <input
          type="text"
          className="border p-2 rounded w-2/3 mr-2"
          placeholder="chicken, rice, spinach"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button onClick={handleSearch} className="bg-blue-500 text-white px-4 py-2 rounded">
          Search
        </button>
      </div>
      {loading && <p className="text-center">Loading...</p>}
      <div className="grid gap-4 md:grid-cols-3">
        {recipes.map((r, idx) => (
          <div key={idx} className="bg-white shadow rounded p-4 flex flex-col">
            <h2 className="text-xl font-semibold mb-2">{r.title}</h2>
            <p className="mb-2">{r.description}</p>
            <h3 className="font-semibold">Ingredients</h3>
            <ul className="list-disc list-inside mb-2">
              {r.ingredients.map((ing, i) => (
                <li key={i}>{ing}</li>
              ))}
            </ul>
            <h3 className="font-semibold">Steps</h3>
            <ol className="list-decimal list-inside mb-4">
              {r.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
            <div className="mt-auto flex space-x-2">
              <button
                onClick={() => fetchRecipes(`${query} but spicier`)}
                className="bg-orange-500 text-white px-2 py-1 rounded"
              >
                Remix
              </button>
              <button
                onClick={() => saveRecipe(r)}
                className="bg-green-600 text-white px-2 py-1 rounded"
              >
                Save to Cookbook
              </button>
              <button
                onClick={() => downloadRecipe(r)}
                className="bg-gray-700 text-white px-2 py-1 rounded"
              >
                Download as PDF
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
