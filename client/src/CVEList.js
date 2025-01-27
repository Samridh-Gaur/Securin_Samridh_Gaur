import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CVEList.css';
import { useNavigate } from 'react-router-dom';

const CVEList = () => {
  const [cves, setCVEs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [resultsPerPage, setResultsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  const [year, setYear] = useState('');
  const [score, setScore] = useState('');
  const [days, setDays] = useState('');

  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('');
  const [filterValue, setFilterValue] = useState('');

  const navigate = useNavigate();

  const handleFilterApply = (filterType, value) => {
    if (!value) return;
    switch (filterType.toLowerCase()) {
      case 'year':
        setYear(value);
        setScore('');
        setDays('');
        break;
      case 'score':
        setScore(value);
        setYear('');
        setDays('');
        break;
      case 'days':
        setDays(value);
        setYear('');
        setScore('');
        break;
      default:
        console.error('Invalid filter type');
        break;
    }
    setCurrentPage(1); 
  };


  useEffect(() => {
    const fetchCVEs = async () => {
      let endpoint = `${process.env.REACT_APP_API_URL}/api/cves`;
      let params = { page: currentPage, limit: resultsPerPage };

      if (year) {
        endpoint = `${process.env.REACT_APP_API_URL}/api/cves/year/${year}`;
        params.year = year;
      } else if (score) {
        endpoint = `${process.env.REACT_APP_API_URL}/api/cves/score/${score}`;
        params.score = score;
      } else if (days) {
        endpoint = `${process.env.REACT_APP_API_URL}/api/cves/modified/${days}`;
        params.days = days;
      }

      const response = await axios.get(endpoint, { params });
      const cleanedCVEs = response.data.cves.filter(cve => 
        cve.metrics?.[0]?.source && cve.published && cve.lastModified && cve.vulnStatus
      );
      setCVEs(cleanedCVEs || []);
      setTotalRecords(response.data.totalRecords || 0);
      setTotalPages(Math.ceil(response.data.totalRecords / resultsPerPage));
    };

    fetchCVEs();
  }, [currentPage, resultsPerPage, year, score, days]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };


  const handleResultsPerPageChange = (e) => {
    setResultsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  return (
    <div className="cve-list-container">
      <h1 className="cve-list-title">CVE List</h1>
      <div className="filter-dropdown-container">
        <button
          className="filter-dropdown-button"
          onClick={() => setShowFilterDropdown(!showFilterDropdown)}
        >
          Filter Options
        </button>

        {showFilterDropdown && (
          <div className="filter-dropdown-menu">
            <div
              className="filter-dropdown-item"
              onClick={() => setSelectedFilter('Year')}
            >
              Year
            </div>
            <div
              className="filter-dropdown-item"
              onClick={() => setSelectedFilter('Score')}
            >
              Score
            </div>
            <div
              className="filter-dropdown-item"
              onClick={() => setSelectedFilter('Days')}
            >
              Modified in Last (days)
            </div>
          </div>
        )}

        {selectedFilter && (
          <div className="filter-input-container">
            <label>
              {selectedFilter}: &nbsp;
              <input
                type={selectedFilter === 'Score' || selectedFilter === 'Days' ? 'number' : 'text'}
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                className="filter-input"
              />
            </label>
            <button
              className="apply-filter-button"
              onClick={() => {
                handleFilterApply(selectedFilter, filterValue);
                setShowFilterDropdown(false);
                setSelectedFilter('');
                setFilterValue('');
              }}
            >
              Apply Filter
            </button>
          </div>
        )}
      </div>

      <h3>Total Records: {totalRecords}</h3>

      <table className="cve-list-table">
        <thead>
          <tr className="cve-list-header">
            <th className="cve-list-header-cell">CVE ID</th>
            <th className="cve-list-header-cell">Identifier</th>
            <th className="cve-list-header-cell">Published Date</th>
            <th className="cve-list-header-cell">Last Modified Date</th>
            <th className="cve-list-header-cell">Status</th>
          </tr>
        </thead>
        <tbody>
          {cves.length > 0 ? (
            cves.map((cve) => (
              <tr key={cve.id} className="cve-list-row" onClick={() => navigate(`/cves/${cve.id}`)}>
                <td className="cve-list-cell">{cve.id}</td>
                <td className="cve-list-cell">{cve.metrics?.[0]?.source || 'N/A'}</td>
                <td className="cve-list-cell">{cve.published}</td>
                <td className="cve-list-cell">{cve.lastModified}</td>
                <td className="cve-list-cell">{cve.vulnStatus || 'N/A'}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="cve-list-cell cve-list-no-data">
                No CVEs found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="flex-row r">
        <div className="results-per-page">
          <label htmlFor="results-per-page">Results Per Page:</label>
          <select
            id="results-per-page"
            value={resultsPerPage}
            onChange={handleResultsPerPageChange}
          >
            <option value={10}>10</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div className="cve-list-pagination">
          <h4>
            {currentPage * resultsPerPage - resultsPerPage + 1} -{' '}
            {Math.min(currentPage * resultsPerPage, totalRecords)} of {totalRecords} records
          </h4>

          <button
            className={`cve-list-pagination-button ${currentPage === 1 ? 'cve-list-pagination-button-disabled' : ''}`}
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            &lt;
          </button>

          {(() => {
            const pageNumbers = [];
            let startPage = Math.max(currentPage - 2, 1);
            let endPage = Math.min(startPage + 4, totalPages);

            if (endPage - startPage < 4) {
              startPage = Math.max(endPage - 4, 1);
            }

            for (let i = startPage; i <= endPage; i++) {
              pageNumbers.push(i);
            }

            return pageNumbers.map((page) => (
              <button
                key={page}
                className={`cve-list-pagination-button ${page === currentPage ? 'cve-list-pagination-button-active' : ''}`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            ));
          })()}

          <button
            className={`cve-list-pagination-button ${currentPage === totalPages ? 'cve-list-pagination-button-disabled' : ''}`}
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
};

export default CVEList;
