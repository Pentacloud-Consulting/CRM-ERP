'use client';
import { useState, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown, Filter } from 'lucide-react';
import styles from './DataTable.module.css';

export default function DataTable({
  columns,
  data,
  onRowClick,
  searchable = true,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No records found',
  stickyHeader = true,
  maxHeight,
  filters,
  renderActions,
}) {
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [activeFilters, setActiveFilters] = useState({});

  const filtered = useMemo(() => {
    let result = [...data];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(row =>
        columns.some(col => {
          const val = col.accessor ? (typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor]) : '';
          return String(val || '').toLowerCase().includes(q);
        })
      );
    }

    // Active filters
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value && value !== '__all__') {
        result = result.filter(row => row[key] === value);
      }
    });

    // Sort
    if (sortCol) {
      const col = columns.find(c => c.key === sortCol);
      if (col) {
        result.sort((a, b) => {
          const aVal = typeof col.accessor === 'function' ? col.accessor(a) : a[col.accessor];
          const bVal = typeof col.accessor === 'function' ? col.accessor(b) : b[col.accessor];
          if (aVal == null) return 1;
          if (bVal == null) return -1;
          const cmp = typeof aVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal));
          return sortDir === 'asc' ? cmp : -cmp;
        });
      }
    }

    return result;
  }, [data, search, sortCol, sortDir, columns, activeFilters]);

  const handleSort = (colKey) => {
    if (sortCol === colKey) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(colKey);
      setSortDir('asc');
    }
  };

  return (
    <div className={styles.container}>
      {(searchable || filters || renderActions) && (
        <div className={styles.toolbar}>
          {searchable && (
            <div className={styles.searchWrap}>
              <Search size={15} className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}
          {filters && (
            <div className={styles.filters}>
              {filters.map(f => (
                <select
                  key={f.key}
                  className={styles.filterSelect}
                  value={activeFilters[f.key] || '__all__'}
                  onChange={(e) => setActiveFilters(prev => ({ ...prev, [f.key]: e.target.value }))}
                >
                  <option value="__all__">{f.label}: All</option>
                  {f.options.map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              ))}
            </div>
          )}
          {renderActions && <div className={styles.actions}>{renderActions()}</div>}
        </div>
      )}

      <div className={styles.tableWrap} style={maxHeight ? { maxHeight } : undefined}>
        <table className={styles.table}>
          <thead className={stickyHeader ? styles.stickyHead : ''}>
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`${styles.th} ${col.sortable !== false ? styles.sortable : ''} ${col.align === 'right' ? styles.right : ''} ${col.width ? '' : ''}`}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  <span className={styles.thContent}>
                    {col.label}
                    {sortCol === col.key && (
                      <span className={styles.sortIndicator}>
                        {sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className={styles.empty}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filtered.map((row, i) => (
                <tr
                  key={row.id || row.lead_id || row.shipment_id || row.account_id || row.contact_id || row.opportunity_id || row.awb_id || row.booking_request_id || i}
                  className={`${styles.row} ${onRowClick ? styles.clickable : ''}`}
                  onClick={() => onRowClick?.(row)}
                  style={{ animationDelay: `${Math.min(i * 20, 300)}ms` }}
                >
                  {columns.map(col => (
                    <td
                      key={col.key}
                      className={`${styles.td} ${col.align === 'right' ? styles.right : ''} ${col.mono ? styles.mono : ''}`}
                    >
                      {col.render ? col.render(row) : (typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.footer}>
        <span className={styles.count}>{filtered.length} of {data.length} records</span>
      </div>
    </div>
  );
}
