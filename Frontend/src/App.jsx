import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTasks } from './features/tasks/hooks/useTasks'
import TaskList from './features/tasks/components/TaskList'
import TaskForm from './features/tasks/components/TaskForm'
import TaskFilter from './features/tasks/components/TaskFilter'
import SortSelector from './features/tasks/components/SortSelector'
import Pagination from './features/tasks/components/Pagination'
import ConfirmDialog from './components/ConfirmDialog/ConfirmDialog'
import Modal from './components/Modal/Modal'
import { deleteTask, toggleTaskStatus } from './features/tasks/api/taskApi'
import './App.css'

function App() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialSearch = searchParams.get('search') || ''
  const initialStatus = searchParams.get('status') || ''
  const initialSortBy = searchParams.get('sortBy') || 'CREATED_AT'
  const initialSortDir = searchParams.get('sortDir') || 'DESC'
  const initialPage = parseInt(searchParams.get('page') || '0', 10)

  const { tasks, setTasks, loading, error, pagination, filters, setSearch, setStatusFilter, setSort, setPage, refetch } = useTasks({
    initialSearch,
    initialStatus,
    initialSortBy,
    initialSortDir,
    initialPage
  })

  // Sync filter state to URL
  useEffect(() => {
    const newParams = new URLSearchParams()
    if (filters.search) newParams.set('search', filters.search)
    if (filters.status) newParams.set('status', filters.status)
    if (filters.sortBy && filters.sortBy !== 'CREATED_AT') newParams.set('sortBy', filters.sortBy)
    if (filters.sortDir && filters.sortDir !== 'DESC') newParams.set('sortDir', filters.sortDir)
    if (pagination.page > 0) newParams.set('page', pagination.page.toString())
    setSearchParams(newParams, { replace: true })
  }, [filters.search, filters.status, filters.sortBy, filters.sortDir, pagination.page, setSearchParams])

  // -- UI State --
  const [editingTask, setEditingTask] = useState(null)
  const [deletingTask, setDeletingTask] = useState(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const togglingTaskIds = useRef(new Set())

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingTask) return
    try {
      await deleteTask(deletingTask.id)
      showToast('Xóa công việc thành công!')
      refetch()
    } catch (error) {
      if (error.status === 404) {
        showToast('Công việc này không còn tồn tại, có thể đã bị xóa', 'error')
        refetch()
      } else {
        showToast(error.message || 'Lỗi khi xóa công việc', 'error')
      }
    } finally {
      setDeletingTask(null)
    }
  }

  const handleToggle = async (id) => {
    if (togglingTaskIds.current.has(id)) return

    const taskIndex = tasks.findIndex(t => t.id === id)
    if (taskIndex === -1) return
    const task = tasks[taskIndex]
    const originalStatus = task.status
    const newStatus = originalStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED'

    togglingTaskIds.current.add(id)
    setTasks(currentTasks => {
      const idx = currentTasks.findIndex(t => t.id === id)
      if (idx === -1) return currentTasks
      const updated = [...currentTasks]
      updated[idx] = { ...updated[idx], status: newStatus }
      return updated
    })

    try {
      await toggleTaskStatus(id)
    } catch (error) {
      setTasks(currentTasks => {
        const idx = currentTasks.findIndex(t => t.id === id)
        if (idx === -1) return currentTasks
        const reverted = [...currentTasks]
        reverted[idx] = { ...reverted[idx], status: originalStatus }
        return reverted
      })
      showToast('Không thể cập nhật trạng thái, công việc có thể đã bị thay đổi hoặc xóa', 'error')
    } finally {
      togglingTaskIds.current.delete(id)
    }
  }

  return (
    <div className="app">
      {/* ── Toast ── */}
      {toast && (
        <div className={`toast-notification toast--${toast.type}`} role="alert">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {toast.message}
        </div>
      )}

      {/* ── Sidebar Overlay (mobile) ── */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ══════════════ SIDEBAR ══════════════ */}
      <aside className={`app-sidebar${sidebarOpen ? ' app-sidebar--open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <span className="material-symbols-outlined sidebar-brand__icon fill">task_alt</span>
          <div>
            <div className="sidebar-brand__title">TaskFlow</div>
            <div className="sidebar-brand__subtitle">Productivity Mode</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav" aria-label="Main navigation">
          <button className="sidebar-nav__link sidebar-nav__link--active">
            <span className="material-symbols-outlined">dashboard</span>
            Dashboard
          </button>
          <button className="sidebar-nav__link" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
            <span className="material-symbols-outlined">calendar_today</span>
            Lịch
          </button>
        </nav>

        {/* CTA */}
        <button
          className="sidebar-cta"
          id="sidebar-create-btn"
          onClick={() => { setIsCreateOpen(true); setSidebarOpen(false) }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add</span>
          Tạo công việc mới
        </button>
      </aside>

      {/* ══════════════ WORKSPACE ══════════════ */}
      <div className="app-workspace">
        {/* TopBar */}
        <header className="app-topbar">
          {/* Hamburger (mobile) */}
          <button
            className="topbar-menu-btn"
            onClick={() => setSidebarOpen(v => !v)}
            aria-label="Mở menu"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>

          {/* Search */}
          <div className="topbar-search">
            <span className="material-symbols-outlined topbar-search__icon">search</span>
            <input
              className="topbar-search__input"
              type="text"
              placeholder="Tìm kiếm công việc..."
              value={filters.search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Tìm kiếm công việc"
              id="topbar-search-input"
            />
          </div>

          {/* Actions */}
          <div className="topbar-actions">
            <div className="topbar-divider" aria-hidden="true" />
            <button
              className="topbar-add-btn"
              id="topbar-add-task-btn"
              onClick={() => setIsCreateOpen(true)}
            >
              <span className="material-symbols-outlined">add</span>
              Thêm công việc
            </button>
          </div>
        </header>

        {/* Main */}
        <main className="app-main">
          {/* Filter + Sort */}
          <div className="app-controls">
            <TaskFilter
              search={filters.search}
              status={filters.status}
              onSearchChange={setSearch}
              onStatusChange={setStatusFilter}
            />
            <SortSelector
              sortBy={filters.sortBy}
              sortDir={filters.sortDir}
              onSortChange={setSort}
            />
          </div>

          {/* Task List */}
          <TaskList
            tasks={tasks}
            loading={loading}
            error={error}
            onEdit={setEditingTask}
            onDelete={(id) => {
              const task = tasks.find(t => t.id === id)
              if (task) setDeletingTask(task)
            }}
            onToggle={handleToggle}
            currentPage={pagination.page}
            onResetPage={() => setPage(0)}
          />

          {/* Pagination */}
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
          />
        </main>
      </div>

      {/* ── Create Task Modal ── */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Tạo công việc mới"
      >
        <TaskForm
          mode="create"
          onSuccess={() => {
            showToast('Tạo công việc thành công!')
            setIsCreateOpen(false)
            refetch()
          }}
          onCancel={() => setIsCreateOpen(false)}
        />
      </Modal>

      {/* ── Edit Task Modal ── */}
      <Modal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        title="Chỉnh sửa công việc"
      >
        {editingTask && (
          <TaskForm
            mode="edit"
            initialData={editingTask}
            onSuccess={() => {
              showToast('Cập nhật công việc thành công!')
              setEditingTask(null)
              refetch()
            }}
            onNotFound={() => {
              showToast('Công việc này không còn tồn tại, có thể đã bị xóa', 'error')
              setEditingTask(null)
              refetch()
            }}
            onCancel={() => setEditingTask(null)}
          />
        )}
      </Modal>

      {/* ── Delete Confirm Dialog ── */}
      <ConfirmDialog
        isOpen={!!deletingTask}
        message={`Bạn có chắc muốn xóa công việc '${deletingTask?.title}'? Hành động này không thể hoàn tác.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingTask(null)}
      />
    </div>
  )
}

export default App
