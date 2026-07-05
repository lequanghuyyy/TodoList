import './TaskFilter.css';

const STATUS_TABS = [
  { value: '',          label: 'Tất cả'          },
  { value: 'PENDING',   label: 'Đang làm'         },
  { value: 'COMPLETED', label: 'Hoàn thành'       },
]

const TaskFilter = ({ search, status, onSearchChange, onStatusChange }) => {
  return (
    <div className="task-filter">
      {/* Pill status tabs */}
      <div className="task-filter__tabs" role="group" aria-label="Lọc theo trạng thái">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            className={`task-filter__tab${status === tab.value ? ' task-filter__tab--active' : ''}`}
            onClick={() => onStatusChange(tab.value)}
            aria-pressed={status === tab.value}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TaskFilter;
