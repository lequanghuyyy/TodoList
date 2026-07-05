import './Pagination.css';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const handlePrev = () => {
    if (currentPage > 0) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages - 1) onPageChange(currentPage + 1);
  };

  return (
    <div className="pagination">
      <button
        className="pagination__btn"
        onClick={handlePrev}
        disabled={currentPage === 0}
        aria-label="Trang trước"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span>
        Trước
      </button>

      <span className="pagination__info" aria-live="polite">
        Trang {currentPage + 1} / {totalPages}
      </span>

      <button
        className="pagination__btn"
        onClick={handleNext}
        disabled={currentPage >= totalPages - 1}
        aria-label="Trang sau"
      >
        Sau
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
      </button>
    </div>
  );
};

export default Pagination;
