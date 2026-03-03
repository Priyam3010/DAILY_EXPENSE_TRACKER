import { useState, useEffect, useMemo } from 'react'
import { Plus, Trash2, Search, Filter, Download, ArrowUpRight, TrendingUp, Calendar, CreditCard } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { format, startOfMonth, isToday, isWithinInterval, endOfMonth, parseISO } from 'date-fns'

const CATEGORIES = [
  { name: 'Food', color: '#f87171' },
  { name: 'Transport', color: '#60a5fa' },
  { name: 'Shopping', color: '#fbbf24' },
  { name: 'Bills', color: '#34d399' },
  { name: 'Health', color: '#f472b6' },
  { name: 'Entertainment', color: '#a78bfa' },
  { name: 'Other', color: '#94a3b8' },
]

export default function App() {
  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('expenses')
    return saved ? JSON.parse(saved) : []
  })

  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Food')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('All')

  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses))
  }, [expenses])

  const handleAddExpense = (e) => {
    e.preventDefault()
    if (!description || !amount) return

    const newExpense = {
      id: crypto.randomUUID(),
      description,
      amount: parseFloat(amount),
      category,
      date,
      createdAt: new Date().toISOString()
    }

    setExpenses([newExpense, ...expenses])
    setDescription('')
    setAmount('')
    setCategory('Food')
    setDate(format(new Date(), 'yyyy-MM-dd'))
  }

  const handleDeleteExpense = (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      setExpenses(expenses.filter(e => e.id !== id))
    }
  }

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = filterCategory === 'All' || expense.category === filterCategory
      return matchesSearch && matchesCategory
    })
  }, [expenses, searchTerm, filterCategory])

  const totals = useMemo(() => {
    const today = new Date()
    const monthStart = startOfMonth(today)
    const monthEnd = endOfMonth(today)

    return expenses.reduce((acc, curr) => {
      const expenseDate = parseISO(curr.date)
      if (isToday(expenseDate)) {
        acc.today += curr.amount
      }
      if (isWithinInterval(expenseDate, { start: monthStart, end: monthEnd })) {
        acc.month += curr.amount
      }
      return acc
    }, { today: 0, month: 0 })
  }, [expenses])

  const chartData = useMemo(() => {
    const data = CATEGORIES.map(cat => ({
      name: cat.name,
      value: expenses
        .filter(e => e.category === cat.name)
        .reduce((sum, e) => sum + e.amount, 0),
      color: cat.color
    })).filter(d => d.value > 0)
    return data
  }, [expenses])

  const handleReset = () => {
    if (window.confirm('Are you sure you want to clear all expense data? This action cannot be undone.')) {
      setExpenses([])
      localStorage.removeItem('expenses')
    }
  }

  const handleExportCSV = () => {
    const headers = ['Date,Category,Description,Amount (₹)']
    const rows = expenses.map(e => `${e.date},${e.category},${e.description},${e.amount}`)
    const csvContent = headers.concat(rows).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `expenses_${format(new Date(), 'yyyy-MM-dd')}.csv`)
    link.click()
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12">
      {/* Header */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <TrendingUp size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">SpendWise</h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleReset}
              className="text-slate-400 hover:text-red-500 p-2 rounded-lg transition-colors text-xs font-semibold uppercase tracking-wider"
            >
              Reset Data
            </button>
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Form and Dashboard */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-3 text-emerald-500/10 group-hover:text-emerald-500/20 transition-colors">
                  <ArrowUpRight size={48} />
                </div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today</p>
                <p className="text-2xl font-bold mt-1 text-slate-800">₹{totals.today.toLocaleString()}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-3 text-indigo-500/10 group-hover:text-indigo-500/20 transition-colors">
                  <ArrowUpRight size={48} />
                </div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">This Month</p>
                <p className="text-2xl font-bold mt-1 text-slate-800">₹{totals.month.toLocaleString()}</p>
              </div>
            </div>

            {/* Add Expense Form */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Plus size={20} className="text-indigo-600" />
                Add New Expense
              </h2>
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Description</label>
                  <input
                    type="text"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Starbucks Coffee"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Amount (₹)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none appearance-none"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.name} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <Plus size={20} />
                  Add Expense
                </button>
              </form>
            </div>

            {/* Category Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold mb-4">Spending Breakdown</h2>
              <div className="h-64 w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <TrendingUp size={32} className="mb-2 opacity-20" />
                    <p className="text-sm">No data to display</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: List & Filters */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search and Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="pl-10 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none appearance-none font-medium text-slate-600"
                >
                  <option value="All">All Categories</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat.name} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Expenses List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-bold">Recent Expenses</h2>
                <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                  {filteredExpenses.length} Total
                </span>
              </div>
              
              <div className="divide-y divide-slate-100">
                {filteredExpenses.length > 0 ? (
                  filteredExpenses.map((expense) => {
                    const catColor = CATEGORIES.find(c => c.name === expense.category)?.color || '#94a3b8'
                    return (
                      <div key={expense.id} className="p-4 sm:p-6 hover:bg-slate-50/50 transition-colors group">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1">
                            <div 
                              className="w-12 h-12 rounded-full hidden sm:flex items-center justify-center shrink-0"
                              style={{ backgroundColor: `${catColor}15`, color: catColor }}
                            >
                              <CreditCard size={20} />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-slate-800 truncate">{expense.description}</h3>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                <span className="flex items-center gap-1 text-xs text-slate-400">
                                  <Calendar size={12} />
                                  {format(parseISO(expense.date), 'MMM dd, yyyy')}
                                </span>
                                <span 
                                  className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full"
                                  style={{ backgroundColor: `${catColor}15`, color: catColor }}
                                >
                                  {expense.category}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <span className="text-lg font-bold text-slate-900 leading-none">
                              ₹{expense.amount.toLocaleString()}
                            </span>
                            <button
                              onClick={() => handleDeleteExpense(expense.id)}
                              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                              aria-label="Delete expense"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="py-20 flex flex-col items-center justify-center text-slate-400 px-6 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                      <Search size={32} className="opacity-20" />
                    </div>
                    <p className="font-medium text-slate-500">No expenses found</p>
                    <p className="text-sm mt-1">Try adding a new expense or adjusting your filters.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
